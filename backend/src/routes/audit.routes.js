const express = require('express');
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validate');
const { listAuditLogsQuerySchema } = require('../validators/audit.validator');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', validateRequest(listAuditLogsQuerySchema, 'query'), auditController.listAuditLogs);

module.exports = router;
