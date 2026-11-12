const fleetService = require('../services/fleet.service');
const { sendSuccess } = require('../utils/response');

async function listOperators(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await fleetService.listOperators(query);
    return sendSuccess(res, result, 'Operators retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function createOperator(req, res, next) {
  try {
    const operator = await fleetService.createOperator(req.body, req.user.userId, req.ip);
    return sendSuccess(res, { operator }, 'Operator created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

async function updateOperator(req, res, next) {
  try {
    const operator = await fleetService.updateOperator(
      req.params.id,
      req.body,
      req.user.userId,
      req.ip
    );
    return sendSuccess(res, { operator }, 'Operator updated successfully');
  } catch (error) {
    return next(error);
  }
}

async function listBuses(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await fleetService.listBuses(query, req.user);
    return sendSuccess(res, result, 'Buses retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getBusById(req, res, next) {
  try {
    const bus = await fleetService.getBusWithSeats(req.params.id);
    return sendSuccess(res, { bus }, 'Bus details and seat layout retrieved');
  } catch (error) {
    return next(error);
  }
}

async function createBus(req, res, next) {
  try {
    const bus = await fleetService.createBusWithSeats(req.body, req.user.userId, req.ip);
    return sendSuccess(res, { bus }, 'Bus registered and seat layout generated', 201);
  } catch (error) {
    return next(error);
  }
}

async function updateBus(req, res, next) {
  try {
    const bus = await fleetService.updateBus(
      req.params.id,
      req.body,
      req.user.userId,
      req.ip,
      req.user
    );
    return sendSuccess(res, { bus }, 'Bus updated successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listOperators,
  createOperator,
  updateOperator,
  listBuses,
  getBusById,
  createBus,
  updateBus,
};
