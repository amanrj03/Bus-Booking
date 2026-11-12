const { z } = require('zod');

const createOperatorSchema = z.object({
  name: z.string().trim().min(2, 'Operator name must be at least 2 characters'),
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters'),
  contactEmail: z.string().trim().toLowerCase().email('Invalid contact email'),
  contactPhone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Contact phone must be a valid 10-digit Indian mobile number'),
  userId: z.string().uuid('Invalid userId UUID').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
});

const updateOperatorSchema = createOperatorSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

const listOperatorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

const createBusSchema = z.object({
  operatorId: z.string().uuid('Invalid operatorId UUID'),
  busNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, 'Bus registration number must be at least 4 characters')
    .max(20),
  busType: z.enum(['AC_SLEEPER_2X1', 'AC_SEATER_2X2', 'NON_AC_SEATER_2X2']),
  rows: z.coerce.number().int().min(4).max(15).optional(),
  amenities: z
    .object({
      wifi: z.boolean().optional(),
      chargingPort: z.boolean().optional(),
      waterBottle: z.boolean().optional(),
      blanket: z.boolean().optional(),
      gpsTracking: z.boolean().optional(),
    })
    .optional(),
});

const updateBusSchema = z.object({
  operatorId: z.string().uuid().optional(),
  busType: z.enum(['AC_SLEEPER_2X1', 'AC_SEATER_2X2', 'NON_AC_SEATER_2X2']).optional(),
  amenities: z.record(z.string(), z.boolean()).optional(),
  isActive: z.boolean().optional(),
});

const listBusesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  operatorId: z.string().uuid().optional(),
  busType: z.enum(['AC_SLEEPER_2X1', 'AC_SEATER_2X2', 'NON_AC_SEATER_2X2']).optional(),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

module.exports = {
  createOperatorSchema,
  updateOperatorSchema,
  listOperatorsQuerySchema,
  createBusSchema,
  updateBusSchema,
  listBusesQuerySchema,
};
