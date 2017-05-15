'use strict';


class AuthTokenResponse {
    constructor(authToken, expires_at, refreshToken) {
        this.token = authToken;
        this.expires_at = expires_at;
        this.refreshToken = refreshToken.token;
    }
}

module.exports = AuthTokenResponse;