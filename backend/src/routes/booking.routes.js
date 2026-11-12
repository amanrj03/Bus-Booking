const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validate');
const bookingController = require('../controllers/booking.controller');
const {
  createBookingSchema,
  listBookingsQuerySchema,
  cancelBookingSchema,
} = require('../validators/booking.validator');

const router = express.Router();

// Authenticated passenger booking history
router.get(
  '/my',
  authenticate,
  validateRequest(listBookingsQuerySchema, 'query'),
  bookingController.listMyBookings
);

// Public / guest e-ticket lookup by PNR
router.get('/pnr/:pnr', optionalAuthenticate, bookingController.getBookingByPnr);

// Cancellation quote preview by PNR
router.get(
  '/pnr/:pnr/cancel-quote',
  optionalAuthenticate,
  bookingController.getCancellationQuote
);

// Cancel booking by PNR
router.post(
  '/pnr/:pnr/cancel',
  optionalAuthenticate,
  validateRequest(cancelBookingSchema),
  bookingController.cancelBooking
);

// Cancellation quote preview by Booking UUID
router.get('/:id/cancel-quote', optionalAuthenticate, bookingController.getCancellationQuote);

// Cancel booking by Booking UUID
router.post(
  '/:id/cancel',
  optionalAuthenticate,
  validateRequest(cancelBookingSchema),
  bookingController.cancelBooking
);

// Create booking atomically with FOR UPDATE row locks, BookingSeats & simulated Payment
router.post(
  '/',
  optionalAuthenticate,
  validateRequest(createBookingSchema),
  bookingController.createBooking
);

module.exports = router;
