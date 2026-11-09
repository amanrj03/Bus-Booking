const { sendError } = require('../utils/response');

/**
 * 404 Route Not Found middleware
 */
const notFoundHandler = (req, res, next) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = notFoundHandler;
