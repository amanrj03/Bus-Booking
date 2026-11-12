const routeService = require('../services/route.service');
const { sendSuccess } = require('../utils/response');

async function listStops(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await routeService.listStops(query);
    return sendSuccess(res, result, 'Stops retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function createStop(req, res, next) {
  try {
    const stop = await routeService.createStop(req.body);
    return sendSuccess(res, { stop }, 'Stop created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

async function listRoutes(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await routeService.listRoutes(query);
    return sendSuccess(res, result, 'Routes retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getRouteById(req, res, next) {
  try {
    const route = await routeService.getRouteById(req.params.id);
    return sendSuccess(res, { route }, 'Route details retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function createRoute(req, res, next) {
  try {
    const route = await routeService.createRoute(req.body, req.user.userId, req.ip);
    return sendSuccess(res, { route }, 'Route created successfully', 201);
  } catch (error) {
    return next(error);
  }
}

async function updateRoute(req, res, next) {
  try {
    const route = await routeService.updateRoute(
      req.params.id,
      req.body,
      req.user.userId,
      req.ip
    );
    return sendSuccess(res, { route }, 'Route updated successfully');
  } catch (error) {
    return next(error);
  }
}

async function replaceRouteStops(req, res, next) {
  try {
    const result = await routeService.replaceRouteStops(
      req.params.id,
      req.body.stops,
      req.user.userId,
      req.ip
    );
    return sendSuccess(res, result, 'Route stop sequence updated successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listStops,
  createStop,
  listRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  replaceRouteStops,
};
