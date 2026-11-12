const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { recordAudit, AUDIT_ACTIONS } = require('./audit.service');

/**
 * Releases expired LOCKED seats on a specific trip back to AVAILABLE.
 */
async function releaseExpiredLocksForTrip(tripId, client = prisma, now = new Date()) {
  return client.tripSeat.updateMany({
    where: {
      tripId,
      status: 'LOCKED',
      lockedUntil: { lte: now },
    },
    data: {
      status: 'AVAILABLE',
      lockedUntil: null,
    },
  });
}

/**
 * Global background-callable sweep to release all expired temporary seat locks across trips.
 */
async function releaseAllExpiredLocks(now = new Date()) {
  return prisma.tripSeat.updateMany({
    where: {
      status: 'LOCKED',
      lockedUntil: { lte: now },
    },
    data: {
      status: 'AVAILABLE',
      lockedUntil: null,
    },
  });
}

/**
 * Fetches live seat layout and availability statuses for a trip after expiring stale locks.
 */
async function getLiveTripSeatMap(tripId) {
  const now = new Date();

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      route: {
        select: {
          id: true,
          sourceCity: true,
          destinationCity: true,
          distanceKm: true,
          estimatedMinutes: true,
          routeStops: {
            orderBy: { stopOrder: 'asc' },
            include: {
              stop: {
                select: { id: true, city: true, stationName: true, landmark: true },
              },
            },
          },
        },
      },
      bus: {
        select: {
          id: true,
          busNumber: true,
          busType: true,
          totalSeats: true,
          deckCount: true,
          amenities: true,
          operator: {
            select: { id: true, name: true, companyName: true },
          },
        },
      },
    },
  });

  if (!trip) {
    throw new AppError('Trip not found', 404);
  }

  // Lazy lock expiration before snapshot retrieval
  await releaseExpiredLocksForTrip(tripId, prisma, now);

  const tripSeats = await prisma.tripSeat.findMany({
    where: { tripId },
    include: {
      seat: {
        select: {
          id: true,
          deck: true,
          row: true,
          column: true,
          seatType: true,
          isAccessible: true,
        },
      },
    },
    orderBy: [
      { seat: { deck: 'asc' } },
      { seat: { row: 'asc' } },
      { seat: { column: 'asc' } },
    ],
  });

  const seats = tripSeats.map((ts) => ({
    tripSeatId: ts.id,
    seatId: ts.seatId,
    seatNumber: ts.seatNumber,
    deck: ts.seat?.deck ?? 1,
    row: ts.seat?.row ?? 1,
    column: ts.seat?.column ?? 1,
    seatType: ts.seat?.seatType ?? 'WINDOW',
    isAccessible: Boolean(ts.seat?.isAccessible),
    price: Number(ts.price),
    status: ts.status,
    lockedUntil: ts.lockedUntil,
  }));

  const summary = seats.reduce(
    (acc, s) => {
      acc.total += 1;
      if (s.status === 'AVAILABLE') acc.available += 1;
      else if (s.status === 'LOCKED') acc.locked += 1;
      else if (s.status === 'BOOKED') acc.booked += 1;
      return acc;
    },
    { total: 0, available: 0, locked: 0, booked: 0 }
  );

  return {
    trip: {
      ...trip,
      baseFare: Number(trip.baseFare),
    },
    seats,
    summary,
  };
}

/**
 * Places a temporary hold (default 10 mins) on selected seats atomically inside a transaction.
 */
async function lockTripSeats(tripId, { seatNumbers, holdMinutes = 10 }, actorUserId, ipAddress) {
  const uniqueSeats = Array.from(new Set(seatNumbers));
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + holdMinutes * 60_000);

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    throw new AppError('Trip not found', 404);
  }
  if (trip.status === 'CANCELLED' || trip.status === 'COMPLETED') {
    throw new AppError(`Cannot lock seats for a ${trip.status} trip`, 400);
  }

  return prisma.$transaction(async (tx) => {
    await releaseExpiredLocksForTrip(tripId, tx, now);

    const matchingSeats = await tx.tripSeat.findMany({
      where: {
        tripId,
        seatNumber: { in: uniqueSeats },
      },
      select: {
        id: true,
        seatNumber: true,
        price: true,
        status: true,
      },
    });

    if (matchingSeats.length !== uniqueSeats.length) {
      const foundSet = new Set(matchingSeats.map((s) => s.seatNumber));
      const missing = uniqueSeats.filter((num) => !foundSet.has(num));
      throw new AppError(`Invalid seat numbers for this bus: ${missing.join(', ')}`, 404);
    }

    // Conditional atomic claim prevents race conditions where another passenger locks/books simultaneously
    const claimResult = await tx.tripSeat.updateMany({
      where: {
        tripId,
        seatNumber: { in: uniqueSeats },
        status: 'AVAILABLE',
      },
      data: {
        status: 'LOCKED',
        lockedUntil,
      },
    });

    if (claimResult.count !== uniqueSeats.length) {
      throw new AppError(
        'One or more selected seats are already booked or held by another passenger.',
        409
      );
    }

    const totalSeatPrice = matchingSeats.reduce((sum, s) => sum + Number(s.price), 0);

    await recordAudit({
      userId: actorUserId,
      action: AUDIT_ACTIONS.SEAT_LOCKED,
      entity: 'Trip',
      entityId: tripId,
      details: {
        seatNumbers: uniqueSeats,
        holdMinutes,
        lockedUntil,
      },
      ipAddress,
      tx,
    });

    return {
      tripId,
      lockedSeats: matchingSeats.map((s) => ({
        tripSeatId: s.id,
        seatNumber: s.seatNumber,
        price: Number(s.price),
      })),
      lockedUntil,
      totalSeatPrice: Number(totalSeatPrice.toFixed(2)),
    };
  });
}

/**
 * Releases held LOCKED seats back to AVAILABLE when a passenger abandons or deselects them.
 */
async function releaseTripSeats(tripId, { seatNumbers }, actorUserId, ipAddress) {
  const uniqueSeats = Array.from(new Set(seatNumbers));

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    throw new AppError('Trip not found', 404);
  }

  return prisma.$transaction(async (tx) => {
    const result = await tx.tripSeat.updateMany({
      where: {
        tripId,
        seatNumber: { in: uniqueSeats },
        status: 'LOCKED',
      },
      data: {
        status: 'AVAILABLE',
        lockedUntil: null,
      },
    });

    await recordAudit({
      userId: actorUserId,
      action: AUDIT_ACTIONS.SEAT_RELEASED,
      entity: 'Trip',
      entityId: tripId,
      details: {
        seatNumbers: uniqueSeats,
        releasedCount: result.count,
      },
      ipAddress,
      tx,
    });

    return {
      tripId,
      releasedCount: result.count,
    };
  });
}

module.exports = {
  releaseExpiredLocksForTrip,
  releaseAllExpiredLocks,
  getLiveTripSeatMap,
  lockTripSeats,
  releaseTripSeats,
};
