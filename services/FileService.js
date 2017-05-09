'use strict';

const multer      = require('multer');
const storage     = multer.memoryStorage();
const fileUpload  = multer({ storage: storage, limits: { fileSize: 52428800 }, fileFilter: fileFilter });
const CostumError = require('../utils/CostumError');


function fileFilter (req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        callback(new CostumError('BAD_REQUEST', 'Only images are allowed.', 400));
    } else {
        callback(null, true);
    }
}


function FileService() {}

FileService.prototype.singleFileUpload = function (req, res, fieldname, callback) {
    const singleFileUpload = fileUpload.single(fieldname);
    singleFileUpload(req, res, callback);
}

FileService.prototype.arrayFileUpload = function (req, res, fieldname, maxCount, callback) {
    const arrayFileUpload = fileUpload.array(fieldname, maxCount);
    arrayFileUpload(req, res, callback);
}


module.exports = new FileService();