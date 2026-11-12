import api from './api';

/**
 * Fetches active routes and their boarding/dropping stops for city suggestions & popular corridors.
 */
export async function fetchRoutes(params = {}) {
  const response = await api.get('/routes', { params });
  return response.data?.data || { routes: [], pagination: {} };
}

/**
 * Fetches bus stops for boarding/dropping point autocomplete.
 */
export async function fetchStops(params = {}) {
  const response = await api.get('/routes/stops', { params });
  return response.data?.data || { stops: [], pagination: {} };
}

/**
 * Searches public scheduled trips with city pair, travel date, INR fare, and coach type filters.
 */
export async function searchTrips(params = {}) {
  const response = await api.get('/trips/search', { params });
  return response.data?.data || { trips: [], pagination: {} };
}

/**
 * Fetches public trip details and ordered stops by tripId.
 */
export async function fetchTripById(tripId) {
  const response = await api.get(`/trips/${tripId}`);
  return response.data?.data?.trip || null;
}
