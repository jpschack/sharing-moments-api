'use strict'

const config        = require('../config/config');
const amqp          = require('../utils/amqp');
const AMQPEmailData = require('../utils/responseObjects/AMQPEmailData');


class MailService {
    static verificationEmail(user, token, callback) {
        const content = {
            name: user.name,
            url: config.webhost + '/?vt=' + token.token,
            linktext: 'Complete your signup now'
        };
        const data = new AMQPEmailData('Email Verification', 'email', 'verification-mail', user.email, 'Verify your Email Address', content);

        amqp.publish(data, (error, sent) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, sent);
            }
        });
    }

    static resetPasswordEmail(user, token, callback) {
        const content = {
            name: user.name,
            url: config.webhost + '/?rt=' + token.token,
            linktext: 'Reset Password'
        };
        const data = new AMQPEmailData('Reset Password', 'email', 'reset-password-email', user.email, 'Reset your Password', content);

        amqp.publish(data, (error, sent) => {
            if (error) {
                callback(error, null);
            } else {
                callback(null, sent);
            }
        });
    }
}

module.exports = MailService;