const tripService = require('../services/trip.service');
const { sendSuccess } = require('../utils/response');

async function listTrips(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await tripService.listTripsForManagement(query, req.user);
    return sendSuccess(res, result, 'Trips retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function searchTrips(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await tripService.searchPublicTrips(query);
    return sendSuccess(res, result, 'Available trips retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getTripById(req, res, next) {
  try {
    const trip = await tripService.getPublicTripById(req.params.id);
    return sendSuccess(res, { trip }, 'Trip details retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function scheduleTrip(req, res, next) {
  try {
    const trip = await tripService.scheduleTrip(
      req.body,
      req.user.userId,
      req.ip,
      req.user
    );
    return sendSuccess(res, { trip }, 'Trip scheduled and seat inventory generated', 201);
  } catch (error) {
    return next(error);
  }
}

async function updateTrip(req, res, next) {
  try {
    const trip = await tripService.updateTrip(
      req.params.id,
      req.body,
      req.user.userId,
      req.ip,
      req.user
    );
    return sendSuccess(res, { trip }, 'Trip updated successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTrips,
  searchTrips,
  getTripById,
  scheduleTrip,
  updateTrip,
};
