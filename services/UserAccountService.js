'use strict'

const config               = require('../config/config');
const logger               = require('../utils/logger');
const MailService          = require('../services/MailService');
const async                = require('async');
const CostumError          = require('../utils/CostumError');
const LoggedInUserResponse = require('../utils/responseObjects/LoggedInUserResponse');
const AuthTokenResponse    = require('../utils/responseObjects/AuthTokenResponse');
const User                 = require('../models/User');
const VerificationToken    = require('../models/VerificationToken');
const PasswordResetToken   = require('../models/PasswordResetToken');
const RefreshToken         = require('../models/RefreshToken');
const mongoose             = require('mongoose');
const ObjectId             = mongoose.Types.ObjectId;


function UserAccountService() {}

UserAccountService.prototype.login = function(email, password, callback) {
    async.waterfall([
        function (next) {
            User.findOne({ email: email }).select('+password').exec(function(error, user) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else if (user) {
                    if (user.strategy == 'local' && user.isPasswordValid(password)) {
                        next(null, user);
                    } else {
                        callback(new CostumError('Not found', 'No user with those credentials found.', 401), null);
                    }
                } else {
                    callback(new CostumError('Not found', 'No user with those credentials found.', 401), null);
                }
            });
        },
        function(user, next) {
            RefreshToken.create(user, function(error, refreshToken, authToken, expires_at) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user, new AuthTokenResponse(authToken, expires_at, refreshToken));
                }
            });
        },
        function(user, authTokenResponse, next) {
            let userResponseObject = new LoggedInUserResponse(user, authTokenResponse);
            next(null, userResponseObject);
        }
    ], callback);
}

UserAccountService.prototype.getNewAuthToken = function(token, userid, callback) {
    async.waterfall([
        function(next) {
            RefreshToken.findOne({
                $and: [
                    { user: ObjectId(userid) },
                    { token: token }
                ] }).exec(function(error, refreshToken) {
                    if (error) {
                        logger.error(error);
                        callback(err, null);
                    } else if (refreshToken) {
                        next(null, refreshToken);
                    } else {
                        callback(new CostumError('Unauthorized', 'Token is not valid.', 401), null);
                    }
            });
        },
        function(refreshToken, next) {
            refreshToken.getNewAuthToken(function(error, authToken, expires_at) {
                if (error) {
                    logger.error(error);
                    next(error)
                } else {
                    refreshToken.updateExpiration(function(error, updatedRefreshToken) {
                        if (error) {
                            logger.error(error);
                            next(error)
                        } else {
                            next(null, new AuthTokenResponse(authToken, expires_at, updatedRefreshToken));
                        }
                    });
                }
            });
        }
    ], callback);
}

UserAccountService.prototype.register = function(email, username, password, callback) {
    async.waterfall([
        function(next) {
            User.createLocalUser(email, password, username, function (error, user) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user);
                }
            });
        },
        function(user, next) {
            VerificationToken.create(user, function (error, token) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user, token);
                }
            });
        },
        function(user, token, next) {
            MailService.verificationEmail(user, token, function (error, sent) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user);
                }
            });
        },
        function(user, next) {
            RefreshToken.create(user, function(error, refreshToken, authToken, expires_at) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user, new AuthTokenResponse(authToken, expires_at, refreshToken));
                }
            });
        },
        function(user, authTokenResponse, next) {
            let userResponseObject = new LoggedInUserResponse(user, authTokenResponse);
            next(null, userResponseObject);
        }
    ], callback);
}

UserAccountService.prototype.verifyAccount = function(vt, callback) {
    async.waterfall([
        function (next) {
            VerificationToken.findOne({ token: vt }).exec(function(error, token) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else if (!token || (token && !token.isTokenValid())) {
                    callback(new CostumError('Unauthorized', 'Token is not valid.', 401), null);
                } else {
                    next(null, token);
                }
            });
        },
        function(token, next) {
            User.findById(token.user).exec(function(error, user) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else if (!user) {
                    callback(new CostumError('Not found', 'No User found for that token.', 404), null);
                } else {
                    next(null, user, token);
                }
            });
        },
        function(user, token, next) {
            user.verified = true;
            user.save(function(error) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user, token);
                }
            });
        },
        function(user, token, next) {
            token.remove(function(error) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user);
                }
            });
        },
        function(user, next) {
            RefreshToken.create(user, function(error, refreshToken, authToken, expires_at) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user, new AuthTokenResponse(authToken, expires_at, refreshToken));
                }
            });
        },
        function(user, authTokenResponse, next) {
            let userResponseObject = new LoggedInUserResponse(user, authTokenResponse);
            next(null, userResponseObject);
        }
    ], callback);
}

UserAccountService.prototype.resetPassword = function(email, callback) {
    async.waterfall([
        function (next) {
            User.findOne({ email: email }).exec(function(error, user) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else if (!user) {
                    callback(new CostumError('Not Found', 'No User found for email address.', 404), null);
                } else if (user.strategy != 'local') {
                    callback(new CostumError('Forbitten', 'Can not reset password for social users.', 403), null);
                } else {
                    next(null, user);
                }
            });
        },
        function (user, next) {
            PasswordResetToken.create(user, function (error, token) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user, token);
                }
            });
        },
        function (user, token, next) {
            MailService.resetPasswordEmail(user, token, function (error, sent) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, true);
                }
            });
        }
    ], callback);
}

UserAccountService.prototype.changePassword = function(rt, password, callback) {
    async.waterfall([
        function (next) {
            PasswordResetToken.findOne({ token: rt }, function(error, token) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else if (!token || (token && !token.isTokenValid())) {
                    callback(new CostumError('Unauthorized', 'Token is not valid.', 401), null);
                } else {
                    next(null, token);
                }
            });
        },
        function (token, next) {
            User.findById(token.user, function(error, user) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else if (!token) {
                    callback(new CostumError('Not found', 'User not found.', 401), null);
                } else {
                    next(null, token, user);
                }
            });
        },
        function (token, user, next) {
            user.password = User.generateHash(password);

            user.save(function(error) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    token.remove(function(error) {
                        if (error) {
                            logger.error(error);
                            callback(error, null);
                        } else {
                            next(null, user);
                        }
                    });
                }
            });
        },
        function(user, next) {
            RefreshToken.create(user, function(error, refreshToken, authToken, expires_at) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    next(null, user, new AuthTokenResponse(authToken, expires_at, refreshToken));
                }
            });
        },
        function(user, authTokenResponse, next) {
            let userResponseObject = new LoggedInUserResponse(user, authTokenResponse);
            next(null, userResponseObject);
        }
    ], callback);
}

UserAccountService.prototype.logout = function(user, token, callback) {
    async.waterfall([
        function (next) {
            RefreshToken.findOne({
                $and: [
                    { user: user.id },
                    { token: token }
                ] }).exec(function(error, token) {
                    if (error) {
                        logger.error(error);
                        callback(err, null);
                    } else if (token) {
                        next(null, token);
                    } else {
                        callback(new CostumError('Unauthorized', 'Token is not valid.', 401), null);
                    }
            });
        },
        function (token, next) {
            token.remove(function(error) {
                if (error) {
                    logger.error(error);
                    callback(error, false);
                } else {
                    callback(null, true);
                }
            });
        }
    ], callback);
}

UserAccountService.prototype.delete = function(user, callback) {
    user.remove(function(error) {
        if (error) {
            logger.error(error);
            callback(error, null);
        } else {
            callback(null, true);
        }
    });
}

UserAccountService.prototype.update = function(user, id, email, username, name, privacy, callback) {
    if (id != user.id) {
        callback(new CostumError('Forbitten', 'It is not allowed to change the users id.', 403), null);
    } else {
        var userModified = false;

        if (email != user.email) {
            user.email = email;
            userModified = true;
        }

        if (username != user.username) {
            user.username = username;
            userModified = true;
        }

        if (name != user.name) {
            user.name = name;
            userModified = true;
        }

        if (privacy != user.privacy) {
            user.privacy = privacy;
            userModified = true;
        }

        if (userModified) {
            user.save(function(error) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    callback(null, user);
                }
            });
        } else {
            callback(null, user);
        }
    }
}

UserAccountService.prototype.updatePassword = function(user, oldpassword, password, callback) {
    if (user.strategy != 'local') {
        callback(new CostumError('Forbitten', 'Can not change the password for a social user.', 403), null);
    } else {
        if (user.isPasswordValid(oldpassword)) {
            user.password = User.generateHash(password);
            user.save(function(error) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    callback(null, user);
                }
            });
        } else {
            callback(new CostumError('Forbitten', 'The given password does not match the current password.', 403), null);
        }
    }
}

UserAccountService.prototype.updatePrivacy = function(user, privacy, callback) {
    user.privateAccount = privacy;
    user.save(function(error) {
        if (error) {
            logger.error(error);
            callback(error, null);
        } else {
            callback(null, user);
        }
    });
}

module.exports = new UserAccountService();