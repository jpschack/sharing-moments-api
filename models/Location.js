'use strict';

const mongoose       = require('mongoose');
const SchemaObjectId = mongoose.Schema.Types.ObjectId;

const LocationSchema = mongoose.Schema({ 
    user: { type: SchemaObjectId, ref: 'User', required: true },
    placeid: { type: String, required: true , index: { unique: true } }, //google place_id
    updated_at: { type: Date, default: Date.now }
});

LocationSchema.plugin(require('./plugins/toJSONPlugin'));

LocationSchema.path('placeid').validate({
    isAsync: true,
    validator: (value, respond) => {
        const locationObject = this;
        Location.findOne({ placeid: value }, (error, location) => {
            if (error) {
                return respond(error);
            } else if (location && !location._id.equals(locationObject._id)) {
                respond(false);
            } else {
                respond(true);
            }
        });
    },
    message: 'Location already exists.'
});

LocationSchema.pre('save', (next) => {
    if (!this.isNew) {
        this.updated_at = new Date();
    }
    next();
});

LocationSchema.statics.create = function(user, placeid, callback) {
    const location   = new Location();
    location.user    = user._id;
    location.placeid = placeid;

    location.save((error) => {
        if (error) {
            callback(error, null);
        } else {
            callback(null, location);
        }
    });
}

LocationSchema.statics.findOrCreate = function(user, placeid, callback) {
    Location.findOne({ placeid: placeid }, (error, location) => {
        if (error) {
        } else if (location) {
            callback(null, location);
        } else {
            Location.create(user, placeid, callback);
        }
    });
}

const Location = mongoose.model('Location', LocationSchema);

module.exports = Location;