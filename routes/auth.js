'use strict';

const express            = require('express');
const router             = express.Router();
const passport           = require('passport');
const config             = require('../config/config');
const passportJwt        = require('../config/passportJwt');
const validateRequest    = require('../config/validateRequest');
const logger             = require('../utils/logger');
const GenericResponse    = require('../utils/GenericResponse');
const UserAccountService = require('../services/UserAccountService');
const RefreshToken       = require('../models/RefreshToken');


router.post('/login', (req, res, next) => {
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

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const email = req.body.email;
            const password = req.body.password;

            UserAccountService.login(email, password, (error, userResponseObject) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, userResponseObject));
                }
            });
        }
    });
});

router.get('/refreshtoken', (req, res, next) => {
    const validationSchema = {
        'token': {
            notEmpty: true,
            errorMessage: 'Missing RefreshToken'
        },
        'userid': {
            notEmpty: true,
            isObjectIdValid: {
                errorMessage: 'Invalid userid'
            },
            errorMessage: 'Missing userid'
        }
    };
    req.checkQuery(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const token = req.query.token;
            const userid = req.query.userid;

            UserAccountService.getNewAuthToken(token, userid, (error, authTokenResponse) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, authTokenResponse));
                }
            });
        }
    });
});

router.post('/register', (req, res, next) => {
    const validationSchema = {
        'email': {
            isEmail: {
              errorMessage: 'The given email address is invalid.'
            }
        },
        'username': {
            notEmpty: true,
            errorMessage: 'Missing username'
        },
        'password': {
            notEmpty: true,
            errorMessage: 'Missing Password'
        }
    };
    req.checkBody(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const email = req.body.email;
            const username = req.body.username;
            const password = req.body.password;

            UserAccountService.register(email, username, password, (error, userResponseObject) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, 'User successful registered', userResponseObject));
                }
            });
        }
    });
});

router.post('/verifyAccount', (req, res, next) => {
    const validationSchema = {
        'vt': {
            notEmpty: true,
            errorMessage: 'Missing VerificationToken'
        }
    };
    req.checkBody(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const vt = req.body.vt;

            UserAccountService.verifyAccount(vt, (error, userResponseObject) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, 'Account verified.', userResponseObject));
                }
            });
        }
    });
});

router.post('/resetpassword', (req, res, next) => {
    const validationSchema = {
        'email': {
            isEmail: {
              errorMessage: 'The given email address is invalid.'
            }
        }
    };
    req.checkBody(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const email = req.body.email;

            UserAccountService.resetPassword(email, (error, success) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, 'Reset Password Email send.', null));
                }
            });
        }
    });
});

router.post('/changepassword', (req, res, next) => {
    const validationSchema = {
        'rt': {
            notEmpty: true,
            errorMessage: 'Missing PasswordResetToken'
        },
        'password': {
            notEmpty: true,
            errorMessage: 'Missing Password'
        }
    };
    req.checkBody(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const rt = req.body.rt;
            const password = req.body.password;

            UserAccountService.changePassword(rt, password, (error, userResponseObject) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, 'Password changed.', userResponseObject));
                }
            });
        }
    });
});

router.post('/logout', passportJwt, (req, res, next) => {
    const validationSchema = {
        'refreshtoken': {
            notEmpty: true,
            errorMessage: 'Missing RefreshToken'
        }
    };
    req.checkBody(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const refreshtoken = req.body.refreshtoken;

            UserAccountService.logout(req.user, refreshtoken, (error, result) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, null));
                }
            });
        }
    });
});

router.get('/facebook', passport.authenticate('facebook', { session: false, scope: ['email'] }));

router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/' }), (req, res) => {
    if (req.user) {
        RefreshToken.create(user, (error, refreshToken, authToken, expires_at) => {
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