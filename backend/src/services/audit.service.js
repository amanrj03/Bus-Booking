const prisma = require('../config/prisma');

const AUDIT_ACTIONS = {
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_ROLE_UPDATED: 'USER_ROLE_UPDATED',
  OPERATOR_CREATED: 'OPERATOR_CREATED',
  OPERATOR_UPDATED: 'OPERATOR_UPDATED',
  BUS_CREATED: 'BUS_CREATED',
  BUS_UPDATED: 'BUS_UPDATED',
  ROUTE_CREATED: 'ROUTE_CREATED',
  ROUTE_UPDATED: 'ROUTE_UPDATED',
  TRIP_SCHEDULED: 'TRIP_SCHEDULED',
  TRIP_UPDATED: 'TRIP_UPDATED',
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  SEAT_LOCKED: 'SEAT_LOCKED',
  SEAT_RELEASED: 'SEAT_RELEASED',
};

/**
 * Records an audit trail entry. Supports passing a Prisma transaction client (`tx`)
 * for atomic operations, or falls back to standalone `prisma` with safe error capture.
 *
 * @param {{
 *   userId?: string | null,
 *   action: string,
 *   entity: string,
 *   entityId?: string | null,
 *   details?: object | null,
 *   ipAddress?: string | null,
 *   tx?: object
 * }} params
 */
async function recordAudit({
  userId = null,
  action,
  entity,
  entityId = null,
  details = null,
  ipAddress = null,
  tx = null,
}) {
  const client = tx || prisma;

  const payload = {
    userId,
    action,
    entity,
    entityId,
    details,
    ipAddress,
  };

  if (tx) {
    // Inside a database transaction: let errors propagate for atomic rollback
    return client.auditLog.create({ data: payload });
  }

  // Outside transaction: never crash primary workflow on logging failure
  try {
    return await client.auditLog.create({ data: payload });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`[AuditLog] Non-fatal logging error (${action}):`, error.message);
    return null;
  }
}

/**
 * Retrieves paginated audit logs for Admin inspection
 */
async function listAuditLogs({ page = 1, limit = 25, action, entity, userId }) {
  const where = {};

  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  AUDIT_ACTIONS,
  recordAudit,
  listAuditLogs,
};
