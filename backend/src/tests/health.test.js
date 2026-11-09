const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');

describe('API Health and Root Endpoints', () => {
  it('GET / should return service metadata', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Bus Booking Management System API');
    assert.equal(res.body.version, '1.0.0');
  });

  it('GET /api/v1/health should return 200 and operational status', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ONLINE');
    assert.ok(res.body.data.timestamp);
  });

  it('GET /unknown-route should return 404 with structured error', async () => {
    const res = await request(app).get('/unknown-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Route not found/);
  });
});
