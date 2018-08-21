'use strict';

const express           = require('express');
const router            = express.Router();
const passportJwt       = require('../middleware/passportJwt');
const requestValidation = require('../middleware/requestValidation');
const GenericResponse   = require('../utils/GenericResponse');
const PhotoService      = require('../services/PhotoService');

const validationSchema = {
    photoParam: {
        'id': {
            isObjectIdValid: {
                errorMessage: 'Invalid photoid'
            }
        }
    },
    photoBody: {
        'description': {
            isAscii: {
                errorMessage: 'description must only contain Ascii characters',
            }
        }
    }
};

router.get('/:id', passportJwt, requestValidation(null, validationSchema.photoParam, null), (req, res, next) => {
    const photoId = req.params.id;

    PhotoService.getPhotoById(photoId, (error, photo) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, photo));
        }
    });
});

router.put('/:id', passportJwt, requestValidation(validationSchema.photoBody, validationSchema.photoParam, null), (req, res, next) => {
    const photoId     = req.params.id;
    const description = req.body.description;

    PhotoService.updatePhotoDetails(photoId, description, (error, photo) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, photo));
        }
    });
});

router.delete('/:id', passportJwt, requestValidation(null, validationSchema.photoParam, null), (req, res, next) => {
    const photoId = req.params.id;

    PhotoService.deletePhoto(photoId, (error, result) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json(new GenericResponse(true, null, null));
        }
    });
});

module.exports = router;