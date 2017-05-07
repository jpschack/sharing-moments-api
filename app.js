'use strict';

const express = require("express");
const config  = require('./config/config');
const logger  = require("./utils/logger");

require('./config/db')(config);

let app = express();

require('./config/passport')(app, config);

require('./config/express')(app, config);

require("./config/routes")(app);

require("./config/errorHandler")(app);

app.listen(config.port, function() {
    logger.info("Express running");
});