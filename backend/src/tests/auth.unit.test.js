const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { generateToken, verifyToken } = require('../utils/jwt');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { sanitizeUser } = require('../services/auth.service');

describe('Auth Utilities, Validators & Input Protection Suite', () => {
  it('generateToken() and verifyToken() should encode and verify JWT payload cleanly', () => {
    const payload = { userId: 'u-123', role: 'PASSENGER', email: 'test@example.com' };
    const token = generateToken(payload);
    assert.ok(typeof token === 'string' && token.split('.').length === 3);

    const decoded = verifyToken(token);
    assert.equal(decoded.userId, payload.userId);
    assert.equal(decoded.role, payload.role);
    assert.equal(decoded.email, payload.email);
  });

  it('verifyToken() should reject tampered tokens', () => {
    const token = generateToken({ userId: 'u-123', role: 'PASSENGER' });
    const tampered = token.slice(0, -4) + 'XXXX';
    assert.throws(() => verifyToken(tampered));
  });

  it('sanitizeUser() should strip passwordHash from user object', () => {
    const rawUser = {
      id: 'u-1',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      passwordHash: '$2a$10$secret',
      role: 'PASSENGER',
    };
    const safe = sanitizeUser(rawUser);
    assert.equal(safe.passwordHash, undefined);
    assert.equal(safe.email, 'rahul@example.com');
  });

  it('registerSchema should validate Indian phone and enforce password rules', () => {
    const valid = registerSchema.safeParse({
      name: 'Priya Patel',
      email: 'PRIYA@example.com',
      password: 'Password123!',
      phone: '+91 9876543210',
    });
    assert.equal(valid.success, true);
    assert.equal(valid.data.email, 'priya@example.com');

    const invalidPhone = registerSchema.safeParse({
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: 'Password123!',
      phone: '12345',
    });
    assert.equal(invalidPhone.success, false);

    const shortPwd = registerSchema.safeParse({
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: '123',
    });
    assert.equal(shortPwd.success, false);
  });

  it('POST /api/v1/auth/register should reject invalid payloads with 400 and field errors', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: '123' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Validation failed');
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.length >= 3);
  });

  it('POST /api/v1/auth/login should reject missing password with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'passenger@busbooking.local', password: '' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Validation failed');
  });
});
