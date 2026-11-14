const express = require('express');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validate');
const { authenticate } = require('../middleware/auth.middleware');
const { registerSchema, loginSchema, googleAuthSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/google', validateRequest(googleAuthSchema), authController.googleLogin);
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
