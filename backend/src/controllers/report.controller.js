const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');

async function getPassengerManifest(req, res, next) {
  try {
    const tripId = req.params.tripId || req.query.tripId;
    const includeCancelled =
      req.query.includeCancelled === 'true' || req.query.includeCancelled === true;
    const result = await reportService.getTripPassengerManifest(tripId, req.user, {
      includeCancelled,
    });
    return sendSuccess(res, result, 'Passenger manifest generated successfully');
  } catch (error) {
    return next(error);
  }
}

async function getOccupancyReport(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await reportService.getOccupancyReport(query, req.user);
    return sendSuccess(res, result, 'Occupancy metrics and route report generated successfully');
  } catch (error) {
    return next(error);
  }
}

async function getRevenueReport(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await reportService.getRevenueSummaryReport(query, req.user);
    return sendSuccess(res, result, 'Revenue analytics and financial KPIs generated successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPassengerManifest,
  getOccupancyReport,
  getRevenueReport,
};

