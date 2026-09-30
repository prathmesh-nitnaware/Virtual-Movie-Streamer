const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled Server Error:', err.message, err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
}

module.exports = errorHandler;
