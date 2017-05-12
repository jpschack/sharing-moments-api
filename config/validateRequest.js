'use strict';

const RequestValidationError = require('../utils/RequestValidationError');


function validateRequest(req, callback) {
    req.getValidationResult().then((validationResult) => {
        if (validationResult.isEmpty()) {
            callback();
        } else {
            const error = new RequestValidationError();
            error.errors = validationResult.array();
            callback(error);
        }
    });
}

module.exports = validateRequest;