'use strict';

const express           = require('express');
const router            = express.Router();
const passportJwt       = require('../middleware/passportJwt');
const requestValidation = require('../middleware/requestValidation');
const hasQueryParams    = require('../middleware/hasQueryParams');
const GenericResponse   = require('../utils/GenericResponse');
const UserService       = require('../services/UserService');

const validationSchema = {
    userParam: {
        'id': {
            notEmpty: true,
            isObjectIdValid: {
                errorMessage: 'Invalid userid'
            },
            errorMessage: 'Missing userid'
        }
    },
    userQuery: {
        'limit': {
            optional: true,
            isInt: {
                errorMessage: 'Must be an integer greater than 0.',
                options: { gt: 0 }
            }
        },
        'page': {
            optional: true,
            isInt: {
                errorMessage: 'Must be an integer greater or equal than 0.',
                options: { gt: -1 }
            }
        }
    }
};

router.get('/:id', passportJwt, requestValidation(null, validationSchema.userParam, null), (req, res, next) => {
    const validationSchema = {
        'id': {
            notEmpty: true,
            isObjectIdValid: {
                errorMessage: 'Invalid userid'
            },
            errorMessage: 'Missing userid'
        }
    };
    req.checkParams(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const id = req.params.id;
            UserService.getUserById(id, (error, user) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, user));
                }
            });
        }
    });
});

router.get('/', passportJwt, hasQueryParams('q', 'username'), requestValidation(null, null, validationSchema.userQuery), (req, res, next) => {
    if (req.query.q) {
        const searchString = req.query.q;
        let limit = 5;
        let page = 0;

        if (req.query.limit) {
            limit = req.query.limit;
        }

        if (req.query.page) {
            page = req.query.page;
        }

        UserService.search(searchString, limit, page, (error, users, count) => {
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, null, users, undefined, count));
            }
        });
    } else if (req.query.username) {
        const username = req.query.username;
        UserService.getUserByUsername(username, (error, user) => {
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, null, user));
            }
        });
    } else {
        next();
    }
});

module.exports = router;