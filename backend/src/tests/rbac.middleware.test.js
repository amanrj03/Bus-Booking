const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth.middleware');
const { generateToken } = require('../utils/jwt');

describe('RBAC & Authentication Middleware Suite', () => {
  it('authenticate() should reject missing Authorization header with 401', () => {
    const req = { headers: {} };
    let capturedError = null;
    authenticate(req, {}, (err) => {
      capturedError = err;
    });
    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 401);
  });

  it('authenticate() should populate req.user on valid Bearer token', () => {
    const token = generateToken({ userId: 'u-admin', role: 'ADMIN', email: 'admin@busbooking.local' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    let capturedError = null;
    authenticate(req, {}, (err) => {
      capturedError = err;
    });
    assert.equal(capturedError, undefined);
    assert.equal(req.user.userId, 'u-admin');
    assert.equal(req.user.role, 'ADMIN');
  });

  it('optionalAuthenticate() should set req.user to null when token is absent', () => {
    const req = { headers: {} };
    let capturedError = null;
    optionalAuthenticate(req, {}, (err) => {
      capturedError = err;
    });
    assert.equal(capturedError, undefined);
    assert.equal(req.user, null);
  });

  it('authorize() should allow matching role and deny mismatched roles with 403', () => {
    const adminMiddleware = authorize('ADMIN');

    // Allowed
    let errAllowed = null;
    adminMiddleware({ user: { userId: 'u-1', role: 'ADMIN' } }, {}, (err) => {
      errAllowed = err;
    });
    assert.equal(errAllowed, undefined);

    // Denied (PASSENGER -> ADMIN)
    let errDenied = null;
    adminMiddleware({ user: { userId: 'u-2', role: 'PASSENGER' } }, {}, (err) => {
      errDenied = err;
    });
    assert.ok(errDenied);
    assert.equal(errDenied.statusCode, 403);
  });

  it('GET /api/v1/auth/me without token should return 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('GET /api/v1/users without token should return 401', async () => {
    const res = await request(app).get('/api/v1/users');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('GET /api/v1/users with PASSENGER JWT should return 403 Forbidden', async () => {
    const token = generateToken({ userId: 'u-pass', role: 'PASSENGER', email: 'pass@example.com' });
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access forbidden/);
  });

  it('GET /api/v1/users with OPERATOR JWT should return 403 Forbidden', async () => {
    const token = generateToken({ userId: 'u-op', role: 'OPERATOR', email: 'op@busbooking.local' });
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });
});
