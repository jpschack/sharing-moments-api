'use strict';

const express              = require('express');
const router               = express.Router();
const config               = require('../config/config');
const passportJwt          = require('../config/passportJwt');
const GenericResponse      = require('../utils/GenericResponse');
const UserAccountService   = require('../services/UserAccountService');
const LoggedInUserResponse = require('../utils/responseObjects/LoggedInUserResponse');


router.get('/', passportJwt, function(req, res) {
    if (req.user) {
        let userResponseObject = new LoggedInUserResponse(req.user, undefined);
        res.status(200).json(new GenericResponse(true, null, userResponseObject));
    } else {
        res.status(401).json(new GenericResponse(false, null, null));
    }
});

router.put('/', passportJwt, function(req, res, next) {
    if (req.body.id && req.body.email && req.body.username && req.body.name && req.body.privacy) {
        let id = req.body.id;
        let email = req.body.email;
        let username = req.body.username;
        let name = req.body.name;
        let privacy = req.body.privacy;

        UserAccountService.update(req.user, id, email, username, name, privacy, function (error, user) {
            if (!error) {
                let userResponseObject = new LoggedInUserResponse(user, undefined);
                res.status(200).json(new GenericResponse(true, 'Account updated.', userResponseObject));
            } else {
                next(error);
            }
        });
    } else {
        res.status(400).json(new GenericResponse(false, 'False Request', null));
    }
});

router.delete('/', passportJwt, function(req, res, next) {
    UserAccountService.delete(req.user, function (error, success) {
        if (!error) {
            res.status(200).json(new GenericResponse(true, 'Account successful deleted.', null));
        } else {
            next(error);
        }
    });
});

router.put('/password', passportJwt, function(req, res, next) {
    if (req.body.oldpassword && req.body.password) {
        let oldpassword = req.body.oldpassword;
        let password = req.body.password;

        UserAccountService.updatePassword(req.user, oldpassword, password, function (error, user) {
            if (!error) {
                let userResponseObject = new LoggedInUserResponse(user, undefined);
                res.status(200).json(new GenericResponse(true, 'Account updated.', userResponseObject));
            } else {
                next(error);
            }
        });
    } else {
        res.status(400).json(new GenericResponse(false, 'False Request', null));
    }
});

router.put('/privacy', passportJwt, function(req, res, next) {
    if (req.body.privacy) {
        let privacy = req.body.privacy;

        UserAccountService.updatePrivacy(req.user, privacy, function (error, user) {
            if (!error) {
                let userResponseObject = new LoggedInUserResponse(user, undefined);
                res.status(200).json(new GenericResponse(true, 'Account updated.', userResponseObject));
            } else {
                next(error);
            }
        });
    } else {
        res.status(400).json(new GenericResponse(false, 'False Request', null));
    }
});

module.exports = router;