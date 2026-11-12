const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { AUDIT_ACTIONS, recordAudit } = require('../services/audit.service');
const { listAuditLogsQuerySchema } = require('../validators/audit.validator');
const { generateToken } = require('../utils/jwt');

describe('Centralized Audit Trail Suite', () => {
  it('AUDIT_ACTIONS should define all critical business action constants', () => {
    assert.equal(AUDIT_ACTIONS.BOOKING_CREATED, 'BOOKING_CREATED');
    assert.equal(AUDIT_ACTIONS.BOOKING_CANCELLED, 'BOOKING_CANCELLED');
    assert.equal(AUDIT_ACTIONS.TRIP_SCHEDULED, 'TRIP_SCHEDULED');
    assert.equal(AUDIT_ACTIONS.USER_REGISTERED, 'USER_REGISTERED');
    assert.equal(AUDIT_ACTIONS.USER_ROLE_UPDATED, 'USER_ROLE_UPDATED');
  });

  it('recordAudit() should delegate to transaction client when tx is provided', async () => {
    let capturedData = null;
    const mockTx = {
      auditLog: {
        create: async ({ data }) => {
          capturedData = data;
          return { id: 'audit-1', ...data };
        },
      },
    };

    const result = await recordAudit({
      userId: 'u-101',
      action: AUDIT_ACTIONS.BOOKING_CREATED,
      entity: 'Booking',
      entityId: 'b-99',
      details: { pnr: 'FLX-DEL-1001' },
      ipAddress: '127.0.0.1',
      tx: mockTx,
    });

    assert.equal(result.id, 'audit-1');
    assert.equal(capturedData.action, 'BOOKING_CREATED');
    assert.equal(capturedData.entityId, 'b-99');
  });

  it('recordAudit() should propagate error if tx rejects inside a transaction', async () => {
    const failingTx = {
      auditLog: {
        create: async () => {
          throw new Error('Transaction write failure');
        },
      },
    };

    await assert.rejects(
      () =>
        recordAudit({
          action: AUDIT_ACTIONS.BOOKING_CREATED,
          entity: 'Booking',
          tx: failingTx,
        }),
      /Transaction write failure/
    );
  });

  it('listAuditLogsQuerySchema should validate pagination and UUID filters', () => {
    const valid = listAuditLogsQuerySchema.safeParse({ page: '2', limit: '50', action: 'BOOKING_CREATED' });
    assert.equal(valid.success, true);
    assert.equal(valid.data.page, 2);
    assert.equal(valid.data.limit, 50);

    const badUuid = listAuditLogsQuerySchema.safeParse({ userId: 'not-a-uuid' });
    assert.equal(badUuid.success, false);
  });

  it('GET /api/v1/audit-logs should enforce 401 for unauthenticated and 403 for non-ADMIN roles', async () => {
    const unauth = await request(app).get('/api/v1/audit-logs');
    assert.equal(unauth.status, 401);

    const passengerToken = generateToken({ userId: 'u-p', role: 'PASSENGER', email: 'p@example.com' });
    const passRes = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${passengerToken}`);
    assert.equal(passRes.status, 403);

    const operatorToken = generateToken({ userId: 'u-op', role: 'OPERATOR', email: 'op@busbooking.local' });
    const opRes = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${operatorToken}`);
    assert.equal(opRes.status, 403);
  });

  it('GET /api/v1/audit-logs should return 400 on invalid query parameters for ADMIN', async () => {
    const adminToken = generateToken({ userId: 'u-admin', role: 'ADMIN', email: 'admin@busbooking.local' });
    const res = await request(app)
      .get('/api/v1/audit-logs?userId=invalid-uuid')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'Validation failed');
  });
});
