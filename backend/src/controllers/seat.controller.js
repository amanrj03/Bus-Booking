const seatService = require('../services/seat.service');
const { sendSuccess } = require('../utils/response');

async function getTripSeats(req, res, next) {
  try {
    const result = await seatService.getLiveTripSeatMap(req.params.id);
    return sendSuccess(res, result, 'Live trip seat map retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function lockSeats(req, res, next) {
  try {
    const actorUserId = req.user?.userId || null;
    const result = await seatService.lockTripSeats(
      req.params.id,
      req.body,
      actorUserId,
      req.ip
    );
    return sendSuccess(res, result, 'Seats temporarily locked for checkout');
  } catch (error) {
    return next(error);
  }
}

async function releaseSeats(req, res, next) {
  try {
    const actorUserId = req.user?.userId || null;
    const result = await seatService.releaseTripSeats(
      req.params.id,
      req.body,
      actorUserId,
      req.ip
    );
    return sendSuccess(res, result, 'Locked seats released back to inventory');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTripSeats,
  lockSeats,
  releaseSeats,
};
