'use strict';

const passport = require('passport');


function passportJwt(req, res, next) {
    passport.authenticate('jwt', { session: false }, function(error, user, info) {
        if (error) {
            next(error);
        } else {
            req.user = user;
            next();
        }
    })(req, res, next);
}

module.exports = passportJwt;