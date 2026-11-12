const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validateRequest = require('../middleware/validate');
const fleetController = require('../controllers/fleet.controller');
const {
  createOperatorSchema,
  updateOperatorSchema,
  listOperatorsQuerySchema,
  createBusSchema,
  updateBusSchema,
  listBusesQuerySchema,
} = require('../validators/fleet.validator');

const router = express.Router();

// Operator routes
router.get(
  '/operators',
  authenticate,
  authorize('ADMIN', 'OPERATOR'),
  validateRequest(listOperatorsQuerySchema, 'query'),
  fleetController.listOperators
);

router.post(
  '/operators',
  authenticate,
  authorize('ADMIN'),
  validateRequest(createOperatorSchema),
  fleetController.createOperator
);

router.patch(
  '/operators/:id',
  authenticate,
  authorize('ADMIN'),
  validateRequest(updateOperatorSchema),
  fleetController.updateOperator
);

// Bus routes
router.get(
  '/buses',
  authenticate,
  authorize('ADMIN', 'OPERATOR'),
  validateRequest(listBusesQuerySchema, 'query'),
  fleetController.listBuses
);

router.get(
  '/buses/:id',
  authenticate,
  authorize('ADMIN', 'OPERATOR'),
  fleetController.getBusById
);

router.post(
  '/buses',
  authenticate,
  authorize('ADMIN'),
  validateRequest(createBusSchema),
  fleetController.createBus
);

router.patch(
  '/buses/:id',
  authenticate,
  authorize('ADMIN', 'OPERATOR'),
  validateRequest(updateBusSchema),
  fleetController.updateBus
);

module.exports = router;
