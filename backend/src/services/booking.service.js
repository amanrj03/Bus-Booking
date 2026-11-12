const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { generatePnrCode, calculateBookingFareSummary } = require('../utils/pnrGenerator');
const { recordAudit, AUDIT_ACTIONS } = require('./audit.service');

/**
 * Acquires PostgreSQL row-level locks (SELECT ... FOR UPDATE) in deterministic
 * alphabetical seatNumber order to prevent deadlocks and guarantee exclusive claims.
 */
async function lockAndValidateSeats(tx, tripId, seatNumbers, holdExpiresAt, now = new Date()) {
  const sortedSeats = [...seatNumbers].sort();

  const lockedRows =
    typeof tx.$queryRaw === 'function'
      ? await tx.$queryRaw`
          SELECT id, "tripId", "seatId", "seatNumber", price, status, "lockedUntil"
          FROM "TripSeat"
          WHERE "tripId" = ${tripId}
            AND "seatNumber" = ANY(${sortedSeats}::text[])
          ORDER BY "seatNumber" ASC
          FOR UPDATE
        `
      : await tx.tripSeat.findMany({
          where: {
            tripId,
            seatNumber: { in: sortedSeats },
          },
          orderBy: { seatNumber: 'asc' },
        });

  if (lockedRows.length !== sortedSeats.length) {
    const foundSet = new Set(lockedRows.map((r) => r.seatNumber));
    const missing = sortedSeats.filter((num) => !foundSet.has(num));
    throw new AppError(`Invalid seat numbers for this trip: ${missing.join(', ')}`, 404);
  }

  const holdTargetMs = holdExpiresAt ? new Date(holdExpiresAt).getTime() : null;

  for (const seat of lockedRows) {
    if (seat.status === 'BOOKED') {
      throw new AppError(`Seat ${seat.seatNumber} is already booked.`, 409);
    }

    if (seat.status === 'LOCKED' && seat.lockedUntil) {
      const seatLockMs = new Date(seat.lockedUntil).getTime();
      const isActiveLock = seatLockMs > now.getTime();
      const matchesCallerHold =
        holdTargetMs !== null && Math.abs(seatLockMs - holdTargetMs) <= 1000;

      if (isActiveLock && !matchesCallerHold) {
        throw new AppError(
          `Seat ${seat.seatNumber} is currently reserved in another active checkout session.`,
          409
        );
      }
    }
  }

  return lockedRows;
}

/**
 * Generates a unique PNR guaranteed not to collide with existing bookings.
 */
async function allocateUniquePnr(tx, sourceCity) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generatePnrCode(sourceCity);
    const existing = await tx.booking.findUnique({
      where: { pnr: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  throw new AppError('Unable to allocate unique PNR code. Please retry.', 500);
}

/**
 * Executes an atomic transactional booking:
 * - Validates active SCHEDULED trip
 * - Acquires FOR UPDATE row locks on TripSeat records
 * - Computes authoritative INR fare summary (with 5% GST)
 * - Generates unique PNR & persists Booking + BookingPassengers + claims TripSeats
 * - Records BOOKING_CREATED audit log inside the same transaction
 */
async function createTransactionalBooking(payload, actorUserId, ipAddress) {
  const now = new Date();
  const requestedSeatNumbers = payload.passengers.map((p) => p.seatNumber);

  const trip = await prisma.trip.findUnique({
    where: { id: payload.tripId },
    include: {
      route: {
        select: {
          id: true,
          sourceCity: true,
          destinationCity: true,
        },
      },
      bus: {
        select: {
          id: true,
          busNumber: true,
          busType: true,
        },
      },
    },
  });

  if (!trip) {
    throw new AppError('Trip not found', 404);
  }

  if (trip.status === 'CANCELLED' || trip.status === 'COMPLETED') {
    throw new AppError(`Cannot create booking for a ${trip.status} trip`, 400);
  }

  return prisma.$transaction(async (tx) => {
    const lockedSeats = await lockAndValidateSeats(
      tx,
      payload.tripId,
      requestedSeatNumbers,
      payload.holdExpiresAt,
      now
    );

    const fareSummary = calculateBookingFareSummary(lockedSeats, payload.addons);
    const pnr = await allocateUniquePnr(tx, trip.route?.sourceCity);

    const booking = await tx.booking.create({
      data: {
        pnr,
        userId: actorUserId || null,
        tripId: payload.tripId,
        totalAmount: fareSummary.totalAmount,
        status: 'CONFIRMED',
        contactEmail: payload.contactEmail,
        contactPhone: payload.contactPhone,
      },
    });

    const passengers = await Promise.all(
      payload.passengers.map((p) =>
        tx.bookingPassenger.create({
          data: {
            bookingId: booking.id,
            fullName: p.fullName,
            age: p.age,
            gender: p.gender,
            seatNumber: p.seatNumber,
          },
        })
      )
    );

    const seatIds = lockedSeats.map((s) => s.id);
    const claimResult = await tx.tripSeat.updateMany({
      where: {
        id: { in: seatIds },
        tripId: payload.tripId,
        status: { in: ['AVAILABLE', 'LOCKED'] },
      },
      data: {
        status: 'BOOKED',
        lockedUntil: null,
        currentBookingId: booking.id,
      },
    });

    if (claimResult.count !== lockedSeats.length) {
      throw new AppError(
        'Seat inventory changed concurrently while finalizing booking. Please retry.',
        409
      );
    }

    await recordAudit({
      userId: actorUserId,
      action: AUDIT_ACTIONS.BOOKING_CREATED,
      entity: 'Booking',
      entityId: booking.id,
      details: {
        pnr: booking.pnr,
        tripId: booking.tripId,
        seatNumbers: requestedSeatNumbers,
        totalAmount: fareSummary.totalAmount,
      },
      ipAddress,
      tx,
    });

    return {
      booking: {
        ...booking,
        totalAmount: Number(booking.totalAmount),
      },
      passengers,
      seats: lockedSeats.map((s) => ({
        tripSeatId: s.id,
        seatNumber: s.seatNumber,
        price: Number(s.price),
      })),
      fareSummary,
    };
  });
}

module.exports = {
  lockAndValidateSeats,
  allocateUniquePnr,
  createTransactionalBooking,
};
