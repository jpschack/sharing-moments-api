'use strict'

const config               = require('../config/config');
const MailService          = require('../services/MailService');
const async                = require('async');
const CostumError          = require('../utils/CostumError');
const AuthTokenResponse    = require('../utils/responseObjects/AuthTokenResponse');
const LoggedInUser         = require('../models/LoggedInUser');
const VerificationToken    = require('../models/VerificationToken');
const PasswordResetToken   = require('../models/PasswordResetToken');
const RefreshToken         = require('../models/RefreshToken');
const mongoose             = require('mongoose');
const ObjectId             = mongoose.Types.ObjectId;


class LoggedInUserService {
    static login(email, password, callback) {
        async.waterfall([
            (next) => {
                LoggedInUser.findOne({ email: email }).select('+password').exec((error, user) => {
                    if (error) {
                        callback(error, null);
                    } else if (user) {
                        if (user.strategy == 'local' && user.isPasswordValid(password)) {
                            next(null, user);
                        } else {
                            callback(new CostumError('UNAUTHORIZED', 'No user with those credentials found.', 401), null);
                        }
                    } else {
                        callback(new CostumError('UNAUTHORIZED', 'No user with those credentials found.', 401), null);
                    }
                });
            },
            (user, next) => {
                RefreshToken.create(user, (error, refreshToken, authToken, expires_at) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user, new AuthTokenResponse(authToken, expires_at), refreshToken);
                    }
                });
            },
            (user, authTokenResponse, refreshToken, next) => {
                user.authToken = authTokenResponse;
                user.refreshToken = refreshToken;
                next(null, user);
            }
        ], callback);
    }

    static getNewAuthToken(token, userid, callback) {
        async.waterfall([
            (next) => {
                RefreshToken.findOne({
                    $and: [
                        { user: ObjectId(userid) },
                        { token: token }
                    ] }).exec((error, refreshToken) => {
                        if (error) {
                            callback(err, null);
                        } else if (refreshToken) {
                            next(null, refreshToken);
                        } else {
                            callback(new CostumError('UNAUTHORIZED', 'Token is not valid.', 401), null);
                        }
                });
            },
            (refreshToken, next) => {
                refreshToken.getNewAuthToken((error, authToken, expires_at) => {
                    if (error) {
                        next(error)
                    } else {
                        refreshToken.updateExpiration((error, updatedRefreshToken) => {
                            if (error) {
                                next(error)
                            } else {
                                const updatedTokens = { authToken: new AuthTokenResponse(authToken, expires_at), refreshToken: updatedRefreshToken };
                                next(null, updatedTokens);
                            }
                        });
                    }
                });
            }
        ], callback);
    }

    static register(email, username, password, callback) {
        async.waterfall([
            (next) => {
                LoggedInUser.createLocalUser(email, password, username, (error, user) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user);
                    }
                });
            },
            (user, next) => {
                VerificationToken.create(user, (error, token) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user, token);
                    }
                });
            },
            (user, token, next) => {
                MailService.verificationEmail(user, token, (error, sent) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user);
                    }
                });
            },
            (user, next) => {
                RefreshToken.create(user, (error, refreshToken, authToken, expires_at) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user, new AuthTokenResponse(authToken, expires_at), refreshToken);
                    }
                });
            },
            (user, authTokenResponse, refreshToken, next) => {
                user.authToken = authTokenResponse;
                user.refreshToken = refreshToken;
                next(null, user);
            }
        ], callback);
    }

    static verifyAccount(vt, callback) {
        async.waterfall([
            (next) => {
                VerificationToken.findOne({ token: vt }).exec((error, token) => {
                    if (error) {
                        callback(error, null);
                    } else if (!token || (token && !token.isTokenValid())) {
                        callback(new CostumError('UNAUTHORIZED', 'Token is not valid.', 401), null);
                    } else {
                        next(null, token);
                    }
                });
            },
            (token, next) => {
                LoggedInUser.findById(token.user).exec((error, user) => {
                    if (error) {
                        callback(error, null);
                    } else if (!user) {
                        callback(new CostumError('NOT_FOUND', 'No User found for that token.', 404), null);
                    } else {
                        next(null, user, token);
                    }
                });
            },
            (user, token, next) => {
                user.verified = true;
                user.save((error) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user, token);
                    }
                });
            },
            (user, token, next) => {
                token.remove((error) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user);
                    }
                });
            },
            (user, next) => {
                RefreshToken.create(user, (error, refreshToken, authToken, expires_at) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user, new AuthTokenResponse(authToken, expires_at), refreshToken);
                    }
                });
            },
            (user, authTokenResponse, refreshToken, next) => {
                user.authToken = authTokenResponse;
                user.refreshToken = refreshToken;
                next(null, user);
            }
        ], callback);
    }

    static resetPassword(email, callback) {
        async.waterfall([
            (next) => {
                LoggedInUser.findOne({ email: email }).exec((error, user) => {
                    if (error) {
                        callback(error, null);
                    } else if (!user) {
                        callback(new CostumError('NOT_FOUND', 'No User found for email address.', 404), null);
                    } else if (user.strategy != 'local') {
                        callback(new CostumError('FORBIDDEN', 'Can not reset password for social users.', 403), null);
                    } else {
                        next(null, user);
                    }
                });
            },
            (user, next) => {
                PasswordResetToken.create(user, (error, token) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user, token);
                    }
                });
            },
            (user, token, next) => {
                MailService.resetPasswordEmail(user, token, (error, sent) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, true);
                    }
                });
            }
        ], callback);
    }

    static changePassword(rt, password, callback) {
        async.waterfall([
            (next) => {
                PasswordResetToken.findOne({ token: rt }, (error, token) => {
                    if (error) {
                        callback(error, null);
                    } else if (!token || (token && !token.isTokenValid())) {
                        callback(new CostumError('UNAUTHORIZED', 'Token is not valid.', 401), null);
                    } else {
                        next(null, token);
                    }
                });
            },
            (token, next) => {
                LoggedInUser.findById(token.user, (error, user) => {
                    if (error) {
                        callback(error, null);
                    } else if (!token) {
                        callback(new CostumError('NOT_FOUND', 'User not found.', 404), null);
                    } else {
                        next(null, token, user);
                    }
                });
            },
            (token, user, next) => {
                user.password = LoggedInUser.generateHash(password);

                user.save((error) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        token.remove((error) => {
                            if (error) {
                                callback(error, null);
                            } else {
                                next(null, user);
                            }
                        });
                    }
                });
            },
            (user, next) => {
                RefreshToken.create(user, (error, refreshToken, authToken, expires_at) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, user, new AuthTokenResponse(authToken, expires_at), refreshToken);
                    }
                });
            },
            (user, authTokenResponse, refreshToken, next) => {
                user.authToken = authTokenResponse;
                user.refreshToken = refreshToken;
                next(null, user);
            }
        ], callback);
    }

    static logout(user, token, callback) {
        async.waterfall([
            (next) => {
                RefreshToken.findOne({
                    $and: [
                        { user: user.id },
                        { token: token }
                    ] }).exec((error, token) => {
                        if (error) {
                            callback(err, null);
                        } else if (token) {
                            next(null, token);
                        } else {
                            callback(new CostumError('UNAUTHORIZED', 'Token is not valid.', 401), null);
                        }
                });
            },
            (token, next) => {
                token.remove((error) => {
                    if (error) {
                        callback(error, false);
                    } else {
                        callback(null, true);
                    }
                });
            }
        ], callback);
    }

    static delete(user, callback) {
        user.remove((error) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, true);
            }
        });
    }

    static update(user, id, email, username, name, privacy, callback) {
        if (id != user.id) {
            callback(new CostumError('FORBIDDEN', 'It is not allowed to change the users id.', 403), null);
        } else {
            let userModified = false;

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
                user.save((error) => {
                    if (error) {
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

    static updatePassword(user, oldpassword, password, callback) {
        if (user.strategy != 'local') {
            callback(new CostumError('FORBIDDEN', 'Can not change the password for a social user.', 403), null);
        } else {
            if (user.isPasswordValid(oldpassword)) {
                user.password = LoggedInUser.generateHash(password);
                user.save((error) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        callback(null, user);
                    }
                });
            } else {
                callback(new CostumError('FORBIDDEN', 'The given password does not match the current password.', 403), null);
            }
        }
    }

    static updatePrivacy(user, privacy, callback) {
        user.privateAccount = privacy;
        user.save((error) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, user);
            }
        });
    }
}

module.exports = LoggedInUserService;