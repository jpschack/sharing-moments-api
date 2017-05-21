'use strict';

const express         = require('express');
const router          = express.Router();
const passportJwt     = require('../config/passportJwt');
const validateRequest = require('../config/validateRequest');
const GenericResponse = require('../utils/GenericResponse');
const PhotoService    = require('../services/PhotoService');

const photoParamValidationSchema = {
    'id': {
        isObjectIdValid: {
            errorMessage: 'Invalid photoid'
        }
    }
};

router.get('/:id', passportJwt, (req, res, next) => {
    req.checkParams(photoParamValidationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const photoid = req.params.id;

            PhotoService.getPhotoById(photoid, (error, photo) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, photo));
                }
            });
        }
    });
});

router.put('/:id', passportJwt, (req, res, next) => {
    const validationSchema = {
        'description': {
            isAscii: {
                errorMessage: 'description must only contain Ascii characters',
            }
        }
    };

    req.checkParams(photoParamValidationSchema);
    req.checkBody(validationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const photoid     = req.params.id;
            const description = req.body.description;

            PhotoService.updatePhotoDetails(photoid, description, (error, photo) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, photo));
                }
            });
        }
    });
});

router.delete('/:id', passportJwt, (req, res, next) => {
    req.checkParams(photoParamValidationSchema);

    validateRequest(req, (error) => {
        if (error) {
            next(error);
        } else {
            const photoid = req.params.id;

            PhotoService.deletePhoto(photoid, (error, result) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json(new GenericResponse(true, null, null));
                }
            });
        }
    });
});

module.exports = router;