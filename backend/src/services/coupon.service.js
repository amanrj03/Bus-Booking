const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { recordAudit, AUDIT_ACTIONS } = require('./audit.service');

/**
 * Calculates discount amount based on coupon rules and subtotal.
 */
function calculateDiscount(coupon, bookingAmount) {
  const amount = Number(bookingAmount);
  let discount = 0;

  if (coupon.discountType === 'PERCENTAGE') {
    discount = Math.round((amount * Number(coupon.discountValue)) / 100);
    if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  } else {
    // FIXED
    discount = Math.min(Number(coupon.discountValue), amount);
  }

  const finalAmount = Math.max(0, amount - discount);
  return { discount, finalAmount };
}

/**
 * List active and unexpired coupons available for public display and customer application.
 */
async function listActiveCoupons() {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      expiryDate: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter out any where usage limit is reached
  return coupons
    .filter((c) => c.usageLimit === null || c.usedCount < c.usageLimit)
    .map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
      minBookingAmount: Number(c.minBookingAmount),
      expiryDate: c.expiryDate,
    }));
}

/**
 * Server-side validation of a coupon against a requested booking amount and optional user context.
 */
async function validateCoupon(code, bookingAmount, userId = null, userEmail = null) {
  if (!code || typeof code !== 'string') {
    throw new AppError('Coupon code is required.', 400);
  }

  const cleanCode = code.trim().toUpperCase();
  const amount = Number(bookingAmount);

  if (isNaN(amount) || amount <= 0) {
    throw new AppError('Valid booking amount is required for coupon evaluation.', 400);
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: cleanCode },
  });

  if (!coupon) {
    throw new AppError(`Coupon '${cleanCode}' is invalid or does not exist.`, 404);
  }

  if (!coupon.isActive) {
    throw new AppError(`Coupon '${cleanCode}' is currently deactivated.`, 400);
  }

  const now = new Date();
  if (now < new Date(coupon.startDate)) {
    throw new AppError(`Coupon '${cleanCode}' is not active yet.`, 400);
  }

  if (now > new Date(coupon.expiryDate)) {
    throw new AppError(`Coupon '${cleanCode}' has expired.`, 400);
  }

  if (amount < Number(coupon.minBookingAmount)) {
    throw new AppError(
      `Minimum booking amount of ₹${Number(coupon.minBookingAmount)} required to apply '${cleanCode}'.`,
      400
    );
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(`Coupon '${cleanCode}' total usage limit has been reached.`, 400);
  }

  // Check per-user redemption limit if user context is available
  if (userId || userEmail) {
    const userRedemptions = await prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(userEmail ? [{ userEmail: userEmail.toLowerCase() }] : []),
        ],
      },
    });

    if (userRedemptions >= coupon.perUserLimit) {
      throw new AppError(
        `You have already reached the maximum redemption limit (${coupon.perUserLimit}) for coupon '${cleanCode}'.`,
        400
      );
    }
  }

  const { discount, finalAmount } = calculateDiscount(coupon, amount);

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      minBookingAmount: Number(coupon.minBookingAmount),
      discountAmount: discount,
      finalAmount: finalAmount,
      expiryDate: coupon.expiryDate,
    },
  };
}

/**
 * Admin view: List all coupons with filters, usage stats, and totals.
 */
async function listAdminCoupons({ page = 1, limit = 20, search = '', status = 'ALL' } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const now = new Date();
  const where = {};

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { code: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (status === 'ACTIVE') {
    where.isActive = true;
    where.expiryDate = { gte: now };
  } else if (status === 'INACTIVE') {
    where.isActive = false;
  } else if (status === 'EXPIRED') {
    where.expiryDate = { lt: now };
  }

  const [coupons, total, statsAgg, redemptionsCount] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    }),
    prisma.coupon.count({ where }),
    prisma.coupon.aggregate({
      _count: { id: true },
      _sum: { usedCount: true },
    }),
    prisma.couponRedemption.aggregate({
      _sum: { discountAmount: true },
    }),
  ]);

  const activeCount = await prisma.coupon.count({
    where: { isActive: true, expiryDate: { gte: now } },
  });

  return {
    coupons: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
      minBookingAmount: Number(c.minBookingAmount),
      usageLimit: c.usageLimit,
      perUserLimit: c.perUserLimit,
      usedCount: c.usedCount,
      redemptionsCount: c._count.redemptions,
      startDate: c.startDate,
      expiryDate: c.expiryDate,
      isActive: c.isActive,
      isExpired: new Date(c.expiryDate) < now,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    pagination: {
      page: pageNum,
      limit: take,
      total,
      totalPages: Math.ceil(total / take) || 1,
    },
    metrics: {
      totalCoupons: statsAgg._count.id || 0,
      activeCoupons: activeCount,
      totalRedemptions: statsAgg._sum.usedCount || 0,
      totalDiscountGiven: Number(redemptionsCount._sum.discountAmount || 0),
    },
  };
}

/**
 * Admin view: Create a new promotional coupon.
 */
async function createCoupon(data, adminUserId, ipAddress) {
  const cleanCode = (data.code || '').trim().toUpperCase();
  if (!cleanCode) {
    throw new AppError('Coupon code is required.', 400);
  }

  const existing = await prisma.coupon.findUnique({
    where: { code: cleanCode },
  });
  if (existing) {
    throw new AppError(`A coupon with code '${cleanCode}' already exists.`, 409);
  }

  const discountValue = Number(data.discountValue);
  if (isNaN(discountValue) || discountValue <= 0) {
    throw new AppError('Discount value must be greater than 0.', 400);
  }

  if (data.discountType === 'PERCENTAGE' && discountValue > 100) {
    throw new AppError('Percentage discount cannot exceed 100%.', 400);
  }

  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const expiryDate = new Date(data.expiryDate);
  if (isNaN(expiryDate.getTime()) || expiryDate <= startDate) {
    throw new AppError('Expiry date must be in the future and after start date.', 400);
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: cleanCode,
      description: (data.description || '').trim(),
      discountType: data.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
      discountValue,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      minBookingAmount: data.minBookingAmount ? Number(data.minBookingAmount) : 0,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit, 10) : null,
      perUserLimit: data.perUserLimit ? parseInt(data.perUserLimit, 10) : 1,
      startDate,
      expiryDate,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    },
  });

  await recordAudit({
    userId: adminUserId,
    action: AUDIT_ACTIONS.COUPON_CREATED,
    entity: 'Coupon',
    entityId: coupon.id,
    details: { code: coupon.code, discountType: coupon.discountType, discountValue },
    ipAddress,
  });

  return coupon;
}

/**
 * Admin view: Update an existing coupon.
 */
async function updateCoupon(id, data, adminUserId, ipAddress) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Coupon not found.', 404);
  }

  const updateData = {};

  if (data.description !== undefined) {
    updateData.description = String(data.description).trim();
  }

  if (data.discountType !== undefined) {
    updateData.discountType = data.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  }

  if (data.discountValue !== undefined) {
    const val = Number(data.discountValue);
    if (isNaN(val) || val <= 0) {
      throw new AppError('Discount value must be greater than 0.', 400);
    }
    if ((updateData.discountType || existing.discountType) === 'PERCENTAGE' && val > 100) {
      throw new AppError('Percentage discount cannot exceed 100%.', 400);
    }
    updateData.discountValue = val;
  }

  if (data.maxDiscount !== undefined) {
    updateData.maxDiscount = data.maxDiscount ? Number(data.maxDiscount) : null;
  }

  if (data.minBookingAmount !== undefined) {
    updateData.minBookingAmount = Math.max(0, Number(data.minBookingAmount) || 0);
  }

  if (data.usageLimit !== undefined) {
    updateData.usageLimit = data.usageLimit ? parseInt(data.usageLimit, 10) : null;
  }

  if (data.perUserLimit !== undefined) {
    updateData.perUserLimit = Math.max(1, parseInt(data.perUserLimit, 10) || 1);
  }

  if (data.expiryDate !== undefined) {
    const exp = new Date(data.expiryDate);
    if (isNaN(exp.getTime())) {
      throw new AppError('Invalid expiry date.', 400);
    }
    updateData.expiryDate = exp;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = Boolean(data.isActive);
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: updateData,
  });

  await recordAudit({
    userId: adminUserId,
    action: AUDIT_ACTIONS.COUPON_UPDATED,
    entity: 'Coupon',
    entityId: updated.id,
    details: { code: updated.code, changes: updateData },
    ipAddress,
  });

  return updated;
}

/**
 * Admin view: Toggle active status of a coupon.
 */
async function toggleCouponStatus(id, adminUserId, ipAddress) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Coupon not found.', 404);
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await recordAudit({
    userId: adminUserId,
    action: AUDIT_ACTIONS.COUPON_TOGGLED,
    entity: 'Coupon',
    entityId: updated.id,
    details: { code: updated.code, newStatus: updated.isActive },
    ipAddress,
  });

  return updated;
}

/**
 * Admin view: Delete a coupon.
 */
async function deleteCoupon(id, adminUserId, ipAddress) {
  const existing = await prisma.coupon.findUnique({
    where: { id },
    include: { _count: { select: { redemptions: true } } },
  });
  if (!existing) {
    throw new AppError('Coupon not found.', 404);
  }

  await prisma.coupon.delete({ where: { id } });

  await recordAudit({
    userId: adminUserId,
    action: AUDIT_ACTIONS.COUPON_DELETED,
    entity: 'Coupon',
    entityId: id,
    details: { code: existing.code },
    ipAddress,
  });

  return { message: `Coupon '${existing.code}' deleted successfully.` };
}

module.exports = {
  calculateDiscount,
  listActiveCoupons,
  validateCoupon,
  listAdminCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
};
