import api from './api';

/**
 * Finalizes booking transaction with passenger manifest, simulated payment, and PNR emission.
 */
export async function createBooking(payload) {
  const response = await api.post('/bookings', payload);
  return response.data?.data;
}

/**
 * Fetches an e-ticket and full booking confirmation details by PNR.
 */
export async function fetchBookingByPnr(pnr) {
  const response = await api.get(`/bookings/pnr/${encodeURIComponent(pnr)}`);
  return response.data?.data?.booking || null;
}

/**
 * Fetches paginated booking history for the authenticated passenger.
 */
export async function fetchMyBookings(params = {}) {
  const response = await api.get('/bookings/my', { params });
  return response.data?.data || { bookings: [], pagination: {} };
}
