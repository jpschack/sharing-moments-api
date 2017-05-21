'use strict';

const auth       = require('../routes/auth');
const account    = require('../routes/account');
const user       = require('../routes/user');
const event      = require('../routes/event');
const eventPhoto = require('../routes/eventPhoto');
const photo      = require('../routes/photo');


module.exports = (app) => {
    app.use('/auth', auth);
    app.use('/account', account);
    app.use('/user', user);
    app.use('/event', event);
    app.use('/event', eventPhoto);
    app.use('/photo', photo);
};