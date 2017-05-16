'use strict';


class AuthTokenResponse {
    constructor(authToken, expires_at) {
        this.token = authToken;
        this.expires_at = expires_at;
    }
}

module.exports = AuthTokenResponse;