const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validate');
const routeController = require('../controllers/route.controller');
const {
  createStopSchema,
  listStopsQuerySchema,
  createRouteSchema,
  updateRouteSchema,
  setRouteStopsSchema,
  listRoutesQuerySchema,
} = require('../validators/route.validator');

const router = express.Router();

// Stop management & lookup (registered before /:id to avoid collision)
router.get(
  '/stops',
  validateRequest(listStopsQuerySchema, 'query'),
  routeController.listStops
);

router.post(
  '/stops',
  authenticate,
  authorize('ADMIN'),
  validateRequest(createStopSchema),
  routeController.createStop
);

// Route catalog & sequencing
router.get(
  '/',
  validateRequest(listRoutesQuerySchema, 'query'),
  routeController.listRoutes
);

router.get('/:id', routeController.getRouteById);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateRequest(createRouteSchema),
  routeController.createRoute
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateRequest(updateRouteSchema),
  routeController.updateRoute
);

router.put(
  '/:id/stops',
  authenticate,
  authorize('ADMIN'),
  validateRequest(setRouteStopsSchema),
  routeController.replaceRouteStops
);

module.exports = router;
