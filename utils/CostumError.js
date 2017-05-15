'use strict';


class CostumError extends Error {
    constructor(type, message, errorCode) {
        super(message);

        this.name      = this.constructor.name;
        this.type      = type;
        this.errorCode = errorCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = CostumError;