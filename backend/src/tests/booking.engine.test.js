const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { generatePnrCode, calculateBookingFareSummary } = require('../utils/pnrGenerator');
const { createBookingSchema } = require('../validators/booking.validator');

const originalTripDelegate = prisma.trip;
const originalTransaction = prisma.$transaction;

const TRIP_UUID = '66666666-6666-4666-8666-666666666666';

describe('Transactional Booking Engine (FOR UPDATE & Unique PNR)', () => {
  afterEach(() => {
    prisma.trip = originalTripDelegate;
    prisma.$transaction = originalTransaction;
  });

  describe('PNR & Fare Breakdown Unit Tests', () => {
    it('generatePnrCode() should emit realistic Indian GB-CITY-YYMM-XXXX format', () => {
      const pnr = generatePnrCode('Delhi', new Date('2026-11-12T10:00:00.000Z'));
      assert.match(pnr, /^GB-DEL-2611-\d{4}$/);

      const blrPnr = generatePnrCode('Bangalore', new Date('2026-12-01T00:00:00.000Z'));
      assert.match(blrPnr, /^GB-BAN-2612-\d{4}$/);
    });

    it('calculateBookingFareSummary() should compute seat subtotal, add-ons, and 5% GST in INR', () => {
      const summary = calculateBookingFareSummary(
        [{ price: 650 }, { price: 600 }],
        { extraBaggage: true, travelInsurance: true }
      );
      // 1250 + 99 + (29 * 2 = 58) = 1407; GST 5% = 70.35; total = 1477.35
      assert.equal(summary.seatSubtotal, 1250);
      assert.equal(summary.baggageFee, 99);
      assert.equal(summary.insuranceFee, 58);
      assert.equal(summary.gstAmount, 70.35);
      assert.equal(summary.totalAmount, 1477.35);
    });
  });

  describe('Booking Payload Validator Tests', () => {
    it('should reject duplicate seatNumber across passengers and invalid Indian phone number', () => {
      const dupSeat = createBookingSchema.safeParse({
        tripId: TRIP_UUID,
        contactEmail: 'traveler@example.com',
        contactPhone: '+91 9876543210',
        passengers: [
          { fullName: 'Aarav Mehta', age: 28, gender: 'MALE', seatNumber: '1A' },
          { fullName: 'Diya Mehta', age: 26, gender: 'FEMALE', seatNumber: '1a' },
        ],
      });
      assert.equal(dupSeat.success, false);

      const badPhone = createBookingSchema.safeParse({
        tripId: TRIP_UUID,
        contactEmail: 'traveler@example.com',
        contactPhone: '12345',
        passengers: [
          { fullName: 'Aarav Mehta', age: 28, gender: 'MALE', seatNumber: '1A' },
        ],
      });
      assert.equal(badPhone.success, false);
    });
  });

  describe('Booking Transaction & Row-Locking Integration Tests', () => {
    it('POST /api/v1/bookings should acquire FOR UPDATE rows, retry PNR collision, create Booking & Passengers, and mark seats BOOKED', async () => {
      let queryRawSql = '';
      let pnrChecks = 0;
      let claimedUpdateData = null;
      let auditPayload = null;
      const createdPassengers = [];

      prisma.trip = {
        findUnique: async () => ({
          id: TRIP_UUID,
          status: 'SCHEDULED',
          route: { id: 'r-1', sourceCity: 'Mumbai', destinationCity: 'Pune' },
          bus: { id: 'b-1', busNumber: 'MH12AB1234', busType: 'AC_SEATER_2X2' },
        }),
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          $queryRaw: async (strings) => {
            queryRawSql = strings.join('?');
            return [
              { id: 'ts-1', tripId: TRIP_UUID, seatId: 's-1', seatNumber: '1A', price: 650, status: 'AVAILABLE', lockedUntil: null },
              { id: 'ts-2', tripId: TRIP_UUID, seatId: 's-2', seatNumber: '1B', price: 600, status: 'AVAILABLE', lockedUntil: null },
            ];
          },
          booking: {
            findUnique: async () => {
              pnrChecks += 1;
              return pnrChecks === 1 ? { id: 'colliding-booking' } : null;
            },
            create: async ({ data }) => ({
              id: 'booking-new-1',
              ...data,
              createdAt: new Date(),
            }),
          },
          bookingPassenger: {
            create: async ({ data }) => {
              const p = { id: `bp-${createdPassengers.length + 1}`, ...data };
              createdPassengers.push(p);
              return p;
            },
          },
          payment: {
            create: async ({ data }) => ({ id: 'pay-1', ...data, createdAt: new Date() }),
          },
          bookingSeat: {
            create: async ({ data }) => ({ id: 'bs-1', ...data, createdAt: new Date() }),
          },
          tripSeat: {
            updateMany: async ({ data }) => {
              claimedUpdateData = data;
              return { count: 2 };
            },
          },
          auditLog: {
            create: async ({ data }) => {
              auditPayload = data;
              return { id: 'audit-book-1', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const passengerToken = generateToken({
        userId: 'user-pass-1',
        role: 'PASSENGER',
        email: 'aarav@bus.in',
      });

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'aarav@bus.in',
          contactPhone: '+91 9876543210',
          passengers: [
            { fullName: 'Aarav Mehta', age: 28, gender: 'MALE', seatNumber: '1B' },
            { fullName: 'Diya Mehta', age: 26, gender: 'FEMALE', seatNumber: '1A' },
          ],
          addons: { extraBaggage: false, travelInsurance: false },
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.match(res.body.data.booking.pnr, /^GB-MUM-\d{4}-\d{4}$/);
      assert.equal(res.body.data.booking.totalAmount, 1312.5); // 1250 + 5% GST
      assert.equal(pnrChecks, 2);
      assert.match(queryRawSql, /FOR UPDATE/);
      assert.equal(createdPassengers.length, 2);
      assert.deepEqual(claimedUpdateData, {
        status: 'BOOKED',
        lockedUntil: null,
        currentBookingId: 'booking-new-1',
      });
      assert.equal(auditPayload.action, 'BOOKING_CREATED');
    });

    it('POST /api/v1/bookings should reject active hold mismatch with 409 Conflict and allow matching holdExpiresAt', async () => {
      const activeHold = new Date(Date.now() + 300_000);

      prisma.trip = {
        findUnique: async () => ({
          id: TRIP_UUID,
          status: 'SCHEDULED',
          route: { id: 'r-1', sourceCity: 'Delhi', destinationCity: 'Jaipur' },
          bus: { id: 'b-1', busNumber: 'DL01AB1234', busType: 'AC_SEATER_2X2' },
        }),
      };

      prisma.$transaction = async (fn) => {
        const mockTx = {
          $queryRaw: async () => [
            { id: 'ts-1', tripId: TRIP_UUID, seatId: 's-1', seatNumber: '1A', price: 650, status: 'LOCKED', lockedUntil: activeHold },
          ],
          booking: {
            findUnique: async () => null,
            create: async ({ data }) => ({ id: 'booking-hold-1', ...data }),
          },
          bookingPassenger: {
            create: async ({ data }) => ({ id: 'bp-1', ...data }),
          },
          payment: {
            create: async ({ data }) => ({ id: 'pay-hold-1', ...data, createdAt: new Date() }),
          },
          bookingSeat: {
            create: async ({ data }) => ({ id: 'bs-hold-1', ...data, createdAt: new Date() }),
          },
          tripSeat: {
            updateMany: async () => ({ count: 1 }),
          },
          auditLog: {
            create: async ({ data }) => ({ id: 'audit-hold', ...data }),
          },
        };
        return fn(mockTx);
      };

      // Without matching holdExpiresAt -> 409 Conflict
      const conflictRes = await request(app)
        .post('/api/v1/bookings')
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'guest@bus.in',
          contactPhone: '9876543210',
          passengers: [{ fullName: 'Guest Rider', age: 30, gender: 'OTHER', seatNumber: '1A' }],
        });
      assert.equal(conflictRes.status, 409);

      // With matching holdExpiresAt -> 201 Created
      const okRes = await request(app)
        .post('/api/v1/bookings')
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'guest@bus.in',
          contactPhone: '9876543210',
          holdExpiresAt: activeHold.toISOString(),
          passengers: [{ fullName: 'Guest Rider', age: 30, gender: 'OTHER', seatNumber: '1A' }],
        });
      assert.equal(okRes.status, 201);
      assert.match(okRes.body.data.booking.pnr, /^GB-DEL-\d{4}-\d{4}$/);
    });
  });
});
