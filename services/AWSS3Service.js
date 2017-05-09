'use strict'

const config = require('../config/config');
const aws    = require('aws-sdk');
const crypto = require('crypto');
const AWSS3  = require('../config/awss3');


function AWSS3Service() {}

AWSS3Service.prototype.upload = function(fileBuffer, callback) {
    crypto.randomBytes(48, function(error, buffer) {
        if (error) {
            callback(error, null);
        } else {
            let key = buffer.toString('hex');
            let params = {
                Bucket: config.aws.bucket,
                Key: key,
                Body: fileBuffer
            };

            AWSS3.upload(params, function(error, data) {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, data);
                }
            });
        }
    });
}

AWSS3Service.prototype.delete = function(objectKey, callback) {
    AWSS3.deleteObject({ Bucket: config.aws.bucket, Key: objectKey }, function(error, data) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, data);
        }
    });
}

module.exports = new AWSS3Service();