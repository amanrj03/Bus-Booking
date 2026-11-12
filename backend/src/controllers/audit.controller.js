const auditService = require('../services/audit.service');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/v1/audit-logs
 */
async function listAuditLogs(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await auditService.listAuditLogs(query);
    return sendSuccess(res, result, 'Audit logs retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listAuditLogs,
};
