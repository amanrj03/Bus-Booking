const { z } = require('zod');

const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  userId: z.string().uuid('Invalid userId UUID format').optional(),
});

module.exports = {
  listAuditLogsQuerySchema,
};
