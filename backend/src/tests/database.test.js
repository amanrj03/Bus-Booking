const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { checkDatabaseConnection, getDatabaseSeedMetrics } = require('../utils/dbCheck');

describe('Database Configuration & Connection Diagnostics Suite', () => {
  it('Prisma client singleton should be configured with all expected models', () => {
    assert.ok(prisma.user, 'User model delegate should exist');
    assert.ok(prisma.operator, 'Operator model delegate should exist');
    assert.ok(prisma.bus, 'Bus model delegate should exist');
    assert.ok(prisma.seat, 'Seat model delegate should exist');
    assert.ok(prisma.route, 'Route model delegate should exist');
    assert.ok(prisma.stop, 'Stop model delegate should exist');
    assert.ok(prisma.routeStop, 'RouteStop model delegate should exist');
    assert.ok(prisma.trip, 'Trip model delegate should exist');
    assert.ok(prisma.tripSeat, 'TripSeat model delegate should exist');
    assert.ok(prisma.booking, 'Booking model delegate should exist');
    assert.ok(prisma.bookingPassenger, 'BookingPassenger model delegate should exist');
    assert.ok(prisma.bookingSeat, 'BookingSeat model delegate should exist');
    assert.ok(prisma.payment, 'Payment model delegate should exist');
    assert.ok(prisma.cancellation, 'Cancellation model delegate should exist');
    assert.ok(prisma.auditLog, 'AuditLog model delegate should exist');
  });

  it('checkDatabaseConnection() should return a structured status object without uncaught exceptions', async () => {
    const status = await checkDatabaseConnection();
    assert.ok(typeof status === 'object' && status !== null);
    assert.ok(typeof status.isConnected === 'boolean');
    if (!status.isConnected) {
      assert.ok(typeof status.error === 'string');
    }
  });

  it('getDatabaseSeedMetrics() should safely report seed metrics or handle disconnected state', async () => {
    const metrics = await getDatabaseSeedMetrics();
    assert.ok(typeof metrics === 'object' && metrics !== null);
    assert.ok(typeof metrics.isSeeded === 'boolean');
  });

  it('GET /api/v1/health should include database connectivity status', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.database);
    assert.ok(typeof res.body.data.database.connected === 'boolean');
    assert.ok(res.body.data.database.message);
  });

  it('GET /api/v1/health/db should return detailed database diagnostics payload', async () => {
    const res = await request(app).get('/api/v1/health/db');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.data.connected === 'boolean');
    assert.ok(typeof res.body.data.isSeeded === 'boolean');
  });
});
