'use strict';


class RequestValidationError {
    constructor(errors) {
        this.name   = 'RequestValidationError';
        this.errors = errors;
    }
}

module.exports = RequestValidationError;