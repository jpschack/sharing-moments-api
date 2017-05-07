'use strict';

const mongoose = require('mongoose');
const logger   = require('../utils/logger');


module.exports = function(config) {
    mongoose.Promise = global.Promise;

    let dbConnection = mongoose.connection;

    dbConnection.on('connecting', function() {
        logger.info('Mongoose connecting to ' + config.db);
    });

    dbConnection.on('connected', function() {
        logger.info('Mongoose connected to ' + config.db);
    });

    dbConnection.on('error', function(error) {
        logger.error('Mongoose connection error ' + error);
        process.exit(1);
    });

    dbConnection.on('reconnected', function() {
        logger.info('Mongoose reconnected to ' + config.db);
    });

    dbConnection.on('timeout', function() {
        logger.error('Mongoose connection timeout to ' + config.db);
    });

    dbConnection.on('disconnected', function() {
        logger.info('Mongoose connection disconnected to ' + config.db);
    });

    mongoose.connect(config.db);
};