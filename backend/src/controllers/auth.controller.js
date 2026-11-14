const authService = require('../services/auth.service');
const { recordAudit, AUDIT_ACTIONS } = require('../services/audit.service');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/v1/auth/register
 */
async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);

    await recordAudit({
      userId: result.user.id,
      action: AUDIT_ACTIONS.USER_REGISTERED,
      entity: 'User',
      entityId: result.user.id,
      details: { email: result.user.email, role: result.user.role },
      ipAddress: req.ip,
    });

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

    await recordAudit({
      userId: result.user.id,
      action: AUDIT_ACTIONS.USER_LOGIN,
      entity: 'User',
      entityId: result.user.id,
      details: { email: result.user.email, role: result.user.role },
      ipAddress: req.ip,
    });

    return sendSuccess(res, result, 'Authentication successful', 200);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/auth/google
 */
async function googleLogin(req, res, next) {
  try {
    const result = await authService.loginWithGoogle(req.body);

    await recordAudit({
      userId: result.user.id,
      action: result.isNewUser ? AUDIT_ACTIONS.USER_REGISTERED : AUDIT_ACTIONS.USER_LOGIN,
      entity: 'User',
      entityId: result.user.id,
      details: { email: result.user.email, provider: 'GOOGLE_OAUTH', role: result.user.role },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      { user: result.user, token: result.token },
      result.isNewUser ? 'Google account registered and logged in' : 'Logged in with Google successfully',
      result.isNewUser ? 201 : 200
    );
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
  googleLogin,
  getProfile,
};
