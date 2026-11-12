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
    return sendSuccess(res, result, 'Booking confirmed with simulated payment and unique PNR', 201);
  } catch (error) {
    return next(error);
  }
}

async function listMyBookings(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await bookingService.listUserBookings(req.user.userId, query);
    return sendSuccess(res, result, 'Booking history retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getBookingByPnr(req, res, next) {
  try {
    const booking = await bookingService.getBookingByPnr(req.params.pnr);
    return sendSuccess(res, { booking }, 'Booking e-ticket retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createBooking,
  listMyBookings,
  getBookingByPnr,
};
