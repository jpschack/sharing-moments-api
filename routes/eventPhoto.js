'use strict';

const express         = require('express');
const router          = express.Router();
const passportJwt     = require('../config/passportJwt');
const validateRequest = require('../config/validateRequest');
const GenericResponse = require('../utils/GenericResponse');
const PhotoService    = require('../services/PhotoService');


const eventParamValidationSchema = {
    'id': {
        isObjectIdValid: {
            errorMessage: 'Invalid eventid'
        }
    }
};

router.post('/:id/photo', passportJwt, (req, res, next) => {
    req.checkParams(eventParamValidationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const eventid = req.params.id;

            PhotoService.upload(req, res, eventid, (error, photos) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, photos));
                }
            });
        }
    });
});

router.get('/:id/photo', passportJwt, (req, res, next) => {
    const validationSchema = {
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

    req.checkParams(eventParamValidationSchema);
    req.checkQuery(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const eventid = req.params.id;

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

            PhotoService.getPhotosByEventid(eventid, limit, page, sort, (error, photos) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, photos));
                }
            });
        }
    });
});

module.exports = router;