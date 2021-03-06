'use strict';

const multer      = require('multer');
const storage     = multer.memoryStorage();
const fileUpload  = multer({ storage: storage, limits: { fileSize: 52428800 }, fileFilter: fileFilter });
const CustomError = require('../utils/CustomError');


function fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        callback(new CustomError('BAD_REQUEST', 'Only images are allowed.', 400));
    } else {
        callback(null, true);
    }
}

class FileService {
    static singleFileUpload(req, res, fieldname, callback) {
        const singleFileUpload = fileUpload.single(fieldname);
        singleFileUpload(req, res, callback);
    }

    static arrayFileUpload(req, res, fieldname, maxCount, callback) {
        const arrayFileUpload = fileUpload.array(fieldname, maxCount);
        arrayFileUpload(req, res, callback);
    }
}


module.exports = FileService;