const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { releaseAllExpiredLocks } = require('../services/seat.service');
const { lockSeatsSchema } = require('../validators/seat.validator');

const originalTripDelegate = prisma.trip;
const originalTripSeatDelegate = prisma.tripSeat;
const originalTransaction = prisma.$transaction;

const TRIP_UUID = '55555555-5555-4555-8555-555555555555';

describe('Live Trip Seat Status & Temporary Hold Expiration', () => {
  afterEach(() => {
    prisma.trip = originalTripDelegate;
    prisma.tripSeat = originalTripSeatDelegate;
    prisma.$transaction = originalTransaction;
  });

  describe('Seat Hold Validator & Global Expiration Sweep', () => {
    it('should validate 1..6 uppercase seat numbers and reject >6 seats', () => {
      const valid = lockSeatsSchema.safeParse({ seatNumbers: ['1a', '1b'] });
      assert.equal(valid.success, true);
      assert.deepEqual(valid.data.seatNumbers, ['1A', '1B']);
      assert.equal(valid.data.holdMinutes, 10);

      const tooMany = lockSeatsSchema.safeParse({
        seatNumbers: ['1A', '1B', '1C', '1D', '2A', '2B', '2C'],
      });
      assert.equal(tooMany.success, false);
    });

    it('releaseAllExpiredLocks() should release LOCKED seats whose lockedUntil has passed', async () => {
      let capturedWhere = null;
      let capturedData = null;

      prisma.tripSeat = {
        updateMany: async ({ where, data }) => {
          capturedWhere = where;
          capturedData = data;
          return { count: 4 };
        },
      };

      const now = new Date('2026-11-20T10:00:00.000Z');
      const result = await releaseAllExpiredLocks(now);
      assert.equal(result.count, 4);
      assert.equal(capturedWhere.status, 'LOCKED');
      assert.equal(capturedWhere.lockedUntil.lte.toISOString(), now.toISOString());
      assert.deepEqual(capturedData, { status: 'AVAILABLE', lockedUntil: null });
    });
  });

  describe('Seat Status & Lock API Integration Tests', () => {
    it('GET /api/v1/trips/:id/seats should expire stale locks first and return live layout & summary counts', async () => {
      let expiredSweepCalled = false;

      prisma.trip = {
        findUnique: async () => ({
          id: TRIP_UUID,
          departureTime: new Date('2026-11-25T10:00:00.000Z'),
          arrivalTime: new Date('2026-11-25T15:00:00.000Z'),
          baseFare: 600,
          status: 'SCHEDULED',
          route: { id: 'r-1', sourceCity: 'Delhi', destinationCity: 'Jaipur', routeStops: [] },
          bus: { id: 'b-1', busNumber: 'DL01AB1001', busType: 'AC_SEATER_2X2', totalSeats: 4, deckCount: 1 },
        }),
      };

      prisma.tripSeat = {
        updateMany: async ({ where }) => {
          assert.equal(where.tripId, TRIP_UUID);
          assert.equal(where.status, 'LOCKED');
          assert.ok(where.lockedUntil.lte instanceof Date);
          expiredSweepCalled = true;
          return { count: 1 };
        },
        findMany: async () => [
          {
            id: 'ts-1',
            seatId: 's-1',
            seatNumber: '1A',
            price: 650,
            status: 'AVAILABLE',
            lockedUntil: null,
            seat: { id: 's-1', deck: 1, row: 1, column: 1, seatType: 'WINDOW', isAccessible: true },
          },
          {
            id: 'ts-2',
            seatId: 's-2',
            seatNumber: '1B',
            price: 600,
            status: 'LOCKED',
            lockedUntil: new Date(Date.now() + 300_000),
            seat: { id: 's-2', deck: 1, row: 1, column: 2, seatType: 'AISLE', isAccessible: true },
          },
          {
            id: 'ts-3',
            seatId: 's-3',
            seatNumber: '1C',
            price: 600,
            status: 'BOOKED',
            lockedUntil: null,
            seat: { id: 's-3', deck: 1, row: 1, column: 3, seatType: 'AISLE', isAccessible: false },
          },
        ],
      };

      const res = await request(app).get(`/api/v1/trips/${TRIP_UUID}/seats`);
      assert.equal(res.status, 200);
      assert.equal(expiredSweepCalled, true);
      assert.equal(res.body.data.seats.length, 3);
      assert.deepEqual(res.body.data.summary, {
        total: 3,
        available: 1,
        locked: 1,
        booked: 1,
      });
    });

    it('POST /api/v1/trips/:id/seats/lock should lock AVAILABLE seats, compute INR subtotal, and log SEAT_LOCKED', async () => {
      let auditPayload = null;
      const passengerToken = generateToken({
        userId: 'pass-user-1',
        role: 'PASSENGER',
        email: 'pass@bus.in',
      });

      prisma.trip = {
        findUnique: async () => ({ id: TRIP_UUID, status: 'SCHEDULED' }),
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          tripSeat: {
            updateMany: async ({ where }) => {
              // First call: expired lock release; second call: atomic claim
              if (where.status === 'LOCKED') return { count: 0 };
              return { count: 2 };
            },
            findMany: async () => [
              { id: 'ts-1', seatNumber: '1A', price: 650, status: 'AVAILABLE' },
              { id: 'ts-2', seatNumber: '1B', price: 600, status: 'AVAILABLE' },
            ],
          },
          auditLog: {
            create: async ({ data }) => {
              auditPayload = data;
              return { id: 'audit-lock-1', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const res = await request(app)
        .post(`/api/v1/trips/${TRIP_UUID}/seats/lock`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ seatNumbers: ['1A', '1B'], holdMinutes: 10 });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.lockedSeats.length, 2);
      assert.equal(res.body.data.totalSeatPrice, 1250);
      assert.ok(res.body.data.lockedUntil);
      assert.equal(auditPayload.action, 'SEAT_LOCKED');
      assert.equal(auditPayload.userId, 'pass-user-1');
    });

    it('POST /api/v1/trips/:id/seats/lock should return 409 Conflict if any requested seat is no longer AVAILABLE', async () => {
      prisma.trip = {
        findUnique: async () => ({ id: TRIP_UUID, status: 'SCHEDULED' }),
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          tripSeat: {
            updateMany: async ({ where }) => {
              if (where.status === 'LOCKED') return { count: 0 };
              // Only 1 of 2 seats was AVAILABLE
              return { count: 1 };
            },
            findMany: async () => [
              { id: 'ts-1', seatNumber: '1A', price: 650, status: 'AVAILABLE' },
              { id: 'ts-2', seatNumber: '1B', price: 600, status: 'LOCKED' },
            ],
          },
        };
        return fn(mockTx);
      };

      const res = await request(app)
        .post(`/api/v1/trips/${TRIP_UUID}/seats/lock`)
        .send({ seatNumbers: ['1A', '1B'] });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });

    it('POST /api/v1/trips/:id/seats/release should release LOCKED seats and log SEAT_RELEASED', async () => {
      let auditPayload = null;

      prisma.trip = {
        findUnique: async () => ({ id: TRIP_UUID, status: 'SCHEDULED' }),
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          tripSeat: {
            updateMany: async ({ data }) => {
              assert.deepEqual(data, { status: 'AVAILABLE', lockedUntil: null });
              return { count: 2 };
            },
          },
          auditLog: {
            create: async ({ data }) => {
              auditPayload = data;
              return { id: 'audit-rel-1', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const res = await request(app)
        .post(`/api/v1/trips/${TRIP_UUID}/seats/release`)
        .send({ seatNumbers: ['1A', '1B'] });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.releasedCount, 2);
      assert.equal(auditPayload.action, 'SEAT_RELEASED');
    });
  });
});
