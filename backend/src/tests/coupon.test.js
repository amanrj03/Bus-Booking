const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');

describe('Promotional Coupon System & Management Suite', () => {
  let adminToken;
  let passengerToken;

  before(async () => {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    adminToken = generateToken({
      userId: adminUser?.id || 'admin-test-uuid',
      email: adminUser?.email || 'admin@gobus.com',
      role: 'ADMIN',
    });

    const passengerUser = await prisma.user.findFirst({ where: { role: 'PASSENGER' } });
    passengerToken = generateToken({
      userId: passengerUser?.id || 'passenger-test-uuid',
      email: passengerUser?.email || 'passenger@gobus.com',
      role: 'PASSENGER',
    });
  });

  it('GET /api/v1/coupons/active should return public active coupons', async () => {
    const res = await request(app).get('/api/v1/coupons/active');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);

    const hopon = res.body.data.find((c) => c.code === 'HOPON9');
    assert.ok(hopon, 'HOPON9 must be present in active coupons');
    assert.equal(hopon.discountType, 'PERCENTAGE');
    assert.equal(hopon.discountValue, 15);
  });

  it('POST /api/v1/coupons/validate should calculate percentage discount and respect maxDiscount cap', async () => {
    // HOPON9: 15% off, max ₹200, min ₹499
    // On ₹1000 booking: 15% is ₹150 (<= 200 cap) -> discount ₹150, final ₹850
    const res1 = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ code: 'HOPON9', bookingAmount: 1000 });

    assert.equal(res1.status, 200);
    assert.equal(res1.body.success, true);
    assert.equal(res1.body.data.valid, true);
    assert.equal(res1.body.data.coupon.discountAmount, 150);
    assert.equal(res1.body.data.coupon.finalAmount, 850);

    // On ₹2000 booking: 15% is ₹300 (> 200 cap) -> capped to ₹200, final ₹1800
    const res2 = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ code: 'HOPON9', bookingAmount: 2000 });

    assert.equal(res2.status, 200);
    assert.equal(res2.body.data.coupon.discountAmount, 200);
    assert.equal(res2.body.data.coupon.finalAmount, 1800);
  });

  it('POST /api/v1/coupons/validate should reject booking amount below minBookingAmount', async () => {
    // HOPON9 has minBookingAmount: 499. ₹300 should be rejected.
    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ code: 'HOPON9', bookingAmount: 300 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Minimum booking amount/);
  });

  it('POST /api/v1/coupons/validate should reject nonexistent coupon code with 404', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ code: 'NONEXISTENT_CODE_XYZ', bookingAmount: 1000 });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid or does not exist/i);
  });

  it('Admin API should enforce 401 unauthenticated and 403 for PASSENGER role', async () => {
    // Unauthenticated
    const resUnauth = await request(app).get('/api/v1/coupons');
    assert.equal(resUnauth.status, 401);

    // Passenger role
    const resForbidden = await request(app)
      .get('/api/v1/coupons')
      .set('Authorization', `Bearer ${passengerToken}`);
    assert.equal(resForbidden.status, 403);

    // Admin role
    const resAdmin = await request(app)
      .get('/api/v1/coupons')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resAdmin.status, 200);
    assert.equal(resAdmin.body.success, true);
    assert.ok(Array.isArray(resAdmin.body.data.coupons));
    assert.ok(resAdmin.body.data.metrics);
  });

  it('Admin API should support full lifecycle: Create, Toggle, and Delete coupon', async () => {
    const uniqueTestCode = `TEST${Date.now()}`;

    // 1. Create Coupon
    const createRes = await request(app)
      .post('/api/v1/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: uniqueTestCode,
        description: 'Automated test discount coupon',
        discountType: 'FIXED',
        discountValue: 75,
        minBookingAmount: 350,
        usageLimit: 100,
        perUserLimit: 2,
        expiryDate: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        isActive: true,
      });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.success, true);
    assert.equal(createRes.body.data.code, uniqueTestCode);
    const createdId = createRes.body.data.id;

    // 2. Toggle Status to Inactive
    const toggleRes = await request(app)
      .patch(`/api/v1/coupons/${createdId}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(toggleRes.status, 200);
    assert.equal(toggleRes.body.data.isActive, false);

    // 3. Validation should now reject it as inactive
    const valRes = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ code: uniqueTestCode, bookingAmount: 500 });
    assert.equal(valRes.status, 400);
    assert.match(valRes.body.message, /currently deactivated/i);

    // 4. Delete Coupon
    const deleteRes = await request(app)
      .delete(`/api/v1/coupons/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.success, true);
  });
});
