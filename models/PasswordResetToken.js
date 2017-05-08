'use strict';

const mongoose       = require('mongoose');
const logger         = require('../utils/logger');
const crypto         = require('crypto');
const SchemaObjectId = mongoose.Schema.Types.ObjectId;

let PasswordResetTokenSchema = mongoose.Schema({ userid: { type: SchemaObjectId, ref: 'User', required: true },
                            token: { type: String, required: true, index: { unique: true } },
                            expires_at: { type: Date, default: function() { return +new Date() + (9*60*60*1000) } }
});

PasswordResetTokenSchema.statics.create = function(user, callback) {
    var token = new PasswordResetToken();
    token.userid = user._id;

    crypto.randomBytes(48, function(error, buffer) {
        if (error) {
            callback(error, null);
        } else {
            token.token = buffer.toString('hex');

            token.save(function(error) {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    callback(null, token);
                }
            });
        }
    });
}

PasswordResetTokenSchema.methods.isTokenValid = function() {
    let today = new Date();

    if (this.expires_at.getTime() < today.getTime()) {
        return false;
    } else {
        return true;
    }
}

let PasswordResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);

module.exports = PasswordResetToken;