'use strict';

const _ = require('lodash');

//checks if the provided array of params are in the query (only one needs to match)
//if of a param of the params is an array, all elements of that array need to be in the query
function hasQueryParams(...params) {
    return (req, res, next) => {
        let passed = false;

        for (const param of params) {
            if (req.query && _.has(req.query, param)) {
                passed = true;
                break;
            }
        }

        if (passed) {
            next();
        } else {
            next('route');
        }
    }
}

module.exports = hasQueryParams;