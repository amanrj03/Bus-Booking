const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const {
  buildTripSearchWhere,
  getTripSearchOrderBy,
  matchesDepartureWindow,
} = require('../services/trip.service');
const { searchTripsQuerySchema } = require('../validators/trip.validator');

const originalTripDelegate = prisma.trip;
const TRIP_UUID = '33333333-3333-4333-8333-333333333333';
const OP_UUID = '44444444-4444-4444-8444-444444444444';

describe('Public Trip Search & Filtering Suite', () => {
  afterEach(() => {
    prisma.trip = originalTripDelegate;
  });

  describe('Search Query Builder & Validator Unit Tests', () => {
    it('should validate search query params and reject minPrice > maxPrice or malformed date', () => {
      assert.equal(
        searchTripsQuerySchema.safeParse({
          sourceCity: 'Delhi',
          destinationCity: 'Jaipur',
          date: '2026-11-20',
          minPrice: '400',
          maxPrice: '1200',
          busType: 'AC_SLEEPER_2X1',
          departureWindow: 'EVENING',
          sortBy: 'price_asc',
        }).success,
        true
      );

      assert.equal(
        searchTripsQuerySchema.safeParse({
          minPrice: '1500',
          maxPrice: '900',
        }).success,
        false
      );

      assert.equal(
        searchTripsQuerySchema.safeParse({
          date: '20-11-2026',
        }).success,
        false
      );
    });

    it('should construct Prisma where-clause for city pair, date bounds, busType, and INR fare bounds', () => {
      const where = buildTripSearchWhere({
        sourceCity: 'Mumbai',
        destinationCity: 'Pune',
        date: '2026-11-20',
        minPrice: 350,
        maxPrice: 900,
        busType: 'AC_SEATER_2X2',
        operatorId: OP_UUID,
      });

      assert.equal(where.status, 'SCHEDULED');
      assert.deepEqual(where.route, {
        isActive: true,
        sourceCity: { contains: 'Mumbai', mode: 'insensitive' },
        destinationCity: { contains: 'Pune', mode: 'insensitive' },
      });
      assert.deepEqual(where.bus, {
        isActive: true,
        busType: 'AC_SEATER_2X2',
        operatorId: OP_UUID,
      });
      assert.equal(where.departureTime.gte.toISOString(), '2026-11-20T00:00:00.000Z');
      assert.equal(where.departureTime.lte.toISOString(), '2026-11-20T23:59:59.999Z');
      assert.deepEqual(where.baseFare, { gte: 350, lte: 900 });
    });

    it('should accurately classify UTC departure windows and sort orders', () => {
      assert.equal(matchesDepartureWindow('2026-11-20T08:30:00.000Z', 'MORNING'), true);
      assert.equal(matchesDepartureWindow('2026-11-20T14:00:00.000Z', 'AFTERNOON'), true);
      assert.equal(matchesDepartureWindow('2026-11-20T19:30:00.000Z', 'EVENING'), true);
      assert.equal(matchesDepartureWindow('2026-11-20T22:15:00.000Z', 'NIGHT'), true);
      assert.equal(matchesDepartureWindow('2026-11-21T02:00:00.000Z', 'NIGHT'), true);
      assert.equal(matchesDepartureWindow('2026-11-20T14:00:00.000Z', 'NIGHT'), false);

      assert.deepEqual(getTripSearchOrderBy('price_asc'), { baseFare: 'asc' });
      assert.deepEqual(getTripSearchOrderBy('duration_asc'), {
        route: { estimatedMinutes: 'asc' },
      });
    });
  });

  describe('Public Trip Search API Integration Tests', () => {
    it('GET /api/v1/trips/search should return matching trips with live availableSeatsCount (counting expired locks as available)', async () => {
      let capturedArgs = null;
      const pastExpiry = new Date(Date.now() - 60_000);
      const activeLockExpiry = new Date(Date.now() + 300_000);

      prisma.trip = {
        findMany: async (args) => {
          capturedArgs = args;
          return [
            {
              id: TRIP_UUID,
              departureTime: new Date('2026-11-20T19:00:00.000Z'),
              arrivalTime: new Date('2026-11-21T00:00:00.000Z'),
              baseFare: 599,
              status: 'SCHEDULED',
              route: {
                id: 'r-1',
                sourceCity: 'Delhi',
                destinationCity: 'Jaipur',
                distanceKm: 280,
                estimatedMinutes: 300,
                routeStops: [],
              },
              bus: {
                id: 'b-1',
                busNumber: 'DL01AB1234',
                busType: 'AC_SEATER_2X2',
                totalSeats: 40,
                deckCount: 1,
                amenities: { wifi: true },
                operator: { id: OP_UUID, name: 'Zingbus', companyName: 'Zingbus Express' },
              },
              tripSeats: [
                { status: 'AVAILABLE', lockedUntil: null, price: 599 },
                { status: 'LOCKED', lockedUntil: pastExpiry, price: 649 }, // expired -> available
                { status: 'LOCKED', lockedUntil: activeLockExpiry, price: 599 }, // actively locked
                { status: 'BOOKED', lockedUntil: null, price: 649 },
              ],
            },
          ];
        },
        count: async () => 1,
      };

      const res = await request(app).get(
        '/api/v1/trips/search?sourceCity=Delhi&destinationCity=Jaipur&date=2026-11-20&minPrice=500&maxPrice=900&sortBy=price_asc'
      );

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.trips.length, 1);
      assert.equal(res.body.data.trips[0].availableSeatsCount, 2);
      assert.equal(res.body.data.trips[0].minSeatPrice, 599);
      assert.equal(res.body.data.trips[0].tripSeats, undefined);
      assert.deepEqual(capturedArgs.orderBy, { baseFare: 'asc' });
    });

    it('GET /api/v1/trips/search should filter by departureWindow and return accurate filtered pagination', async () => {
      prisma.trip = {
        findMany: async () => [
          {
            id: 't-morning',
            departureTime: new Date('2026-11-20T07:00:00.000Z'),
            arrivalTime: new Date('2026-11-20T12:00:00.000Z'),
            baseFare: 500,
            status: 'SCHEDULED',
            route: { id: 'r-1', sourceCity: 'Mumbai', destinationCity: 'Pune', estimatedMinutes: 200, routeStops: [] },
            bus: { id: 'b-1', busType: 'AC_SEATER_2X2', operator: { id: OP_UUID, name: 'Neugo' } },
            tripSeats: [{ status: 'AVAILABLE', lockedUntil: null, price: 500 }],
          },
          {
            id: 't-evening',
            departureTime: new Date('2026-11-20T18:30:00.000Z'),
            arrivalTime: new Date('2026-11-20T22:00:00.000Z'),
            baseFare: 650,
            status: 'SCHEDULED',
            route: { id: 'r-1', sourceCity: 'Mumbai', destinationCity: 'Pune', estimatedMinutes: 210, routeStops: [] },
            bus: { id: 'b-2', busType: 'AC_SLEEPER_2X1', operator: { id: OP_UUID, name: 'Neugo' } },
            tripSeats: [{ status: 'AVAILABLE', lockedUntil: null, price: 650 }],
          },
        ],
      };

      const res = await request(app).get(
        '/api/v1/trips/search?sourceCity=Mumbai&destinationCity=Pune&departureWindow=EVENING'
      );

      assert.equal(res.status, 200);
      assert.equal(res.body.data.trips.length, 1);
      assert.equal(res.body.data.trips[0].id, 't-evening');
      assert.equal(res.body.data.pagination.total, 1);
    });

    it('GET /api/v1/trips/:id should return public trip overview or 404 when missing', async () => {
      prisma.trip = {
        findUnique: async ({ where }) =>
          where.id === TRIP_UUID
            ? {
                id: TRIP_UUID,
                departureTime: new Date('2026-11-20T18:00:00.000Z'),
                arrivalTime: new Date('2026-11-20T23:00:00.000Z'),
                baseFare: 799,
                status: 'SCHEDULED',
                route: { sourceCity: 'Bangalore', destinationCity: 'Chennai', routeStops: [] },
                bus: { busNumber: 'KA01AB9999', busType: 'AC_SLEEPER_2X1', operator: { name: 'Orange' } },
                tripSeats: [{ status: 'AVAILABLE', lockedUntil: null, price: 799 }],
              }
            : null,
      };

      const okRes = await request(app).get(`/api/v1/trips/${TRIP_UUID}`);
      assert.equal(okRes.status, 200);
      assert.equal(okRes.body.data.trip.availableSeatsCount, 1);

      const notFoundRes = await request(app).get('/api/v1/trips/missing-id');
      assert.equal(notFoundRes.status, 404);
    });
  });
});
