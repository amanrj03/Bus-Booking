const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const {
  generatePnrCode,
  calculateBookingFareSummary,
  generateSimulatedTxnRef,
} = require('../utils/pnrGenerator');
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

    // Simulated payment processing: allow explicit simulateFailure for negative testing
    if (payload.paymentDetails?.simulateFailure) {
      throw new AppError('Simulated payment declined by bank/network provider.', 402);
    }

    const transactionReference = generateSimulatedTxnRef(payload.paymentMethod);
    const payment = await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: fareSummary.totalAmount,
        paymentMethod: payload.paymentMethod || 'UPI',
        paymentStatus: 'SUCCESS',
        transactionReference,
      },
    });

    // Map each passenger to their TripSeat record and persist BookingSeat audit records
    const seatMapByNumber = new Map(lockedSeats.map((s) => [s.seatNumber, s]));
    const bookingSeats = await Promise.all(
      passengers.map((p) => {
        const tripSeat = seatMapByNumber.get(p.seatNumber);
        return tx.bookingSeat.create({
          data: {
            bookingId: booking.id,
            passengerId: p.id,
            tripSeatId: tripSeat.id,
            seatNumber: p.seatNumber,
            seatPrice: Number(tripSeat.price),
            status: 'CONFIRMED',
          },
        });
      })
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
        transactionReference,
        paymentMethod: payload.paymentMethod || 'UPI',
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
      bookingSeats: bookingSeats.map((bs) => ({
        ...bs,
        seatPrice: Number(bs.seatPrice),
      })),
      payment: {
        ...payment,
        amount: Number(payment.amount),
      },
      fareSummary,
    };
  });
}

/**
 * Retrieves passenger booking history with route, operator, seats, and simulated payment details.
 */
async function listUserBookings(userId, { page = 1, limit = 10, status }) {
  const where = { userId };
  if (status) where.status = status;

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        trip: {
          include: {
            route: {
              select: {
                id: true,
                sourceCity: true,
                destinationCity: true,
                estimatedMinutes: true,
              },
            },
            bus: {
              select: {
                busNumber: true,
                busType: true,
                operator: { select: { id: true, name: true, companyName: true, logoUrl: true } },
              },
            },
          },
        },
        passengers: true,
        seats: true,
        payment: true,
        cancellation: true,
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map((b) => ({
      ...b,
      totalAmount: Number(b.totalAmount),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Fetches an e-ticket by unique PNR code with passenger manifest and payment confirmation.
 */
async function getBookingByPnr(pnr) {
  const booking = await prisma.booking.findUnique({
    where: { pnr },
    include: {
      trip: {
        include: {
          route: {
            include: {
              routeStops: {
                orderBy: { stopOrder: 'asc' },
                include: { stop: true },
              },
            },
          },
          bus: {
            select: {
              busNumber: true,
              busType: true,
              amenities: true,
              operator: { select: { id: true, name: true, companyName: true, contactPhone: true } },
            },
          },
        },
      },
      passengers: true,
      seats: true,
      payment: true,
      cancellation: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found for provided PNR code', 404);
  }

  return {
    ...booking,
    totalAmount: Number(booking.totalAmount),
  };
}

module.exports = {
  lockAndValidateSeats,
  allocateUniquePnr,
  createTransactionalBooking,
  listUserBookings,
  getBookingByPnr,
};
