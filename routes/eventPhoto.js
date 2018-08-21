'use strict';

const express           = require('express');
const router            = express.Router();
const passportJwt       = require('../middleware/passportJwt');
const requestValidation = require('../middleware/requestValidation');
const GenericResponse   = require('../utils/GenericResponse');
const PhotoService      = require('../services/PhotoService');

const validationSchema = {
    eventParam: {
        'id': {
            isObjectIdValid: {
                errorMessage: 'Invalid eventid'
            }
        }
    },
    eventPhotoQuery: {
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

router.post('/:id/photo', passportJwt, requestValidation(null, validationSchema.eventParam, null), (req, res, next) => {
    const eventId = req.params.id;

    PhotoService.upload(req, res, eventId, (error, photos) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, photos));
        }
    });
});

router.get('/:id/photo', passportJwt, requestValidation(null, validationSchema.eventParam, validationSchema.eventPhotoQuery), (req, res, next) => {
    const eventId = req.params.id;
    let limit = 20;
    let page  = 0;
    let sort  = 'asc';

    if (req.query.limit) {
        limit = req.query.limit;
    }

    if (req.query.page) {
        page = req.query.page;
    }

    if (req.query.sort) {
        sort = req.query.sort;
    }

    PhotoService.getPhotosByEventid(eventId, limit, page, sort, (error, photos) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, photos));
        }
    });
});

module.exports = router;