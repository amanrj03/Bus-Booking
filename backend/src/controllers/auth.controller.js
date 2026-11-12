const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/v1/auth/register
 */
async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    return sendSuccess(res, result, 'Passenger registered successfully', 201);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    return sendSuccess(res, result, 'Authentication successful', 200);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/auth/me
 */
async function getProfile(req, res, next) {
  try {
    const user = await authService.getUserProfile(req.user.userId);
    return sendSuccess(res, { user }, 'User profile retrieved', 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile,
};
