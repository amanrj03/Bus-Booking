const app = require('./app');
const config = require('./config/env');

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[Server] Bus Booking API running on http://localhost:${config.port} in ${config.nodeEnv} mode`);
  // eslint-disable-next-line no-console
  console.log(`[Server] Health check: http://localhost:${config.port}/api/v1/health`);
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`[Server] Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('[Server] HTTP server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
