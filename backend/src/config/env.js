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

const config = {
  get port() {
    return parseInt(process.env.PORT || '5000', 10);
  },
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  get databaseUrl() {
    return (
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/bus_booking_db?schema=public'
    );
  },
  get jwtSecret() {
    return process.env.JWT_SECRET || 'bus-booking-super-secret-jwt-key-2026';
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '7d';
  },
  get frontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  },
};

module.exports = config;
