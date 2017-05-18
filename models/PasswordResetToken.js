'use strict';

const mongoose       = require('mongoose');
const crypto         = require('crypto');
const SchemaObjectId = mongoose.Schema.Types.ObjectId;

const PasswordResetTokenSchema = mongoose.Schema({ 
    user: { type: SchemaObjectId, ref: 'LoggedInUser', required: true },
    token: { type: String, required: true, index: { unique: true } },
    expires_at: { type: Date, default: () => { return +new Date() + (9*60*60*1000) } }
});

PasswordResetTokenSchema.statics.create = (user, callback) => {
    const token = new PasswordResetToken();
    token.user = user._id;

    crypto.randomBytes(48, (error, buffer) => {
        if (error) {
            callback(error, null);
        } else {
            token.token = buffer.toString('hex');

            token.save((error) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, token);
                }
            });
        }
    });
}

PasswordResetTokenSchema.methods.isTokenValid = function() {
    const today = new Date();

    if (this.expires_at.getTime() < today.getTime()) {
        return false;
    } else {
        return true;
    }
}

const PasswordResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);

module.exports = PasswordResetToken;