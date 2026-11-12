const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');

const originalTripDelegate = prisma.trip;
const originalBookingDelegate = prisma.booking;
const originalBusDelegate = prisma.bus;

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const OPERATOR_USER_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_OPERATOR_USER_ID = '33333333-3333-4333-8333-333333333333';
const PASSENGER_ID = '44444444-4444-4444-8444-444444444444';
const TRIP_UUID = '77777777-7777-4777-8777-777777777777';

const adminToken = generateToken({ userId: ADMIN_ID, email: 'admin@bus.local', role: 'ADMIN' });
const operatorToken = generateToken({
  userId: OPERATOR_USER_ID,
  email: 'op@bus.local',
  role: 'OPERATOR',
});
const otherOperatorToken = generateToken({
  userId: OTHER_OPERATOR_USER_ID,
  email: 'other@bus.local',
  role: 'OPERATOR',
});
const passengerToken = generateToken({
  userId: PASSENGER_ID,
  email: 'pax@bus.local',
  role: 'PASSENGER',
});

describe('Reports API: Passenger Manifest, Occupancy % & Revenue Summary Suite', () => {
  afterEach(() => {
    prisma.trip = originalTripDelegate;
    prisma.booking = originalBookingDelegate;
    prisma.bus = originalBusDelegate;
  });

  describe('RBAC Protection', () => {
    it('enforces 401 for unauthenticated and 403 for PASSENGER on /api/v1/reports/*', async () => {
      const unauthRes = await request(app).get('/api/v1/reports/revenue');
      assert.equal(unauthRes.status, 401);

      const paxRes = await request(app)
        .get('/api/v1/reports/occupancy')
        .set('Authorization', `Bearer ${passengerToken}`);
      assert.equal(paxRes.status, 403);
    });
  });

  describe('GET /api/v1/reports/manifest/:tripId', () => {
    it('returns sorted passenger manifest, seat prices, and trip occupancy rate', async () => {
      prisma.trip = {
        findUnique: async () => ({
          id: TRIP_UUID,
          departureTime: new Date('2026-11-15T21:00:00.000Z'),
          arrivalTime: new Date('2026-11-16T04:00:00.000Z'),
          status: 'SCHEDULED',
          baseFare: 650,
          route: { id: 'r-1', sourceCity: 'Delhi', destinationCity: 'Jaipur', routeStops: [] },
          bus: {
            id: 'b-1',
            busNumber: 'DL01AB1234',
            busType: 'AC_SLEEPER_2X1',
            totalSeats: 4,
            operator: {
              id: 'op-1',
              userId: OPERATOR_USER_ID,
              name: 'Zingbus',
              companyName: 'Zingbus Express',
              contactPhone: '9811122233',
            },
          },
          tripSeats: [
            { seatNumber: '1A', status: 'BOOKED' },
            { seatNumber: '1B', status: 'BOOKED' },
            { seatNumber: '2A', status: 'AVAILABLE' },
            { seatNumber: '10A', status: 'AVAILABLE' },
          ],
          bookings: [
            {
              id: 'bkg-1',
              pnr: 'FLX-DEL-2026-0001',
              status: 'CONFIRMED',
              totalAmount: 1365,
              contactEmail: 'a@test.com',
              contactPhone: '9876543210',
              createdAt: new Date('2026-11-12T10:00:00.000Z'),
              passengers: [
                { fullName: 'Bob Patel', age: 30, gender: 'MALE', seatNumber: '1B' },
                { fullName: 'Alice Verma', age: 25, gender: 'FEMALE', seatNumber: '1A' },
              ],
              seats: [
                { seatNumber: '1A', seatPrice: 650 },
                { seatNumber: '1B', seatPrice: 650 },
              ],
              payment: { paymentStatus: 'SUCCESS' },
            },
          ],
        }),
      };

      const res = await request(app)
        .get(`/api/v1/reports/manifest/${TRIP_UUID}`)
        .set('Authorization', `Bearer ${operatorToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.metrics.totalSeats, 4);
      assert.equal(res.body.data.metrics.bookedSeatsCount, 2);
      assert.equal(res.body.data.metrics.availableSeatsCount, 2);
      assert.equal(res.body.data.metrics.occupancyRate, 50);
      assert.equal(res.body.data.metrics.confirmedPassengersCount, 2);
      assert.equal(res.body.data.metrics.confirmedRevenue, 1365);

      // Sorted naturally by seatNumber (1A before 1B)
      assert.equal(res.body.data.manifest.length, 2);
      assert.equal(res.body.data.manifest[0].seatNumber, '1A');
      assert.equal(res.body.data.manifest[0].passengerName, 'Alice Verma');
      assert.equal(res.body.data.manifest[1].seatNumber, '1B');
      assert.equal(res.body.data.manifest[1].passengerName, 'Bob Patel');
    });

    it('rejects OPERATOR trying to view another operator trip manifest with 403', async () => {
      prisma.trip = {
        findUnique: async () => ({
          id: TRIP_UUID,
          bus: { operator: { userId: OPERATOR_USER_ID } },
          tripSeats: [],
          bookings: [],
        }),
      };

      const res = await request(app)
        .get(`/api/v1/reports/manifest/${TRIP_UUID}`)
        .set('Authorization', `Bearer ${otherOperatorToken}`);

      assert.equal(res.status, 403);
    });
  });

  describe('GET /api/v1/reports/occupancy', () => {
    it('computes system-wide occupancy %, route breakdown, and paginated trips', async () => {
      prisma.trip = {
        findMany: async () => [
          {
            id: 't-1',
            departureTime: new Date('2026-11-15T10:00:00.000Z'),
            arrivalTime: new Date('2026-11-15T16:00:00.000Z'),
            status: 'SCHEDULED',
            route: { id: 'r-dj', sourceCity: 'Delhi', destinationCity: 'Jaipur' },
            bus: { busNumber: 'DL01', busType: 'AC_SEATER_2X2', totalSeats: 4, operator: { companyName: 'Zingbus' } },
            tripSeats: [
              { status: 'BOOKED' },
              { status: 'BOOKED' },
              { status: 'BOOKED' },
              { status: 'AVAILABLE' },
            ],
          },
          {
            id: 't-2',
            departureTime: new Date('2026-11-15T18:00:00.000Z'),
            arrivalTime: new Date('2026-11-15T22:00:00.000Z'),
            status: 'SCHEDULED',
            route: { id: 'r-mp', sourceCity: 'Mumbai', destinationCity: 'Pune' },
            bus: { busNumber: 'MH01', busType: 'AC_SLEEPER_2X1', totalSeats: 4, operator: { companyName: 'IntrCity' } },
            tripSeats: [
              { status: 'BOOKED' },
              { status: 'AVAILABLE' },
              { status: 'AVAILABLE' },
              { status: 'AVAILABLE' },
            ],
          },
        ],
      };

      const res = await request(app)
        .get('/api/v1/reports/occupancy?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.summary.totalTrips, 2);
      assert.equal(res.body.data.summary.totalCapacity, 8);
      assert.equal(res.body.data.summary.totalBookedSeats, 4);
      assert.equal(res.body.data.summary.averageOccupancyRate, 50);

      assert.equal(res.body.data.byRoute.length, 2);
      assert.equal(res.body.data.byRoute[0].routeLabel, 'Delhi → Jaipur');
      assert.equal(res.body.data.byRoute[0].occupancyRate, 75);
      assert.equal(res.body.data.byRoute[1].occupancyRate, 25);
    });
  });

  describe('GET /api/v1/reports/revenue', () => {
    it('computes net revenue, refunds, daily trend, route breakdown, and operator shares', async () => {
      prisma.bus = { count: async () => 12 };
      prisma.booking = {
        findMany: async () => [
          {
            id: 'b-1',
            totalAmount: 1000,
            status: 'CONFIRMED',
            createdAt: new Date('2026-11-11T10:00:00.000Z'),
            passengers: [{ id: 'p-1' }, { id: 'p-2' }],
            cancellation: null,
            trip: {
              route: { id: 'r-1', sourceCity: 'Delhi', destinationCity: 'Jaipur' },
              bus: { operator: { id: 'op-1', companyName: 'Zingbus Express' } },
            },
          },
          {
            id: 'b-2',
            totalAmount: 1000,
            status: 'CANCELLED',
            createdAt: new Date('2026-11-12T12:00:00.000Z'),
            passengers: [{ id: 'p-3' }],
            cancellation: { cancellationFee: 100, refundAmount: 900 },
            trip: {
              route: { id: 'r-2', sourceCity: 'Mumbai', destinationCity: 'Pune' },
              bus: { operator: { id: 'op-2', companyName: 'IntrCity SmartBus' } },
            },
          },
        ],
      };

      const res = await request(app)
        .get('/api/v1/reports/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      const { kpis, dailyTrend, byRoute, byOperator } = res.body.data;

      assert.equal(kpis.grossBookingsCount, 2);
      assert.equal(kpis.confirmedBookingsCount, 1);
      assert.equal(kpis.cancelledBookingsCount, 1);
      assert.equal(kpis.totalPassengers, 2);
      assert.equal(kpis.grossRevenue, 2000);
      assert.equal(kpis.confirmedRevenue, 1000);
      assert.equal(kpis.totalRefunded, 900);
      assert.equal(kpis.retainedCancellationFees, 100);
      assert.equal(kpis.netRevenue, 1100);
      assert.equal(kpis.activeFleetCount, 12);

      assert.equal(dailyTrend.length, 2);
      assert.equal(dailyTrend[0].date, '2026-11-11');
      assert.equal(dailyTrend[0].netRevenue, 1000);
      assert.equal(dailyTrend[1].date, '2026-11-12');
      assert.equal(dailyTrend[1].refunds, 900);
      assert.equal(dailyTrend[1].netRevenue, 100);

      assert.equal(byRoute.length, 2);
      assert.equal(byOperator.length, 2);
      assert.equal(byOperator[0].operatorName, 'Zingbus Express');
      assert.equal(byOperator[0].sharePercentage, 90.9);
    });
  });
});
