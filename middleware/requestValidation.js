'use strict';

const RequestValidationError = require('../utils/RequestValidationError');

function requestValidation(bodyValidationSchema, paramValidationSchema, queryValidationSchema) {
    return (req, res, next) => {
        if (bodyValidationSchema) {
            req.checkBody(bodyValidationSchema);
        }

        if (paramValidationSchema) {
            req.checkParams(paramValidationSchema);
        }

        if (queryValidationSchema) {
            req.checkQuery(queryValidationSchema);
        }

        req.getValidationResult().then((validationResult) => {
            if (validationResult.isEmpty()) {
                next();
            } else {
                next(new RequestValidationError(validationResult.array()));
            }
        });
    }
}

module.exports = requestValidation;