'use strict';

const express              = require('express');
const router               = express.Router();
const passportJwt          = require('../config/passportJwt');
const validateRequest      = require('../config/validateRequest');
const GenericResponse      = require('../utils/GenericResponse');
const LoggedInUserService   = require('../services/LoggedInUserService');


router.get('/', passportJwt, (req, res) => {
    res.status(200).json(new GenericResponse(true, null, req.user));
});

router.put('/', passportJwt, (req, res, next) => {
    const validationSchema = {
        'id': {
            notEmpty: true,
            errorMessage: 'Missing UserId'
        },
        'email': {
            isEmail: {
              errorMessage: 'The given email address is invalid.'
            }
        },
        'username': {
            notEmpty: true,
            errorMessage: 'Missing username'
        },
        'privacy': {
            isBoolean: {
                errorMessage: 'Missing privacy'
            }
        }
    };
    req.checkBody(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const id = req.body.id;
            const email = req.body.email;
            const username = req.body.username;
            const name = req.body.name;
            const privacy = req.body.privacy;

            LoggedInUserService.update(req.user, id, email, username, name, privacy, (error, user) => {
                if (!error) {
                    res.status(200).json(new GenericResponse(true, 'Account updated.', user));
                } else {
                    next(error);
                }
            });
        }
    });
});

router.delete('/', passportJwt, (req, res, next) => {
    LoggedInUserService.delete(req.user, (error, success) => {
        if (!error) {
            res.status(200).json(new GenericResponse(true, 'Account successful deleted.', null));
        } else {
            next(error);
        }
    });
});

router.put('/password', passportJwt, (req, res, next) => {
    const validationSchema = {
        'oldpassword': {
            notEmpty: true,
            errorMessage: 'Missing old password.'
        },
        'password': {
            notEmpty: true,
            errorMessage: 'Missing new password.'
        }
    };
    req.checkBody(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const oldpassword = req.body.oldpassword;
            const password = req.body.password;

            LoggedInUserService.updatePassword(req.user, oldpassword, password, (error, user) => {
                if (!error) {
                    res.status(200).json(new GenericResponse(true, 'Account updated.', user));
                } else {
                    next(error);
                }
            });
        }
    });
});

router.put('/privacy', passportJwt, (req, res, next) => {
    const validationSchema = {
        'privacy': {
            isBoolean: {
                errorMessage: 'Missing privacy.'
            }
        }
    };
    req.checkBody(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const privacy = req.body.privacy;

            LoggedInUserService.updatePrivacy(req.user, privacy, (error, user) => {
                if (!error) {
                    res.status(200).json(new GenericResponse(true, 'Account updated.', user));
                } else {
                    next(error);
                }
            });
        }
    });
});

module.exports = router;