'use strict'

const async       = require('async');
const CustomError = require('../utils/CustomError');
const mongoose    = require('mongoose');
const ObjectId    = mongoose.Types.ObjectId;
const User        = require('../models/User');


class UserService {
    static getUserById(id, callback) {
        User.findById(ObjectId(id)).exec((error, user) => {
            if (error) {
                callback(error, null);
            } else if (user) {
                callback(null, user);
            } else {
                callback(new CustomError('NOT_FOUND', 'User not found.', 404), null);
            }
        });
    }

    static getUserByUsername(username, callback) {
        User.findOne({ username: username }).exec((error, user) => {
            if (error) {
                callback(error, null);
            } else if (user) {
                callback(null, user);
            } else {
                callback(new CustomError('NOT_FOUND', 'User not found.', 404), null);
            }
        });
    }

    static search(searchString, limit, page, callback) {
        async.waterfall([
            (next) => {
                User.find().countSearchResults(searchString, (error, count) => {
                    if (error) {
                        callback(error, null, null);
                    } else if (count == 0) {
                        callback(null, null, count);
                    } else {
                        next(null, count);
                    }
                });
            },
            (count, next) => {
                User.find().search(searchString, limit, page, (error, users) => {
                    if (error) {
                        callback(error, null, count);
                    } else if (users) {
                        next(null, users, count);
                    } else {
                        next(null, null, count);
                    }
                });
            }
        ], callback);
    }
}

module.exports = UserService;