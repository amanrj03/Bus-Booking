const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validate');
const { listUsersQuerySchema, updateRoleSchema } = require('../validators/user.validator');

const router = express.Router();

// All user management routes require ADMIN authentication
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateRequest(listUsersQuerySchema, 'query'), userController.listUsers);
router.patch('/:id/role', validateRequest(updateRoleSchema, 'body'), userController.updateUserRole);

module.exports = router;
