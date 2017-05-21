'use strict';

const amqp        = require('amqplib/callback_api');
const config      = require('../config/config');
const logger      = require('../utils/logger');
const CostumError = require('../utils/CostumError');


class AMQP {
    constructor() {
        this.connection = null;
    }

    connect(callback) {
        amqp.connect(config.amqp.host + '?heartbeat=60', (error, conn) => {
            if (error) {
                logger.error('[AMQP]', error.message);
                callback(error, null);
            }

            conn.on('error', (error) => {
                if (error.message !== 'Connection closing') {
                    logger.error('[AMQP] conn error', error.message);
                }
            });

            conn.on('close', () => {
                logger.info('[AMQP] reconnecting');
                setTimeout(() => {
                    this.connect((error, connection) => {
                        if (error) {
                            logger.error('[AMQP] reconnecting failed');
                        } else {
                            logger.info('[AMQP] reconnected');
                            this.connection = connection;
                        }
                    });
                }, 1000);
            });

            this.connection = conn;
            callback(null, conn);
        });
    }

    publish(content, callback) {
        if (this.connection) {
            this.connection.createChannel((error, channel) => {
                if (error) {
                    logger.error(error);
                    callback(error, null);
                } else {
                    channel.assertQueue(config.amqp.queue, { durable: true }, (error) => {
                        if (error) {
                            logger.error(error);
                            callback(error, null);
                        } else {
                            const sent = channel.sendToQueue(config.amqp.queue, Buffer.from(JSON.stringify(content)), {
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
            callback(new CostumError('AMQP_ERROR', 'Can not publish message because of missing connection', 500), null);
        }
    }
}

const AMQPConnection = new AMQP();
AMQPConnection.connect((error, connection) => {
    if (error) {
        logger.error('[AMQP] connecting failed');
    } else {
        logger.info('[AMQP] connected');
    }
});

module.exports = AMQPConnection;