const express = require('express');
const { optionalAuthenticate } = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validate');
const bookingController = require('../controllers/booking.controller');
const { createBookingSchema } = require('../validators/booking.validator');

const router = express.Router();

// Create booking atomically with FOR UPDATE row locks & unique PNR (supports authenticated & guest checkout)
router.post(
  '/',
  optionalAuthenticate,
  validateRequest(createBookingSchema),
  bookingController.createBooking
);

module.exports = router;
