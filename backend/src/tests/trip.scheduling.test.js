const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { calculateSeatPrice, buildTripSeatInventory } = require('../utils/tripPricing');
const { scheduleTripSchema } = require('../validators/trip.validator');

const originalRouteDelegate = prisma.route;
const originalBusDelegate = prisma.bus;
const originalTripDelegate = prisma.trip;
const originalTransaction = prisma.$transaction;

const ROUTE_UUID = '11111111-1111-4111-8111-111111111111';
const BUS_UUID = '22222222-2222-4222-8222-222222222222';
const TRIP_UUID = '33333333-3333-4333-8333-333333333333';

const mockSeats = [
  { id: 's-1', seatNumber: 'L1A', seatType: 'SLEEPER' },
  { id: 's-2', seatNumber: 'L1B', seatType: 'AISLE' },
  { id: 's-3', seatNumber: 'L1C', seatType: 'WINDOW' },
];

describe('Trip Scheduling & Automatic TripSeat Inventory', () => {
  afterEach(() => {
    prisma.route = originalRouteDelegate;
    prisma.bus = originalBusDelegate;
    prisma.trip = originalTripDelegate;
    prisma.$transaction = originalTransaction;
  });

  describe('Seat Pricing & Inventory Builder Unit Tests', () => {
    it('should apply INR surcharges cleanly (+150 SLEEPER, +50 WINDOW, +0 AISLE)', () => {
      assert.equal(calculateSeatPrice(800, 'SLEEPER'), 950);
      assert.equal(calculateSeatPrice(800, 'WINDOW'), 850);
      assert.equal(calculateSeatPrice(800, 'AISLE'), 800);
      assert.equal(calculateSeatPrice(800, 'MIDDLE'), 800);
    });

    it('should build TripSeat inventory rows defaulting to AVAILABLE status', () => {
      const inventory = buildTripSeatInventory(TRIP_UUID, mockSeats, 750);
      assert.equal(inventory.length, 3);
      assert.deepEqual(inventory[0], {
        tripId: TRIP_UUID,
        seatId: 's-1',
        seatNumber: 'L1A',
        price: 900,
        status: 'AVAILABLE',
      });
      assert.equal(inventory[1].price, 750);
      assert.equal(inventory[2].price, 800);
    });
  });

  describe('Trip Validator Tests', () => {
    it('should reject arrivalTime before or equal to departureTime', () => {
      const result = scheduleTripSchema.safeParse({
        routeId: ROUTE_UUID,
        busId: BUS_UUID,
        departureTime: '2026-11-20T18:00:00.000Z',
        arrivalTime: '2026-11-20T17:00:00.000Z',
        baseFare: 699,
      });
      assert.equal(result.success, false);
    });

    it('should accept valid scheduling payload without explicit arrivalTime', () => {
      const result = scheduleTripSchema.safeParse({
        routeId: ROUTE_UUID,
        busId: BUS_UUID,
        departureTime: '2026-11-20T18:00:00.000Z',
        baseFare: 699,
      });
      assert.equal(result.success, true);
    });
  });

  describe('Trip Scheduling API Integration Tests', () => {
    it('should return 401 unauthenticated and 403 for PASSENGER role on /api/v1/trips', async () => {
      const unauth = await request(app).post('/api/v1/trips').send({});
      assert.equal(unauth.status, 401);

      const passToken = generateToken({
        userId: 'pass-1',
        role: 'PASSENGER',
        email: 'pass@bus.in',
      });
      const passRes = await request(app)
        .get('/api/v1/trips')
        .set('Authorization', `Bearer ${passToken}`);
      assert.equal(passRes.status, 403);
    });

    it('POST /api/v1/trips should compute arrivalTime, create TripSeats atomically, and log TRIP_SCHEDULED', async () => {
      let insertedInventory = [];
      let createdTripInput = null;
      let auditPayload = null;

      prisma.route = {
        findUnique: async () => ({
          id: ROUTE_UUID,
          sourceCity: 'Delhi',
          destinationCity: 'Jaipur',
          estimatedMinutes: 300,
          isActive: true,
        }),
      };
      prisma.bus = {
        findUnique: async () => ({
          id: BUS_UUID,
          busNumber: 'DL01AB1234',
          isActive: true,
          operator: { id: 'op-1', userId: 'op-user-1', name: 'Zingbus', isActive: true },
          seats: mockSeats,
        }),
      };
      prisma.trip = {
        findFirst: async () => null,
      };
      prisma.$transaction = async (fn) => {
        const mockTx = {
          trip: {
            create: async ({ data }) => {
              createdTripInput = data;
              return { id: TRIP_UUID, ...data };
            },
          },
          tripSeat: {
            createMany: async ({ data }) => {
              insertedInventory = data;
              return { count: data.length };
            },
          },
          auditLog: {
            create: async ({ data }) => {
              auditPayload = data;
              return { id: 'audit-trip-1', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const adminToken = generateToken({
        userId: 'admin-1',
        role: 'ADMIN',
        email: 'admin@bus.in',
      });

      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          routeId: ROUTE_UUID,
          busId: BUS_UUID,
          departureTime: '2026-11-20T06:00:00.000Z',
          baseFare: 650,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.trip.id, TRIP_UUID);
      assert.equal(res.body.data.trip.tripSeatsGenerated, 3);
      // 300 minutes (5h) added automatically to 06:00 -> 11:00
      assert.equal(
        createdTripInput.arrivalTime.toISOString(),
        '2026-11-20T11:00:00.000Z'
      );
      assert.equal(insertedInventory.length, 3);
      assert.equal(insertedInventory[0].price, 800); // SLEEPER: 650 + 150
      assert.equal(auditPayload.action, 'TRIP_SCHEDULED');
    });

    it('POST /api/v1/trips should return 409 Conflict when bus has an overlapping active schedule', async () => {
      prisma.route = {
        findUnique: async () => ({ id: ROUTE_UUID, estimatedMinutes: 240, isActive: true }),
      };
      prisma.bus = {
        findUnique: async () => ({
          id: BUS_UUID,
          busNumber: 'DL01AB1234',
          isActive: true,
          operator: { id: 'op-1', userId: 'op-user-1' },
          seats: mockSeats,
        }),
      };
      prisma.trip = {
        findFirst: async () => ({ id: 'existing-trip-1' }),
      };

      const adminToken = generateToken({
        userId: 'admin-1',
        role: 'ADMIN',
        email: 'admin@bus.in',
      });

      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          routeId: ROUTE_UUID,
          busId: BUS_UUID,
          departureTime: '2026-11-20T06:00:00.000Z',
          baseFare: 650,
        });

      assert.equal(res.status, 409);
    });

    it('POST /api/v1/trips should return 403 when OPERATOR tries to schedule another operator bus', async () => {
      prisma.route = {
        findUnique: async () => ({ id: ROUTE_UUID, estimatedMinutes: 240, isActive: true }),
      };
      prisma.bus = {
        findUnique: async () => ({
          id: BUS_UUID,
          busNumber: 'DL01AB1234',
          isActive: true,
          operator: { id: 'op-1', userId: 'owner-user-1' },
          seats: mockSeats,
        }),
      };

      const otherOpToken = generateToken({
        userId: 'other-user-2',
        role: 'OPERATOR',
        email: 'other@bus.in',
      });

      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${otherOpToken}`)
        .send({
          routeId: ROUTE_UUID,
          busId: BUS_UUID,
          departureTime: '2026-11-20T06:00:00.000Z',
          baseFare: 650,
        });

      assert.equal(res.status, 403);
    });

    it('PATCH /api/v1/trips/:id should update baseFare, reprice AVAILABLE seats, and log TRIP_UPDATED', async () => {
      const updatedSeatPrices = [];
      let auditPayload = null;

      prisma.trip = {
        findUnique: async () => ({
          id: TRIP_UUID,
          departureTime: new Date('2026-11-20T06:00:00.000Z'),
          arrivalTime: new Date('2026-11-20T11:00:00.000Z'),
          baseFare: 650,
          bus: { operator: { userId: 'owner-user-1' } },
        }),
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          trip: {
            update: async ({ data }) => ({
              id: TRIP_UUID,
              ...data,
            }),
          },
          tripSeat: {
            findMany: async () => [
              { id: 'ts-1', seat: { seatType: 'SLEEPER' } },
              { id: 'ts-2', seat: { seatType: 'WINDOW' } },
            ],
            update: async ({ where, data }) => {
              updatedSeatPrices.push({ id: where.id, price: data.price });
              return { id: where.id, ...data };
            },
          },
          auditLog: {
            create: async ({ data }) => {
              auditPayload = data;
              return { id: 'audit-trip-upd', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const ownerOpToken = generateToken({
        userId: 'owner-user-1',
        role: 'OPERATOR',
        email: 'owner@bus.in',
      });

      const res = await request(app)
        .patch(`/api/v1/trips/${TRIP_UUID}`)
        .set('Authorization', `Bearer ${ownerOpToken}`)
        .send({ baseFare: 900 });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.trip.baseFare, 900);
      assert.deepEqual(updatedSeatPrices, [
        { id: 'ts-1', price: 1050 },
        { id: 'ts-2', price: 950 },
      ]);
      assert.equal(auditPayload.action, 'TRIP_UPDATED');
    });
  });
});
