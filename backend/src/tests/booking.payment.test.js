const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { generateSimulatedTxnRef } = require('../utils/pnrGenerator');

const originalTripDelegate = prisma.trip;
const originalBookingDelegate = prisma.booking;
const originalTransaction = prisma.$transaction;

const TRIP_UUID = '77777777-7777-4777-8777-777777777777';

describe('Simulated Payment Confirmation & BookingSeat Settlement', () => {
  afterEach(() => {
    prisma.trip = originalTripDelegate;
    prisma.booking = originalBookingDelegate;
    prisma.$transaction = originalTransaction;
  });

  describe('Payment Reference Unit Tests', () => {
    it('generateSimulatedTxnRef() should emit prefix matching method', () => {
      assert.match(generateSimulatedTxnRef('UPI'), /^TXN-SIM-UPI-\d{6}$/);
      assert.match(generateSimulatedTxnRef('NET_BANKING'), /^TXN-SIM-NBK-\d{6}$/);
      assert.match(generateSimulatedTxnRef('DEBIT_CARD'), /^TXN-SIM-CRD-\d{6}$/);
      assert.match(generateSimulatedTxnRef('WALLET'), /^TXN-SIM-WLT-\d{6}$/);
    });
  });

  describe('Payment & BookingSeat Integration Tests', () => {
    it('POST /api/v1/bookings should create Payment with SUCCESS, persist BookingSeat rows, and return complete confirmation payload', async () => {
      let createdPayment = null;
      const createdBookingSeats = [];
      let auditPayload = null;

      prisma.trip = {
        findUnique: async () => ({
          id: TRIP_UUID,
          status: 'SCHEDULED',
          route: { id: 'r-1', sourceCity: 'Bangalore', destinationCity: 'Chennai' },
          bus: { id: 'b-1', busNumber: 'KA01AB7777', busType: 'AC_SLEEPER_2X1' },
        }),
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          $queryRaw: async () => [
            { id: 'ts-1', tripId: TRIP_UUID, seatId: 's-1', seatNumber: 'L1A', price: 950, status: 'AVAILABLE' },
          ],
          booking: {
            findUnique: async () => null,
            create: async ({ data }) => ({ id: 'booking-pay-1', ...data, createdAt: new Date() }),
          },
          bookingPassenger: {
            create: async ({ data }) => ({ id: 'pass-rec-1', ...data }),
          },
          payment: {
            create: async ({ data }) => {
              createdPayment = { id: 'pay-rec-1', ...data, createdAt: new Date() };
              return createdPayment;
            },
          },
          bookingSeat: {
            create: async ({ data }) => {
              const row = { id: `bs-${createdBookingSeats.length + 1}`, ...data };
              createdBookingSeats.push(row);
              return row;
            },
          },
          tripSeat: {
            updateMany: async () => ({ count: 1 }),
          },
          auditLog: {
            create: async ({ data }) => {
              auditPayload = data;
              return { id: 'audit-pay-1', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'traveler@example.com',
          contactPhone: '9876543210',
          paymentMethod: 'UPI',
          paymentDetails: { upiId: 'traveler@okaxis' },
          passengers: [{ fullName: 'Sunita Rao', age: 34, gender: 'FEMALE', seatNumber: 'L1A' }],
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.match(res.body.data.booking.pnr, /^GB-BAN-\d{4}-\d{4}$/);
      assert.equal(res.body.data.payment.paymentMethod, 'UPI');
      assert.equal(res.body.data.payment.paymentStatus, 'SUCCESS');
      assert.match(res.body.data.payment.transactionReference, /^TXN-SIM-UPI-\d{6}$/);
      assert.equal(createdBookingSeats.length, 1);
      assert.equal(createdBookingSeats[0].passengerId, 'pass-rec-1');
      assert.equal(createdBookingSeats[0].seatNumber, 'L1A');
      assert.equal(createdBookingSeats[0].status, 'CONFIRMED');
      assert.match(auditPayload.details.transactionReference, /^TXN-SIM-UPI-\d{6}$/);
    });

    it('POST /api/v1/bookings should abort transaction with 402 Payment Required when simulateFailure is true', async () => {
      prisma.trip = {
        findUnique: async () => ({
          id: TRIP_UUID,
          status: 'SCHEDULED',
          route: { id: 'r-1', sourceCity: 'Delhi', destinationCity: 'Jaipur' },
        }),
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          $queryRaw: async () => [
            { id: 'ts-1', tripId: TRIP_UUID, seatId: 's-1', seatNumber: '1A', price: 600, status: 'AVAILABLE' },
          ],
          booking: {
            findUnique: async () => null,
            create: async ({ data }) => ({ id: 'b-fail', ...data }),
          },
          bookingPassenger: {
            create: async ({ data }) => ({ id: 'p-fail', ...data }),
          },
        };
        return fn(mockTx);
      };

      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'declined@example.com',
          contactPhone: '9876543210',
          paymentMethod: 'DEBIT_CARD',
          paymentDetails: { simulateFailure: true },
          passengers: [{ fullName: 'Test User', age: 30, gender: 'MALE', seatNumber: '1A' }],
        });

      assert.equal(res.status, 402);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /declined/i);
    });

    it('GET /api/v1/bookings/my should enforce 401 unauthenticated and return paginated user history', async () => {
      const unauth = await request(app).get('/api/v1/bookings/my');
      assert.equal(unauth.status, 401);

      prisma.booking = {
        findMany: async () => [
          {
            id: 'b-hist-1',
            pnr: 'GB-DEL-2611-1234',
            userId: 'user-pass-1',
            totalAmount: 1312.5,
            status: 'CONFIRMED',
            trip: {
              departureTime: new Date(),
              route: { sourceCity: 'Delhi', destinationCity: 'Jaipur' },
              bus: { busNumber: 'DL01AB1111', operator: { name: 'Zingbus' } },
            },
            passengers: [],
            seats: [],
            payment: { transactionReference: 'TXN-SIM-UPI-123456', paymentStatus: 'SUCCESS' },
          },
        ],
        count: async () => 1,
      };

      const token = generateToken({ userId: 'user-pass-1', role: 'PASSENGER', email: 'pass@bus.in' });
      const res = await request(app)
        .get('/api/v1/bookings/my')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.bookings.length, 1);
      assert.equal(res.body.data.bookings[0].pnr, 'GB-DEL-2611-1234');
    });

    it('GET /api/v1/bookings/pnr/:pnr should return public e-ticket details or 404', async () => {
      prisma.booking = {
        findUnique: async ({ where }) =>
          where.pnr === 'GB-DEL-2611-9999'
            ? {
                id: 'b-eticket-1',
                pnr: 'GB-DEL-2611-9999',
                totalAmount: 997.5,
                status: 'CONFIRMED',
                trip: { route: { sourceCity: 'Delhi', destinationCity: 'Jaipur', routeStops: [] }, bus: {} },
                passengers: [{ fullName: 'Aarav Mehta', seatNumber: '1A' }],
                payment: { paymentStatus: 'SUCCESS' },
              }
            : null,
      };

      const okRes = await request(app).get('/api/v1/bookings/pnr/GB-DEL-2611-9999');
      assert.equal(okRes.status, 200);
      assert.equal(okRes.body.data.booking.passengers.length, 1);

      const notFoundRes = await request(app).get('/api/v1/bookings/pnr/INVALID-PNR');
      assert.equal(notFoundRes.status, 404);
    });
  });
});
