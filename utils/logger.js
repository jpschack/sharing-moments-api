'use strict';

const winston = require('winston');

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            name: 'info-file',
            filename: 'logs/info.log',
            level: 'info'
        }),
        new (winston.transports.Console)({
            name: 'info-console',
            level: 'info'
        }),
        new (winston.transports.File)({
            name: 'error-file',
            filename: 'logs/error.log',
            level: 'error'
        }),
        new (winston.transports.Console)({
            name: 'error-console',
            level: 'error'
        })
    ]
});

module.exports = logger;