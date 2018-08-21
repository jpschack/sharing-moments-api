'use strict';

const express             = require('express');
const router              = express.Router();
const passportJwt         = require('../middleware/passportJwt');
const requestValidation   = require('../middleware/requestValidation');
const validateRequest     = require('../config/validateRequest');
const GenericResponse     = require('../utils/GenericResponse');
const LoggedInUserService = require('../services/LoggedInUserService');

const validationSchema = {
    updateAccount: {
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
    },
    updatePassword: {
        'oldpassword': {
            notEmpty: true,
            errorMessage: 'Missing old password.'
        },
        'password': {
            notEmpty: true,
            errorMessage: 'Missing new password.'
        }
    },
    updatePrivacy: {
        'privacy': {
            isBoolean: {
                errorMessage: 'Missing privacy.'
            }
        }
    }
};

router.get('/', passportJwt, (req, res) => {
    res.status(200).json(new GenericResponse(true, null, req.user));
});

router.put('/', passportJwt, requestValidation(validationSchema.updateAccount, null, null), (req, res, next) => {
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

router.put('/password', passportJwt, requestValidation(validationSchema.updatePassword, null, null), (req, res, next) => {
    const oldPassword = req.body.oldpassword;
    const password = req.body.password;

    LoggedInUserService.updatePassword(req.user, oldPassword, password, (error, user) => {
        if (!error) {
            res.status(200).json(new GenericResponse(true, 'Account updated.', user));
        } else {
            next(error);
        }
    });
});

router.put('/privacy', passportJwt, requestValidation(validationSchema.updatePrivacy, null, null), (req, res, next) => {
    const privacy = req.body.privacy;

    LoggedInUserService.updatePrivacy(req.user, privacy, (error, user) => {
        if (!error) {
            res.status(200).json(new GenericResponse(true, 'Account updated.', user));
        } else {
            next(error);
        }
    });
});

module.exports = router;