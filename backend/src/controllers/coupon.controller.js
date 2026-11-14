const couponService = require('../services/coupon.service');

/**
 * Public: Get active promotional coupons for dashboard display & checkout listing
 */
async function getActiveCoupons(req, res, next) {
  try {
    const coupons = await couponService.listActiveCoupons();
    res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public/Auth: Validate a coupon against an order amount and optional user context
 */
async function validateCouponCode(req, res, next) {
  try {
    const { code, bookingAmount, userEmail } = req.body;
    const userId = req.user?.id || null;
    const email = userEmail || req.user?.email || null;

    const result = await couponService.validateCoupon(code, bookingAmount, userId, email);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: List all coupons with metrics and pagination
 */
async function getAdminCoupons(req, res, next) {
  try {
    const result = await couponService.listAdminCoupons(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Create a new promotional coupon
 */
async function createAdminCoupon(req, res, next) {
  try {
    const adminUserId = req.user?.id || req.user?.userId;
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const coupon = await couponService.createCoupon(req.body, adminUserId, ipAddress);

    res.status(201).json({
      success: true,
      message: `Coupon '${coupon.code}' created successfully.`,
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update existing coupon
 */
async function updateAdminCoupon(req, res, next) {
  try {
    const adminUserId = req.user?.id || req.user?.userId;
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const coupon = await couponService.updateCoupon(req.params.id, req.body, adminUserId, ipAddress);

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' updated successfully.`,
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Toggle active/inactive status
 */
async function toggleAdminCoupon(req, res, next) {
  try {
    const adminUserId = req.user?.id || req.user?.userId;
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const coupon = await couponService.toggleCouponStatus(req.params.id, adminUserId, ipAddress);

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' is now ${coupon.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Delete a coupon
 */
async function deleteAdminCoupon(req, res, next) {
  try {
    const adminUserId = req.user?.id || req.user?.userId;
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const result = await couponService.deleteCoupon(req.params.id, adminUserId, ipAddress);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getActiveCoupons,
  validateCouponCode,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  toggleAdminCoupon,
  deleteAdminCoupon,
};
