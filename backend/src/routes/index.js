const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const auditRoutes = require('./audit.routes');
const fleetRoutes = require('./fleet.routes');

const router = express.Router();

// Mount subroutes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/fleet', fleetRoutes);

module.exports = router;
