'use strict';

const logger                 = require('../utils/logger');
const GenericResponse        = require('../utils/GenericResponse');
const ValidationError        = require('../utils/responseObjects/ValidationError');
const RequestValidationError = require('../utils/RequestValidationError');

function errorHandler(error, req, res, next) {
    if (error) {
        logger.error(error);
        if (error.name == 'CostumError') {
            res.status(error.errorCode).json(new GenericResponse(false, error.message, null));
        } else if (error.name == 'ValidationError') {
            let errorList = [];
            for (let key of Object.keys(error.errors)) {
                errorList.push(new ValidationError(error.errors[key]));
            }
            res.status(403).json(new GenericResponse(false, 'ValidationError', null, errorList));
        } else if (error.name == 'RequestValidationError') {
            res.status(403).json(new GenericResponse(false, 'RequestValidationError', null, error.errors));
        } else {
            res.status(500).json(new GenericResponse(false, error.message, null));
        }
    } else {
        next();
    }
}

function notFoundErrorHandler(req, res, next) {
    res.status(404).json(new GenericResponse(false, 'Route not found.', null));
}

module.exports = function(app) {
    app.use(errorHandler);
    app.use(notFoundErrorHandler);
};