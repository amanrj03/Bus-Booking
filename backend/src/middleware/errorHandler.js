const { sendError } = require('../utils/response');
const config = require('../config/env');

/**
 * Centralized global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Only log unexpected 500 server errors loudly during tests/dev
  if (!err.isOperational && config.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // Handle Zod validation errors directly
  if (err.name === 'ZodError') {
    const rawIssues = err.issues || err.errors || [];
    const formattedErrors = rawIssues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 400, formattedErrors);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired', 401);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    const target = err.meta?.target ? ` (${err.meta.target})` : '';
    return sendError(res, `A record with this unique value already exists${target}.`, 409);
  }
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found in database', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || (config.nodeEnv === 'development' && !err.isOperational ? { stack: err.stack } : null);

  return sendError(res, message, statusCode, errors);
};

module.exports = errorHandler;
