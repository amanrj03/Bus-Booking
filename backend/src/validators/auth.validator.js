const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

const googleAuthSchema = z.object({
  credential: z.string().optional(),
  email: z
    .string({ required_error: 'Google email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  name: z.string().trim().min(1).default('Google Passenger'),
  picture: z.string().url().optional().or(z.literal('')),
  sub: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleAuthSchema,
};
