const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { generateBusSeats } = require('../utils/seatGenerator');
const { recordAudit, AUDIT_ACTIONS } = require('./audit.service');

/**
 * Lists operators with server-side pagination and fleet counts
 */
async function listOperators({ page = 1, limit = 20, search, isActive }) {
  const where = {};

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactEmail: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [operators, total] = await Promise.all([
    prisma.operator.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { buses: true },
        },
      },
    }),
    prisma.operator.count({ where }),
  ]);

  return {
    operators,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Creates a new bus operator
 */
async function createOperator(data, actorUserId, ipAddress) {
  if (data.userId) {
    const userExists = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!userExists) {
      throw new AppError('Referenced user account does not exist', 404);
    }
  }

  const operator = await prisma.operator.create({
    data: {
      name: data.name,
      companyName: data.companyName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      userId: data.userId || null,
      logoUrl: data.logoUrl || null,
    },
  });

  await recordAudit({
    userId: actorUserId,
    action: AUDIT_ACTIONS.OPERATOR_CREATED,
    entity: 'Operator',
    entityId: operator.id,
    details: { name: operator.name, companyName: operator.companyName },
    ipAddress,
  });

  return operator;
}

/**
 * Updates an operator's details or active status
 */
async function updateOperator(operatorId, data, actorUserId, ipAddress) {
  const existing = await prisma.operator.findUnique({ where: { id: operatorId } });
  if (!existing) {
    throw new AppError('Operator not found', 404);
  }

  const updated = await prisma.operator.update({
    where: { id: operatorId },
    data,
  });

  await recordAudit({
    userId: actorUserId,
    action: AUDIT_ACTIONS.OPERATOR_UPDATED,
    entity: 'Operator',
    entityId: updated.id,
    details: { updatedFields: Object.keys(data) },
    ipAddress,
  });

  return updated;
}

/**
 * Lists buses with pagination and operator scoping
 */
async function listBuses({ page = 1, limit = 20, operatorId, busType, search, isActive }, userContext) {
  const where = {};

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  if (busType) {
    where.busType = busType;
  }

  // If authenticated user is an OPERATOR, scope fleet view to their operator profile
  if (userContext && userContext.role === 'OPERATOR') {
    const op = await prisma.operator.findUnique({ where: { userId: userContext.userId } });
    if (!op) {
      return {
        buses: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }
    where.operatorId = op.id;
  } else if (operatorId) {
    where.operatorId = operatorId;
  }

  if (search) {
    where.busNumber = { contains: search, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;

  const [buses, total] = await Promise.all([
    prisma.bus.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        _count: {
          select: { seats: true, trips: true },
        },
      },
    }),
    prisma.bus.count({ where }),
  ]);

  return {
    buses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Retrieves a single bus with its complete physical seat layout
 */
async function getBusWithSeats(busId) {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: {
      operator: {
        select: { id: true, name: true, companyName: true },
      },
      seats: {
        orderBy: [{ deck: 'asc' }, { row: 'asc' }, { column: 'asc' }],
      },
    },
  });

  if (!bus) {
    throw new AppError('Bus vehicle not found', 404);
  }

  return bus;
}

/**
 * Registers a bus and generates its physical seat inventory atomically
 */
async function createBusWithSeats(data, actorUserId, ipAddress) {
  const operator = await prisma.operator.findUnique({ where: { id: data.operatorId } });
  if (!operator) {
    throw new AppError('Operator not found', 404);
  }

  const duplicateBus = await prisma.bus.findUnique({ where: { busNumber: data.busNumber } });
  if (duplicateBus) {
    throw new AppError(`Bus with registration number ${data.busNumber} already exists`, 409);
  }

  const deckCount = data.busType === 'AC_SLEEPER_2X1' ? 2 : 1;
  const rows = data.rows || (data.busType === 'AC_SLEEPER_2X1' ? 6 : 10);
  const seatsPerRow = data.busType === 'AC_SLEEPER_2X1' ? 3 : 4;
  const totalSeats = deckCount * rows * seatsPerRow;

  const defaultAmenities = {
    wifi: true,
    chargingPort: true,
    waterBottle: data.busType.startsWith('AC'),
    blanket: data.busType === 'AC_SLEEPER_2X1',
    gpsTracking: true,
  };

  const result = await prisma.$transaction(async (tx) => {
    const bus = await tx.bus.create({
      data: {
        operatorId: data.operatorId,
        busNumber: data.busNumber,
        busType: data.busType,
        totalSeats,
        deckCount,
        amenities: data.amenities || defaultAmenities,
      },
    });

    const seatTemplates = generateBusSeats(bus.id, data.busType, data.rows);
    await tx.seat.createMany({ data: seatTemplates });

    await recordAudit({
      userId: actorUserId,
      action: AUDIT_ACTIONS.BUS_CREATED,
      entity: 'Bus',
      entityId: bus.id,
      details: {
        busNumber: bus.busNumber,
        busType: bus.busType,
        totalSeats,
        operatorId: bus.operatorId,
      },
      ipAddress,
      tx,
    });

    return {
      ...bus,
      seatsGenerated: seatTemplates.length,
    };
  });

  return result;
}

/**
 * Updates vehicle metadata with operator ownership check
 */
async function updateBus(busId, data, actorUserId, ipAddress, userContext) {
  const existing = await prisma.bus.findUnique({
    where: { id: busId },
    include: {
      operator: {
        select: { userId: true },
      },
    },
  });

  if (!existing) {
    throw new AppError('Bus vehicle not found', 404);
  }

  // Enforce ownership if modified by OPERATOR
  if (
    userContext &&
    userContext.role === 'OPERATOR' &&
    existing.operator?.userId !== userContext.userId
  ) {
    throw new AppError('Access forbidden. You can only manage vehicles assigned to your operator.', 403);
  }

  const updated = await prisma.bus.update({
    where: { id: busId },
    data,
  });

  await recordAudit({
    userId: actorUserId,
    action: AUDIT_ACTIONS.BUS_UPDATED,
    entity: 'Bus',
    entityId: updated.id,
    details: { busNumber: updated.busNumber, updatedFields: Object.keys(data) },
    ipAddress,
  });

  return updated;
}

module.exports = {
  listOperators,
  createOperator,
  updateOperator,
  listBuses,
  getBusWithSeats,
  createBusWithSeats,
  updateBus,
};
