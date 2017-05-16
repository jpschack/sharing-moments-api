'use strict';

const mongoose    = require('mongoose');
const CostumError = require('../utils/CostumError');


const UserSchema = mongoose.Schema({
    email: { type: String, required: true, index: { unique: true }, select: false },
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
    strategy: { type: String, select: false },
    name: String,
    enabled: { type: Boolean, default: true, select: false },
    verified: { type: Boolean, default: false, select: false },
    privateAccount: { type: Boolean, default: false },
    profileimage: {
        type: {
            s3ObjectId: String,
            url: String,
            created_at: { type: Date, default: Date.now }
        }
    },
    updated_at: { type: Date, default: Date.now }
});

UserSchema.plugin(require('./plugins/toJSONPlugin'));

UserSchema.pre('save', (next) => {
    next(new CostumError('FORBIDDEN', 'Not the necessary permissions to change this user.', 403));
});

UserSchema.pre('update', (next) => {
    next(new CostumError('FORBIDDEN', 'Not the necessary permissions to change this user.', 403));
});

UserSchema.pre('remove', (next) => {
    next(new CostumError('FORBIDDEN', 'Not the necessary permissions to change this user.', 403));
});

UserSchema.query.search = function(searchString, limit, page, callback) {
    const searchExpression = new RegExp(".*" + searchString.replace(/(\W)/g, "\\$1") + ".*", "i");
    this.find({
        $or: [
            { username: searchExpression },
            { name: searchExpression }
        ] })
        .limit(limit)
        .skip(page * limit)
        .exec((error, result) => {
            if (error) {
                callback(err, null);
            } else if (result) {
                callback(null, result);
            } else {
                callback(null, null);
            }
    });
}

UserSchema.query.countSearchResults = function(searchString, callback) {
    const searchExpression = new RegExp(".*" + searchString.replace(/(\W)/g, "\\$1") + ".*", "i");
    this.find({
        $or: [
            { username: searchExpression },
            { name: searchExpression }
        ] })
        .count()
        .exec((error, count) => {
            if (error) {
                callback(err, null);
            } else {
                callback(null, count);
            }
    });
}

const User = mongoose.model('User', UserSchema, 'users');

module.exports = User;