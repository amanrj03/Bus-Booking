const express = require('express');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth.middleware');
const couponController = require('../controllers/coupon.controller');

const router = express.Router();

// Public: Get currently active promotional coupons
router.get('/active', couponController.getActiveCoupons);

// Public / Authenticated: Validate a coupon against cart booking amount
router.post('/validate', optionalAuthenticate, couponController.validateCouponCode);

// Admin-only management endpoints
router.get('/', authenticate, authorize('ADMIN'), couponController.getAdminCoupons);
router.post('/', authenticate, authorize('ADMIN'), couponController.createAdminCoupon);
router.put('/:id', authenticate, authorize('ADMIN'), couponController.updateAdminCoupon);
router.patch('/:id/toggle', authenticate, authorize('ADMIN'), couponController.toggleAdminCoupon);
router.delete('/:id', authenticate, authorize('ADMIN'), couponController.deleteAdminCoupon);

module.exports = router;
