'use strict';

function UserResponse(user) {
    this.id = user.id;
    this.username = user.username;
    this.name = user.name;
    this.created_at = user._id.getTimestamp();
    this.privateAccount = user.privateAccount;
}

module.exports = UserResponse;