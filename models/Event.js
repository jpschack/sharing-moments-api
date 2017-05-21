'use strict';

const mongoose       = require('mongoose');
const SchemaObjectId = mongoose.Schema.Types.ObjectId;
const CostumError    = require('../utils/CostumError');
const Photo          = require('./Photo');
const async          = require('async');


const dateValidation = [
    { validator: function (value) {
        return !(value && this.startDate.getTime() == this.endDate.getTime());
    }, msg: 'startDate can not be equal endDate if it is a multiday event.' },
    { validator: function(value) {
        return !(!value && this.startDate.getTime() != this.endDate.getTime());
    }, msg: 'startDate must be equal endDate if it is not a multiday event.' },
    { validator: function (value) {
        return !(value && this.startDate.getTime() > this.endDate.getTime());
    }, msg: 'startDate can not be lower than endDate.' }
];

const EventSchema = mongoose.Schema({ 
    user: { type: SchemaObjectId, ref: 'User', required: true },
    location: { type: SchemaObjectId, ref: 'Location', required: true },
    name: String,
    description: String,
    multiday: { type: Boolean, default: false, validate: dateValidation },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now }
});

EventSchema.plugin(require('./plugins/toJSONPlugin'));

EventSchema.statics.create = (user, location, name, description, multiday, startDate, endDate, callback) => {
    const event       = new Event();
    event.user        = user._id;
    event.location    = location._id;
    event.name        = name;
    event.description = description;
    event.multiday    = multiday;
    event.startDate   = startDate;
    event.endDate     = endDate;

    event.save((error) => {
        if (error) {
            callback(error, null);
        } else {
            callback(null, event);
        }
    });
}

EventSchema.pre('remove', function(callback) {
    Photo.find({ event: this._id}).exec((error, photos) => {
        if (error) {
            callback(error);
        } else if (photos && photos.length > 0) {
            async.each(photos, (photo, next) => {
                photo.remove((error) => {
                    if (error) {
                        next(error);
                    } else {
                        next();
                    }
                });
            }, (error) => {
                if (error) {
                    callback(error);
                } else {
                    callback();
                }
            });
        } else {
            callback();
        }
    });
});

EventSchema.query.search = (searchString, from, to, limit, page, sort, callback) => {
    const query = getSearchQuery(searchString, from, to);

    Event.find(query)
        .sort({ startDate: sort })
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

EventSchema.query.countSearchResults = (searchString, from, to, callback) => {
    const query = getSearchQuery(searchString, from, to);

    Event.find(query)
        .count()
        .exec((error, count) => {
            if (error) {
                callback(err, null);
            } else {
                callback(null, count);
            }
    });
}

function getSearchQuery(searchString, from, to) {
    let query;
    const searchExpression = new RegExp(".*" + searchString.replace(/(\W)/g, "\\$1") + ".*", "i");

    if (from && to) {
        query = {
            $and: [
                {
                    $or: [
                        { name: searchExpression },
                        { description: searchExpression }
                    ]
                },
                { $and: [
                    { startDate: {$lte: to} },
                    { $or: [
                        { $and: [ { multiday: {$eq: false} }, { startDate: {$gte: from} } ] },
                        { $and: [ { multiday: {$eq: true} }, { endDate: {$gte: from} } ]  }
                    ] }
                ] }
            ] };
    } else if (from) {
        query = {
            $and: [
                {
                    $or: [
                        { name: searchExpression },
                        { description: searchExpression }
                    ]
                },
                { $or: [
                    { startDate: {$gte: from} },
                    { $and: [
                        { multiday: {$eq: true} },
                        { endDate: {$gte: from} }
                    ] }
                ] }
            ] };
    } else if (to) {
        query = {
            $and: [
                {
                    $or: [
                        { name: searchExpression },
                        { description: searchExpression }
                    ]
                },
                { startDate: {$lte: to} }
            ] };
    } else {
        query = {
            $or: [
                { name: searchExpression },
                { description: searchExpression }
            ]
        };
    }

    return query;
}

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;