const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validate');
const reportController = require('../controllers/report.controller');
const {
  manifestParamsSchema,
  manifestQuerySchema,
  occupancyQuerySchema,
  revenueQuerySchema,
} = require('../validators/report.validator');

const router = express.Router();

// All reporting endpoints require authentication and ADMIN or OPERATOR role
router.use(authenticate, authorize('ADMIN', 'OPERATOR'));

// Passenger Manifest for conductors and dispatchers
router.get(
  '/manifest',
  validateRequest(manifestQuerySchema, 'query'),
  reportController.getPassengerManifest
);

router.get(
  '/manifest/:tripId',
  validateRequest(manifestParamsSchema, 'params'),
  validateRequest(manifestQuerySchema, 'query'),
  reportController.getPassengerManifest
);

// Seat Occupancy % metrics & route performance
router.get(
  '/occupancy',
  validateRequest(occupancyQuerySchema, 'query'),
  reportController.getOccupancyReport
);

// Revenue analytics, daily trend & operator shares
router.get(
  '/revenue',
  validateRequest(revenueQuerySchema, 'query'),
  reportController.getRevenueReport
);

module.exports = router;

