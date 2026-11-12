const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { validateStopSequence } = require('../services/route.service');
const { createRouteSchema, createStopSchema, setRouteStopsSchema } = require('../validators/route.validator');

const originalRouteDelegate = prisma.route;
const originalStopDelegate = prisma.stop;
const originalAuditLogDelegate = prisma.auditLog;
const originalTransaction = prisma.$transaction;

const STOP_1_UUID = '11111111-1111-4111-8111-111111111111';
const STOP_2_UUID = '22222222-2222-4222-8222-222222222222';
const STOP_3_UUID = '33333333-3333-4333-8333-333333333333';
const ROUTE_UUID = '44444444-4444-4444-8444-444444444444';

describe('Route & Stop Sequencing Management', () => {
  afterEach(() => {
    prisma.route = originalRouteDelegate;
    prisma.stop = originalStopDelegate;
    prisma.auditLog = originalAuditLogDelegate;
    prisma.$transaction = originalTransaction;
  });

  describe('Stop Sequence Validator Unit Tests', () => {
    it('should sort and accept valid sequential stops 1..N with non-decreasing offsets', async () => {
      prisma.stop = {
        findMany: async () => [{ id: STOP_1_UUID }, { id: STOP_2_UUID }],
      };

      const ordered = await validateStopSequence([
        {
          stopId: STOP_2_UUID,
          stopOrder: 2,
          durationFromOriginMinutes: 180,
          distanceFromOriginKm: 150,
        },
        {
          stopId: STOP_1_UUID,
          stopOrder: 1,
          durationFromOriginMinutes: 0,
          distanceFromOriginKm: 0,
        },
      ]);

      assert.equal(ordered.length, 2);
      assert.equal(ordered[0].stopOrder, 1);
      assert.equal(ordered[0].stopId, STOP_1_UUID);
      assert.equal(ordered[1].stopOrder, 2);
      assert.equal(ordered[1].stopId, STOP_2_UUID);
    });

    it('should reject gaps in stopOrder (e.g. 1, 3)', async () => {
      await assert.rejects(
        () =>
          validateStopSequence([
            { stopId: STOP_1_UUID, stopOrder: 1, durationFromOriginMinutes: 0, distanceFromOriginKm: 0 },
            { stopId: STOP_2_UUID, stopOrder: 3, durationFromOriginMinutes: 90, distanceFromOriginKm: 80 },
          ]),
        (err) => err.statusCode === 400 && /expected order 2/.test(err.message)
      );
    });

    it('should reject duplicate stopId in the same route', async () => {
      await assert.rejects(
        () =>
          validateStopSequence([
            { stopId: STOP_1_UUID, stopOrder: 1, durationFromOriginMinutes: 0, distanceFromOriginKm: 0 },
            { stopId: STOP_1_UUID, stopOrder: 2, durationFromOriginMinutes: 60, distanceFromOriginKm: 50 },
          ]),
        (err) => err.statusCode === 400 && /Duplicate stopId/.test(err.message)
      );
    });

    it('should reject decreasing durationFromOriginMinutes along the sequence', async () => {
      await assert.rejects(
        () =>
          validateStopSequence([
            { stopId: STOP_1_UUID, stopOrder: 1, durationFromOriginMinutes: 120, distanceFromOriginKm: 50 },
            { stopId: STOP_2_UUID, stopOrder: 2, durationFromOriginMinutes: 90, distanceFromOriginKm: 80 },
          ]),
        (err) => err.statusCode === 400 && /durationFromOriginMinutes/.test(err.message)
      );
    });

    it('should throw 404 when a referenced stopId does not exist in DB', async () => {
      prisma.stop = {
        findMany: async () => [{ id: STOP_1_UUID }],
      };

      await assert.rejects(
        () =>
          validateStopSequence([
            { stopId: STOP_1_UUID, stopOrder: 1, durationFromOriginMinutes: 0, distanceFromOriginKm: 0 },
            { stopId: STOP_2_UUID, stopOrder: 2, durationFromOriginMinutes: 120, distanceFromOriginKm: 110 },
          ]),
        (err) => err.statusCode === 404 && /do not exist/.test(err.message)
      );
    });
  });

  describe('Route Zod Validator Tests', () => {
    it('should reject route creation when sourceCity equals destinationCity', () => {
      const result = createRouteSchema.safeParse({
        sourceCity: 'Bengaluru',
        destinationCity: 'bengaluru',
        distanceKm: 350,
        estimatedMinutes: 360,
      });
      assert.equal(result.success, false);
    });

    it('should accept valid stop and route-stop payloads', () => {
      assert.equal(
        createStopSchema.safeParse({
          city: 'Delhi',
          stationName: 'Kashmere Gate ISBT',
          landmark: 'Metro Gate 5',
        }).success,
        true
      );

      assert.equal(
        setRouteStopsSchema.safeParse({
          stops: [
            {
              stopId: STOP_1_UUID,
              stopOrder: 1,
              durationFromOriginMinutes: 0,
              distanceFromOriginKm: 0,
            },
          ],
        }).success,
        true
      );
    });
  });

  describe('Routes & Stops API Integration Tests', () => {
    it('GET /api/v1/routes and /api/v1/routes/stops should be publicly readable', async () => {
      prisma.route = {
        findMany: async () => [
          {
            id: ROUTE_UUID,
            sourceCity: 'Delhi',
            destinationCity: 'Jaipur',
            distanceKm: 280,
            estimatedMinutes: 310,
            isActive: true,
            routeStops: [],
            _count: { trips: 4 },
          },
        ],
        count: async () => 1,
      };
      prisma.stop = {
        findMany: async () => [
          { id: STOP_1_UUID, city: 'Delhi', stationName: 'Kashmere Gate ISBT' },
        ],
        count: async () => 1,
      };

      const routesRes = await request(app).get('/api/v1/routes');
      assert.equal(routesRes.status, 200);
      assert.equal(routesRes.body.data.routes.length, 1);

      const stopsRes = await request(app).get('/api/v1/routes/stops');
      assert.equal(stopsRes.status, 200);
      assert.equal(stopsRes.body.data.stops.length, 1);
    });

    it('should return 401 unauthenticated and 403 for non-ADMIN on route/stop mutations', async () => {
      const unauthRes = await request(app).post('/api/v1/routes/stops').send({
        city: 'Pune',
        stationName: 'Swargate Bus Stand',
      });
      assert.equal(unauthRes.status, 401);

      const opToken = generateToken({
        userId: 'op-1',
        role: 'OPERATOR',
        email: 'op@bus.in',
      });

      const forbiddenRes = await request(app)
        .post('/api/v1/routes')
        .set('Authorization', `Bearer ${opToken}`)
        .send({
          sourceCity: 'Mumbai',
          destinationCity: 'Pune',
          distanceKm: 150,
          estimatedMinutes: 195,
        });
      assert.equal(forbiddenRes.status, 403);
    });

    it('POST /api/v1/routes should create a route with ordered stops atomically and log ROUTE_CREATED', async () => {
      let createdStops = [];
      let auditPayload = null;

      prisma.route = {
        findFirst: async () => null,
      };
      prisma.stop = {
        findMany: async () => [{ id: STOP_1_UUID }, { id: STOP_2_UUID }],
      };
      prisma.$transaction = async (fn) => {
        const mockTx = {
          route: {
            create: async ({ data }) => ({
              id: ROUTE_UUID,
              ...data,
              isActive: true,
              createdAt: new Date(),
            }),
          },
          routeStop: {
            createMany: async ({ data }) => {
              createdStops = data;
              return { count: data.length };
            },
          },
          auditLog: {
            create: async ({ data }) => {
              auditPayload = data;
              return { id: 'audit-route-1', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const adminToken = generateToken({
        userId: 'admin-1',
        role: 'ADMIN',
        email: 'admin@bus.in',
      });

      const res = await request(app)
        .post('/api/v1/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceCity: 'Mumbai',
          destinationCity: 'Pune',
          distanceKm: 150,
          estimatedMinutes: 195,
          stops: [
            {
              stopId: STOP_2_UUID,
              stopOrder: 2,
              durationFromOriginMinutes: 195,
              distanceFromOriginKm: 150,
            },
            {
              stopId: STOP_1_UUID,
              stopOrder: 1,
              durationFromOriginMinutes: 0,
              distanceFromOriginKm: 0,
            },
          ],
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.route.id, ROUTE_UUID);
      assert.equal(res.body.data.route.stopsConfigured, 2);
      assert.equal(createdStops.length, 2);
      assert.equal(createdStops[0].stopOrder, 1);
      assert.equal(createdStops[0].stopId, STOP_1_UUID);
      assert.equal(auditPayload.action, 'ROUTE_CREATED');
    });

    it('POST /api/v1/routes should return 409 Conflict when city pair already exists', async () => {
      prisma.route = {
        findFirst: async () => ({ id: ROUTE_UUID, sourceCity: 'Mumbai', destinationCity: 'Pune' }),
      };

      const adminToken = generateToken({
        userId: 'admin-1',
        role: 'ADMIN',
        email: 'admin@bus.in',
      });

      const res = await request(app)
        .post('/api/v1/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceCity: 'Mumbai',
          destinationCity: 'Pune',
          distanceKm: 150,
          estimatedMinutes: 195,
        });

      assert.equal(res.status, 409);
    });

    it('PUT /api/v1/routes/:id/stops should re-sequence stops atomically and log ROUTE_UPDATED', async () => {
      let deletedRouteId = null;
      let insertedStops = [];
      let auditPayload = null;

      prisma.route = {
        findUnique: async () => ({ id: ROUTE_UUID, sourceCity: 'Mumbai', destinationCity: 'Pune' }),
      };
      prisma.stop = {
        findMany: async () => [{ id: STOP_1_UUID }, { id: STOP_2_UUID }, { id: STOP_3_UUID }],
      };
      prisma.$transaction = async (fn) => {
        const mockTx = {
          routeStop: {
            deleteMany: async ({ where }) => {
              deletedRouteId = where.routeId;
              return { count: 2 };
            },
            createMany: async ({ data }) => {
              insertedStops = data;
              return { count: data.length };
            },
          },
          auditLog: {
            create: async ({ data }) => {
              auditPayload = data;
              return { id: 'audit-route-seq', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const adminToken = generateToken({
        userId: 'admin-1',
        role: 'ADMIN',
        email: 'admin@bus.in',
      });

      const res = await request(app)
        .put(`/api/v1/routes/${ROUTE_UUID}/stops`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stops: [
            { stopId: STOP_1_UUID, stopOrder: 1, durationFromOriginMinutes: 0, distanceFromOriginKm: 0 },
            { stopId: STOP_2_UUID, stopOrder: 2, durationFromOriginMinutes: 75, distanceFromOriginKm: 60 },
            { stopId: STOP_3_UUID, stopOrder: 3, durationFromOriginMinutes: 195, distanceFromOriginKm: 150 },
          ],
        });

      assert.equal(res.status, 200);
      assert.equal(deletedRouteId, ROUTE_UUID);
      assert.equal(insertedStops.length, 3);
      assert.equal(res.body.data.routeStops.length, 3);
      assert.equal(auditPayload.action, 'ROUTE_UPDATED');
    });
  });
});
