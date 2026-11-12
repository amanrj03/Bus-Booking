const bookingService = require('../services/booking.service');
const { sendSuccess } = require('../utils/response');

async function createBooking(req, res, next) {
  try {
    const actorUserId = req.user?.userId || null;
    const result = await bookingService.createTransactionalBooking(
      req.body,
      actorUserId,
      req.ip
    );
    return sendSuccess(res, result, 'Booking confirmed with unique PNR', 201);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createBooking,
};
