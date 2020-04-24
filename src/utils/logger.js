const winston = require('winston');
const config = require('better-config');

// Create a logger based on the log level in config.json
const logger = winston.createLogger({
  level: config.get('application.logLevel'),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

logger.stream = {
  // Write the text in 'message' to the log.
  write: (message) => {
    // Removes double newline issue with piping morgan server request
    // log through winston logger.
    logger.info(message.length > 0 ? message.substring(0, message.length - 1) : message);
  },
};

module.exports = logger;
