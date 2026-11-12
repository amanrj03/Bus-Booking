const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { buildTripSeatInventory, calculateSeatPrice } = require('../utils/tripPricing');
const { recordAudit, AUDIT_ACTIONS } = require('./audit.service');

/**
 * Lists scheduled/active trips for ADMIN and OPERATOR management dashboards.
 * Operators are automatically scoped to vehicles under their Operator profile.
 */
async function listTripsForManagement(
  { page = 1, limit = 20, routeId, busId, operatorId, status, fromDate, toDate },
  userContext
) {
  const where = {};

  if (routeId) where.routeId = routeId;
  if (busId) where.busId = busId;
  if (status) where.status = status;

  if (fromDate || toDate) {
    where.departureTime = {};
    if (fromDate) where.departureTime.gte = fromDate;
    if (toDate) where.departureTime.lte = toDate;
  }

  if (userContext && userContext.role === 'OPERATOR') {
    where.bus = {
      operator: {
        userId: userContext.userId,
      },
    };
  } else if (operatorId) {
    where.bus = { operatorId };
  }

  const skip = (page - 1) * limit;

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      skip,
      take: limit,
      orderBy: { departureTime: 'asc' },
      include: {
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true,
            distanceKm: true,
            estimatedMinutes: true,
          },
        },
        bus: {
          select: {
            id: true,
            busNumber: true,
            busType: true,
            totalSeats: true,
            operator: {
              select: { id: true, name: true, companyName: true },
            },
          },
        },
        _count: {
          select: { tripSeats: true, bookings: true },
        },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  return {
    trips,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Schedules a new trip and atomically generates TripSeat inventory for all physical seats of the bus.
 */
async function scheduleTrip(data, actorUserId, ipAddress, userContext) {
  const route = await prisma.route.findUnique({ where: { id: data.routeId } });
  if (!route) {
    throw new AppError('Route not found', 404);
  }
  if (route.isActive === false) {
    throw new AppError('Cannot schedule trip on an inactive route', 400);
  }

  const bus = await prisma.bus.findUnique({
    where: { id: data.busId },
    include: {
      operator: {
        select: { id: true, userId: true, name: true, isActive: true },
      },
      seats: {
        orderBy: [{ deck: 'asc' }, { row: 'asc' }, { column: 'asc' }],
      },
    },
  });

  if (!bus) {
    throw new AppError('Bus vehicle not found', 404);
  }
  if (bus.isActive === false) {
    throw new AppError('Cannot schedule trip with an inactive bus', 400);
  }

  if (
    userContext &&
    userContext.role === 'OPERATOR' &&
    bus.operator?.userId !== userContext.userId
  ) {
    throw new AppError(
      'Access forbidden. Operators can only schedule trips for their own vehicles.',
      403
    );
  }

  if (!bus.seats || bus.seats.length === 0) {
    throw new AppError('Bus has no configured physical seats for inventory creation', 400);
  }

  const departureTime = new Date(data.departureTime);
  const arrivalTime = data.arrivalTime
    ? new Date(data.arrivalTime)
    : new Date(departureTime.getTime() + route.estimatedMinutes * 60_000);

  if (arrivalTime <= departureTime) {
    throw new AppError('arrivalTime must be strictly after departureTime', 400);
  }

  // Prevent double-booking the same bus across overlapping time windows
  const overlappingTrip = await prisma.trip.findFirst({
    where: {
      busId: data.busId,
      status: { not: 'CANCELLED' },
      departureTime: { lt: arrivalTime },
      arrivalTime: { gt: departureTime },
    },
  });

  if (overlappingTrip) {
    throw new AppError(
      `Bus ${bus.busNumber} is already scheduled on an overlapping time window`,
      409
    );
  }

  const trip = await prisma.$transaction(async (tx) => {
    const createdTrip = await tx.trip.create({
      data: {
        routeId: data.routeId,
        busId: data.busId,
        departureTime,
        arrivalTime,
        baseFare: data.baseFare,
        status: 'SCHEDULED',
      },
    });

    const tripSeatInventory = buildTripSeatInventory(
      createdTrip.id,
      bus.seats,
      data.baseFare
    );

    await tx.tripSeat.createMany({ data: tripSeatInventory });

    await recordAudit({
      userId: actorUserId,
      action: AUDIT_ACTIONS.TRIP_SCHEDULED,
      entity: 'Trip',
      entityId: createdTrip.id,
      details: {
        routeId: createdTrip.routeId,
        busId: createdTrip.busId,
        busNumber: bus.busNumber,
        departureTime: createdTrip.departureTime,
        arrivalTime: createdTrip.arrivalTime,
        baseFare: data.baseFare,
        tripSeatsGenerated: tripSeatInventory.length,
      },
      ipAddress,
      tx,
    });

    return {
      ...createdTrip,
      tripSeatsGenerated: tripSeatInventory.length,
    };
  });

  return trip;
}

/**
 * Updates trip timing, status, or baseFare (repricing AVAILABLE seats atomically when baseFare changes).
 */
async function updateTrip(tripId, data, actorUserId, ipAddress, userContext) {
  const existing = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      bus: {
        include: {
          operator: { select: { userId: true } },
        },
      },
    },
  });

  if (!existing) {
    throw new AppError('Trip not found', 404);
  }

  if (
    userContext &&
    userContext.role === 'OPERATOR' &&
    existing.bus?.operator?.userId !== userContext.userId
  ) {
    throw new AppError(
      'Access forbidden. Operators can only update trips assigned to their own vehicles.',
      403
    );
  }

  const nextDeparture = data.departureTime ? new Date(data.departureTime) : existing.departureTime;
  const nextArrival = data.arrivalTime ? new Date(data.arrivalTime) : existing.arrivalTime;
  if (nextArrival <= nextDeparture) {
    throw new AppError('arrivalTime must be strictly after departureTime', 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data,
    });

    if (typeof data.baseFare === 'number') {
      const availableSeats = await tx.tripSeat.findMany({
        where: { tripId, status: 'AVAILABLE' },
        include: { seat: { select: { seatType: true } } },
      });

      await Promise.all(
        availableSeats.map((ts) =>
          tx.tripSeat.update({
            where: { id: ts.id },
            data: { price: calculateSeatPrice(data.baseFare, ts.seat?.seatType) },
          })
        )
      );
    }

    await recordAudit({
      userId: actorUserId,
      action: AUDIT_ACTIONS.TRIP_UPDATED,
      entity: 'Trip',
      entityId: updatedTrip.id,
      details: { updatedFields: Object.keys(data) },
      ipAddress,
      tx,
    });

    return updatedTrip;
  });

  return updated;
}

module.exports = {
  listTripsForManagement,
  scheduleTrip,
  updateTrip,
};
