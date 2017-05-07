'use strict';

function GenericResponse(success, message, data, errors, totalCount) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;

    if (totalCount) {
        this.totalCount = totalCount;
    } else if (data) {
        this.totalCount = 1;
    } else {
        this.totalCount = 0;
    }
}

module.exports = GenericResponse;