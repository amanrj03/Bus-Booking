const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { generateBusSeats } = require('../utils/seatGenerator');
const { createOperatorSchema, createBusSchema } = require('../validators/fleet.validator');

const originalOperatorDelegate = prisma.operator;
const originalBusDelegate = prisma.bus;
const originalAuditLogDelegate = prisma.auditLog;
const originalTransaction = prisma.$transaction;

const SAMPLE_OPERATOR_UUID = '11111111-1111-4111-8111-111111111111';
const SAMPLE_BUS_UUID = '22222222-2222-4222-8222-222222222222';

describe('Fleet Management (Seat Generator, Operators & Buses)', () => {
  afterEach(() => {
    prisma.operator = originalOperatorDelegate;
    prisma.bus = originalBusDelegate;
    prisma.auditLog = originalAuditLogDelegate;
    prisma.$transaction = originalTransaction;
  });

  describe('Seat Generator Unit Tests', () => {
    it('should generate 40 seats across 10 rows on deck 1 for AC_SEATER_2X2', () => {
      const seats = generateBusSeats(SAMPLE_BUS_UUID, 'AC_SEATER_2X2');
      assert.equal(seats.length, 40);

      const firstSeat = seats.find((s) => s.seatNumber === '1A');
      assert.equal(firstSeat.deck, 1);
      assert.equal(firstSeat.row, 1);
      assert.equal(firstSeat.column, 1);
      assert.equal(firstSeat.seatType, 'WINDOW');
      assert.equal(firstSeat.isAccessible, true);

      const lastSeat = seats.find((s) => s.seatNumber === '10D');
      assert.equal(lastSeat.deck, 1);
      assert.equal(lastSeat.row, 10);
      assert.equal(lastSeat.column, 4);
      assert.equal(lastSeat.seatType, 'WINDOW');
      assert.equal(lastSeat.isAccessible, false);
    });

    it('should generate 36 seats across 2 decks for AC_SLEEPER_2X1', () => {
      const seats = generateBusSeats(SAMPLE_BUS_UUID, 'AC_SLEEPER_2X1');
      assert.equal(seats.length, 36);

      const lowerFirst = seats.find((s) => s.seatNumber === 'L1A');
      assert.equal(lowerFirst.deck, 1);
      assert.equal(lowerFirst.seatType, 'SLEEPER');
      assert.equal(lowerFirst.isAccessible, true);

      const upperLast = seats.find((s) => s.seatNumber === 'U6C');
      assert.equal(upperLast.deck, 2);
      assert.equal(upperLast.row, 6);
      assert.equal(upperLast.column, 3);
      assert.equal(upperLast.seatType, 'WINDOW');
      assert.equal(upperLast.isAccessible, false);
    });

    it('should support custom row counts for both layouts', () => {
      assert.equal(generateBusSeats(SAMPLE_BUS_UUID, 'NON_AC_SEATER_2X2', 8).length, 32);
      assert.equal(generateBusSeats(SAMPLE_BUS_UUID, 'AC_SLEEPER_2X1', 5).length, 30);
    });
  });

  describe('Fleet Zod Validator Tests', () => {
    it('should accept valid operator and bus payloads', () => {
      const opResult = createOperatorSchema.safeParse({
        name: 'VRL Travels',
        companyName: 'VRL Logistics Ltd',
        contactEmail: 'Ops@VrlBus.in',
        contactPhone: '+91 9876543210',
      });
      assert.equal(opResult.success, true);
      assert.equal(opResult.data.contactEmail, 'ops@vrlbus.in');

      const busResult = createBusSchema.safeParse({
        operatorId: SAMPLE_OPERATOR_UUID,
        busNumber: 'ka-01-ab-1234',
        busType: 'AC_SEATER_2X2',
      });
      assert.equal(busResult.success, true);
      assert.equal(busResult.data.busNumber, 'KA-01-AB-1234');
    });

    it('should reject invalid phone number and short bus registration', () => {
      const badOp = createOperatorSchema.safeParse({
        name: 'Bad Operator',
        companyName: 'Bad Co',
        contactEmail: 'bad@example.com',
        contactPhone: '12345',
      });
      assert.equal(badOp.success, false);

      const badBus = createBusSchema.safeParse({
        operatorId: SAMPLE_OPERATOR_UUID,
        busNumber: 'KA1',
        busType: 'AC_SLEEPER_2X1',
      });
      assert.equal(badBus.success, false);
    });
  });

  describe('Fleet Endpoints & RBAC Integration Tests', () => {
    it('should return 401 when unauthenticated on fleet endpoints', async () => {
      const res = await request(app).get('/api/v1/fleet/operators');
      assert.equal(res.status, 401);

      const busRes = await request(app).post('/api/v1/fleet/buses').send({});
      assert.equal(busRes.status, 401);
    });

    it('should forbid PASSENGER from listing operators and forbid OPERATOR from creating buses', async () => {
      const passengerToken = generateToken({
        userId: 'user-pass-1',
        role: 'PASSENGER',
        email: 'pass@example.com',
      });
      const opToken = generateToken({
        userId: 'user-op-1',
        role: 'OPERATOR',
        email: 'op@example.com',
      });

      const passRes = await request(app)
        .get('/api/v1/fleet/operators')
        .set('Authorization', `Bearer ${passengerToken}`);
      assert.equal(passRes.status, 403);

      const opRes = await request(app)
        .post('/api/v1/fleet/buses')
        .set('Authorization', `Bearer ${opToken}`)
        .send({
          operatorId: SAMPLE_OPERATOR_UUID,
          busNumber: 'KA01AB1234',
          busType: 'AC_SEATER_2X2',
        });
      assert.equal(opRes.status, 403);
    });

    it('POST /api/v1/fleet/operators should allow ADMIN to create an operator and log audit', async () => {
      let auditPayload = null;

      prisma.operator = {
        create: async ({ data }) => ({
          id: SAMPLE_OPERATOR_UUID,
          ...data,
          isActive: true,
          createdAt: new Date(),
        }),
      };
      prisma.auditLog = {
        create: async ({ data }) => {
          auditPayload = data;
          return { id: 'audit-op-1', ...data };
        },
      };

      const adminToken = generateToken({
        userId: 'admin-1',
        role: 'ADMIN',
        email: 'admin@busbook.in',
      });

      const res = await request(app)
        .post('/api/v1/fleet/operators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'SRS Travels',
          companyName: 'SRS Fleet Pvt Ltd',
          contactEmail: 'fleet@srs.in',
          contactPhone: '9876543210',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.operator.id, SAMPLE_OPERATOR_UUID);
      assert.equal(auditPayload.action, 'OPERATOR_CREATED');
    });

    it('POST /api/v1/fleet/buses with ADMIN JWT should create bus, generate 40 seats, and log BUS_CREATED', async () => {
      let insertedSeats = [];
      let auditPayload = null;

      prisma.operator = {
        findUnique: async () => ({
          id: SAMPLE_OPERATOR_UUID,
          name: 'SRS Travels',
        }),
      };
      prisma.bus = {
        findUnique: async () => null,
      };
      prisma.$transaction = async (fn) => {
        const mockTx = {
          bus: {
            create: async ({ data }) => ({
              id: SAMPLE_BUS_UUID,
              ...data,
              isActive: true,
              createdAt: new Date(),
            }),
          },
          seat: {
            createMany: async ({ data }) => {
              insertedSeats = data;
              return { count: data.length };
            },
          },
          auditLog: {
            create: async ({ data }) => {
              auditPayload = data;
              return { id: 'audit-bus-1', ...data };
            },
          },
        };
        return fn(mockTx);
      };

      const adminToken = generateToken({
        userId: 'admin-1',
        role: 'ADMIN',
        email: 'admin@busbook.in',
      });

      const res = await request(app)
        .post('/api/v1/fleet/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          operatorId: SAMPLE_OPERATOR_UUID,
          busNumber: 'KA01F9988',
          busType: 'AC_SEATER_2X2',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.bus.totalSeats, 40);
      assert.equal(res.body.data.bus.seatsGenerated, 40);
      assert.equal(insertedSeats.length, 40);
      assert.equal(auditPayload.action, 'BUS_CREATED');
      assert.equal(auditPayload.entityId, SAMPLE_BUS_UUID);
    });

    it('POST /api/v1/fleet/buses should return 409 Conflict when busNumber already exists', async () => {
      prisma.operator = {
        findUnique: async () => ({ id: SAMPLE_OPERATOR_UUID }),
      };
      prisma.bus = {
        findUnique: async () => ({ id: SAMPLE_BUS_UUID, busNumber: 'KA01F9988' }),
      };

      const adminToken = generateToken({
        userId: 'admin-1',
        role: 'ADMIN',
        email: 'admin@busbook.in',
      });

      const res = await request(app)
        .post('/api/v1/fleet/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          operatorId: SAMPLE_OPERATOR_UUID,
          busNumber: 'ka01f9988',
          busType: 'AC_SEATER_2X2',
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });

    it('PATCH /api/v1/fleet/buses/:id should return 403 if OPERATOR does not own the vehicle, and 200 if owned', async () => {
      let auditPayload = null;

      prisma.bus = {
        findUnique: async () => ({
          id: SAMPLE_BUS_UUID,
          busNumber: 'KA01F9988',
          operator: { userId: 'owner-op-1' },
        }),
        update: async ({ data }) => ({
          id: SAMPLE_BUS_UUID,
          busNumber: 'KA01F9988',
          ...data,
        }),
      };
      prisma.auditLog = {
        create: async ({ data }) => {
          auditPayload = data;
          return { id: 'audit-bus-upd', ...data };
        },
      };

      const otherOperatorToken = generateToken({
        userId: 'other-op-2',
        role: 'OPERATOR',
        email: 'other@op.in',
      });

      const forbiddenRes = await request(app)
        .patch(`/api/v1/fleet/buses/${SAMPLE_BUS_UUID}`)
        .set('Authorization', `Bearer ${otherOperatorToken}`)
        .send({ isActive: false });

      assert.equal(forbiddenRes.status, 403);

      const ownerToken = generateToken({
        userId: 'owner-op-1',
        role: 'OPERATOR',
        email: 'owner@op.in',
      });

      const okRes = await request(app)
        .patch(`/api/v1/fleet/buses/${SAMPLE_BUS_UUID}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ isActive: false });

      assert.equal(okRes.status, 200);
      assert.equal(okRes.body.data.bus.isActive, false);
      assert.equal(auditPayload.action, 'BUS_UPDATED');
    });

    it('GET /api/v1/fleet/buses/:id should return bus details and seat layout for OPERATOR', async () => {
      const sampleSeats = generateBusSeats(SAMPLE_BUS_UUID, 'AC_SLEEPER_2X1');

      prisma.bus = {
        findUnique: async () => ({
          id: SAMPLE_BUS_UUID,
          busNumber: 'KA01SL1111',
          busType: 'AC_SLEEPER_2X1',
          totalSeats: 36,
          operator: { id: SAMPLE_OPERATOR_UUID, name: 'VRL Travels', companyName: 'VRL Ltd' },
          seats: sampleSeats,
        }),
      };

      const opToken = generateToken({
        userId: 'op-1',
        role: 'OPERATOR',
        email: 'op@vrl.in',
      });

      const res = await request(app)
        .get(`/api/v1/fleet/buses/${SAMPLE_BUS_UUID}`)
        .set('Authorization', `Bearer ${opToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.bus.seats.length, 36);
    });
  });
});
