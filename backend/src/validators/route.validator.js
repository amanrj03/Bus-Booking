const { z } = require('zod');

const createStopSchema = z.object({
  city: z.string().trim().min(2, 'City name must be at least 2 characters'),
  stationName: z.string().trim().min(2, 'Station name must be at least 2 characters'),
  landmark: z.string().trim().max(200).optional(),
  address: z.string().trim().max(300).optional(),
});

const listStopsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  city: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

const routeStopItemSchema = z.object({
  stopId: z.string().uuid('Invalid stopId UUID'),
  stopOrder: z.coerce.number().int().min(1, 'stopOrder must be a positive integer starting at 1'),
  durationFromOriginMinutes: z.coerce
    .number()
    .int()
    .min(0, 'durationFromOriginMinutes cannot be negative'),
  distanceFromOriginKm: z.coerce
    .number()
    .min(0, 'distanceFromOriginKm cannot be negative'),
});

const createRouteSchema = z
  .object({
    sourceCity: z.string().trim().min(2, 'Source city must be at least 2 characters'),
    destinationCity: z.string().trim().min(2, 'Destination city must be at least 2 characters'),
    distanceKm: z.coerce.number().positive('Distance must be greater than 0 km'),
    estimatedMinutes: z.coerce.number().int().positive('Estimated duration must be greater than 0 minutes'),
    stops: z.array(routeStopItemSchema).optional(),
  })
  .refine(
    (data) => data.sourceCity.toLowerCase() !== data.destinationCity.toLowerCase(),
    {
      message: 'Source city and destination city must be different',
      path: ['destinationCity'],
    }
  );

const updateRouteSchema = z.object({
  distanceKm: z.coerce.number().positive().optional(),
  estimatedMinutes: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

const setRouteStopsSchema = z.object({
  stops: z
    .array(routeStopItemSchema)
    .min(1, 'At least one stop is required to define a route sequence'),
});

const listRoutesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sourceCity: z.string().trim().optional(),
  destinationCity: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

module.exports = {
  createStopSchema,
  listStopsQuerySchema,
  routeStopItemSchema,
  createRouteSchema,
  updateRouteSchema,
  setRouteStopsSchema,
  listRoutesQuerySchema,
};
