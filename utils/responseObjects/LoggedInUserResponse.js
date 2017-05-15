'use strict';


class LoggedInUserResponse {
    constructor(user, authToken) {
        this.id = user.id;
        this.email = user.email;
        this.username = user.username;
        this.name = user.name;
        this.updated_at = user.updated_at;
        this.created_at = user._id.getTimestamp();
        this.privateAccount = user.privateAccount;
        this.verified = user.verified;
        this.authToken = authToken;
    }
}

module.exports = LoggedInUserResponse;