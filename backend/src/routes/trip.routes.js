const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validate');
const tripController = require('../controllers/trip.controller');
const {
  scheduleTripSchema,
  updateTripSchema,
  listAdminTripsQuerySchema,
  searchTripsQuerySchema,
} = require('../validators/trip.validator');

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
