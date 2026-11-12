const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { randomUUID } = require('node:crypto');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');

const originalDelegates = {
  trip: prisma.trip,
  tripSeat: prisma.tripSeat,
  booking: prisma.booking,
  bookingPassenger: prisma.bookingPassenger,
  bookingSeat: prisma.bookingSeat,
  payment: prisma.payment,
  auditLog: prisma.auditLog,
  $transaction: prisma.$transaction,
};

const yieldMicrotask = () => new Promise((resolve) => setImmediate(resolve));

/**
 * Simulates PostgreSQL ReadCommitted transactional row-level locking (`SELECT ... FOR UPDATE`)
 * over an in-memory TripSeat inventory with async I/O yields between steps.
 */
function createTransactionalRowLockHarness(tripId, initialSeats) {
  const state = {
    trip: {
      id: tripId,
      status: 'SCHEDULED',
      route: { id: 'r-1', sourceCity: 'Delhi', destinationCity: 'Jaipur' },
      bus: { id: 'b-1', busNumber: 'DL01CC9001', busType: 'AC_SEATER_2X2' },
    },
    tripSeats: initialSeats.map((s) => ({ ...s, tripId })),
    bookings: [],
    bookingPassengers: [],
    bookingSeats: [],
    payments: [],
    auditLogs: [],
  };

  // Row-level mutex queue keyed by TripSeat.id
  const rowMutexQueues = new Map();

  async function acquireRowLock(seatId, heldLocks) {
    if (heldLocks.has(seatId)) return;
    const prevChain = rowMutexQueues.get(seatId) || Promise.resolve();
    let releaseFn;
    const myTurn = new Promise((resolve) => {
      releaseFn = resolve;
    });
    const tail = prevChain.then(() => myTurn);
    rowMutexQueues.set(seatId, tail);

    await prevChain;
    heldLocks.add(seatId);
    return releaseFn;
  }

  function createDelegates(txContext = null) {
    return {
      trip: {
        findUnique: async ({ where }) => (where.id === tripId ? state.trip : null),
      },
      tripSeat: {
        findMany: async ({ where }) => {
          await yieldMicrotask();
          return state.tripSeats.filter((s) => {
            if (where.tripId && s.tripId !== where.tripId) return false;
            if (where.seatNumber?.in && !where.seatNumber.in.includes(s.seatNumber)) return false;
            return true;
          });
        },
        updateMany: async ({ where, data }) => {
          await yieldMicrotask();
          const now = new Date();
          const candidates = state.tripSeats.filter((seat) => {
            if (where.id?.in && !where.id.in.includes(seat.id)) return false;
            if (where.tripId && seat.tripId !== where.tripId) return false;
            if (where.seatNumber?.in && !where.seatNumber.in.includes(seat.seatNumber)) return false;
            return true;
          });

          if (txContext) {
            for (const seat of candidates.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))) {
              const rel = await acquireRowLock(seat.id, txContext.heldLockIds);
              if (rel) txContext.releasers.push(rel);
            }
          }

          let updated = 0;
          for (const seat of candidates) {
            if (typeof where.status === 'string' && seat.status !== where.status) continue;
            if (where.status?.in && !where.status.in.includes(seat.status)) continue;
            if (where.lockedUntil?.lte && (!seat.lockedUntil || seat.lockedUntil > where.lockedUntil.lte)) {
              continue;
            }

            if (txContext && !txContext.mutatedBefore.has(seat.id)) {
              txContext.mutatedBefore.set(seat.id, {
                status: seat.status,
                lockedUntil: seat.lockedUntil,
                currentBookingId: seat.currentBookingId,
              });
            }

            Object.assign(seat, data, { updatedAt: now });
            updated += 1;
          }
          return { count: updated };
        },
      },
      booking: {
        findUnique: async ({ where }) =>
          state.bookings.find((b) => b.pnr === where.pnr) || null,
        create: async ({ data }) => {
          await yieldMicrotask();
          const rec = { id: randomUUID(), createdAt: new Date(), ...data };
          if (txContext) txContext.pendingBookings.push(rec);
          else state.bookings.push(rec);
          return rec;
        },
      },
      bookingPassenger: {
        create: async ({ data }) => {
          await yieldMicrotask();
          const rec = { id: randomUUID(), createdAt: new Date(), ...data };
          if (txContext) txContext.pendingPassengers.push(rec);
          else state.bookingPassengers.push(rec);
          return rec;
        },
      },
      payment: {
        create: async ({ data }) => {
          await yieldMicrotask();
          const rec = { id: randomUUID(), createdAt: new Date(), ...data };
          if (txContext) txContext.pendingPayments.push(rec);
          else state.payments.push(rec);
          return rec;
        },
      },
      bookingSeat: {
        create: async ({ data }) => {
          await yieldMicrotask();
          const rec = { id: randomUUID(), createdAt: new Date(), ...data };
          if (txContext) txContext.pendingBookingSeats.push(rec);
          else state.bookingSeats.push(rec);
          return rec;
        },
      },
      auditLog: {
        create: async ({ data }) => {
          const rec = { id: randomUUID(), createdAt: new Date(), ...data };
          if (txContext) txContext.pendingAudits.push(rec);
          else state.auditLogs.push(rec);
          return rec;
        },
      },
      $queryRaw: async (_strings, qTripId, seatNumbers) => {
        const sortedTargets = [...seatNumbers].sort();
        const matchingIds = state.tripSeats
          .filter((s) => s.tripId === qTripId && sortedTargets.includes(s.seatNumber))
          .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))
          .map((s) => s.id);

        if (txContext) {
          for (const id of matchingIds) {
            const rel = await acquireRowLock(id, txContext.heldLockIds);
            if (rel) txContext.releasers.push(rel);
          }
        }

        // Snapshot rows AFTER acquiring FOR UPDATE locks (ReadCommitted)
        await yieldMicrotask();
        return state.tripSeats
          .filter((s) => matchingIds.includes(s.id))
          .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))
          .map((s) => ({ ...s }));
      },
    };
  }

  async function transactionImpl(fn) {
    const txContext = {
      heldLockIds: new Set(),
      releasers: [],
      mutatedBefore: new Map(),
      pendingBookings: [],
      pendingPassengers: [],
      pendingPayments: [],
      pendingBookingSeats: [],
      pendingAudits: [],
    };

    const txDelegates = createDelegates(txContext);
    try {
      const result = await fn(txDelegates);
      // Commit staged inserts
      state.bookings.push(...txContext.pendingBookings);
      state.bookingPassengers.push(...txContext.pendingPassengers);
      state.payments.push(...txContext.pendingPayments);
      state.bookingSeats.push(...txContext.pendingBookingSeats);
      state.auditLogs.push(...txContext.pendingAudits);
      return result;
    } catch (err) {
      // Rollback ONLY TripSeat rows modified by this specific transaction
      for (const s of state.tripSeats) {
        if (txContext.mutatedBefore.has(s.id)) {
          Object.assign(s, txContext.mutatedBefore.get(s.id));
        }
      }
      throw err;
    } finally {
      for (const rel of txContext.releasers) {
        rel();
      }
    }
  }

  return { state, rootDelegates: createDelegates(null), transactionImpl };
}

describe('Automated Concurrent Booking Race-Condition Suite', () => {
  afterEach(() => {
    Object.assign(prisma, originalDelegates);
  });

  const TRIP_UUID = '88888888-8888-4888-8888-888888888888';

  it('2-way parallel race for the same seat 1A: strictly 1 succeeds (201) and 1 fails (409)', async () => {
    const harness = createTransactionalRowLockHarness(TRIP_UUID, [
      { id: 'ts-1', seatId: 's-1', seatNumber: '1A', price: 650, status: 'AVAILABLE', lockedUntil: null },
    ]);
    Object.assign(prisma, harness.rootDelegates);
    prisma.$transaction = harness.transactionImpl;

    const userA = generateToken({ userId: 'u-a', role: 'PASSENGER', email: 'a@bus.in' });
    const userB = generateToken({ userId: 'u-b', role: 'PASSENGER', email: 'b@bus.in' });

    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${userA}`)
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'a@bus.in',
          contactPhone: '9876543210',
          passengers: [{ fullName: 'Passenger Alpha', age: 25, gender: 'MALE', seatNumber: '1A' }],
        }),
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${userB}`)
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'b@bus.in',
          contactPhone: '9876543211',
          passengers: [{ fullName: 'Passenger Beta', age: 27, gender: 'FEMALE', seatNumber: '1A' }],
        }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    assert.deepEqual(statuses, [201, 409]);
    assert.equal(harness.state.bookings.length, 1);
    assert.equal(harness.state.bookingSeats.length, 1);
    assert.equal(harness.state.payments.length, 1);
    assert.equal(harness.state.tripSeats[0].status, 'BOOKED');
  });

  it('10-way concurrent stampede for seat 1A: exactly 1 booking confirmed and 9 get 409 Conflict', async () => {
    const harness = createTransactionalRowLockHarness(TRIP_UUID, [
      { id: 'ts-1', seatId: 's-1', seatNumber: '1A', price: 700, status: 'AVAILABLE', lockedUntil: null },
    ]);
    Object.assign(prisma, harness.rootDelegates);
    prisma.$transaction = harness.transactionImpl;

    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, idx) =>
        request(app)
          .post('/api/v1/bookings')
          .send({
            tripId: TRIP_UUID,
            contactEmail: `rider${idx}@bus.in`,
            contactPhone: `987654321${idx}`,
            passengers: [
              { fullName: `Rider ${idx}`, age: 22 + idx, gender: 'OTHER', seatNumber: '1A' },
            ],
          })
      )
    );

    const created = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    assert.equal(created.length, 1);
    assert.equal(conflicts.length, 9);
    assert.equal(harness.state.bookings.length, 1);
    assert.equal(harness.state.bookingPassengers.length, 1);
    assert.equal(harness.state.tripSeats[0].status, 'BOOKED');
  });

  it('overlapping multi-seat opposite-order requests ([1B, 1A] vs [1C, 1A]): deadlock-free, 1 wins, uncontended 1C stays AVAILABLE', async () => {
    const harness = createTransactionalRowLockHarness(TRIP_UUID, [
      { id: 'ts-1', seatId: 's-1', seatNumber: '1A', price: 650, status: 'AVAILABLE', lockedUntil: null },
      { id: 'ts-2', seatId: 's-2', seatNumber: '1B', price: 600, status: 'AVAILABLE', lockedUntil: null },
      { id: 'ts-3', seatId: 's-3', seatNumber: '1C', price: 600, status: 'AVAILABLE', lockedUntil: null },
    ]);
    Object.assign(prisma, harness.rootDelegates);
    prisma.$transaction = harness.transactionImpl;

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/bookings')
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'group1@bus.in',
          contactPhone: '9876543210',
          passengers: [
            { fullName: 'Member One', age: 29, gender: 'MALE', seatNumber: '1B' },
            { fullName: 'Member Two', age: 28, gender: 'FEMALE', seatNumber: '1A' },
          ],
        }),
      request(app)
        .post('/api/v1/bookings')
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'group2@bus.in',
          contactPhone: '9876543211',
          passengers: [
            { fullName: 'Member Three', age: 31, gender: 'MALE', seatNumber: '1C' },
            { fullName: 'Member Four', age: 30, gender: 'FEMALE', seatNumber: '1A' },
          ],
        }),
    ]);

    assert.deepEqual([res1.status, res2.status].sort(), [201, 409]);
    assert.equal(harness.state.bookings.length, 1);
    assert.equal(harness.state.bookingSeats.length, 2);

    const winnerSeatNumbers = harness.state.tripSeats
      .filter((s) => s.status === 'BOOKED')
      .map((s) => s.seatNumber)
      .sort();
    const loserSeatNumber = winnerSeatNumbers.includes('1B') ? '1C' : '1B';
    const uncontendedSeat = harness.state.tripSeats.find((s) => s.seatNumber === loserSeatNumber);
    assert.equal(uncontendedSeat.status, 'AVAILABLE');
  });

  it('non-overlapping concurrent bookings (1A vs 1B) both succeed with distinct PNRs', async () => {
    const harness = createTransactionalRowLockHarness(TRIP_UUID, [
      { id: 'ts-1', seatId: 's-1', seatNumber: '1A', price: 650, status: 'AVAILABLE', lockedUntil: null },
      { id: 'ts-2', seatId: 's-2', seatNumber: '1B', price: 600, status: 'AVAILABLE', lockedUntil: null },
    ]);
    Object.assign(prisma, harness.rootDelegates);
    prisma.$transaction = harness.transactionImpl;

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/bookings')
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'solo1@bus.in',
          contactPhone: '9876543210',
          passengers: [{ fullName: 'Solo One', age: 25, gender: 'MALE', seatNumber: '1A' }],
        }),
      request(app)
        .post('/api/v1/bookings')
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'solo2@bus.in',
          contactPhone: '9876543211',
          passengers: [{ fullName: 'Solo Two', age: 26, gender: 'FEMALE', seatNumber: '1B' }],
        }),
    ]);

    assert.equal(res1.status, 201);
    assert.equal(res2.status, 201);
    assert.notEqual(res1.body.data.booking.pnr, res2.body.data.booking.pnr);
    assert.equal(harness.state.bookings.length, 2);
  });

  it('concurrent /seats/lock hold vs /bookings direct checkout maintains strict mutual exclusion', async () => {
    const harness = createTransactionalRowLockHarness(TRIP_UUID, [
      { id: 'ts-1', seatId: 's-1', seatNumber: '1A', price: 650, status: 'AVAILABLE', lockedUntil: null },
    ]);
    Object.assign(prisma, harness.rootDelegates);
    prisma.$transaction = harness.transactionImpl;

    const [lockRes, bookRes] = await Promise.all([
      request(app)
        .post(`/api/v1/trips/${TRIP_UUID}/seats/lock`)
        .send({ seatNumbers: ['1A'], holdMinutes: 10 }),
      request(app)
        .post('/api/v1/bookings')
        .send({
          tripId: TRIP_UUID,
          contactEmail: 'race@bus.in',
          contactPhone: '9876543210',
          passengers: [{ fullName: 'Race Rider', age: 24, gender: 'MALE', seatNumber: '1A' }],
        }),
    ]);

    // Exactly one of {lock, direct booking} wins; the other must receive 409 Conflict
    const outcomes = [lockRes.status, bookRes.status].sort();
    assert.equal(outcomes.includes(409), true);
    assert.equal(
      outcomes[0] === 200 || outcomes[0] === 201,
      true
    );
  });
});
