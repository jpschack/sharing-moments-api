'use strict';

const mongoose = require('mongoose');
const logger   = require('../utils/logger');
const config   = require('./config');


function db() {
    mongoose.Promise = global.Promise;

    const dbConnection = mongoose.connection;

    dbConnection.on('connecting', () => {
        logger.info('Mongoose connecting to ' + config.db.url);
    });

    dbConnection.on('connected', () => {
        logger.info('Mongoose connected to ' + config.db.url);
    });

    dbConnection.on('error', (error) => {
        logger.error('Mongoose connection error ' + error);
        process.exit(1);
    });

    dbConnection.on('reconnected', () => {
        logger.info('Mongoose reconnected to ' + config.db.url);
    });

    dbConnection.on('timeout', () => {
        logger.error('Mongoose connection timeout to ' + config.db.url);
    });

    dbConnection.on('disconnected', () => {
        logger.info('Mongoose connection disconnected to ' + config.db.url);
    });

    mongoose.connect(config.db.url, config.db.options);
}

module.exports = db;