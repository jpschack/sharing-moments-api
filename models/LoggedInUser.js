'use strict';

const mongoose           = require('mongoose');
const logger             = require('../utils/logger');
const bcrypt             = require('bcrypt-nodejs');
const async              = require('async');
const VerificationToken  = require('./VerificationToken');
const PasswordResetToken = require('./PasswordResetToken');
const RefreshToken       = require('./RefreshToken');


const LoggedInUserSchema = mongoose.Schema({
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
    profileimage: {
        type: {
            s3ObjectId: String,
            url: String,
            created_at: { type: Date, default: Date.now }
        }
    },
    updated_at: { type: Date, default: Date.now }
}, {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            ret.created_at = ret._id.getTimestamp();
            delete ret.password;
            delete ret.socialData;
            delete ret._id;
            delete ret.__v;
        }
    }
});

LoggedInUserSchema.virtual('authToken').get(function () {
    return this.__authToken;
}).set(function(authToken) {
    this.__authToken = authToken;
});

LoggedInUserSchema.virtual('refreshToken').get(function () {
    return this.__refreshToken;
}).set(function(refreshToken) {
    this.__refreshToken = refreshToken;
});

LoggedInUserSchema.path('email').validate({
    isAsync: true,
    validator: function (value, respond) {
        const userObject = this;
        LoggedInUser.findOne({ email: value }, (err, user) => {
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

LoggedInUserSchema.path('username').validate({
    isAsync: true,
    validator: function (value, respond) {
        const userObject = this;
        LoggedInUser.findOne({ username: value }, (err, user) => {
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

LoggedInUserSchema.pre('save', (next) => {
    if (!this.isNew) {
        this.updated_at = new Date();
    }
    next();
});

LoggedInUserSchema.pre('remove', (callback) => {
    const user = this;
    async.waterfall([
        (next) => {
            VerificationToken.find({ user: user.id }).exec((error, tokens) => {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else if (tokens && tokens.length > 0) {
                    for (var i = 0; i < tokens.length; i++) {
                        const token = tokens[i];
                        token.remove((error) => {
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
        (next) => {
            PasswordResetToken.find({ user: user.id }).exec((error, tokens) => {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else if (tokens && tokens.length > 0) {
                    for (var i = 0; i < tokens.length; i++) {
                        const token = tokens[i];
                        token.remove((error) => {
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
        (next) => {
            RefreshToken.find({ user: user.id }).exec((error, tokens) => {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else if (tokens && tokens.length > 0) {
                    for (var i = 0; i < tokens.length; i++) {
                        const token = tokens[i];
                        token.remove((error) => {
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

LoggedInUserSchema.statics.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

LoggedInUserSchema.methods.isPasswordValid = function(password) {
    return bcrypt.compareSync(password, this.password);
};

LoggedInUserSchema.statics.createSocialUser = function(email, socialData, name, callback) {
    const user = new LoggedInUser();
    user.email = email;
    user.socialData = socialData;
    user.strategy = 'facebook';
    user.name = name;
    user.verified = true;

    user.save((error) => {
        if (error) {
            callback(error, null);
        } else {
            callback(null, user);
        }
    });
}

LoggedInUserSchema.statics.createLocalUser = function(email, password, username, callback) {
    const user = new LoggedInUser();
    user.email = email;
    user.password = LoggedInUser.generateHash(password);
    user.strategy = 'local';
    user.username = username;

    user.save((error) => {
        if (error) {
            callback(error, null);
        } else {
            callback(null, user);
        }
    });
}

LoggedInUserSchema.query.socialUser = function(socialId, strategy, callback) {
    this.find({
        $and: [
            { 'socialData.id': socialId },
            { strategy: strategy }
        ] }).select('+socialData').exec((error, result) => {
            if (error) {
                callback(err, null);
            } else if (result && result.length == 1) {
                callback(null, result[0].toObject());
            } else {
                callback(null, null);
            }
    });
}


const LoggedInUser = mongoose.model('LoggedInUser', LoggedInUserSchema, 'users');

module.exports = LoggedInUser;