'use strict';

const express             = require('express');
const router              = express.Router();
const passport            = require('passport');
const config              = require('../config/config');
const passportJwt         = require('../config/passportJwt');
const requestValidation   = require('../middleware/requestValidation');
const logger              = require('../utils/logger');
const GenericResponse     = require('../utils/GenericResponse');
const LoggedInUserService = require('../services/LoggedInUserService');
const RefreshToken        = require('../models/RefreshToken');

const validationSchema = {
    login: {
        'email': {
            isEmail: {
              errorMessage: 'The given email address is invalid.'
            }
        },
        'password': {
            notEmpty: true,
            errorMessage: 'Missing Password'
        }
    },
    refreshToken: {
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
    },
    register: {
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
    },
    verifyAccount: {
        'vt': {
            notEmpty: true,
            errorMessage: 'Missing VerificationToken'
        }
    },
    resetPassword: {
        'email': {
            isEmail: {
              errorMessage: 'The given email address is invalid.'
            }
        }
    },
    changePassword: {
        'rt': {
            notEmpty: true,
            errorMessage: 'Missing PasswordResetToken'
        },
        'password': {
            notEmpty: true,
            errorMessage: 'Missing Password'
        }
    },
    logout: {
        'refreshtoken': {
            notEmpty: true,
            errorMessage: 'Missing RefreshToken'
        }
    }
};

router.post('/login', requestValidation(validationSchema.login, null, null), (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    LoggedInUserService.login(email, password, (error, user) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, user));
        }
    });
});

router.get('/refreshtoken', requestValidation(null, null, validationSchema.refreshToken), (req, res, next) => {
    const token = req.query.token;
    const userid = req.query.userid;

    LoggedInUserService.getNewAuthToken(token, userid, (error, updatedTokens) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, updatedTokens));
        }
    });
});

router.post('/register', requestValidation(validationSchema.register, null, null), (req, res, next) => {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    LoggedInUserService.register(email, username, password, (error, user) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, 'User successful registered', user));
        }
    });
});

router.post('/verifyaccount', requestValidation(validationSchema.verifyAccount, null, null), (req, res, next) => {
    const vt = req.body.vt;

    LoggedInUserService.verifyAccount(vt, (error, user) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, 'Account verified.', user));
        }
    });
});

router.post('/resetpassword', requestValidation(validationSchema.resetPassword, null, null), (req, res, next) => {
    const email = req.body.email;

    LoggedInUserService.resetPassword(email, (error, success) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, 'Reset Password Email send.', null));
        }
    });
});

router.post('/changepassword', requestValidation(validationSchema.changePassword, null, null), (req, res, next) => {
    const rt = req.body.rt;
    const password = req.body.password;

    LoggedInUserService.changePassword(rt, password, (error, user) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, 'Password changed.', user));
        }
    });
});

router.post('/logout', passportJwt, requestValidation(validationSchema.logout, null, null), (req, res, next) => {
    const refreshtoken = req.body.refreshtoken;

    LoggedInUserService.logout(req.user, refreshtoken, (error, result) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, null));
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