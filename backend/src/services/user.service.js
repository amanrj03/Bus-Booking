const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

/**
 * Lists users with server-side pagination and optional role/search filters
 */
async function listUsers({ page = 1, limit = 20, role, search }) {
  const where = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        operator: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Updates a user's RBAC role (Admin only)
 */
async function updateUserRole(userId, newRole) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      updatedAt: true,
    },
  });

  return updated;
}

module.exports = {
  listUsers,
  updateUserRole,
};
