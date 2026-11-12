const prisma = require('../config/prisma');

/**
 * Validates database connectivity with graceful error capture
 * @returns {Promise<{ isConnected: boolean, latencyMs?: number, error?: string }>}
 */
async function checkDatabaseConnection() {
  const start = Date.now();
  try {
    // Execute lightweight raw query
    await prisma.$queryRaw`SELECT 1 as health_check`;
    const latencyMs = Date.now() - start;
    return {
      isConnected: true,
      latencyMs,
    };
  } catch (error) {
    return {
      isConnected: false,
      error: error.message || 'Database connection could not be established',
    };
  }
}

/**
 * Validates entity models and counts if database is seeded
 * @returns {Promise<{ isSeeded: boolean, counts: Record<string, number> | null }>}
 */
async function getDatabaseSeedMetrics() {
  try {
    const [userCount, operatorCount, busCount, routeCount, tripCount, bookingCount] = await Promise.all([
      prisma.user.count(),
      prisma.operator.count(),
      prisma.bus.count(),
      prisma.route.count(),
      prisma.trip.count(),
      prisma.booking.count(),
    ]);

    const counts = {
      users: userCount,
      operators: operatorCount,
      buses: busCount,
      routes: routeCount,
      trips: tripCount,
      bookings: bookingCount,
    };

    return {
      isSeeded: tripCount > 0 && bookingCount > 0,
      counts,
    };
  } catch (error) {
    return {
      isSeeded: false,
      counts: null,
      error: error.message,
    };
  }
}

module.exports = {
  checkDatabaseConnection,
  getDatabaseSeedMetrics,
};
