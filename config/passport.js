'use strict';

const CostumError         = require('../utils/CostumError');
const passport            = require('passport');
const passportJWTStrategy = require('passport-jwt').Strategy;
const FacebookStrategy    = require('passport-facebook').Strategy;
const User                = require('../models/User');
const mongoose            = require('mongoose');
const ObjectId            = mongoose.Types.ObjectId;
const logger              = require('../utils/logger');


module.exports = function(app, config) {
    passport.use(
        new passportJWTStrategy(config.jwt.passportJWT, function(jwt_payload, next) {
            if (!jwt_payload || !jwt_payload.exp || !jwt_payload.id) {
                next(new CostumError('Unauthorized', 'Token invalid.', 401), false);
            } else {
                let exp = jwt_payload.exp;
                let currentTime = Date.now() / 1000;
                if (exp < currentTime) {
                    next(new CostumError('Unauthorized', 'Token expired.', 401), false);
                } else {
                    let userid = ObjectId(jwt_payload.id);
                    User.findById(userid).select('+password').exec(function(error, user) {
                        if (error) {
                            next(error, false);
                        } else if (user) {
                            next(null, user);
                        } else {
                            next(new CostumError('Unauthorized', 'Associated user not found.', 401), false);
                        }
                    });
                }
            }
        })
    );

    const options = {
        clientID: config.fb.clientID,
        clientSecret: config.fb.clientSecret,
        callbackURL: config.fb.callbackURL,
        profileFields: ['id', 'email', 'name'],
    };

    passport.use(
        new FacebookStrategy(
            options,
            function(accessToken, refreshToken, profile, next) {
                if (profile.emails && profile.emails.length > 0 && profile.name && profile.name.givenName) {
                    let id = profile.id;

                    User.find().socialUser(id, 'facebook', function (error, user) {
                        if (error) {
                            logger.error(error);
                            next(error, null);
                        } else if (user) {
                            next(null, user);
                        } else {
                            let email = profile.emails[0].value;
                            let name = profile.name.givenName + (profile.name.familyName ? (' ' + profile.name.familyName) : '');
                            let socialData = { id: id, accessToken: accessToken, refreshToken: refreshToken };

                            User.createSocialUser(email, socialData, name, function (error, user) {
                                if (error) {
                                    logger.error(error);
                                    next(error, null);
                                } else {
                                    next(null, user);
                                }
                            });
                        }
                    });
                } else {
                    next(new CostumError('FB Login Error', 'Unexpected error while login to fb. Did not receive all needed information.', 500), null);
                }
            }
        )
    );

    app.use(passport.initialize());
};