'use strict'

const config = require('../config/config');
const aws    = require('aws-sdk');
const crypto = require('crypto');
const AWSS3  = require('../config/awss3');


class AWSS3Service {
    static upload(fileBuffer, callback) {
        crypto.randomBytes(48, (error, buffer) => {
            if (error) {
                callback(error, null);
            } else {
                const key = buffer.toString('hex');
                const params = {
                    Bucket: config.aws.bucket,
                    Key: key,
                    Body: fileBuffer
                };

                AWSS3.upload(params, (error, data) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        callback(null, data);
                    }
                });
            }
        });
    }

    static delete(objectKey, callback) {
        AWSS3.deleteObject({ Bucket: config.aws.bucket, Key: objectKey }, (error, data) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, data);
            }
        });
    }
}

module.exports = AWSS3Service;