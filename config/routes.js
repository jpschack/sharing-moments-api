'use strict';

const auth    = require('../routes/auth');
const account = require('../routes/account');
const user    = require('../routes/user');


module.exports = function(app) {
    app.use('/auth', auth);
    app.use('/account', account);
    app.use('/user', user);
};