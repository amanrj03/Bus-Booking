const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const prisma = require('../config/prisma');
const config = require('../config/env');
const { generateToken } = require('../utils/jwt');

const originalUserDelegate = prisma.user;
const originalAuditLogDelegate = prisma.auditLog;

describe('Auth & RBAC End-to-End Integration Suite', () => {
  afterEach(() => {
    prisma.user = originalUserDelegate;
    prisma.auditLog = originalAuditLogDelegate;
  });

  it('POST /api/v1/auth/register should create a PASSENGER, hash password, ignore injected role, and emit JWT', async () => {
    let createdPayload = null;
    let auditPayload = null;

    prisma.user = {
      findUnique: async () => null,
      create: async ({ data }) => {
        createdPayload = data;
        return {
          id: 'user-new-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
    };
    prisma.auditLog = {
      create: async ({ data }) => {
        auditPayload = data;
        return { id: 'audit-1', ...data };
      },
    };

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Ananya Verma',
        email: 'ananya.verma@example.com',
        password: 'Password123!',
        phone: '+91 9876543210',
        role: 'ADMIN', // Attempt privilege escalation
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'PASSENGER');
    assert.equal(res.body.data.user.passwordHash, undefined);
    assert.ok(res.body.data.token);

    // Verify password was actually hashed with bcrypt
    assert.notEqual(createdPayload.passwordHash, 'Password123!');
    const isHashedMatch = await bcrypt.compare('Password123!', createdPayload.passwordHash);
    assert.equal(isHashedMatch, true);

    // Verify audit log recorded
    assert.equal(auditPayload.action, 'USER_REGISTERED');
    assert.equal(auditPayload.entityId, 'user-new-1');
  });

  it('POST /api/v1/auth/register should reject duplicate email with 409 Conflict', async () => {
    prisma.user = {
      findUnique: async () => ({
        id: 'existing-1',
        email: 'ananya.verma@example.com',
      }),
    };

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Ananya Verma',
        email: 'ananya.verma@example.com',
        password: 'Password123!',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/);
  });

  it('POST /api/v1/auth/login should authenticate valid credentials and issue JWT', async () => {
    const hash = await bcrypt.hash('Password123!', 10);
    let auditRecorded = false;

    prisma.user = {
      findUnique: async () => ({
        id: 'user-op-1',
        name: 'Zingbus Manager',
        email: 'zingbus@busbooking.local',
        passwordHash: hash,
        role: 'OPERATOR',
        phone: '+91 9820011001',
        operator: {
          id: 'op-1',
          name: 'Zingbus Express',
          companyName: 'Zingbus Express Pvt Ltd',
          isActive: true,
        },
      }),
    };
    prisma.auditLog = {
      create: async () => {
        auditRecorded = true;
        return { id: 'audit-login' };
      },
    };

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'ZINGBUS@busbooking.local',
        password: 'Password123!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'OPERATOR');
    assert.equal(res.body.data.user.operator.name, 'Zingbus Express');
    assert.equal(res.body.data.user.passwordHash, undefined);
    assert.ok(res.body.data.token);
    assert.equal(auditRecorded, true);
  });

  it('POST /api/v1/auth/login should reject invalid password with 401', async () => {
    const hash = await bcrypt.hash('Password123!', 10);
    prisma.user = {
      findUnique: async () => ({
        id: 'user-1',
        email: 'passenger@busbooking.local',
        passwordHash: hash,
        role: 'PASSENGER',
      }),
    };

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'passenger@busbooking.local',
        password: 'WrongPassword!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  it('POST /api/v1/auth/login should reject nonexistent user with 401', async () => {
    prisma.user = {
      findUnique: async () => null,
    };

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'Password123!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  it('GET /api/v1/auth/me should return user profile for valid JWT and 401 for expired JWT', async () => {
    prisma.user = {
      findUnique: async () => ({
        id: 'user-pass-1',
        name: 'Demo Passenger',
        email: 'passenger@busbooking.local',
        passwordHash: 'secret',
        role: 'PASSENGER',
        operator: null,
      }),
    };

    const validToken = generateToken({
      userId: 'user-pass-1',
      role: 'PASSENGER',
      email: 'passenger@busbooking.local',
    });

    const okRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(okRes.status, 200);
    assert.equal(okRes.body.data.user.email, 'passenger@busbooking.local');
    assert.equal(okRes.body.data.user.passwordHash, undefined);

    const expiredToken = jwt.sign(
      { userId: 'user-pass-1', role: 'PASSENGER' },
      config.jwtSecret,
      { expiresIn: -10 }
    );

    const expiredRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    assert.equal(expiredRes.status, 401);
    assert.match(expiredRes.body.message, /expired/);
  });

  it('GET /api/v1/users should return paginated users for ADMIN role', async () => {
    prisma.user = {
      findMany: async () => [
        { id: 'u-1', name: 'Admin', email: 'admin@busbooking.local', role: 'ADMIN' },
        { id: 'u-2', name: 'Passenger', email: 'pass@example.com', role: 'PASSENGER' },
      ],
      count: async () => 2,
    };

    const adminToken = generateToken({
      userId: 'u-1',
      role: 'ADMIN',
      email: 'admin@busbooking.local',
    });

    const res = await request(app)
      .get('/api/v1/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.users.length, 2);
    assert.equal(res.body.data.pagination.total, 2);
    assert.equal(res.body.data.pagination.totalPages, 1);
  });

  it('PATCH /api/v1/users/:id/role should allow ADMIN to update role and audit the change', async () => {
    let auditEntry = null;

    prisma.user = {
      findUnique: async () => ({
        id: 'u-target',
        email: 'target@example.com',
        role: 'PASSENGER',
      }),
      update: async ({ data }) => ({
        id: 'u-target',
        name: 'Target User',
        email: 'target@example.com',
        role: data.role,
        phone: null,
        updatedAt: new Date(),
      }),
    };
    prisma.auditLog = {
      create: async ({ data }) => {
        auditEntry = data;
        return { id: 'audit-role', ...data };
      },
    };

    const adminToken = generateToken({
      userId: 'u-admin',
      role: 'ADMIN',
      email: 'admin@busbooking.local',
    });

    const res = await request(app)
      .patch('/api/v1/users/u-target/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'OPERATOR' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.role, 'OPERATOR');
    assert.equal(auditEntry.action, 'USER_ROLE_UPDATED');
    assert.equal(auditEntry.userId, 'u-admin');
    assert.equal(auditEntry.entityId, 'u-target');
  });
});
