const { z } = require('zod');

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['ADMIN', 'OPERATOR', 'PASSENGER']).optional(),
  search: z.string().trim().optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'OPERATOR', 'PASSENGER'], {
    required_error: 'Role must be ADMIN, OPERATOR, or PASSENGER',
  }),
});

module.exports = {
  listUsersQuerySchema,
  updateRoleSchema,
};
