const AppError = require('../utils/AppError');

/**
 * Middleware factory to validate request payload against a Zod schema
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} target
 */
function validateRequest(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const rawIssues = result.error.issues || result.error.errors || [];
      const formattedErrors = rawIssues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError('Validation failed', 400, formattedErrors));
    }

    req[target] = result.data;
    return next();
  };
}

module.exports = validateRequest;
