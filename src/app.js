const config = require('better-config');

// Load the configuration file.
config.set('../config.json');

const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const routes = require('./routes');
const banner = require('./utils/banner');

const app = express();

// Set up Express components.
app.use(morgan('combined', { stream: logger.stream }));
app.use(bodyParser.json());
app.use(cors());

// Serve the Vue files statically from the 'public' folder.
app.use(express.static(path.join(__dirname, '../public')));

// Serve dynamic API routes with '/api/' path prefix.
app.use('/api', routes);

const port = config.get('application.port');

// Start the server.
app.listen(port, () => {
  banner();
  logger.info(`RediSolar listening on port ${port}, using database: ${config.get('application.dataStore')}`);
});

// For test framework purposes...
module.exports = {
  app,
};
