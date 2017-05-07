'use strict';

const util = require('util');

function CostumError(type, message, errorCode) {
    this.name = 'CostumError';

    if (type)
        this.type = type;

    if (message)
        this.message = message;

    if (errorCode)
        this.errorCode = errorCode;

    Error.captureStackTrace(this, CostumError);
}

util.inherits(CostumError, Error);

module.exports = CostumError;