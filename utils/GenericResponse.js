'use strict';


class GenericResponse {
    constructor(success, message, data, errors, totalCount) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errors = errors;

        if (totalCount) {
            this.totalCount = totalCount;
        } else if (Array.isArray(data)) {
            this.totalCount = data.length;
        } else if (data) {
            this.totalCount = 1;
        } else {
            this.totalCount = 0;
        }
    }
}

module.exports = GenericResponse;