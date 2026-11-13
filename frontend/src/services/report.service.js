import api from './api';

/**
 * Fetches revenue KPIs, daily trend, route breakdown, and operator market share.
 */
export async function fetchRevenueReport(params = {}) {
  const response = await api.get('/reports/revenue', { params });
  return response.data?.data || { kpis: {}, dailyTrend: [], byRoute: [], byOperator: [] };
}

/**
 * Fetches seat occupancy % metrics across routes and scheduled trips.
 */
export async function fetchOccupancyReport(params = {}) {
  const response = await api.get('/reports/occupancy', { params });
  return (
    response.data?.data || {
      summary: {},
      byRoute: [],
      trips: [],
      pagination: {},
    }
  );
}

/**
 * Fetches seat-by-seat passenger manifest and occupancy stats for a specific trip.
 */
export async function fetchPassengerManifest(tripId, params = {}) {
  const response = await api.get(`/reports/manifest/${encodeURIComponent(tripId)}`, { params });
  return response.data?.data || null;
}

/**
 * Fetches paginated system audit logs for Admin inspection.
 */
export async function fetchAuditLogs(params = {}) {
  const response = await api.get('/audit-logs', { params });
  return response.data?.data || { logs: [], pagination: {} };
}

