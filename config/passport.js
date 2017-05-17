'use strict';

const CostumError         = require('../utils/CostumError');
const passport            = require('passport');
const passportJWTStrategy = require('passport-jwt').Strategy;
const FacebookStrategy    = require('passport-facebook').Strategy;
const LoggedInUser        = require('../models/LoggedInUser');
const mongoose            = require('mongoose');
const ObjectId            = mongoose.Types.ObjectId;
const logger              = require('../utils/logger');
const config              = require('./config');


module.exports = (app) => {
    passport.use(
        new passportJWTStrategy(config.jwt.passportJWT, (jwt_payload, next) => {
            if (!jwt_payload || !jwt_payload.exp || !jwt_payload.id) {
                next(new CostumError('Unauthorized', 'Token invalid.', 401), false);
            } else {
                const exp = jwt_payload.exp;
                const currentTime = Date.now() / 1000;
                if (exp < currentTime) {
                    next(new CostumError('Unauthorized', 'Token expired.', 401), false);
                } else {
                    const userid = ObjectId(jwt_payload.id);
                    LoggedInUser.findById(userid).select('+password').exec((error, user) => {
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
            (accessToken, refreshToken, profile, next) => {
                if (profile.emails && profile.emails.length > 0 && profile.name && profile.name.givenName) {
                    const id = profile.id;

                    LoggedInUser.find().socialUser(id, 'facebook', (error, user) => {
                        if (error) {
                            logger.error(error);
                            next(error, null);
                        } else if (user) {
                            next(null, user);
                        } else {
                            const email = profile.emails[0].value;
                            const name = profile.name.givenName + (profile.name.familyName ? (' ' + profile.name.familyName) : '');
                            const socialData = { id: id, accessToken: accessToken, refreshToken: refreshToken };

                            LoggedInUser.createSocialUser(email, socialData, name, (error, user) => {
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