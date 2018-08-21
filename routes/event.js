'use strict';

const express           = require('express');
const router            = express.Router();
const passportJwt       = require('../middleware/passportJwt');
const requestValidation = require('../middleware/requestValidation');
const hasQueryParams    = require('../middleware/hasQueryParams');
const GenericResponse   = require('../utils/GenericResponse');
const EventService      = require('../services/EventService');

const validationSchema = {
    eventBody: {
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
    },
    eventParam: {
        'id': {
            isObjectIdValid: {
                errorMessage: 'Invalid eventid'
            }
        }
    },
    eventQuery: {
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
    }
};

router.post('/', passportJwt, requestValidation(validationSchema.eventBody, null, null), (req, res, next) => {
    const placeId     = req.body.placeid;
    const name        = req.body.name;
    const description = req.body.description;
    const multiDay    = req.body.multiday;
    const startDate   = new Date(req.body.startDate);
    const endDate     = new Date(req.body.endDate);

    EventService.create(req.user, placeId, name, description, multiDay, startDate, endDate, (error, event) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, event));
        }
    });
});

router.put('/:id', passportJwt, requestValidation(validationSchema.eventBody, validationSchema.eventParam, null), (req, res, next) => {
    const eventId     = req.params.id;
    const placeId     = req.body.placeid;
    const name        = req.body.name;
    const description = req.body.description;
    const multiday    = req.body.multiday;
    const startDate   = new Date(req.body.startDate);
    const endDate     = new Date(req.body.endDate);

    EventService.update(eventId, req.user, placeId, name, description, multiday, startDate, endDate, (error, event) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, event));
        }
    });
});

router.delete('/:id', passportJwt, requestValidation(null, validationSchema.eventParam, null), (req, res, next) => {
    const eventId = req.params.id;

    EventService.delete(eventId, req.user, (error, result) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, null));
        }
    });
});

router.get('/:id', passportJwt, requestValidation(null, validationSchema.eventParam, null), (req, res, next) => {
    const id = req.params.id;

    EventService.findById(id, (error, event) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, event));
        }
    });
});

router.get('/', passportJwt, hasQueryParams('q'), requestValidation(null, null, validationSchema.eventQuery), (req, res, next) => {
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

    EventService.search(req.query.q, from, to, limit, page, sort, (error, events, count) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, events, undefined, count));
        }
    });
});

module.exports = router;