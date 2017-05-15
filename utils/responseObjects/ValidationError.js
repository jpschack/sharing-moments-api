'use strict';


class ValidationError {
    constructor(error) {
        this.name = error.name;
        this.message = error.message;
        this.path = error.path;
        this.value = error.value;
    }
}

module.exports = ValidationError;