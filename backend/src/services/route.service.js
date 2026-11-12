const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { recordAudit, AUDIT_ACTIONS } = require('./audit.service');

/**
 * Validates that a list of route stops has sequential ordering (1..N),
 * unique stops, monotonic duration/distance offsets, and existing Stop records.
 *
 * @param {Array<{
 *   stopId: string,
 *   stopOrder: number,
 *   durationFromOriginMinutes: number,
 *   distanceFromOriginKm: number
 * }>} stops
 */
async function validateStopSequence(stops) {
  if (!Array.isArray(stops) || stops.length === 0) {
    return [];
  }

  const sorted = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
  const seenStopIds = new Set();

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const expectedOrder = i + 1;

    if (current.stopOrder !== expectedOrder) {
      throw new AppError(
        `Invalid stopOrder sequence: expected order ${expectedOrder} without gaps or duplicates, got ${current.stopOrder}`,
        400
      );
    }

    if (seenStopIds.has(current.stopId)) {
      throw new AppError(`Duplicate stopId ${current.stopId} is not allowed in the same route sequence`, 400);
    }
    seenStopIds.add(current.stopId);

    if (i > 0) {
      const prev = sorted[i - 1];
      if (current.durationFromOriginMinutes < prev.durationFromOriginMinutes) {
        throw new AppError(
          `Stop ${current.stopOrder} durationFromOriginMinutes (${current.durationFromOriginMinutes}) cannot be less than previous stop (${prev.durationFromOriginMinutes})`,
          400
        );
      }
      if (Number(current.distanceFromOriginKm) < Number(prev.distanceFromOriginKm)) {
        throw new AppError(
          `Stop ${current.stopOrder} distanceFromOriginKm (${current.distanceFromOriginKm}) cannot be less than previous stop (${prev.distanceFromOriginKm})`,
          400
        );
      }
    }
  }

  const stopIds = sorted.map((s) => s.stopId);
  const existingStops = await prisma.stop.findMany({
    where: { id: { in: stopIds } },
    select: { id: true },
  });

  if (existingStops.length !== stopIds.length) {
    const foundIds = new Set(existingStops.map((s) => s.id));
    const missing = stopIds.filter((id) => !foundIds.has(id));
    throw new AppError(`Referenced stops do not exist: ${missing.join(', ')}`, 404);
  }

  return sorted;
}

/**
 * Lists boarding/dropping stops with pagination and optional city/search filter
 */
async function listStops({ page = 1, limit = 50, city, search }) {
  const where = {};

  if (city) {
    where.city = { equals: city, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { city: { contains: search, mode: 'insensitive' } },
      { stationName: { contains: search, mode: 'insensitive' } },
      { landmark: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [stops, total] = await Promise.all([
    prisma.stop.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ city: 'asc' }, { stationName: 'asc' }],
    }),
    prisma.stop.count({ where }),
  ]);

  return {
    stops,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Creates a physical boarding/dropping stop
 */
async function createStop(data) {
  return prisma.stop.create({
    data: {
      city: data.city,
      stationName: data.stationName,
      landmark: data.landmark || null,
      address: data.address || null,
    },
  });
}

/**
 * Lists routes with ordered stops and trip counts
 */
async function listRoutes({ page = 1, limit = 20, sourceCity, destinationCity, isActive }) {
  const where = {};

  if (sourceCity) {
    where.sourceCity = { contains: sourceCity, mode: 'insensitive' };
  }
  if (destinationCity) {
    where.destinationCity = { contains: destinationCity, mode: 'insensitive' };
  }
  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  const skip = (page - 1) * limit;

  const [routes, total] = await Promise.all([
    prisma.route.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ sourceCity: 'asc' }, { destinationCity: 'asc' }],
      include: {
        routeStops: {
          orderBy: { stopOrder: 'asc' },
          include: {
            stop: true,
          },
        },
        _count: {
          select: { trips: true },
        },
      },
    }),
    prisma.route.count({ where }),
  ]);

  return {
    routes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Retrieves a single route with ordered stops
 */
async function getRouteById(routeId) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      routeStops: {
        orderBy: { stopOrder: 'asc' },
        include: {
          stop: true,
        },
      },
      _count: {
        select: { trips: true },
      },
    },
  });

  if (!route) {
    throw new AppError('Route not found', 404);
  }

  return route;
}

/**
 * Creates a route and optionally sequences its initial boarding/dropping stops atomically
 */
async function createRoute(data, actorUserId, ipAddress) {
  const existing = await prisma.route.findFirst({
    where: {
      sourceCity: { equals: data.sourceCity, mode: 'insensitive' },
      destinationCity: { equals: data.destinationCity, mode: 'insensitive' },
    },
  });

  if (existing) {
    throw new AppError(
      `Route from ${data.sourceCity} to ${data.destinationCity} already exists`,
      409
    );
  }

  const orderedStops =
    data.stops && data.stops.length > 0 ? await validateStopSequence(data.stops) : [];

  const route = await prisma.$transaction(async (tx) => {
    const createdRoute = await tx.route.create({
      data: {
        sourceCity: data.sourceCity,
        destinationCity: data.destinationCity,
        distanceKm: data.distanceKm,
        estimatedMinutes: data.estimatedMinutes,
      },
    });

    if (orderedStops.length > 0) {
      await tx.routeStop.createMany({
        data: orderedStops.map((s) => ({
          routeId: createdRoute.id,
          stopId: s.stopId,
          stopOrder: s.stopOrder,
          durationFromOriginMinutes: s.durationFromOriginMinutes,
          distanceFromOriginKm: s.distanceFromOriginKm,
        })),
      });
    }

    await recordAudit({
      userId: actorUserId,
      action: AUDIT_ACTIONS.ROUTE_CREATED,
      entity: 'Route',
      entityId: createdRoute.id,
      details: {
        sourceCity: createdRoute.sourceCity,
        destinationCity: createdRoute.destinationCity,
        stopCount: orderedStops.length,
      },
      ipAddress,
      tx,
    });

    return {
      ...createdRoute,
      stopsConfigured: orderedStops.length,
    };
  });

  return route;
}

/**
 * Updates route distance, estimated duration, or active status
 */
async function updateRoute(routeId, data, actorUserId, ipAddress) {
  const existing = await prisma.route.findUnique({ where: { id: routeId } });
  if (!existing) {
    throw new AppError('Route not found', 404);
  }

  const updated = await prisma.route.update({
    where: { id: routeId },
    data,
  });

  await recordAudit({
    userId: actorUserId,
    action: AUDIT_ACTIONS.ROUTE_UPDATED,
    entity: 'Route',
    entityId: updated.id,
    details: { updatedFields: Object.keys(data) },
    ipAddress,
  });

  return updated;
}

/**
 * Atomically replaces the ordered stop sequence for an existing route
 */
async function replaceRouteStops(routeId, stops, actorUserId, ipAddress) {
  const existing = await prisma.route.findUnique({ where: { id: routeId } });
  if (!existing) {
    throw new AppError('Route not found', 404);
  }

  const orderedStops = await validateStopSequence(stops);

  const result = await prisma.$transaction(async (tx) => {
    await tx.routeStop.deleteMany({ where: { routeId } });

    await tx.routeStop.createMany({
      data: orderedStops.map((s) => ({
        routeId,
        stopId: s.stopId,
        stopOrder: s.stopOrder,
        durationFromOriginMinutes: s.durationFromOriginMinutes,
        distanceFromOriginKm: s.distanceFromOriginKm,
      })),
    });

    await recordAudit({
      userId: actorUserId,
      action: AUDIT_ACTIONS.ROUTE_UPDATED,
      entity: 'Route',
      entityId: routeId,
      details: {
        action: 'STOPS_RESEQUENCED',
        stopCount: orderedStops.length,
      },
      ipAddress,
      tx,
    });

    return orderedStops;
  });

  return {
    routeId,
    routeStops: result,
  };
}

module.exports = {
  validateStopSequence,
  listStops,
  createStop,
  listRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  replaceRouteStops,
};
