'use strict';

const mongoose           = require('mongoose');
const bcrypt             = require('bcrypt-nodejs');
const async              = require('async');
const VerificationToken  = require('./VerificationToken');
const PasswordResetToken = require('./PasswordResetToken');
const RefreshToken       = require('./RefreshToken');
const Event              = require('./Event');


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
        transform: (doc, ret) => {
            ret.id = ret._id;
            ret.created_at = ret._id.getTimestamp();
            delete ret.password;
            delete ret.socialData;
            delete ret._id;
            delete ret.__v;
        }
    }
});

LoggedInUserSchema.virtual('authToken').get(function() {
    return this.__authToken;
}).set(function(authToken) {
    this.__authToken = authToken;
});

LoggedInUserSchema.virtual('refreshToken').get(function() {
    return this.__refreshToken;
}).set(function(refreshToken) {
    this.__refreshToken = refreshToken;
});

LoggedInUserSchema.path('email').validate(function(value) {
    return new Promise((resolve, reject) => {
        const userObject = this;
        LoggedInUser.findOne({ email: value }, (error, user) => {
            if (error) {
                return reject(error);
            } else if (user && !user._id.equals(userObject._id)) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}, 'User with this email already exists.', 'duplicate');

LoggedInUserSchema.path('username').validate(function(value) {
    return new Promise((resolve, reject) => {
        const userObject = this;
        LoggedInUser.findOne({ username: value }, (error, user) => {
            if (error) {
                return reject(error);
            } else if (user && !user._id.equals(userObject._id)) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}, 'User with this username already exists.', 'duplicate');

LoggedInUserSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updated_at = new Date();
    }
    next();
});

LoggedInUserSchema.pre('remove', function(callback) {
    //to add: delete photos of user
    const user = this;
    async.parallel([
        (next) => {
            VerificationToken.find({ user: user.id }).exec((error, tokens) => {
                if (error) {
                    callback(error);
                } else if (tokens && tokens.length > 0) {
                    async.each(tokens, (token, nextToken) => {
                        token.remove((error) => {
                            if (error) {
                                nextToken(error);
                            } else {
                                nextToken();
                            }
                        });
                    }, (error) => {
                        if (error) {
                            callback(error);
                        } else {
                            next();
                        }
                    });
                } else {
                    next();
                }
            });
        },
        (next) => {
            PasswordResetToken.find({ user: user.id }).exec((error, tokens) => {
                if (error) {
                    callback(error);
                } else if (tokens && tokens.length > 0) {
                    async.each(tokens, (token, nextToken) => {
                        token.remove((error) => {
                            if (error) {
                                nextToken(error);
                            } else {
                                nextToken();
                            }
                        });
                    }, (error) => {
                        if (error) {
                            callback(error);
                        } else {
                            next();
                        }
                    });
                } else {
                    next();
                }
            });
        },
        (next) => {
            RefreshToken.find({ user: user.id }).exec((error, tokens) => {
                if (error) {
                    callback(error);
                } else if (tokens && tokens.length > 0) {
                    async.each(tokens, (token, nextToken) => {
                        token.remove((error) => {
                            if (error) {
                                nextToken(error);
                            } else {
                                nextToken();
                            }
                        });
                    }, (error) => {
                        if (error) {
                            callback(error);
                        } else {
                            next();
                        }
                    });
                } else {
                    next();
                }
            });
        },
        (next) => {
            Event.find({ user: user.id }).exec((error, events) => {
                if (error) {
                    callback(error);
                } else if (events && events.length > 0) {
                    async.each(events, (event, nextEvent) => {
                        event.remove((error) => {
                            if (error) {
                                nextEvent(error);
                            } else {
                                nextEvent();
                            }
                        });
                    }, (error) => {
                        if (error) {
                            callback(error);
                        } else {
                            next();
                        }
                    });
                } else {
                    next();
                }
            });
        }
    ], callback);
});

LoggedInUserSchema.statics.generateHash = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

LoggedInUserSchema.methods.isPasswordValid = function(password) {
    return bcrypt.compareSync(password, this.password);
};

LoggedInUserSchema.statics.createSocialUser = (email, socialData, name, callback) => {
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

LoggedInUserSchema.statics.createLocalUser = (email, password, username, callback) => {
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

LoggedInUserSchema.query.socialUser = (socialId, strategy, callback) => {
    LoggedInUser.find({
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