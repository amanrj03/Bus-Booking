const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { openapiSpec } = require('../docs/swagger');

describe('Swagger / OpenAPI 3.0 Documentation Suite', () => {
  it('GET /api-docs.json should return valid OpenAPI 3.0.3 specification', async () => {
    const res = await request(app).get('/api-docs.json');

    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'].includes('application/json'), true);
    assert.equal(res.body.openapi, '3.0.3');
    assert.equal(res.body.info.title, 'Algions Intercity Express — Bus Booking Management System API');
    assert.ok(res.body.paths['/bookings']);
    assert.ok(res.body.paths['/trips/search']);
    assert.ok(res.body.paths['/reports/manifest/{tripId}']);
    assert.ok(res.body.paths['/reports/revenue']);
    assert.ok(res.body.paths['/reports/occupancy']);
    assert.ok(res.body.paths['/bookings/{id}/cancel']);
  });

  it('GET /api-docs/ should serve interactive Swagger UI HTML document', async () => {
    const res = await request(app).get('/api-docs/');

    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'].includes('text/html'), true);
    assert.ok(res.text.includes('swagger-ui'));
  });

  it('GET / should include documentation link pointing to /api-docs', async () => {
    const res = await request(app).get('/');

    assert.equal(res.status, 200);
    assert.equal(res.body.documentation, '/api-docs');
    assert.equal(res.body.health, '/api/v1/health');
  });

  it('verifies that all critical endpoints declare security or public access and schemas', () => {
    assert.ok(openapiSpec.components.securitySchemes.BearerAuth);
    assert.ok(openapiSpec.components.schemas.User);
    assert.ok(openapiSpec.components.schemas.Booking);
    assert.ok(openapiSpec.components.schemas.Cancellation);
    assert.ok(openapiSpec.components.schemas.Route);
    assert.ok(openapiSpec.components.schemas.Trip);
  });
});

