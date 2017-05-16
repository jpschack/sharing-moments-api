'use strict';

const mongoose = require('mongoose');
const logger   = require('../utils/logger');


module.exports = function(config) {
    mongoose.Promise = global.Promise;

    const dbConnection = mongoose.connection;

    dbConnection.on('connecting', () => {
        logger.info('Mongoose connecting to ' + config.db);
    });

    dbConnection.on('connected', () => {
        logger.info('Mongoose connected to ' + config.db);
    });

    dbConnection.on('error', (error) => {
        logger.error('Mongoose connection error ' + error);
        process.exit(1);
    });

    dbConnection.on('reconnected', () => {
        logger.info('Mongoose reconnected to ' + config.db);
    });

    dbConnection.on('timeout', () => {
        logger.error('Mongoose connection timeout to ' + config.db);
    });

    dbConnection.on('disconnected', () => {
        logger.info('Mongoose connection disconnected to ' + config.db);
    });

    mongoose.connect(config.db);
};