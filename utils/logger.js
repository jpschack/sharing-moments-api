'use strict';

const winston = require('winston');
const MESSAGE = Symbol.for('message');
const { combine, timestamp, printf, colorize } = winston.format;

const jsonFormat = winston.format((logEntry) => {
    const base = { timestamp: new Date() };
    const json = Object.assign(base, logEntry);
    logEntry[MESSAGE] = JSON.stringify(json);
    return logEntry;
})();

const consoleFormat = combine(
    colorize({ all: true }),
    timestamp(),
    printf(info => {
        return `${info.timestamp} ${info.level}: ${info.message}`;
    })
);

const maxFileSize = 5242880;
const maxFilesPerLog = 5;

winston.addColors({
    info: 'green',
    warn: 'yellow',
    error: 'red'
});

const info = winston.createLogger({
    levels: {
        info: 1
    },
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log', format: jsonFormat })
    ],
    transports: [
        new (winston.transports.File)({ filename: 'logs/info.log', level: 'info', format: jsonFormat, maxsize: maxFileSize, maxFiles: maxFilesPerLog }),
        new (winston.transports.Console)({ level: 'info', format: consoleFormat })
    ]
});

const warn = winston.createLogger({
    levels: {
        warn: 2
    },
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log', format: jsonFormat })
    ],
    transports: [
        new (winston.transports.File)({ filename: 'logs/warn.log', level: 'warn', format: jsonFormat, maxsize: maxFileSize, maxFiles: maxFilesPerLog }),
        new (winston.transports.Console)({ level: 'warn', format: consoleFormat })
    ]
});

const error = winston.createLogger({
    levels: {
        error: 3
    },
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log', format: jsonFormat })
    ],
    transports: [
        new (winston.transports.File)({ filename: 'logs/error.log', level: 'error', format: jsonFormat, maxsize: maxFileSize, maxFiles: maxFilesPerLog }),
        new (winston.transports.Console)({ level: 'error', format: consoleFormat })
    ]
});

const loggers = {
    info: (msg) => {
        info.info(msg);
    },
    warn: (msg) => {
        warn.warn(msg);
    },
    error: (msg) => {
        error.error(msg);
    },
    log: (level, msg) => {
        const lvl = loggers[level];
        lvl(msg);
    }
};

module.exports = loggers;