const userService = require('../services/user.service');
const { recordAudit, AUDIT_ACTIONS } = require('../services/audit.service');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/v1/users
 */
async function listUsers(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await userService.listUsers(query);
    return sendSuccess(res, result, 'Users retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/v1/users/:id/role
 */
async function updateUserRole(req, res, next) {
  try {
    const updatedUser = await userService.updateUserRole(req.params.id, req.body.role);

    await recordAudit({
      userId: req.user.userId,
      action: AUDIT_ACTIONS.USER_ROLE_UPDATED,
      entity: 'User',
      entityId: updatedUser.id,
      details: { targetEmail: updatedUser.email, newRole: updatedUser.role },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: updatedUser }, 'User role updated successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listUsers,
  updateUserRole,
};
