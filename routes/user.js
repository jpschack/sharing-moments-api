'use strict';

const express              = require('express');
const router               = express.Router();
const config               = require('../config/config');
const passportJwt          = require('../config/passportJwt');
const GenericResponse      = require('../utils/GenericResponse');
const UserService   = require('../services/UserService');

router.get('/:id', passportJwt, function(req, res, next) {
    if (req.params.id) {
        let id = req.params.id;
        UserService.getUserById(id, function(error, user){
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, null, user));
            }
        });
    } else {
        res.status(400).json(new GenericResponse(false, 'False Request', null));
    }
});

router.get('/', passportJwt, function(req, res, next) {
    if (req.query.q) {
        let searchString = req.query.q;
        let limit = 5;
        let page = 0;

        if (req.query.limit) {
            limit = req.query.limit;
        }

        if (req.query.page) {
            page = req.query.page;
        }

        UserService.search(searchString, limit, page, function(error, users, count){
            if (error) {
                next(error);
            } else {
                res.status(200).json(new GenericResponse(true, null, users, undefined, count));
            }
        });
    } else if (req.query.username) {
        let username = req.query.username;
        UserService.getUserByUsername(username, function(error, user){
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