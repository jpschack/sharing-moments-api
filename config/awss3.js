'use strict';

const config = require('../config/config');
const aws    = require('aws-sdk');

aws.config.update({
    secretAccessKey: config.aws.secretAccessKey,
    accessKeyId: config.aws.accessKeyId,
});


module.exports = new aws.S3();