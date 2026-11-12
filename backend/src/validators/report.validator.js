const { z } = require('zod');

const manifestParamsSchema = z.object({
  tripId: z.string().uuid('Invalid tripId UUID format'),
});

const manifestQuerySchema = z.object({
  tripId: z.string().uuid('Invalid tripId UUID format').optional(),
  includeCancelled: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => v === true || v === 'true')
    .default(false),
});

const occupancyQuerySchema = z.object({
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be in YYYY-MM-DD format')
    .optional(),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate must be in YYYY-MM-DD format')
    .optional(),
  routeId: z.string().uuid('Invalid routeId UUID').optional(),
  operatorId: z.string().uuid('Invalid operatorId UUID').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const revenueQuerySchema = z.object({
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be in YYYY-MM-DD format')
    .optional(),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate must be in YYYY-MM-DD format')
    .optional(),
  routeId: z.string().uuid('Invalid routeId UUID').optional(),
  operatorId: z.string().uuid('Invalid operatorId UUID').optional(),
});

module.exports = {
  manifestParamsSchema,
  manifestQuerySchema,
  occupancyQuerySchema,
  revenueQuerySchema,
};
