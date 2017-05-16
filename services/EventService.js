'use strict'

const async       = require('async');
const CostumError = require('../utils/CostumError');
const mongoose    = require('mongoose');
const ObjectId    = mongoose.Types.ObjectId;
const Event       = require('../models/Event');
const Location    = require('../models/Location');


class EventService {
    static create(user, placeid, name, description, multiday, startDate, endDate, callback) {
        async.waterfall([
            (next) => {
                Location.findOrCreate(user, placeid, (error, location) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, location);
                    }
                });
            },
            (location, next) => {
                Event.create(user, location, name, description, multiday, startDate, endDate, (error, event) => {
                    if (error) {
                        next(error, null);
                    } else {
                        next(null, event);
                    }
                });
            }
        ], callback);
    }

    static update(eventid, user, placeid, name, description, multiday, startDate, endDate, callback) {
        async.waterfall([
            (next) => {
                    Event
                    .findById(ObjectId(eventid))
                    .populate('location')
                    .exec((error, event) => {
                    if (error) {
                        callback(error, null);
                    } else if (event) {
                        if (event.user.equals(user._id)) {
                            next(null, event);
                        } else {
                            callback(new CostumError('FORBIDDEN', 'This user does not have the necessary permissions to change this event.', 403), null);
                        }
                    } else {
                        callback(new CostumError('NOT_FOUND', 'Event not found.', 404), null);
                    }
                });
            },
            (event, next) => {
                if (event.location.placeid !== placeid) {
                    Location.findOrCreate(user, placeid, (error, location) => {
                        if (error) {
                            callback(error, null);
                        } else {
                            event.location = location._id;
                            next(null, event);
                        }
                    });
                } else {
                    next(null, event);
                }
            },
            (event, next) => {
                event.name        = name;
                event.description = description;
                event.multiday    = multiday;
                event.startDate   = startDate;
                event.endDate     = endDate;

                event.save((error) => {
                    if (error) {
                        next(error, null);
                    } else {
                        next(null, event);
                    }
                });
            }
        ], callback);
    }

    static findById(id, callback) {
        Event
        .findById(ObjectId(id))
        .populate('location')
        .populate('user')
        .exec((error, event) => {
            if (error) {
                callback(error, null);
            } else if (event) {
                callback(null, event);
            } else {
                callback(new CostumError('NOT_FOUND', 'Event not found.', 404), null);
            }
        });
    }

    static search(searchString, from, to, limit, page, sort, callback) {
        async.waterfall([
            (next) => {
                Event.find().countSearchResults(searchString, from, to, (error, count) => {
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
                Event.find().search(searchString, from, to, limit, page, sort, (error, events) => {
                    if (error) {
                        callback(error, null, count);
                    } else if (events) {
                        next(null, events, count);
                    } else {
                        next(null, null, count);
                    }
                });
            }
        ], callback);
    }
}

module.exports = EventService;