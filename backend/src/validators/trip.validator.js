const { z } = require('zod');

const scheduleTripSchema = z
  .object({
    routeId: z.string().uuid('Invalid routeId UUID'),
    busId: z.string().uuid('Invalid busId UUID'),
    departureTime: z.coerce.date({ message: 'Valid departureTime ISO date is required' }),
    arrivalTime: z.coerce.date().optional(),
    baseFare: z.coerce.number().positive('Base fare must be greater than ₹0'),
  })
  .refine(
    (data) => !data.arrivalTime || data.arrivalTime > data.departureTime,
    {
      message: 'arrivalTime must be strictly after departureTime',
      path: ['arrivalTime'],
    }
  );

const updateTripSchema = z.object({
  departureTime: z.coerce.date().optional(),
  arrivalTime: z.coerce.date().optional(),
  baseFare: z.coerce.number().positive('Base fare must be greater than ₹0').optional(),
  status: z.enum(['SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED']).optional(),
});

const listAdminTripsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  routeId: z.string().uuid().optional(),
  busId: z.string().uuid().optional(),
  operatorId: z.string().uuid().optional(),
  status: z.enum(['SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED']).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

const searchTripsQuerySchema = z
  .object({
    sourceCity: z.string().trim().min(1).optional(),
    destinationCity: z.string().trim().min(1).optional(),
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format')
      .optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().positive().optional(),
    busType: z.enum(['AC_SLEEPER_2X1', 'AC_SEATER_2X2', 'NON_AC_SEATER_2X2']).optional(),
    operatorId: z.string().uuid('Invalid operatorId UUID').optional(),
    departureWindow: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT']).optional(),
    sortBy: z
      .enum(['departure_asc', 'departure_desc', 'price_asc', 'price_desc', 'duration_asc'])
      .default('departure_asc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(15),
  })
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: 'minPrice cannot exceed maxPrice',
      path: ['maxPrice'],
    }
  );

module.exports = {
  scheduleTripSchema,
  updateTripSchema,
  listAdminTripsQuerySchema,
  searchTripsQuerySchema,
};
