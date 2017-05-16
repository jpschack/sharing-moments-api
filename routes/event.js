'use strict';

const express         = require('express');
const router          = express.Router();
const passportJwt     = require('../config/passportJwt');
const validateRequest = require('../config/validateRequest');
const GenericResponse = require('../utils/GenericResponse');
const EventService    = require('../services/EventService');


const eventBodyValidationSchema = {
    'placeid': {
        notEmpty: true,
        errorMessage: 'Missing placeid'
    },
    'name': {
        notEmpty: true,
        errorMessage: 'Missing name',
        isAscii: {
            errorMessage: 'name must only contain Ascii characters'
        },
        isLength: {
            options: [{ min: 1, max: 150 }],
            errorMessage: 'name can not be longer than 150 characters'
        }
    },
    'description': {
        optional: true,
        isAscii: {
            errorMessage: 'description must only contain Ascii characters'
        },
        isLength: {
            options: [{ min: 1, max: 500 }],
            errorMessage: 'description can not be longer than 500 characters'
        }
    },
    'multiday': {
        notEmpty: true,
        errorMessage: 'Missing multiday',
        isBoolean: {
            errorMessage: 'multiday must be a Boolean'
        }
    },
    'startDate': {
        notEmpty: true,
        errorMessage: 'Missing startDate',
        isISO8601: {
            errorMessage: 'startDate is not a valid Date'
        }
    },
    'endDate': {
        notEmpty: true,
        errorMessage: 'Missing endDate',
        isISO8601: {
            errorMessage: 'endDate is not a valid Date'
        }
    }
};

const eventParamValidationSchema = {
    'id': {
        isObjectIdValid: {
            errorMessage: 'Invalid eventid'
        }
    }
};

router.post('/', passportJwt, (req, res, next) => {
    req.checkBody(eventBodyValidationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const placeid     = req.body.placeid;
            const name        = req.body.name;
            const description = req.body.description;
            const multiday    = req.body.multiday;
            const startDate   = new Date(req.body.startDate);
            const endDate     = new Date(req.body.endDate);

            EventService.create(req.user, placeid, name, description, multiday, startDate, endDate, (error, event) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, event));
                }
            });
        }
    });
});

router.put('/:id', passportJwt, (req, res, next) => {
    req.checkParams(eventParamValidationSchema);
    req.checkBody(eventBodyValidationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const eventid     = req.params.id;
            const placeid     = req.body.placeid;
            const name        = req.body.name;
            const description = req.body.description;
            const multiday    = req.body.multiday;
            const startDate   = new Date(req.body.startDate);
            const endDate     = new Date(req.body.endDate);

            EventService.update(eventid, req.user, placeid, name, description, multiday, startDate, endDate, (error, event) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, event));
                }
            });
        }
    });
});

router.get('/:id', passportJwt, (req, res, next) => {
    req.checkQuery(eventParamValidationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const id = req.params.id;

            EventService.findById(id, (error, event) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, event));
                }
            });
        }
    });
});

router.get('/', passportJwt, (req, res, next) => {
    if (req.query.q) {
        const validationSchema = {
            'from': {
                optional: true,
                isISO8601: {
                    errorMessage: 'from is not a valid Date'
                }
            },
            'to': {
                optional: true,
                isISO8601: {
                    errorMessage: 'to is not a valid Date'
                }
            },
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
            },
            'sort': {
                optional: true,
                isIn: {
                    options: [['desc', 'asc']],
                    errorMessage: 'Must be asc or desc'
                }
            }
        };
        req.checkQuery(validationSchema);

        validateRequest(req, (error) => {
            if (error) {
                next(error);
            } else {
                const searchString = req.query.q;
                let from           = null;
                let to             = null;
                let limit          = 5;
                let page           = 0;
                let sort           = 'asc';

                if (req.query.from) {
                    from = new Date(req.query.from);
                }

                if (req.query.to) {
                    to = new Date(req.query.to);
                }

                if (req.query.limit) {
                    limit = req.query.limit;
                }

                if (req.query.page) {
                    page = req.query.page;
                }

                if (req.query.sort) {
                    sort = req.query.sort;
                }

                EventService.search(searchString, from, to, limit, page, sort, (error, events, count) => {
                    if (error) {
                        next(error);
                    } else {
                        res.status(200).json(new GenericResponse(true, null, events, undefined, count));
                    }
                });
            }
        });
    } else {
        next();
    }
});

module.exports = router;