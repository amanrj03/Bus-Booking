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

const DEPARTURE_WINDOWS = {
  MORNING: { startHour: 5, endHour: 11 }, // 05:00 - 11:59
  AFTERNOON: { startHour: 12, endHour: 16 }, // 12:00 - 16:59
  EVENING: { startHour: 17, endHour: 20 }, // 17:00 - 20:59
  NIGHT: { startHour: 21, endHour: 4 }, // 21:00 - 04:59
};

/**
 * Checks whether a departure timestamp (UTC hour) falls into the selected time-of-day window.
 */
function matchesDepartureWindow(departureTime, windowName) {
  if (!windowName || !DEPARTURE_WINDOWS[windowName]) {
    return true;
  }
  const hour = new Date(departureTime).getUTCHours();
  const { startHour, endHour } = DEPARTURE_WINDOWS[windowName];
  if (startHour <= endHour) {
    return hour >= startHour && hour <= endHour;
  }
  // Wraps past midnight (e.g. NIGHT: 21..23 or 0..4)
  return hour >= startHour || hour <= endHour;
}

/**
 * Builds Prisma where-clause for public trip search with city, date, bus type, operator, and price filters.
 */
function buildTripSearchWhere(query, now = new Date()) {
  const { sourceCity, destinationCity, date, minPrice, maxPrice, busType, operatorId } = query;

  const where = {
    status: 'SCHEDULED',
  };

  // Route matching
  const routeWhere = { isActive: true };
  if (sourceCity) {
    routeWhere.sourceCity = { contains: sourceCity, mode: 'insensitive' };
  }
  if (destinationCity) {
    routeWhere.destinationCity = { contains: destinationCity, mode: 'insensitive' };
  }
  where.route = routeWhere;

  // Bus / Operator filters
  const busWhere = { isActive: true };
  if (busType) {
    busWhere.busType = busType;
  }
  if (operatorId) {
    busWhere.operatorId = operatorId;
  }
  where.bus = busWhere;

  // Date window matching
  if (date) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    where.departureTime = { gte: startOfDay, lte: endOfDay };
  } else {
    where.departureTime = { gte: now };
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.baseFare = {};
    if (minPrice !== undefined) where.baseFare.gte = minPrice;
    if (maxPrice !== undefined) where.baseFare.lte = maxPrice;
  }

  return where;
}

/**
 * Maps public search sort keys to Prisma orderBy objects.
 */
function getTripSearchOrderBy(sortBy) {
  switch (sortBy) {
    case 'departure_desc':
      return { departureTime: 'desc' };
    case 'price_asc':
      return { baseFare: 'asc' };
    case 'price_desc':
      return { baseFare: 'desc' };
    case 'duration_asc':
      return { route: { estimatedMinutes: 'asc' } };
    case 'departure_asc':
    default:
      return { departureTime: 'asc' };
  }
}

/**
 * Public trip search supporting Indian city-pair queries, travel date, INR price bounds,
 * bus type, operator, departure time windows, and pagination.
 */
async function searchPublicTrips(query) {
  const { page = 1, limit = 15, departureWindow, sortBy = 'departure_asc' } = query;
  const now = new Date();
  const where = buildTripSearchWhere(query, now);
  const orderBy = getTripSearchOrderBy(sortBy);

  const include = {
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
          select: { id: true, name: true, companyName: true, logoUrl: true },
        },
      },
    },
    tripSeats: {
      select: { status: true, lockedUntil: true, price: true },
    },
  };

  // If departureWindow is requested, fetch matching corridor trips and paginate after time-of-day filtering
  const skip = departureWindow ? 0 : (page - 1) * limit;
  const take = departureWindow ? undefined : limit;

  const [rawTrips, dbTotal] = await Promise.all([
    prisma.trip.findMany({
      where,
      skip,
      take,
      orderBy,
      include,
    }),
    departureWindow ? Promise.resolve(0) : prisma.trip.count({ where }),
  ]);

  const formattedAll = rawTrips
    .filter((trip) => matchesDepartureWindow(trip.departureTime, departureWindow))
    .map((trip) => {
      const seats = trip.tripSeats || [];
      const availableSeats = seats.filter(
        (s) =>
          s.status === 'AVAILABLE' ||
          (s.status === 'LOCKED' && s.lockedUntil && new Date(s.lockedUntil) <= now)
      );
      const minSeatPrice =
        seats.length > 0
          ? Math.min(...seats.map((s) => Number(s.price)))
          : Number(trip.baseFare);

      const { tripSeats: _omitSeats, ...tripCore } = trip;
      return {
        ...tripCore,
        baseFare: Number(trip.baseFare),
        availableSeatsCount: availableSeats.length,
        minSeatPrice,
      };
    });

  const total = departureWindow ? formattedAll.length : dbTotal;
  const trips = departureWindow
    ? formattedAll.slice((page - 1) * limit, page * limit)
    : formattedAll;

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
 * Public overview of a scheduled trip including ordered route stops and live availability count.
 */
async function getPublicTripById(tripId) {
  const now = new Date();
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
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
          id: true,
          busNumber: true,
          busType: true,
          totalSeats: true,
          deckCount: true,
          amenities: true,
          operator: {
            select: { id: true, name: true, companyName: true, logoUrl: true },
          },
        },
      },
      tripSeats: {
        select: { status: true, lockedUntil: true, price: true },
      },
    },
  });

  if (!trip) {
    throw new AppError('Trip not found', 404);
  }

  const seats = trip.tripSeats || [];
  const availableSeatsCount = seats.filter(
    (s) =>
      s.status === 'AVAILABLE' ||
      (s.status === 'LOCKED' && s.lockedUntil && new Date(s.lockedUntil) <= now)
  ).length;

  const { tripSeats: _omitSeats, ...tripCore } = trip;

  return {
    ...tripCore,
    baseFare: Number(trip.baseFare),
    availableSeatsCount,
  };
}

module.exports = {
  listTripsForManagement,
  scheduleTrip,
  updateTrip,
  buildTripSearchWhere,
  getTripSearchOrderBy,
  matchesDepartureWindow,
  searchPublicTrips,
  getPublicTripById,
};
