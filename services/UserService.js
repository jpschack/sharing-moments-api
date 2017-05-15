'use strict'

const async        = require('async');
const CostumError  = require('../utils/CostumError');
const UserResponse = require('../utils/responseObjects/UserResponse');
const mongoose     = require('mongoose');
const ObjectId     = mongoose.Types.ObjectId;
const User         = require('../models/User');


class UserService {
    static getUserById(id, callback) {
        User.findById(ObjectId(id)).exec((error, user) => {
            if (error) {
                callback(error, null);
            } else if (user) {
                callback(null, new UserResponse(user));
            } else {
                callback(new CostumError('Not found', 'User not found.', 404), null);
            }
        });
    }

    static getUserByUsername(username, callback) {
        User.findOne({ username: username }).exec((error, user) => {
            if (error) {
                callback(error, null);
            } else if (user) {
                callback(null, new UserResponse(user));
            } else {
                callback(new CostumError('Not found', 'User not found.', 404), null);
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
                        const userList = [];
                        for (var i = 0; i < users.length; i++) {
                            userList.push(new UserResponse(users[i]));
                        }
                        next(null, userList, count);
                    } else {
                        next(null, null, count);
                    }
                });
            }
        ], callback);
    }
}

module.exports = UserService;