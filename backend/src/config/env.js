// Safely load .env only in local Node.js environments
if (typeof __dirname !== 'undefined') {
  try {
    const dotenv = require('dotenv');
    const path = require('path');
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  } catch {
    // Ignore in edge environments where filesystem is not available
  }
}

// In Cloudflare Workers, bindings are accessible via globalThis.__CF_ENV__ or process.env
function getEnvBinding(key) {
  if (typeof globalThis !== 'undefined' && globalThis.__CF_ENV__ && globalThis.__CF_ENV__[key]) {
    return globalThis.__CF_ENV__[key];
  }
  return process.env[key];
}

const config = {
  get port() {
    return parseInt(getEnvBinding('PORT') || '5000', 10);
  },
  get nodeEnv() {
    return getEnvBinding('NODE_ENV') || 'development';
  },
  get databaseUrl() {
    return (
      getEnvBinding('DATABASE_URL') ||
      'postgresql://postgres:postgres@localhost:5432/bus_booking_db?schema=public'
    );
  },
  get jwtSecret() {
    return getEnvBinding('JWT_SECRET') || 'bus-booking-super-secret-jwt-key-2026';
  },
  get jwtExpiresIn() {
    return getEnvBinding('JWT_EXPIRES_IN') || '7d';
  },
  get frontendUrl() {
    return getEnvBinding('FRONTEND_URL') || 'http://localhost:5173';
  },
};

module.exports = config;
