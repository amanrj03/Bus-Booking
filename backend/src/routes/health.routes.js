const express = require('express');
const { sendSuccess } = require('../utils/response');
const config = require('../config/env');

const router = express.Router();

router.get('/', (req, res) => {
  const healthData = {
    service: 'Bus Booking Management System API',
    status: 'ONLINE',
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  return sendSuccess(res, healthData, 'API service is operational');
});

module.exports = router;
