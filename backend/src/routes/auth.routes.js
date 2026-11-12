const express = require('express');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

module.exports = router;
