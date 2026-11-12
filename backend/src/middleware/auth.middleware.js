const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

/**
 * Extracts and verifies JWT Bearer token from Authorization header
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please provide a valid Bearer token.', 401));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Authentication token is missing.', 401));
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };
    return next();
  } catch (error) {
    return next(error); // Forward JsonWebTokenError / TokenExpiredError to errorHandler
  }
}

/**
 * Optionally extracts JWT token if present; allows anonymous access otherwise
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };
  } catch {
    req.user = null;
  }

  return next();
}

/**
 * Role-Based Access Control (RBAC) middleware
 * @param  {...('ADMIN' | 'OPERATOR' | 'PASSENGER')} allowedRoles
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden. Required role: ${allowedRoles.join(' or ')}.`,
          403
        )
      );
    }

    return next();
  };
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
};
