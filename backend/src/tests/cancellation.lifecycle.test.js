const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { randomUUID } = require('node:crypto');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { calculateCancellationRefund } = require('../services/cancellation.service');
const bookingService = require('../services/booking.service');
const cancellationService = require('../services/cancellation.service');
const reportService = require('../services/report.service');

const originalDelegates = {
  trip: prisma.trip,
  tripSeat: prisma.tripSeat,
  booking: prisma.booking,
  bookingPassenger: prisma.bookingPassenger,
  bookingSeat: prisma.bookingSeat,
  payment: prisma.payment,
  cancellation: prisma.cancellation,
  auditLog: prisma.auditLog,
  $transaction: prisma.$transaction,
};

const USER_A_ID = 'aaaa1111-1111-4111-8111-111111111111';
const USER_B_ID = 'bbbb2222-2222-4222-8222-222222222222';
const ADMIN_ID = 'cccc3333-3333-4333-8333-333333333333';
const TRIP_ID = 'dddd4444-4444-4444-8444-444444444444';

const userAToken = generateToken({ userId: USER_A_ID, email: 'passengerA@example.com', role: 'PASSENGER' });
const userBToken = generateToken({ userId: USER_B_ID, email: 'passengerB@example.com', role: 'PASSENGER' });
const adminToken = generateToken({ userId: ADMIN_ID, email: 'admin@example.com', role: 'ADMIN' });

/**
 * Creates an in-memory lifecycle harness simulating Prisma relational queries and mutations
 * to track seat status transitions from AVAILABLE -> BOOKED -> CANCELLED -> RE-BOOKED.
 */
function createLifecycleHarness() {
  const departureDate = new Date(Date.now() + 36 * 60 * 60 * 1000); // 36 hours in future

  const state = {
    trip: {
      id: TRIP_ID,
      departureTime: departureDate,
      arrivalTime: new Date(departureDate.getTime() + 6 * 60 * 60 * 1000),
      status: 'SCHEDULED',
      baseFare: 1000,
      route: { id: 'r-1', sourceCity: 'Delhi', destinationCity: 'Jaipur', routeStops: [] },
      bus: {
        id: 'b-1',
        busNumber: 'DL01AB9000',
        busType: 'AC_SLEEPER_2X1',
        totalSeats: 2,
        operator: { id: 'op-1', userId: 'op-user-1', companyName: 'Zingbus Express' },
      },
    },
    tripSeats: [
      { id: 'ts-12A', tripId: TRIP_ID, seatId: 's-1', seatNumber: '12A', price: 1000, status: 'AVAILABLE', lockedUntil: null, currentBookingId: null },
      { id: 'ts-12B', tripId: TRIP_ID, seatId: 's-2', seatNumber: '12B', price: 1000, status: 'AVAILABLE', lockedUntil: null, currentBookingId: null },
    ],
    bookings: [],
    bookingPassengers: [],
    bookingSeats: [],
    payments: [],
    cancellations: [],
    auditLogs: [],
  };

  function findBookingWithRelations(predicate) {
    const b = state.bookings.find(predicate);
    if (!b) return null;
    const passengers = state.bookingPassengers.filter((p) => p.bookingId === b.id);
    const seats = state.bookingSeats.filter((s) => s.bookingId === b.id);
    const payment = state.payments.find((p) => p.bookingId === b.id) || null;
    const cancellation = state.cancellations.find((c) => c.bookingId === b.id) || null;

    return {
      ...b,
      trip: state.trip,
      passengers,
      seats,
      payment,
      cancellation,
    };
  }

  function createTxClient() {
    return {
      trip: {
        findUnique: async () => state.trip,
      },
      tripSeat: {
        findMany: async ({ where }) => {
          return state.tripSeats.filter((s) => {
            if (where?.tripId && s.tripId !== where.tripId) return false;
            if (where?.seatNumber?.in && !where.seatNumber.in.includes(s.seatNumber)) return false;
            return true;
          });
        },
        updateMany: async ({ where, data }) => {
          let count = 0;
          for (const s of state.tripSeats) {
            let matches = true;
            if (where.tripId && s.tripId !== where.tripId) matches = false;
            if (where.id?.in && !where.id.in.includes(s.id)) matches = false;
            if (where.seatNumber?.in && !where.seatNumber.in.includes(s.seatNumber)) matches = false;
            if (where.currentBookingId && s.currentBookingId !== where.currentBookingId) matches = false;
            if (where.OR) {
              const orMatch = where.OR.some((crit) => {
                if (crit.currentBookingId && s.currentBookingId === crit.currentBookingId) return true;
                if (crit.seatNumber?.in && crit.seatNumber.in.includes(s.seatNumber)) return true;
                return false;
              });
              if (!orMatch) matches = false;
            }

            if (matches) {
              Object.assign(s, data);
              count++;
            }
          }
          return { count };
        },
      },
      booking: {
        findUnique: async ({ where }) => {
          if (where.pnr) return state.bookings.find((b) => b.pnr === where.pnr) || null;
          if (where.id) return state.bookings.find((b) => b.id === where.id) || null;
          return null;
        },
        findFirst: async ({ where }) => {
          return findBookingWithRelations((b) => {
            if (where.id && b.id === where.id) return true;
            if (where.pnr && b.pnr === where.pnr) return true;
            return false;
          });
        },
        create: async ({ data }) => {
          const rec = { id: randomUUID(), ...data, createdAt: new Date() };
          state.bookings.push(rec);
          return rec;
        },
        update: async ({ where, data }) => {
          const b = state.bookings.find((item) => item.id === where.id);
          if (b) Object.assign(b, data);
          return b;
        },
      },
      bookingPassenger: {
        create: async ({ data }) => {
          const rec = { id: `bp-${state.bookingPassengers.length + 1}`, ...data };
          state.bookingPassengers.push(rec);
          return rec;
        },
      },
      bookingSeat: {
        create: async ({ data }) => {
          const rec = { id: `bs-${state.bookingSeats.length + 1}`, ...data };
          state.bookingSeats.push(rec);
          return rec;
        },
        updateMany: async ({ where, data }) => {
          let count = 0;
          for (const bs of state.bookingSeats) {
            if (where.bookingId && bs.bookingId === where.bookingId) {
              Object.assign(bs, data);
              count++;
            }
          }
          return { count };
        },
      },
      payment: {
        create: async ({ data }) => {
          const rec = { id: `pay-${state.payments.length + 1}`, ...data, createdAt: new Date() };
          state.payments.push(rec);
          return rec;
        },
        update: async ({ where, data }) => {
          const p = state.payments.find((item) => item.id === where.id);
          if (p) Object.assign(p, data);
          return p;
        },
      },
      cancellation: {
        create: async ({ data }) => {
          const rec = { id: `canc-${state.cancellations.length + 1}`, ...data, createdAt: new Date() };
          state.cancellations.push(rec);
          return rec;
        },
      },
      auditLog: {
        create: async ({ data }) => {
          const rec = { id: `aud-${state.auditLogs.length + 1}`, ...data, createdAt: new Date() };
          state.auditLogs.push(rec);
          return rec;
        },
      },
    };
  }

  const txClient = createTxClient();

  prisma.trip = {
    findUnique: async ({ include } = {}) => {
      const bookingsWhere = include?.bookings?.where;
      const filteredBookings = state.bookings
        .filter((b) => {
          if (bookingsWhere?.status && b.status !== bookingsWhere.status) return false;
          return true;
        })
        .map((b) => findBookingWithRelations((item) => item.id === b.id));

      return {
        ...state.trip,
        tripSeats: state.tripSeats,
        bookings: filteredBookings,
      };
    },
  };

  prisma.booking = {
    findUnique: async ({ where }) => {
      if (where.pnr) return state.bookings.find((b) => b.pnr === where.pnr) || null;
      if (where.id) return state.bookings.find((b) => b.id === where.id) || null;
      return null;
    },
    findFirst: async ({ where }) => {
      return findBookingWithRelations((b) => {
        if (where.id && b.id === where.id) return true;
        if (where.pnr && b.pnr === where.pnr) return true;
        return false;
      });
    },
  };

  prisma.$transaction = async (fn) => fn(txClient);

  return { state, txClient };
}

describe('Cancellation Charges & Dynamic Seat Re-Availability Test Suite', () => {
  afterEach(() => {
    Object.assign(prisma, originalDelegates);
  });

  describe('Tier-Based Deduction & Exact Rupee Invariant Matrix', () => {
    it('verifies exact boundary deductions across >24h, 12-24h, and <12h windows', () => {
      const departure = new Date('2026-11-20T12:00:00.000Z');

      // 1. > 24 hours: Tier 1 (10% fee)
      const t1 = calculateCancellationRefund(
        1000,
        departure,
        new Date('2026-11-19T11:59:00.000Z') // 24.016 hrs remaining
      );
      assert.equal(t1.tier, 'TIER_1_STANDARD');
      assert.equal(t1.feePercentage, 10);
      assert.equal(t1.cancellationFee, 100);
      assert.equal(t1.refundAmount, 900);

      // 2. Exactly 24.0 hours: Tier 2 (25% fee)
      const t2_boundary = calculateCancellationRefund(
        1000,
        departure,
        new Date('2026-11-19T12:00:00.000Z') // exactly 24.0 hrs
      );
      assert.equal(t2_boundary.tier, 'TIER_2_MODERATE');
      assert.equal(t2_boundary.feePercentage, 25);
      assert.equal(t2_boundary.cancellationFee, 250);
      assert.equal(t2_boundary.refundAmount, 750);

      // 3. Exactly 12.0 hours: Tier 2 (25% fee)
      const t2_low = calculateCancellationRefund(
        1000,
        departure,
        new Date('2026-11-20T00:00:00.000Z') // exactly 12.0 hrs
      );
      assert.equal(t2_low.tier, 'TIER_2_MODERATE');
      assert.equal(t2_low.feePercentage, 25);
      assert.equal(t2_low.cancellationFee, 250);
      assert.equal(t2_low.refundAmount, 750);

      // 4. < 12 hours: Tier 3 (50% fee)
      const t3 = calculateCancellationRefund(
        1000,
        departure,
        new Date('2026-11-20T00:01:00.000Z') // 11.98 hrs remaining
      );
      assert.equal(t3.tier, 'TIER_3_LATE');
      assert.equal(t3.feePercentage, 50);
      assert.equal(t3.cancellationFee, 500);
      assert.equal(t3.refundAmount, 500);

      // 5. 30 minutes before departure: Tier 3 (50% fee)
      const t3_close = calculateCancellationRefund(
        1000,
        departure,
        new Date('2026-11-20T11:30:00.000Z') // 0.5 hrs remaining
      );
      assert.equal(t3_close.feePercentage, 50);
      assert.equal(t3_close.refundAmount, 500);
    });

    it('enforces totalAmount = cancellationFee + refundAmount rupee invariant on fractional pricing', () => {
      const departure = new Date('2026-11-20T12:00:00.000Z');
      const now = new Date('2026-11-19T00:00:00.000Z'); // 36 hrs (Tier 1: 10%)

      const testFares = [1299, 1549, 799, 2190, 833];
      for (const fare of testFares) {
        const res = calculateCancellationRefund(fare, departure, now);
        const feePlusRefund = Number((res.cancellationFee + res.refundAmount).toFixed(2));
        assert.equal(feePlusRefund, fare, `Failed for fare: ${fare}`);
      }
    });

    it('rejects post-departure cancellations with 400 Bad Request', () => {
      const departure = new Date('2026-11-20T12:00:00.000Z');
      const postDeparture = new Date('2026-11-20T12:01:00.000Z');

      assert.throws(
        () => calculateCancellationRefund(1000, departure, postDeparture),
        (err) => err.statusCode === 400 && err.message.includes('after scheduled coach departure')
      );
    });
  });

  describe('Full Seat Lifecycle: Booking -> Cancellation -> Immediate Re-booking -> Manifest Audit', () => {
    it('executes atomic seat release and enables Passenger B to re-book Passenger A cancelled seat', async () => {
      const { state } = createLifecycleHarness();

      // --- STEP 1: Passenger A books Seat 12A ---
      const bookingPayloadA = {
        tripId: TRIP_ID,
        contactEmail: 'passengerA@example.com',
        contactPhone: '+919876543210',
        paymentMethod: 'UPI',
        passengers: [{ fullName: 'Passenger A', age: 28, gender: 'MALE', seatNumber: '12A' }],
      };

      const bookingA = await bookingService.createTransactionalBooking(bookingPayloadA, USER_A_ID, '127.0.0.1');
      assert.ok(bookingA.booking.pnr);
      assert.equal(bookingA.booking.status, 'CONFIRMED');

      // Verify Seat 12A status is BOOKED by Passenger A
      const seat12AAfterA = state.tripSeats.find((s) => s.seatNumber === '12A');
      assert.equal(seat12AAfterA.status, 'BOOKED');
      assert.equal(seat12AAfterA.currentBookingId, bookingA.booking.id);

      // --- STEP 2: Passenger B tries to book Seat 12A while it is BOOKED (Expect 409 Conflict) ---
      const bookingPayloadB = {
        tripId: TRIP_ID,
        contactEmail: 'passengerB@example.com',
        contactPhone: '+919811223344',
        paymentMethod: 'UPI',
        passengers: [{ fullName: 'Passenger B', age: 32, gender: 'FEMALE', seatNumber: '12A' }],
      };

      await assert.rejects(
        () => bookingService.createTransactionalBooking(bookingPayloadB, USER_B_ID, '127.0.0.1'),
        (err) => err.statusCode === 409 && err.message.includes('already booked')
      );

      // --- STEP 3: Passenger A cancels Booking A ---
      const cancellationResult = await cancellationService.cancelBooking(
        bookingA.booking.id,
        { reason: 'Change of travel dates' },
        { userId: USER_A_ID, role: 'PASSENGER', email: 'passengerA@example.com' },
        '127.0.0.1'
      );

      assert.equal(cancellationResult.booking.status, 'CANCELLED');
      assert.equal(cancellationResult.payment.paymentStatus, 'REFUNDED');
      assert.equal(cancellationResult.cancellation.refundStatus, 'PROCESSED');
      assert.deepEqual(cancellationResult.releasedSeats, ['12A']);

      // Verify TripSeat 12A has been reset to AVAILABLE and currentBookingId is null
      const seat12AAfterCancel = state.tripSeats.find((s) => s.seatNumber === '12A');
      assert.equal(seat12AAfterCancel.status, 'AVAILABLE');
      assert.equal(seat12AAfterCancel.currentBookingId, null);

      // Verify BookingSeat for Passenger A is preserved with status CANCELLED
      const bookingSeatA = state.bookingSeats.find((bs) => bs.bookingId === bookingA.booking.id);
      assert.equal(bookingSeatA.status, 'CANCELLED');

      // --- STEP 4: Passenger B now successfully books Seat 12A on the same trip! ---
      const bookingB = await bookingService.createTransactionalBooking(bookingPayloadB, USER_B_ID, '127.0.0.1');
      assert.ok(bookingB.booking.pnr);
      assert.equal(bookingB.booking.status, 'CONFIRMED');
      assert.notEqual(bookingB.booking.pnr, bookingA.booking.pnr);

      // Verify TripSeat 12A is now BOOKED by Passenger B
      const seat12AAfterB = state.tripSeats.find((s) => s.seatNumber === '12A');
      assert.equal(seat12AAfterB.status, 'BOOKED');
      assert.equal(seat12AAfterB.currentBookingId, bookingB.booking.id);

      // Verify BookingSeat for Passenger B is CONFIRMED
      const bookingSeatB = state.bookingSeats.find((bs) => bs.bookingId === bookingB.booking.id);
      assert.equal(bookingSeatB.status, 'CONFIRMED');

      // --- STEP 5: Reconcile Manifest & Audit Trail ---
      // Both BookingSeat records coexist in the database history
      assert.equal(state.bookingSeats.length, 2);
      assert.equal(state.bookingSeats[0].bookingId, bookingA.booking.id);
      assert.equal(state.bookingSeats[0].status, 'CANCELLED');
      assert.equal(state.bookingSeats[1].bookingId, bookingB.booking.id);
      assert.equal(state.bookingSeats[1].status, 'CONFIRMED');

      // Active manifest (includeCancelled=false) only displays Passenger B
      const activeManifest = await reportService.getTripPassengerManifest(
        TRIP_ID,
        { userId: ADMIN_ID, role: 'ADMIN' },
        { includeCancelled: false }
      );
      assert.equal(activeManifest.manifest.length, 1);
      assert.equal(activeManifest.manifest[0].passengerName, 'Passenger B');
      assert.equal(activeManifest.manifest[0].seatNumber, '12A');
      assert.equal(activeManifest.manifest[0].bookingStatus, 'CONFIRMED');

      // Historical manifest (includeCancelled=true) includes both Passenger A and Passenger B
      const fullManifest = await reportService.getTripPassengerManifest(
        TRIP_ID,
        { userId: ADMIN_ID, role: 'ADMIN' },
        { includeCancelled: true }
      );
      assert.equal(fullManifest.manifest.length, 2);
      const names = fullManifest.manifest.map((m) => m.passengerName);
      assert.ok(names.includes('Passenger A'));
      assert.ok(names.includes('Passenger B'));

      // --- STEP 6: Double Cancellation Prevention ---
      await assert.rejects(
        () =>
          cancellationService.cancelBooking(
            bookingA.booking.id,
            { reason: 'Duplicate cancel' },
            { userId: USER_A_ID, role: 'PASSENGER', email: 'passengerA@example.com' },
            '127.0.0.1'
          ),
        (err) => err.statusCode === 400 && err.message.includes('already been cancelled')
      );
    });
  });
});
