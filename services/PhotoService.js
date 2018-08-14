'use strict'

const async        = require('async');
const CustomError  = require('../utils/CustomError');
const mongoose     = require('mongoose');
const ObjectId     = mongoose.Types.ObjectId;
const FileService  = require('../services/FileService');
const AWSS3Service = require('../services/AWSS3Service');
const Photo        = require('../models/Photo');
const Event        = require('../models/Event');
const logger       = require('../utils/logger');


class PhotoService {
    static upload(req, res, eventid, callback) {
        async.waterfall([
            (next) => {
                Event
                .findById(ObjectId(eventid))
                .exec((error, event) => {
                    if (error) {
                        callback(error, null);
                    } else if (event) {
                        next(null, event);
                    } else {
                        callback(new CustomError('NOT_FOUND', 'Event not found.', 404), null);
                    }
                });
            },
            (event, next) => {
                FileService.arrayFileUpload(req, res, 'image', 5, (error) => {
                    if (error) {
                        callback(error, null);
                    } else if (req.files) {
                        next(null, event, req.files);
                    } else {
                        callback(new CustomError('BAD_REQUEST', 'No images found.', 400), null);
                    }
                });
            },
            (event, files, next) => {
                async.map(files, (file, fileCallback) => {
                    async.waterfall([
                        (nextFile) => {
                            AWSS3Service.upload(file.buffer, (error, uploadedFile) => {
                                if (error) {
                                    nextFile(error);
                                } else {
                                    nextFile(null, uploadedFile);
                                }
                            });
                        },
                        (uploadedFile, nextFile) => {
                            const s3ObjectId = uploadedFile.key;
                            const url = uploadedFile.Location;
                            Photo.create(req.user, event, s3ObjectId, url, nextFile);
                        }
                    ], fileCallback);
                }, (error, photos) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, photos);
                    }
                });
            }
        ], callback);
    }

    static updatePhotoDetails(photoid, description, callback) {
        async.waterfall([
            (next) => {
                Photo.findById(ObjectId(photoid)).exec((error, photo) => {
                    if (error) {
                        callback(error, null);
                    } else if (!photo) {
                        callback(new CustomError('NOT_FOUND', 'Photo not found.', 404), null);
                    } else {
                        next(null, photo);
                    }
                });
            },
            (photo, next) => {
                photo.description = description;

                photo.save((error) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        next(null, photo);
                    }
                });
            }
        ], callback);
    }

    static getPhotoById(photoid, callback) {
        Photo
        .findById(ObjectId(photoid))
        .exec((error, photo) => {
            if (error) {
                callback(error, null);
            } else if (!photo) {
                callback(new CustomError('NOT_FOUND', 'Photo not found.', 404), null);
            } else {
                callback(null, photo);
            }
        });
    }

    static getPhotosByEventid(eventid, limit, page, sort, callback) {
        Photo
        .find({ event: ObjectId(eventid) })
        .sort({ _id: sort })
        .limit(limit)
        .skip(page * limit)
        .exec((error, photos) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, photos);
            }
        });
    }

    static getPhotosByUserid(userid, limit, page, sort, callback) {
        Photo
        .find({ user: ObjectId(userid) })
        .sort({ _id: sort })
        .limit(limit)
        .skip(page * limit)
        .exec((error, photos) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, photos);
            }
        });
    }

    static deletePhoto(photoid, callback) {
        async.waterfall([
            (next) => {
                Photo.findById(ObjectId(photoid)).exec((error, photo) => {
                    if (error) {
                        callback(error, null);
                    } else if (!photo) {
                        callback(new CustomError('NOT_FOUND', 'Photo not found.', 404), null);
                    } else {
                        next(null, photo);
                    }
                });
            },
            (photo, next) => {
                AWSS3Service.delete(photo.s3ObjectId, (error, data) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        logger.info(data);
                        next(null, photo);
                    }
                });
            },
            (photo, next) => {
                photo.remove((error) => {
                    if (error) {
                        next(error, null);
                    } else {
                        next(null, true);
                    }
                });
            }
        ], callback);
    }
}

module.exports = PhotoService;