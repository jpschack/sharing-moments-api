'use strict';

const bodyParser       = require('body-parser');
const morgan           = require('morgan');
const expressValidator = require('express-validator');


function validationErrorFormatter(param, msg, value) {
    return {
        name    : 'RequestValidationError',
        param   : param,
        message : msg,
        value   : value
    };
}

module.exports = function(app, config) {
    app.disable('etag');

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    app.use(expressValidator({ errorFormatter: validationErrorFormatter }));

    app.use(morgan('dev'));
};