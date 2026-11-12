const { z } = require('zod');

const bookingPassengerSchema = z.object({
  fullName: z.string().trim().min(2, 'Passenger full name must be at least 2 characters').max(100),
  age: z.coerce.number().int().min(1, 'Age must be at least 1').max(120, 'Invalid passenger age'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  seatNumber: z.string().trim().toUpperCase().min(1, 'Seat number is required').max(10),
});

const createBookingSchema = z
  .object({
    tripId: z.string().uuid('Invalid tripId UUID'),
    contactEmail: z.string().trim().toLowerCase().email('Valid contact email is required'),
    contactPhone: z
      .string()
      .trim()
      .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Contact phone must be a valid 10-digit Indian mobile number'),
    passengers: z
      .array(bookingPassengerSchema)
      .min(1, 'At least 1 passenger is required')
      .max(6, 'Maximum 6 passengers allowed per booking'),
    holdExpiresAt: z.string().datetime().optional(),
    paymentMethod: z
      .enum(['UPI', 'NET_BANKING', 'DEBIT_CARD', 'CREDIT_CARD', 'WALLET'])
      .default('UPI'),
    paymentDetails: z
      .object({
        upiId: z.string().trim().max(80).optional(),
        cardLast4: z.string().trim().regex(/^\d{4}$/).optional(),
        bankName: z.string().trim().max(60).optional(),
        walletProvider: z.string().trim().max(40).optional(),
        simulateFailure: z.boolean().default(false),
      })
      .optional(),
    addons: z
      .object({
        extraBaggage: z.boolean().default(false),
        travelInsurance: z.boolean().default(false),
      })
      .optional(),
  })
  .refine(
    (data) => {
      const seatSet = new Set(data.passengers.map((p) => p.seatNumber));
      return seatSet.size === data.passengers.length;
    },
    {
      message: 'Each passenger must be assigned a unique seatNumber',
      path: ['passengers'],
    }
  );

const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['CONFIRMED', 'CANCELLED']).optional(),
});

const cancelBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Cancellation reason must be at least 3 characters')
    .max(250, 'Cancellation reason cannot exceed 250 characters')
    .optional()
    .default('Passenger requested cancellation'),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Valid contact email is required')
    .optional(),
  contactPhone: z.string().trim().optional(),
});

module.exports = {
  bookingPassengerSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  cancelBookingSchema,
};
