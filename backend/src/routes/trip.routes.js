const express = require('express');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validate');
const tripController = require('../controllers/trip.controller');
const seatController = require('../controllers/seat.controller');
const {
  scheduleTripSchema,
  updateTripSchema,
  listAdminTripsQuerySchema,
  searchTripsQuerySchema,
} = require('../validators/trip.validator');
const { lockSeatsSchema, releaseSeatsSchema } = require('../validators/seat.validator');

const router = express.Router();

// Public trip search (registered before /:id to avoid collision)
router.get(
  '/search',
  validateRequest(searchTripsQuerySchema, 'query'),
  tripController.searchTrips
);

// Management trip listing (ADMIN / OPERATOR)
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'OPERATOR'),
  validateRequest(listAdminTripsQuerySchema, 'query'),
  tripController.listTrips
);

// Public trip overview
router.get('/:id', tripController.getTripById);

// Live seat availability & temporary lock management (public/optional-auth for guest or logged-in checkout)
router.get('/:id/seats', seatController.getTripSeats);

router.post(
  '/:id/seats/lock',
  optionalAuthenticate,
  validateRequest(lockSeatsSchema),
  seatController.lockSeats
);

router.post(
  '/:id/seats/release',
  optionalAuthenticate,
  validateRequest(releaseSeatsSchema),
  seatController.releaseSeats
);

// Schedule trip with automatic TripSeat inventory creation
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'OPERATOR'),
  validateRequest(scheduleTripSchema),
  tripController.scheduleTrip
);

// Update trip schedule, status, or fare
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'OPERATOR'),
  validateRequest(updateTripSchema),
  tripController.updateTrip
);

module.exports = router;
