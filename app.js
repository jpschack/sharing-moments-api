'use strict';

const express = require('express');
const config  = require('./config/config');
const logger  = require("./utils/logger");

require('./config/db')();

const app = express();

require('./config/passport')(app);

require('./config/express')(app);

require('./config/routes')(app);

require('./config/errorHandler')(app);

app.listen(config.port, () => {
    logger.info('Express running');
});

module.exports = app;