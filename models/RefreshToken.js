'use strict';

const mongoose       = require('mongoose');
const config         = require('../config/config');
const logger         = require('../utils/logger');
const jwt            = require('jsonwebtoken');
const crypto         = require('crypto');
const SchemaObjectId = mongoose.Schema.Types.ObjectId;


let RefreshTokenSchema = mongoose.Schema({ 
    user: { type: SchemaObjectId, ref: 'LoggedInUser', required: true },
    token: { type: String, required: true, index: { unique: true } },
    expires_at: { type: Date, default: function() { return +new Date() + config.jwt.refreshtoken.expirationTime } },
    updated_at: { type: Date, default: Date.now }
});

RefreshTokenSchema.plugin(require('./plugins/toJSONPlugin'));

RefreshTokenSchema.pre('save', function(next) {
    if (this.isTokenValid) {
        if (!this.isNew) {
            this.updated_at = new Date();
        }
        next();
    } else {
        next(new CostumError('Unauthorized', 'Token expired.', 401));
    }
});

RefreshTokenSchema.statics.create = function(user, callback) {
    var refreshToken = new RefreshToken();
    refreshToken.user = user._id;

    crypto.randomBytes(48, function(error, buffer) {
        if (error) {
            callback(error, null);
        } else {
            refreshToken.token = buffer.toString('hex');

            refreshToken.save(function(error) {
                if (error) {
                    logger.error(error);
                    callback(error, null, null, null);
                } else {
                    refreshToken.getNewAuthToken(function(error, authToken, expires_at) {
                        if (error) {
                            callback(error, null, null, null);
                        } else {
                            callback(null, refreshToken, authToken, expires_at);
                        }
                    });
                }
            });
        }
    });
}

RefreshTokenSchema.methods.updateExpiration = function(callback) {
    let token = this;
    token.expires_at = +new Date() + config.jwt.refreshtoken.expirationTime;
    token.save(function(error) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, token);
        }
    });
}

RefreshTokenSchema.methods.isTokenValid = function() {
    const today = new Date();

    if (this.expires_at.getTime() < today.getTime()) {
        return false;
    } else {
        return true;
    }
}

RefreshTokenSchema.methods.getNewAuthToken = function(callback) {
    if (this.isTokenValid) {
        const payload = { id: this.user };
        jwt.sign(payload, config.jwt.passportJWT.secretOrKey, { expiresIn: config.jwt.authtoken.jwtExpirationTime }, function(error, authToken) {
            if (error) {
                callback(error, null, null);
            } else {
                const today = new Date();
                const expires_at = new Date(today.getTime() + config.jwt.authtoken.expirationTime);
                callback(null, authToken, expires_at);
            }
        });
    } else {
        callback(new CostumError('Unauthorized', 'Token expired', 401), null, null);
    }
}

let RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

module.exports = RefreshToken;