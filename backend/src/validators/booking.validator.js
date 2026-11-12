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

module.exports = {
  bookingPassengerSchema,
  createBookingSchema,
};
