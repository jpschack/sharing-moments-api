'use strict';

const mongoose           = require('mongoose');
const logger             = require('../utils/logger');
const bcrypt             = require('bcrypt-nodejs');
const async              = require('async');
const VerificationToken  = require('./VerificationToken');
const PasswordResetToken = require('./PasswordResetToken');
const RefreshToken          = require('./RefreshToken');


let UserSchema = mongoose.Schema({
                            email: { type: String, required: true, index: { unique: true } },
                            password: { type: String, select: false },
                            socialData: {
                                type: {
                                    id: Number,
                                    accessToken: String,
                                    refreshToken: String
                                },
                                select: false
                            },
                            username: { type: String, index: { unique: true } },
                            strategy: String,
                            name: String,
                            enabled: { type: Boolean, default: true },
                            verified: { type: Boolean, default: false },
                            privateAccount: { type: Boolean, default: false },
                            updated_at: { type: Date, default: Date.now }
});

UserSchema.path('email').validate({
    isAsync: true,
    validator: function (value, respond) {
        let userObject = this;
        User.findOne({ email: value }, function(err, user) {
            if (err) {
                return respond(err);
            } else if (user && !user._id.equals(userObject._id)) {
                respond(false);
            } else {
                respond(true);
            }
        });
    },
    message: 'User with this email already exists.'
});

UserSchema.path('username').validate({
    isAsync: true,
    validator: function (value, respond) {
        let userObject = this;
        User.findOne({ username: value }, function(err, user) {
            if (err) {
                return respond(err);
            } else if (user && !user._id.equals(userObject._id)) {
                respond(false);
            } else {
                respond(true);
            }
        });
    },
    message: 'User with this username already exists.'
});

UserSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updated_at = new Date();
    }
    next();
});

UserSchema.pre('remove', function(callback) {
    let user = this;
    async.waterfall([
        function (next) {
            VerificationToken.find({ userid: user.id }).exec(function(error, tokens) {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else if (tokens && tokens.length > 0) {
                    for (var i = 0; i < tokens.length; i++) {
                        let token = tokens[i];
                        token.remove(function(error) {
                            if (error) {
                                logger.error(error);
                                callback(error);
                            }
                        });
                    }
                    next();
                } else {
                    next();
                }
            });
        },
        function (next) {
            PasswordResetToken.find({ userid: user.id }).exec(function(error, tokens) {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else if (tokens && tokens.length > 0) {
                    for (var i = 0; i < tokens.length; i++) {
                        let token = tokens[i];
                        token.remove(function(error) {
                            if (error) {
                                logger.error(error);
                                callback(error);
                            }
                        });
                    }
                    next();
                } else {
                    next();
                }
            });
        },
        function (next) {
            RefreshToken.find({ userid: user.id }).exec(function(error, tokens) {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else if (tokens && tokens.length > 0) {
                    for (var i = 0; i < tokens.length; i++) {
                        let token = tokens[i];
                        token.remove(function(error) {
                            if (error) {
                                logger.error(error);
                                callback(error);
                            }
                        });
                    }
                    next();
                } else {
                    next();
                }
            });
        }
    ], callback);
});

UserSchema.statics.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

UserSchema.methods.isPasswordValid = function(password) {
    return bcrypt.compareSync(password, this.password);
};

UserSchema.statics.createSocialUser = function(email, socialData, name, callback) {
    var user = new User();
    user.email = email;
    user.socialData = socialData;
    user.strategy = 'facebook';
    user.name = name;
    user.verified = true;

    user.save(function(error) {
        if (error) {
            logger.error(error);
            callback(error, null);
        } else {
            callback(null, user);
        }
    });
}

UserSchema.statics.createLocalUser = function(email, password, username, callback) {
    var user = new User();
    user.email = email;
    user.password = User.generateHash(password);
    user.strategy = 'local';
    user.username = username;

    user.save(function(error) {
        if (error) {
            logger.error(error);
            callback(error, null);
        } else {
            callback(null, user);
        }
    });
}

UserSchema.query.socialUser = function(socialId, strategy, callback) {
    this.find({
        $and: [
            { 'socialData.id': socialId },
            { strategy: strategy }
        ] }).select('+socialData').exec(function(error, result) {
            if (error) {
                logger.error(error);
                callback(err, null);
            } else if (result && result.length == 1) {
                callback(null, result[0].toObject());
            } else {
                callback(null, null);
            }
    });
}

UserSchema.query.search = function(searchString, limit, page, callback) {
    let searchExpression = new RegExp(".*" + searchString.replace(/(\W)/g, "\\$1") + ".*", "i");
    this.find({
        $or: [
            { username: searchExpression },
            { name: searchExpression }
        ] })
        .limit(limit)
        .skip(page * limit)
        .exec(function(error, result) {
            if (error) {
                logger.error(error);
                callback(err, null);
            } else if (result) {
                callback(null, result);
            } else {
                callback(null, null);
            }
    });
}

UserSchema.query.countSearchResults = function(searchString, callback) {
    let searchExpression = new RegExp(".*" + searchString.replace(/(\W)/g, "\\$1") + ".*", "i");
    this.find({
        $or: [
            { username: searchExpression },
            { name: searchExpression }
        ] })
        .count()
        .exec(function(error, count) {
            if (error) {
                logger.error(error);
                callback(err, null);
            } else {
                callback(null, count);
            }
    });
}

let User = mongoose.model('User', UserSchema);

module.exports = User;