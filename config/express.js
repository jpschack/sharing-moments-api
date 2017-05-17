'use strict';

const bodyParser       = require('body-parser');
const morgan           = require('morgan');
const expressValidator = require('express-validator');
const mongoose         = require('mongoose');


function validationErrorFormatter(param, msg, value) {
    return {
        name    : 'RequestValidationError',
        param   : param,
        message : msg,
        value   : value
    };
}

const customValidators = {
    isObjectIdValid: (value) => {
        return mongoose.Types.ObjectId.isValid(value);
    }
};

module.exports = (app) => {
    app.disable('etag');

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    app.use(expressValidator({ errorFormatter: validationErrorFormatter, customValidators: customValidators }));

    app.use(morgan('dev'));
};