import api from './api';

/**
 * Fetch all currently active and unexpired promotional coupons
 */
export async function fetchActiveCoupons() {
  const response = await api.get('/coupons/active');
  return response.data?.data || [];
}

/**
 * Validate a coupon code against a booking subtotal
 */
export async function validateCouponCode(code, bookingAmount, userEmail = null) {
  const response = await api.post('/coupons/validate', {
    code,
    bookingAmount,
    userEmail,
  });
  return response.data?.data;
}

/**
 * Admin: Fetch paginated coupons with filter and metrics
 */
export async function fetchAdminCoupons(params = {}) {
  const response = await api.get('/coupons', { params });
  return response.data?.data || { coupons: [], pagination: {}, metrics: {} };
}

/**
 * Admin: Create a new promotional coupon
 */
export async function createAdminCoupon(payload) {
  const response = await api.post('/coupons', payload);
  return response.data;
}

/**
 * Admin: Update existing coupon
 */
export async function updateAdminCoupon(id, payload) {
  const response = await api.put(`/coupons/${encodeURIComponent(id)}`, payload);
  return response.data;
}

/**
 * Admin: Toggle coupon active/inactive status
 */
export async function toggleAdminCoupon(id) {
  const response = await api.patch(`/coupons/${encodeURIComponent(id)}/toggle`);
  return response.data;
}

/**
 * Admin: Delete coupon
 */
export async function deleteAdminCoupon(id) {
  const response = await api.delete(`/coupons/${encodeURIComponent(id)}`);
  return response.data;
}
