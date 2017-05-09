'use strict';

const passportJWT = require('passport-jwt');
const env         = process.env.NODE_ENV || 'development';

const ExtractJwt            = passportJWT.ExtractJwt;
const jwtOptions            = {};
jwtOptions.jwtFromRequest   = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey      = '';
jwtOptions.ignoreExpiration = true;

const config = {
    port: 3000,
    host: '',
    env: env,
    db: '',
    fb: {
        clientID: '',
        clientSecret: '',
        callbackURL: ''
    },
    jwt: {
        passportJWT: jwtOptions,
        authtoken: {
            expirationTime: 12*60*60*1000, //in milliseconds
            jwtExpirationTime: '12h' //Eg: 60, "2 days", "10h", "7d"
        },
        refreshtoken: {
            expirationTime: 7*24*60*60*1000 //in milliseconds
        }
    },
    amqp: {
        host: '',
        queue: ''
    },
    aws: {
        secretAccessKey: '',
        accessKeyId: '',
        bucket: ''
    },
    webhost: ''
};

module.exports = config;