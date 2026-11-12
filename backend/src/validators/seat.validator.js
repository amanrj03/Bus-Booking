const { z } = require('zod');

const seatNumberArraySchema = z
  .array(z.string().trim().toUpperCase().min(1).max(10))
  .min(1, 'Select at least 1 seat')
  .max(6, 'Maximum 6 seats can be selected per booking');

const lockSeatsSchema = z.object({
  seatNumbers: seatNumberArraySchema,
  holdMinutes: z.coerce.number().int().min(1).max(15).default(10),
});

const releaseSeatsSchema = z.object({
  seatNumbers: seatNumberArraySchema,
});

module.exports = {
  lockSeatsSchema,
  releaseSeatsSchema,
};
