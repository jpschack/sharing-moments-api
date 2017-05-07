'use strict';

function AuthTokenResponse(authToken, expires_at, refreshToken) {
    this.token = authToken;
    this.expires_at = expires_at;
    this.refreshToken = refreshToken.token;
}

module.exports = AuthTokenResponse;