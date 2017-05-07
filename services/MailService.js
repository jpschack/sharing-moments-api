'use strict'

const config        = require('../config/config');
const amqp          = require('../utils/amqp');
const logger        = require('../utils/logger');
const AMQPEmailData = require('../utils/responseObjects/AMQPEmailData');

function MailService() {}

MailService.prototype.verificationEmail = function(user, token, callback) {
    let content = {
        name: user.name,
        url: config.webhost + '/?vt=' + token.token,
        linktext: 'Complete your signup now'
    };
    let data = new AMQPEmailData('Email Verification', 'email', 'verification-mail', user.email, 'Verify your Email Address', content);

    amqp.publish(data, function(error, sent) {
        if (error) {
            logger.error(error);
            callback(error, null);
        } else {
            callback(null, sent);
        }
    });
}

MailService.prototype.resetPasswordEmail = function(user, token, callback) {
    let content = {
        name: user.name,
        url: config.webhost + '/?rt=' + token.token,
        linktext: 'Reset Password'
    };
    let data = new AMQPEmailData('Reset Password', 'email', 'reset-password-email', user.email, 'Reset your Password', content);

    amqp.publish(data, function(error, sent) {
        if (error) {
            logger.error(error);
            callback(error, null);
        } else {
            callback(null, sent);
        }
    });
}

module.exports = new MailService();