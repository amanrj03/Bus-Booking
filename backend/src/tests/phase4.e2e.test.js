const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { randomUUID } = require('node:crypto');
const app = require('../app');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');

const originalDelegates = {
  user: prisma.user,
  operator: prisma.operator,
  bus: prisma.bus,
  seat: prisma.seat,
  stop: prisma.stop,
  route: prisma.route,
  routeStop: prisma.routeStop,
  trip: prisma.trip,
  tripSeat: prisma.tripSeat,
  auditLog: prisma.auditLog,
  $transaction: prisma.$transaction,
};

function createInMemoryPhase4Db(opUserId) {
  const db = {
    users: [{ id: opUserId, email: 'op@zingbus.in', role: 'OPERATOR' }],
    operators: [],
    buses: [],
    seats: [],
    stops: [],
    routes: [],
    routeStops: [],
    trips: [],
    tripSeats: [],
    auditLogs: [],
  };

  function buildDelegates(target) {
    return {
      user: {
        findUnique: async ({ where }) => target.users.find((u) => u.id === where.id) || null,
      },
      operator: {
        findUnique: async ({ where }) =>
          target.operators.find((o) =>
            where.id ? o.id === where.id : o.userId === where.userId
          ) || null,
        create: async ({ data }) => {
          const rec = { id: randomUUID(), isActive: true, createdAt: new Date(), ...data };
          target.operators.push(rec);
          return rec;
        },
      },
      bus: {
        findUnique: async ({ where }) => {
          const b = target.buses.find((item) =>
            where.id ? item.id === where.id : item.busNumber === where.busNumber
          );
          if (!b) return null;
          return {
            ...b,
            operator: target.operators.find((o) => o.id === b.operatorId) || null,
            seats: target.seats.filter((s) => s.busId === b.id),
          };
        },
        findMany: async ({ where = {} } = {}) =>
          target.buses
            .filter((b) => (!where.operatorId || b.operatorId === where.operatorId))
            .map((b) => ({
              ...b,
              operator: target.operators.find((o) => o.id === b.operatorId),
              _count: {
                seats: target.seats.filter((s) => s.busId === b.id).length,
                trips: target.trips.filter((t) => t.busId === b.id).length,
              },
            })),
        count: async ({ where = {} } = {}) =>
          target.buses.filter((b) => !where.operatorId || b.operatorId === where.operatorId)
            .length,
        create: async ({ data }) => {
          const rec = { id: randomUUID(), isActive: true, createdAt: new Date(), ...data };
          target.buses.push(rec);
          return rec;
        },
      },
      seat: {
        createMany: async ({ data }) => {
          const inserted = data.map((item) => ({ id: randomUUID(), ...item }));
          target.seats.push(...inserted);
          return { count: inserted.length };
        },
      },
      stop: {
        findMany: async ({ where } = {}) => {
          if (where?.id?.in) {
            return target.stops.filter((s) => where.id.in.includes(s.id));
          }
          return target.stops;
        },
        create: async ({ data }) => {
          const rec = { id: randomUUID(), createdAt: new Date(), ...data };
          target.stops.push(rec);
          return rec;
        },
      },
      route: {
        findFirst: async ({ where }) =>
          target.routes.find(
            (r) =>
              r.sourceCity.toLowerCase() === where.sourceCity.equals.toLowerCase() &&
              r.destinationCity.toLowerCase() === where.destinationCity.equals.toLowerCase()
          ) || null,
        findUnique: async ({ where }) =>
          target.routes.find((r) => r.id === where.id) || null,
        create: async ({ data }) => {
          const rec = { id: randomUUID(), isActive: true, createdAt: new Date(), ...data };
          target.routes.push(rec);
          return rec;
        },
      },
      routeStop: {
        createMany: async ({ data }) => {
          const inserted = data.map((item) => ({ id: randomUUID(), ...item }));
          target.routeStops.push(...inserted);
          return { count: inserted.length };
        },
      },
      trip: {
        findFirst: async ({ where }) =>
          target.trips.find(
            (t) =>
              t.busId === where.busId &&
              t.status !== 'CANCELLED' &&
              t.departureTime < where.departureTime.lt &&
              t.arrivalTime > where.arrivalTime.gt
          ) || null,
        findUnique: async ({ where }) => {
          const t = target.trips.find((item) => item.id === where.id);
          if (!t) return null;
          const bus = target.buses.find((b) => b.id === t.busId);
          return {
            ...t,
            bus: {
              ...bus,
              operator: target.operators.find((o) => o.id === bus.operatorId),
            },
          };
        },
        findMany: async ({ where = {}, orderBy } = {}) => {
          const matched = target.trips.filter((t) => {
            const route = target.routes.find((r) => r.id === t.routeId);
            const bus = target.buses.find((b) => b.id === t.busId);
            if (where.status && t.status !== where.status) return false;
            if (where.route?.sourceCity?.contains) {
              if (!route.sourceCity.toLowerCase().includes(where.route.sourceCity.contains.toLowerCase())) {
                return false;
              }
            }
            if (where.route?.destinationCity?.contains) {
              if (
                !route.destinationCity
                  .toLowerCase()
                  .includes(where.route.destinationCity.contains.toLowerCase())
              ) {
                return false;
              }
            }
            if (where.bus?.busType && bus.busType !== where.bus.busType) return false;
            if (where.departureTime?.gte && t.departureTime < where.departureTime.gte) return false;
            if (where.departureTime?.lte && t.departureTime > where.departureTime.lte) return false;
            if (where.baseFare?.gte !== undefined && t.baseFare < where.baseFare.gte) return false;
            if (where.baseFare?.lte !== undefined && t.baseFare > where.baseFare.lte) return false;
            return true;
          });

          if (orderBy?.baseFare === 'asc') {
            matched.sort((a, b) => a.baseFare - b.baseFare);
          }

          return matched.map((t) => {
            const route = target.routes.find((r) => r.id === t.routeId);
            const bus = target.buses.find((b) => b.id === t.busId);
            const operator = target.operators.find((o) => o.id === bus.operatorId);
            const rStops = target.routeStops
              .filter((rs) => rs.routeId === route.id)
              .sort((a, b) => a.stopOrder - b.stopOrder)
              .map((rs) => ({
                ...rs,
                stop: target.stops.find((s) => s.id === rs.stopId),
              }));
            return {
              ...t,
              route: { ...route, routeStops: rStops },
              bus: { ...bus, operator },
              tripSeats: target.tripSeats.filter((ts) => ts.tripId === t.id),
            };
          });
        },
        count: async ({ where = {} } = {}) => {
          const items = await buildDelegates(target).trip.findMany({ where });
          return items.length;
        },
        create: async ({ data }) => {
          const rec = { id: randomUUID(), createdAt: new Date(), ...data };
          target.trips.push(rec);
          return rec;
        },
        update: async ({ where, data }) => {
          const t = target.trips.find((item) => item.id === where.id);
          Object.assign(t, data);
          return t;
        },
      },
      tripSeat: {
        createMany: async ({ data }) => {
          const inserted = data.map((item) => ({ id: randomUUID(), ...item }));
          target.tripSeats.push(...inserted);
          return { count: inserted.length };
        },
        findMany: async ({ where }) =>
          target.tripSeats
            .filter((ts) => ts.tripId === where.tripId && ts.status === where.status)
            .map((ts) => ({
              ...ts,
              seat: target.seats.find((s) => s.id === ts.seatId),
            })),
        update: async ({ where, data }) => {
          const ts = target.tripSeats.find((item) => item.id === where.id);
          Object.assign(ts, data);
          return ts;
        },
      },
      auditLog: {
        create: async ({ data }) => {
          const rec = { id: randomUUID(), createdAt: new Date(), ...data };
          target.auditLogs.push(rec);
          return rec;
        },
      },
    };
  }

  const delegates = buildDelegates(db);
  return { db, delegates };
}

describe('Phase 4 End-to-End Pipeline: Fleet -> Route -> Scheduling -> Public Search', () => {
  afterEach(() => {
    Object.assign(prisma, originalDelegates);
  });

  it('should provision operator, 36-seat sleeper bus, 3-stop route, schedule trip, enforce overlap conflict, and serve filtered search', async () => {
    const opUserId = randomUUID();
    const { db, delegates } = createInMemoryPhase4Db(opUserId);
    Object.assign(prisma, delegates);
    prisma.$transaction = async (fn) => fn(delegates);

    const adminToken = generateToken({ userId: randomUUID(), role: 'ADMIN', email: 'admin@bus.in' });
    const operatorToken = generateToken({ userId: opUserId, role: 'OPERATOR', email: 'op@zingbus.in' });

    // 1. Admin creates Operator linked to opUserId
    const opRes = await request(app)
      .post('/api/v1/fleet/operators')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Zingbus Premium',
        companyName: 'Zingbus Mobility Pvt Ltd',
        contactEmail: 'dispatch@zingbus.in',
        contactPhone: '9876543210',
        userId: opUserId,
      });
    assert.equal(opRes.status, 201);
    const operatorId = opRes.body.data.operator.id;

    // 2. Admin creates AC_SLEEPER_2X1 Bus -> 36 seats generated
    const busRes = await request(app)
      .post('/api/v1/fleet/buses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        operatorId,
        busNumber: 'DL01ZB4001',
        busType: 'AC_SLEEPER_2X1',
      });
    assert.equal(busRes.status, 201);
    assert.equal(busRes.body.data.bus.seatsGenerated, 36);
    const busId = busRes.body.data.bus.id;
    assert.equal(db.seats.length, 36);

    // Operator listing buses sees their assigned vehicle
    const opBusList = await request(app)
      .get('/api/v1/fleet/buses')
      .set('Authorization', `Bearer ${operatorToken}`);
    assert.equal(opBusList.status, 200);
    assert.equal(opBusList.body.data.buses.length, 1);

    // 3. Admin creates 3 stops & sequences Delhi -> Jaipur route
    const stop1 = await request(app)
      .post('/api/v1/routes/stops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ city: 'Delhi', stationName: 'Kashmere Gate ISBT' });
    const stop2 = await request(app)
      .post('/api/v1/routes/stops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ city: 'Gurugram', stationName: 'IFFCO Chowk' });
    const stop3 = await request(app)
      .post('/api/v1/routes/stops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ city: 'Jaipur', stationName: 'Sindhi Camp Bus Stand' });

    const routeRes = await request(app)
      .post('/api/v1/routes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceCity: 'Delhi',
        destinationCity: 'Jaipur',
        distanceKm: 280,
        estimatedMinutes: 300,
        stops: [
          { stopId: stop1.body.data.stop.id, stopOrder: 1, durationFromOriginMinutes: 0, distanceFromOriginKm: 0 },
          { stopId: stop2.body.data.stop.id, stopOrder: 2, durationFromOriginMinutes: 55, distanceFromOriginKm: 35 },
          { stopId: stop3.body.data.stop.id, stopOrder: 3, durationFromOriginMinutes: 300, distanceFromOriginKm: 280 },
        ],
      });
    assert.equal(routeRes.status, 201);
    assert.equal(routeRes.body.data.route.stopsConfigured, 3);
    const routeId = routeRes.body.data.route.id;

    // 4. Operator schedules morning departure at ₹750 base fare
    const tripRes = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        routeId,
        busId,
        departureTime: '2026-11-25T06:00:00.000Z',
        baseFare: 750,
      });
    assert.equal(tripRes.status, 201);
    assert.equal(tripRes.body.data.trip.tripSeatsGenerated, 36);
    assert.equal(db.tripSeats.length, 36);

    // 5. Scheduling an overlapping run on the same bus returns 409 Conflict
    const overlapRes = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        routeId,
        busId,
        departureTime: '2026-11-25T09:00:00.000Z',
        baseFare: 799,
      });
    assert.equal(overlapRes.status, 409);

    // 6. Public passenger searches Delhi -> Jaipur on 2026-11-25
    const searchRes = await request(app).get(
      '/api/v1/trips/search?sourceCity=Delhi&destinationCity=Jaipur&date=2026-11-25&busType=AC_SLEEPER_2X1&minPrice=600&maxPrice=900'
    );
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.body.data.trips.length, 1);
    assert.equal(searchRes.body.data.trips[0].availableSeatsCount, 36);
    assert.equal(searchRes.body.data.trips[0].minSeatPrice, 750);
    assert.equal(searchRes.body.data.trips[0].route.routeStops.length, 3);

    // Price filter excluding trip returns empty array
    const filteredOutRes = await request(app).get(
      '/api/v1/trips/search?sourceCity=Delhi&destinationCity=Jaipur&date=2026-11-25&minPrice=1200'
    );
    assert.equal(filteredOutRes.status, 200);
    assert.equal(filteredOutRes.body.data.trips.length, 0);

    // 7. Cancelling the trip hides it from public search
    const cancelRes = await request(app)
      .patch(`/api/v1/trips/${tripRes.body.data.trip.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'CANCELLED' });
    assert.equal(cancelRes.status, 200);

    const afterCancelSearch = await request(app).get(
      '/api/v1/trips/search?sourceCity=Delhi&destinationCity=Jaipur&date=2026-11-25'
    );
    assert.equal(afterCancelSearch.status, 200);
    assert.equal(afterCancelSearch.body.data.trips.length, 0);
  });

  it('should reject trip scheduling when route is inactive, bus is inactive, or bus has zero physical seats', async () => {
    const adminToken = generateToken({ userId: randomUUID(), role: 'ADMIN', email: 'admin@bus.in' });
    const routeId = randomUUID();
    const busId = randomUUID();

    // Inactive route
    prisma.route = { findUnique: async () => ({ id: routeId, isActive: false, estimatedMinutes: 240 }) };
    const inactiveRouteRes = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ routeId, busId, departureTime: '2026-11-25T10:00:00.000Z', baseFare: 500 });
    assert.equal(inactiveRouteRes.status, 400);

    // Active route, inactive bus
    prisma.route = { findUnique: async () => ({ id: routeId, isActive: true, estimatedMinutes: 240 }) };
    prisma.bus = { findUnique: async () => ({ id: busId, isActive: false, seats: [{ id: 's1' }] }) };
    const inactiveBusRes = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ routeId, busId, departureTime: '2026-11-25T10:00:00.000Z', baseFare: 500 });
    assert.equal(inactiveBusRes.status, 400);

    // Active bus, zero physical seats
    prisma.bus = { findUnique: async () => ({ id: busId, isActive: true, seats: [] }) };
    const emptySeatsRes = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ routeId, busId, departureTime: '2026-11-25T10:00:00.000Z', baseFare: 500 });
    assert.equal(emptySeatsRes.status, 400);
  });
});
