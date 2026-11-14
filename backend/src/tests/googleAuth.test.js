const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');

describe('Google OAuth SSO Authentication Suite', () => {
  const testEmail = `google.rider.${Date.now()}@gmail.com`;

  it('POST /api/v1/auth/google should auto-provision a new PASSENGER and issue JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({
        email: testEmail,
        name: 'Aarav Google Rider',
        picture: 'https://lh3.googleusercontent.com/a/default-user',
        sub: 'google-sub-123456789',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testEmail);
    assert.equal(res.body.data.user.name, 'Aarav Google Rider');
    assert.equal(res.body.data.user.role, 'PASSENGER');
    assert.ok(res.body.data.token, 'Must return signed JWT token');

    // Verify token works with /auth/me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${res.body.data.token}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.user.email, testEmail);
  });

  it('POST /api/v1/auth/google should authenticate existing user and return 200', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({
        email: testEmail,
        name: 'Aarav Google Rider Updated',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testEmail);
    assert.ok(res.body.data.token);
  });

  it('POST /api/v1/auth/google should reject invalid email format with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({
        email: 'not-an-email',
        name: 'Invalid User',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });
});
