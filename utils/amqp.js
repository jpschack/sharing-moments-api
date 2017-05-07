'use strict';

const amqp        = require('amqplib/callback_api');
const config      = require('../config/config');
const logger      = require('../utils/logger');
const CostumError = require('../utils/CostumError');

function AMQP() {
    this.connection = null;
    this.connect = function connect(callback) {
        (function(thisObject) {
            amqp.connect(config.amqp.host + '?heartbeat=60', function(err, conn) {
                if (err) {
                    logger.error('[AMQP]', err.message);
                    callback(err, null);
                }

                conn.on('error', function(err) {
                    if (err.message !== 'Connection closing') {
                        logger.error('[AMQP] conn error', err.message);
                    }
                });

                conn.on('close', function() {
                    logger.info('[AMQP] reconnecting');
                    setTimeout(function() {
                        thisObject.connect(function(error, connection) {
                            if (error) {
                                logger.error('[AMQP] reconnecting failed');
                            } else {
                                logger.info('[AMQP] reconnected');
                            }
                        });
                    }, 1000);
                });

                //save connection to AMQP object
                thisObject.connection = conn;
                callback(null, conn);
            });
        })(this);
    }
}

AMQP.prototype.publish = function(content, callback) {
    if (this.connection) {
        this.connection.createChannel(function(error, channel) {
            if (error) {
                logger.error(error);
                callback(error, null);
            } else {
                channel.assertQueue(config.amqp.queue, { durable: true }, function(error) {
                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        let sent = channel.sendToQueue(config.amqp.queue, Buffer.from(JSON.stringify(content)), {
                            // Store queued elements on disk
                            persistent: true,
                            contentType: 'application/json'
                        });

                        channel.close();
                        callback(null, sent);
                    }
                });
            }
        });
    } else {
        callback(new CostumError('AMQP Error', 'Can not publish message because of missing connection', 500), null);
    }
}

let AMQPConnection = new AMQP();
AMQPConnection.connect(function(error, connection) {
    if (error) {
        logger.error('[AMQP] connecting failed');
    } else {
        logger.info('[AMQP] connected');
    }
});

module.exports = AMQPConnection;