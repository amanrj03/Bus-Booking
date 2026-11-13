const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { calculateCancellationRefund } = require('../services/cancellation.service');

const originalBookingDelegate = prisma.booking;
const originalTransaction = prisma.$transaction;

const PASSENGER_USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_USER_ID = '33333333-3333-4333-8333-333333333333';
const BOOKING_UUID = '55555555-5555-4555-8555-555555555555';
const PNR_CODE = 'FLX-DEL-2026-9999';
const TRIP_UUID = '66666666-6666-4666-8666-666666666666';

const passengerToken = generateToken({
  userId: PASSENGER_USER_ID,
  email: 'passenger@example.com',
  role: 'PASSENGER',
});

const otherPassengerToken = generateToken({
  userId: OTHER_USER_ID,
  email: 'other@example.com',
  role: 'PASSENGER',
});

const adminToken = generateToken({
  userId: ADMIN_USER_ID,
  email: 'admin@example.com',
  role: 'ADMIN',
});

function createMockBooking(overrides = {}) {
  const departureDate = new Date(Date.now() + 30 * 60 * 60 * 1000); // 30 hours in future
  return {
    id: BOOKING_UUID,
    pnr: PNR_CODE,
    userId: PASSENGER_USER_ID,
    tripId: TRIP_UUID,
    totalAmount: 1000,
    status: 'CONFIRMED',
    contactEmail: 'passenger@example.com',
    contactPhone: '+919876543210',
    createdAt: new Date(),
    trip: {
      id: TRIP_UUID,
      departureTime: departureDate,
      arrivalTime: new Date(departureDate.getTime() + 6 * 60 * 60 * 1000),
      route: { sourceCity: 'Delhi', destinationCity: 'Jaipur' },
      bus: {
        busNumber: 'DL01AB1234',
        operator: { userId: 'op-user-1', companyName: 'Zingbus Express' },
      },
    },
    passengers: [
      { id: 'bp-1', fullName: 'Rahul Sharma', age: 28, gender: 'MALE', seatNumber: '1A' },
    ],
    seats: [
      { id: 'bs-1', tripSeatId: 'ts-1', seatNumber: '1A', seatPrice: 1000, status: 'CONFIRMED' },
    ],
    payment: {
      id: 'pay-1',
      amount: 1000,
      paymentMethod: 'UPI',
      paymentStatus: 'SUCCESS',
      transactionReference: 'TXN-SIM-UPI-123456',
    },
    cancellation: null,
    ...overrides,
  };
}

describe('Cancellation & Refund Rules Engine Suite', () => {
  afterEach(() => {
    prisma.booking = originalBookingDelegate;
    prisma.$transaction = originalTransaction;
  });

  describe('Cancellation Refund Calculation Unit Tests', () => {
    it('applies Tier 1 deduction (10% fee, 90% refund) when > 24 hours before departure', () => {
      const now = new Date('2026-11-12T10:00:00.000Z');
      const departure = new Date('2026-11-13T20:00:00.000Z'); // 34 hours remaining

      const result = calculateCancellationRefund(1000, departure, now);
      assert.equal(result.tier, 'TIER_1_STANDARD');
      assert.equal(result.feePercentage, 10);
      assert.equal(result.cancellationFee, 100);
      assert.equal(result.refundAmount, 900);
      assert.equal(result.hoursRemaining, 34);
    });

    it('applies Tier 2 deduction (25% fee, 75% refund) when 12–24 hours before departure', () => {
      const now = new Date('2026-11-12T10:00:00.000Z');
      const departure = new Date('2026-11-13T02:00:00.000Z'); // 16 hours remaining

      const result = calculateCancellationRefund(1200, departure, now);
      assert.equal(result.tier, 'TIER_2_MODERATE');
      assert.equal(result.feePercentage, 25);
      assert.equal(result.cancellationFee, 300);
      assert.equal(result.refundAmount, 900);
      assert.equal(result.hoursRemaining, 16);
    });

    it('applies Tier 3 deduction (50% fee, 50% refund) when < 12 hours before departure', () => {
      const now = new Date('2026-11-12T10:00:00.000Z');
      const departure = new Date('2026-11-12T16:00:00.000Z'); // 6 hours remaining

      const result = calculateCancellationRefund(800, departure, now);
      assert.equal(result.tier, 'TIER_3_LATE');
      assert.equal(result.feePercentage, 50);
      assert.equal(result.cancellationFee, 400);
      assert.equal(result.refundAmount, 400);
      assert.equal(result.hoursRemaining, 6);
    });

    it('throws 400 Bad Request if trip has already departed', () => {
      const now = new Date('2026-11-12T10:00:00.000Z');
      const departure = new Date('2026-11-12T09:00:00.000Z'); // in past

      assert.throws(
        () => calculateCancellationRefund(1000, departure, now),
        (err) => err.statusCode === 400 && err.message.includes('after scheduled coach departure')
      );
    });
  });

  describe('Cancellation Quote API Integration Tests', () => {
    it('GET /api/v1/bookings/:id/cancel-quote should return accurate refund quote for booking owner', async () => {
      const mockBooking = createMockBooking();
      prisma.booking = {
        findFirst: async () => mockBooking,
      };

      const res = await request(app)
        .get(`/api/v1/bookings/${BOOKING_UUID}/cancel-quote`)
        .set('Authorization', `Bearer ${passengerToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.pnr, PNR_CODE);
      assert.equal(res.body.data.refundQuote.tier, 'TIER_1_STANDARD');
      assert.equal(res.body.data.refundQuote.cancellationFee, 100);
      assert.equal(res.body.data.refundQuote.refundAmount, 900);
    });

    it('GET /api/v1/bookings/:id/cancel-quote should reject other passenger with 403 Forbidden', async () => {
      const mockBooking = createMockBooking();
      prisma.booking = {
        findFirst: async () => mockBooking,
      };

      const res = await request(app)
        .get(`/api/v1/bookings/${BOOKING_UUID}/cancel-quote`)
        .set('Authorization', `Bearer ${otherPassengerToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /only cancel your own bookings/i);
    });

    it('GET /api/v1/bookings/:id/cancel-quote should reject already cancelled booking with 400 Bad Request', async () => {
      const mockBooking = createMockBooking({ status: 'CANCELLED' });
      prisma.booking = {
        findFirst: async () => mockBooking,
      };

      const res = await request(app)
        .get(`/api/v1/bookings/${BOOKING_UUID}/cancel-quote`)
        .set('Authorization', `Bearer ${passengerToken}`);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /already cancelled/i);
    });
  });

  describe('Atomic Booking Cancellation & Seat Release Integration Tests', () => {
    it('POST /api/v1/bookings/:id/cancel should cancel booking, mark payment REFUNDED, release TripSeats, and log central audit', async () => {
      const mockBooking = createMockBooking();
      let updatedBookingData = null;
      let updatedPaymentData = null;
      let createdCancellation = null;
      let releasedSeatsCriteria = null;
      let auditLogData = null;

      prisma.booking = {
        findFirst: async () => mockBooking,
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          booking: {
            update: async ({ data }) => {
              updatedBookingData = data;
              return { ...mockBooking, ...data };
            },
          },
          payment: {
            update: async ({ data }) => {
              updatedPaymentData = data;
              return { ...mockBooking.payment, ...data };
            },
          },
          bookingSeat: {
            updateMany: async () => ({ count: 1 }),
          },
          tripSeat: {
            updateMany: async ({ where, data }) => {
              releasedSeatsCriteria = { where, data };
              return { count: 1 };
            },
          },
          cancellation: {
            create: async ({ data }) => {
              createdCancellation = { id: 'canc-1', ...data, createdAt: new Date() };
              return createdCancellation;
            },
          },
          auditLog: {
            create: async ({ data }) => {
              auditLogData = data;
              return { id: 'audit-canc-1', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const res = await request(app)
        .post(`/api/v1/bookings/${BOOKING_UUID}/cancel`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ reason: 'Flight rescheduled to earlier date' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.booking.status, 'CANCELLED');
      assert.equal(res.body.data.cancellation.cancellationFee, 100);
      assert.equal(res.body.data.cancellation.refundAmount, 900);
      assert.deepEqual(res.body.data.releasedSeats, ['1A']);

      // Verify DB transaction side effects
      assert.equal(updatedBookingData.status, 'CANCELLED');
      assert.equal(updatedPaymentData.paymentStatus, 'REFUNDED');
      assert.equal(releasedSeatsCriteria.data.status, 'AVAILABLE');
      assert.equal(releasedSeatsCriteria.data.currentBookingId, null);
      assert.equal(createdCancellation.reason, 'Flight rescheduled to earlier date');
      assert.equal(auditLogData.action, 'BOOKING_CANCELLED');
      assert.equal(auditLogData.entity, 'Booking');
      assert.equal(auditLogData.entityId, BOOKING_UUID);
      assert.equal(auditLogData.details.pnr, PNR_CODE);
      assert.equal(auditLogData.details.cancellationFee, 100);
      assert.equal(auditLogData.details.refundAmount, 900);
    });

    it('POST /api/v1/bookings/pnr/:pnr/cancel should allow ADMIN to cancel with automatic seat release', async () => {
      const mockBooking = createMockBooking();

      prisma.booking = {
        findFirst: async () => mockBooking,
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          booking: { update: async ({ data }) => ({ ...mockBooking, ...data }) },
          payment: { update: async ({ data }) => ({ ...mockBooking.payment, ...data }) },
          bookingSeat: { updateMany: async () => ({ count: 1 }) },
          tripSeat: { updateMany: async () => ({ count: 1 }) },
          cancellation: {
            create: async ({ data }) => ({ id: 'canc-admin-1', ...data, createdAt: new Date() }),
          },
          auditLog: { create: async ({ data }) => ({ id: 'audit-1', ...data }) },
        };
        return fn(mockTx);
      };

      const res = await request(app)
        .post(`/api/v1/bookings/pnr/${PNR_CODE}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Administrative cancellation by operator dispatch' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.booking.status, 'CANCELLED');
      assert.equal(res.body.data.cancellation.reason, 'Administrative cancellation by operator dispatch');
    });

    it('POST /api/v1/bookings/pnr/:pnr/cancel should support unauthenticated guest verification via contactEmail', async () => {
      const guestBooking = createMockBooking({
        userId: null,
        contactEmail: 'guest.traveler@example.com',
        contactPhone: '+919988776655',
      });

      prisma.booking = {
        findFirst: async () => guestBooking,
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          booking: { update: async ({ data }) => ({ ...guestBooking, ...data }) },
          payment: { update: async ({ data }) => ({ ...guestBooking.payment, ...data }) },
          bookingSeat: { updateMany: async () => ({ count: 1 }) },
          tripSeat: { updateMany: async () => ({ count: 1 }) },
          cancellation: {
            create: async ({ data }) => ({ id: 'canc-guest-1', ...data, createdAt: new Date() }),
          },
          auditLog: { create: async ({ data }) => ({ id: 'audit-1', ...data }) },
        };
        return fn(mockTx);
      };

      const res = await request(app)
        .post(`/api/v1/bookings/pnr/${PNR_CODE}/cancel`)
        .send({
          contactEmail: 'guest.traveler@example.com',
          reason: 'Medical necessity',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.booking.status, 'CANCELLED');
    });
  });
});

