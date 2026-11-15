const express = require('express');
const { sendSuccess } = require('../utils/response');
const config = require('../config/env');
const { checkDatabaseConnection, getDatabaseSeedMetrics } = require('../utils/dbCheck');

const router = express.Router();

router.get('/', async (req, res) => {
  const dbHealth = await checkDatabaseConnection();

  const healthData = {
    service: 'Bus Booking Management System API',
    status: 'ONLINE',
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbHealth.isConnected,
      latencyMs: dbHealth.latencyMs || null,
      error: dbHealth.error || null,
      message: dbHealth.isConnected ? 'Database is healthy' : 'Database disconnected or awaiting credentials',
    },
  };

  return sendSuccess(res, healthData, 'API service is operational');
});

router.get('/db', async (req, res) => {
  const dbHealth = await checkDatabaseConnection();
  const seedMetrics = await getDatabaseSeedMetrics();

  const rawUrl = config.databaseUrl || '';
  const maskedHost = rawUrl.includes('@')
    ? rawUrl.split('@')[1].split('/')[0]
    : 'not-set';

  const payload = {
    connected: dbHealth.isConnected,
    latencyMs: dbHealth.latencyMs || null,
    error: dbHealth.error || null,
    diagnostics: {
      isEdgeRuntime: typeof globalThis !== 'undefined' && Boolean(globalThis.__CF_ENV__),
      boundKeys: typeof globalThis !== 'undefined' && globalThis.__CF_ENV__ ? Object.keys(globalThis.__CF_ENV__) : [],
      activeDatabaseHost: maskedHost,
    },
    seedMetrics: seedMetrics.counts || null,
    isSeeded: seedMetrics.isSeeded,
  };

  return sendSuccess(res, payload, 'Database diagnostics status');
});

module.exports = router;
