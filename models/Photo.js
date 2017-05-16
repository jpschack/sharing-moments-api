'use strict';

const mongoose       = require('mongoose');
const SchemaObjectId = mongoose.Schema.Types.ObjectId;


let PhotoSchema = mongoose.Schema({ 
    user: { type: SchemaObjectId, ref: 'User', required: true },
    event: { type: SchemaObjectId, ref: 'Event', required: true },
    s3ObjectId: { type: String, required: true },
    url: { type: String, required: true },
    description: String,
    updated_at: { type: Date, default: Date.now }
});

PhotoSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updated_at = new Date();
    }
    next();
});

PhotoSchema.statics.create = function(user, event, s3ObjectId, url, callback) {
    let photo = new Photo();
    photo.user = user._id;
    photo.event = event._id;
    photo.s3ObjectId = s3ObjectId;
    photo.url = url;

    photo.save(function(error) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, photo);
        }
    });
}

let Photo = mongoose.model('Photo', PhotoSchema);

module.exports = Photo;