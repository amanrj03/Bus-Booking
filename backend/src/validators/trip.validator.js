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

module.exports = {
  scheduleTripSchema,
  updateTripSchema,
  listAdminTripsQuerySchema,
};
