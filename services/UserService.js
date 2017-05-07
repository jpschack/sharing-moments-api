'use strict'

const config       = require('../config/config');
const logger       = require('../utils/logger');
const async        = require('async');
const CostumError  = require('../utils/CostumError');
const UserResponse = require('../utils/responseObjects/UserResponse');
const mongoose     = require('mongoose');
const ObjectId     = mongoose.Types.ObjectId;
const User         = require('../models/User');


function UserService() {}

UserService.prototype.getUserById = function(id, callback) {
    User.findById(ObjectId(id)).exec(function(error, user) {
        if (error) {
            logger.error(error);
            callback(error, null);
        } else if (user) {
            callback(null, new UserResponse(user));
        } else {
            callback(new CostumError('Not found', 'User not found.', 404), null);
        }
    });
}

UserService.prototype.getUserByUsername = function(username, callback) {
    User.findOne({ username: username }).exec(function(error, user) {
        if (error) {
            logger.error(error);
            callback(error, null);
        } else if (user) {
            callback(null, new UserResponse(user));
        } else {
            callback(new CostumError('Not found', 'User not found.', 404), null);
        }
    });
}

UserService.prototype.search = function(searchString, limit, page, callback) {
    async.waterfall([
        function (next) {
            User.find().countSearchResults(searchString, function(error, count) {
                if (error) {
                    logger.error(error);
                    callback(error, null, null);
                } else if (count == 0) {
                    callback(null, null, count);
                } else {
                    next(null, count);
                }
            });
        },
        function (count, next) {
            User.find().search(searchString, limit, page, function(error, users) {
                if (error) {
                    logger.error(error);
                    callback(error, null, count);
                } else if (users) {
                    let userList = [];
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

module.exports = new UserService();