'use strict';

const express = require('express');
const config  = require('./config/config');
const logger  = require("./utils/logger");

require('./config/db')();

const app = express();

require('./middleware/passport')(app);

require('./middleware/express')(app);

require('./config/routes')(app);

require('./middleware/errorHandler')(app);

app.listen(config.port, () => {
    logger.info('Express running');
    logger.error('test');
});

module.exports = app;