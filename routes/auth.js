'use strict';

const express                = require('express');
const router                 = express.Router();
const passport               = require('passport');
const config                 = require('../config/config');
const passportJwt            = require('../config/passportJwt');
const validateRequest        = require('../config/validateRequest');
const logger                 = require('../utils/logger');
const GenericResponse        = require('../utils/GenericResponse');
const LoggedInUserResponse   = require('../utils/responseObjects/LoggedInUserResponse');
const UserAccountService     = require('../services/UserAccountService');
const RefreshToken           = require('../models/RefreshToken');


router.post('/login', function(req, res, next) {
    const validationSchema = {
        'email': {
            isEmail: {
              errorMessage: 'The given email address is invalid.'
            }
        },
        'password': {
            notEmpty: true,
            errorMessage: 'Missing Password'
        }
    };
    req.checkBody(validationSchema);

    validateRequest(req, function (error) {
        if (error) {
            next(error);
        } else {
            let email = req.body.email;
            let password = req.body.password;

            UserAccountService.login(email, password, function (error, userResponseObject) {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, userResponseObject));
                }
            });
        }
    });
});

router.get('/refreshtoken', function(req, res, next) {
    if (req.query.token && req.query.userid) {
        let token = req.query.token;
        let userid = req.query.userid;

        UserAccountService.getNewAuthToken(token, userid, function (error, authTokenResponse) {
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, null, authTokenResponse));
            }
        });
    } else {
        res.status(400).json(new GenericResponse(false, 'False Request', null));
    }
});

router.post('/register', function(req, res, next) {
    if (req.body.email && req.body.username && req.body.password) {
        let email = req.body.email;
        let password = req.body.password;
        let username = req.body.username;

        UserAccountService.register(email, username, password, function (error, userResponseObject) {
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, 'User successful registered', userResponseObject));
            }
        });
    } else {
        res.status(400).json(new GenericResponse(false, 'False Request', null));
    }
});

router.post('/verifyAccount', function(req, res, next) {
    if (req.body.vt) {
        let vt = req.body.vt;

        UserAccountService.verifyAccount(vt, function (error, userResponseObject) {
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, 'Account verified.', userResponseObject));
            }
        });
    } else {
        res.status(400).json(new GenericResponse(false, 'False Request', null));
    }
});

router.post('/resetpassword', function(req, res, next) {
    if (req.body.email) {
        let email = req.body.email;

        UserAccountService.resetPassword(email, function (error, success) {
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, 'Reset Password Email send.', null));
            }
        });
    } else {
        res.status(400).json(new GenericResponse(false, 'False Request', null));
    }
});

router.post('/changepassword', function(req, res, next) {
    if (req.body.rt && req.body.password) {
        let rt = req.body.rt;
        let password = req.body.password;

        UserAccountService.changePassword(rt, password, function (error, userResponseObject) {
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, 'Password changed.', userResponseObject));
            }
        });
    } else {
        res.status(400).json(new GenericResponse(false, 'False Request', null));
    }
});

router.post('/logout', passportJwt, function(req, res, next) {
    if (req.body.refreshtoken) {
        let refreshtoken = req.body.refreshtoken;

        UserAccountService.logout(req.user, refreshtoken, function (error, result) {
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, null, null));
            }
        });
    } else {
        res.status(401).json(new GenericResponse(false, null, null));
    }
});

router.get('/facebook', passport.authenticate('facebook', { session: false, scope: ['email'] }));

router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/' }), function(req, res) {
    if (req.user) {
        RefreshToken.create(user, function(error, refreshToken, authToken, expires_at) {
            if (error) {
                logger.error(error);
                res.redirect(config.webhost + '?fblogin=error');
            } else {
                res.redirect(config.webhost + '?fblogin=success&auth-token=' + authToken + '&expires-at=' + expires_at.toISOString() + '&refresh-token=' + refreshToken);
            }
        });
    } else {
        res.redirect(config.webhost + '?fblogin=error');
    }
});

module.exports = router;