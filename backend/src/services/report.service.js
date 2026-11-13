const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

function buildDateRangeFilter(fromDate, toDate) {
  if (!fromDate && !toDate) return undefined;
  const range = {};
  if (fromDate) range.gte = new Date(`${fromDate}T00:00:00.000Z`);
  if (toDate) range.lte = new Date(`${toDate}T23:59:59.999Z`);
  return range;
}

/**
 * Generates seat-by-seat Passenger Manifest and occupancy summary for a specific trip.
 */
async function getTripPassengerManifest(tripId, userContext, { includeCancelled = false } = {}) {
  if (!tripId) {
    throw new AppError('tripId is required to generate passenger manifest.', 400);
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      route: {
        include: {
          routeStops: {
            orderBy: { stopOrder: 'asc' },
            include: { stop: true },
          },
        },
      },
      bus: {
        include: {
          operator: {
            select: {
              id: true,
              userId: true,
              name: true,
              companyName: true,
              contactPhone: true,
            },
          },
        },
      },
      tripSeats: {
        orderBy: { seatNumber: 'asc' },
      },
      bookings: {
        where: includeCancelled ? undefined : { status: 'CONFIRMED' },
        include: {
          passengers: true,
          seats: true,
          payment: true,
          cancellation: true,
        },
      },
    },
  });

  if (!trip) {
    throw new AppError('Trip not found for passenger manifest', 404);
  }

  if (
    userContext?.role === 'OPERATOR' &&
    trip.bus?.operator?.userId !== userContext.userId
  ) {
    throw new AppError(
      'Forbidden: Cannot view passenger manifest for another operator fleet.',
      403
    );
  }

  const now = new Date();
  const tripSeats = trip.tripSeats || [];
  const totalSeats = tripSeats.length || trip.bus?.totalSeats || 0;
  const bookedSeatsCount = tripSeats.filter((s) => s.status === 'BOOKED').length;
  const lockedSeatsCount = tripSeats.filter(
    (s) => s.status === 'LOCKED' && s.lockedUntil && new Date(s.lockedUntil) > now
  ).length;
  const availableSeatsCount = Math.max(0, totalSeats - bookedSeatsCount - lockedSeatsCount);
  const occupancyRate =
    totalSeats > 0 ? Number(((bookedSeatsCount / totalSeats) * 100).toFixed(1)) : 0;

  const manifestRows = [];
  let confirmedRevenue = 0;
  let confirmedPassengersCount = 0;

  for (const booking of trip.bookings || []) {
    if (booking.status === 'CONFIRMED') {
      confirmedRevenue += Number(booking.totalAmount || 0);
    }

    const seatPriceByNumber = new Map(
      (booking.seats || []).map((bs) => [bs.seatNumber, Number(bs.seatPrice || 0)])
    );

    for (const passenger of booking.passengers || []) {
      if (booking.status === 'CONFIRMED') {
        confirmedPassengersCount += 1;
      }

      manifestRows.push({
        seatNumber: passenger.seatNumber,
        passengerName: passenger.fullName,
        age: passenger.age,
        gender: passenger.gender,
        pnr: booking.pnr,
        bookingId: booking.id,
        bookingStatus: booking.status,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        seatPrice: seatPriceByNumber.get(passenger.seatNumber) ?? Number(trip.baseFare || 0),
        paymentStatus: booking.payment?.paymentStatus || 'SUCCESS',
        cancellationFee: booking.cancellation
          ? Number(booking.cancellation.cancellationFee)
          : null,
        refundAmount: booking.cancellation ? Number(booking.cancellation.refundAmount) : null,
        bookedAt: booking.createdAt,
      });
    }
  }

  manifestRows.sort((a, b) =>
    String(a.seatNumber).localeCompare(String(b.seatNumber), undefined, { numeric: true })
  );

  return {
    trip: {
      id: trip.id,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      status: trip.status,
      baseFare: Number(trip.baseFare || 0),
      route: trip.route,
      bus: trip.bus
        ? {
            id: trip.bus.id,
            busNumber: trip.bus.busNumber,
            busType: trip.bus.busType,
            totalSeats: trip.bus.totalSeats,
            operator: trip.bus.operator
              ? {
                  id: trip.bus.operator.id,
                  name: trip.bus.operator.name,
                  companyName: trip.bus.operator.companyName,
                  contactPhone: trip.bus.operator.contactPhone,
                }
              : null,
          }
        : null,
    },
    metrics: {
      totalSeats,
      bookedSeatsCount,
      lockedSeatsCount,
      availableSeatsCount,
      occupancyRate,
      confirmedPassengersCount,
      confirmedRevenue: Number(confirmedRevenue.toFixed(2)),
    },
    manifest: manifestRows,
  };
}

/**
 * Computes trip-level, route-level, and system-wide Seat Occupancy % metrics.
 */
async function getOccupancyReport(
  { fromDate, toDate, routeId, operatorId, page = 1, limit = 20 } = {},
  userContext
) {
  const where = {
    status: { not: 'CANCELLED' },
  };

  const departureFilter = buildDateRangeFilter(fromDate, toDate);
  if (departureFilter) {
    where.departureTime = departureFilter;
  }
  if (routeId) {
    where.routeId = routeId;
  }

  if (userContext?.role === 'OPERATOR') {
    where.bus = {
      operator: {
        userId: userContext.userId,
      },
    };
  } else if (operatorId) {
    where.bus = { operatorId };
  }

  const trips = await prisma.trip.findMany({
    where,
    orderBy: { departureTime: 'desc' },
    select: {
      id: true,
      departureTime: true,
      arrivalTime: true,
      status: true,
      baseFare: true,
      route: {
        select: {
          id: true,
          sourceCity: true,
          destinationCity: true,
        },
      },
      bus: {
        select: {
          busNumber: true,
          busType: true,
          totalSeats: true,
          operator: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
        },
      },
      tripSeats: {
        select: {
          status: true,
        },
      },
    },
  });

  let totalCapacity = 0;
  let totalBookedSeats = 0;
  const routeGroups = new Map();

  const allTripSummaries = trips.map((trip) => {
    const seats = trip.tripSeats || [];
    const totalSeats = seats.length || trip.bus?.totalSeats || 0;
    const bookedSeats = seats.filter((s) => s.status === 'BOOKED').length;
    const availableSeats = Math.max(0, totalSeats - bookedSeats);
    const occupancyRate =
      totalSeats > 0 ? Number(((bookedSeats / totalSeats) * 100).toFixed(1)) : 0;

    totalCapacity += totalSeats;
    totalBookedSeats += bookedSeats;

    if (trip.route) {
      const rId = trip.route.id;
      const existing = routeGroups.get(rId) || {
        routeId: rId,
        sourceCity: trip.route.sourceCity,
        destinationCity: trip.route.destinationCity,
        routeLabel: `${trip.route.sourceCity} → ${trip.route.destinationCity}`,
        tripsCount: 0,
        totalCapacity: 0,
        bookedSeats: 0,
      };
      existing.tripsCount += 1;
      existing.totalCapacity += totalSeats;
      existing.bookedSeats += bookedSeats;
      routeGroups.set(rId, existing);
    }

    return {
      tripId: trip.id,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      status: trip.status,
      busNumber: trip.bus?.busNumber || '--',
      busType: trip.bus?.busType || '--',
      operatorName: trip.bus?.operator?.companyName || trip.bus?.operator?.name || 'Carrier',
      routeId: trip.route?.id,
      routeLabel: trip.route
        ? `${trip.route.sourceCity} → ${trip.route.destinationCity}`
        : 'Unknown Route',
      totalSeats,
      bookedSeats,
      availableSeats,
      occupancyRate,
    };
  });

  const byRoute = Array.from(routeGroups.values())
    .map((rg) => ({
      ...rg,
      occupancyRate:
        rg.totalCapacity > 0
          ? Number(((rg.bookedSeats / rg.totalCapacity) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.occupancyRate - a.occupancyRate);

  const totalTrips = allTripSummaries.length;
  const startIdx = (page - 1) * limit;
  const paginatedTrips = allTripSummaries.slice(startIdx, startIdx + limit);

  return {
    summary: {
      totalTrips,
      totalCapacity,
      totalBookedSeats,
      totalAvailableSeats: Math.max(0, totalCapacity - totalBookedSeats),
      averageOccupancyRate:
        totalCapacity > 0
          ? Number(((totalBookedSeats / totalCapacity) * 100).toFixed(1))
          : 0,
    },
    byRoute,
    trips: paginatedTrips,
    pagination: {
      page,
      limit,
      total: totalTrips,
      totalPages: Math.max(1, Math.ceil(totalTrips / limit)),
    },
  };
}

/**
 * Generates aggregated Revenue Summary, Daily Trend, Route Breakdown & Operator Share.
 */
async function getRevenueSummaryReport(
  { fromDate, toDate, routeId, operatorId } = {},
  userContext
) {
  const where = {};

  const createdFilter = buildDateRangeFilter(fromDate, toDate);
  if (createdFilter) {
    where.createdAt = createdFilter;
  }

  const tripFilter = {};
  if (routeId) {
    tripFilter.routeId = routeId;
  }
  if (userContext?.role === 'OPERATOR') {
    tripFilter.bus = {
      operator: {
        userId: userContext.userId,
      },
    };
  } else if (operatorId) {
    tripFilter.bus = { operatorId };
  }

  if (Object.keys(tripFilter).length > 0) {
    where.trip = tripFilter;
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      passengers: {
        select: { id: true },
      },
      cancellation: {
        select: {
          cancellationFee: true,
          refundAmount: true,
        },
      },
      trip: {
        select: {
          route: {
            select: {
              id: true,
              sourceCity: true,
              destinationCity: true,
            },
          },
          bus: {
            select: {
              operator: {
                select: {
                  id: true,
                  name: true,
                  companyName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let confirmedBookingsCount = 0;
  let cancelledBookingsCount = 0;
  let totalPassengers = 0;
  let grossRevenue = 0;
  let confirmedRevenue = 0;
  let totalRefunded = 0;
  let retainedCancellationFees = 0;

  const dailyMap = new Map();
  const routeMap = new Map();
  const operatorMap = new Map();

  for (const b of bookings) {
    const amount = Number(b.totalAmount || 0);
    const passengerCount = b.passengers?.length || 0;
    const isConfirmed = b.status === 'CONFIRMED';
    const refundAmt = b.cancellation ? Number(b.cancellation.refundAmount || 0) : 0;
    const feeAmt = b.cancellation ? Number(b.cancellation.cancellationFee || 0) : 0;

    grossRevenue += amount;

    if (isConfirmed) {
      confirmedBookingsCount += 1;
      totalPassengers += passengerCount;
      confirmedRevenue += amount;
    } else {
      cancelledBookingsCount += 1;
      totalRefunded += refundAmt;
      retainedCancellationFees += feeAmt;
    }

    const dayKey = new Date(b.createdAt).toISOString().slice(0, 10);
    const dayEntry = dailyMap.get(dayKey) || {
      date: dayKey,
      confirmedRevenue: 0,
      refunds: 0,
      netRevenue: 0,
      bookingsCount: 0,
    };
    dayEntry.bookingsCount += 1;
    if (isConfirmed) {
      dayEntry.confirmedRevenue += amount;
      dayEntry.netRevenue += amount;
    } else {
      dayEntry.refunds += refundAmt;
      dayEntry.netRevenue += feeAmt;
    }
    dailyMap.set(dayKey, dayEntry);

    const route = b.trip?.route;
    if (route) {
      const rEntry = routeMap.get(route.id) || {
        routeId: route.id,
        routeLabel: `${route.sourceCity} → ${route.destinationCity}`,
        revenue: 0,
        bookingsCount: 0,
        passengersCount: 0,
      };
      rEntry.bookingsCount += 1;
      if (isConfirmed) {
        rEntry.revenue += amount;
        rEntry.passengersCount += passengerCount;
      } else {
        rEntry.revenue += feeAmt;
      }
      routeMap.set(route.id, rEntry);
    }

    const op = b.trip?.bus?.operator;
    if (op) {
      const opEntry = operatorMap.get(op.id) || {
        operatorId: op.id,
        operatorName: op.companyName || op.name,
        revenue: 0,
        bookingsCount: 0,
      };
      opEntry.bookingsCount += 1;
      opEntry.revenue += isConfirmed ? amount : feeAmt;
      operatorMap.set(op.id, opEntry);
    }
  }

  const netRevenue = Number((confirmedRevenue + retainedCancellationFees).toFixed(2));

  const dailyTrend = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      confirmedRevenue: Number(d.confirmedRevenue.toFixed(2)),
      refunds: Number(d.refunds.toFixed(2)),
      netRevenue: Number(d.netRevenue.toFixed(2)),
    }));

  const byRoute = Array.from(routeMap.values())
    .map((r) => ({ ...r, revenue: Number(r.revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue);

  const byOperator = Array.from(operatorMap.values())
    .map((op) => ({
      ...op,
      revenue: Number(op.revenue.toFixed(2)),
      sharePercentage:
        netRevenue > 0 ? Number(((op.revenue / netRevenue) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  let activeFleetCount = null;
  if (typeof prisma.bus?.count === 'function') {
    const busWhere =
      userContext?.role === 'OPERATOR'
        ? { isActive: true, operator: { userId: userContext.userId } }
        : operatorId
        ? { isActive: true, operatorId }
        : { isActive: true };
    activeFleetCount = await prisma.bus.count({ where: busWhere });
  }

  return {
    kpis: {
      grossBookingsCount: bookings.length,
      confirmedBookingsCount,
      cancelledBookingsCount,
      totalPassengers,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      confirmedRevenue: Number(confirmedRevenue.toFixed(2)),
      totalRefunded: Number(totalRefunded.toFixed(2)),
      retainedCancellationFees: Number(retainedCancellationFees.toFixed(2)),
      netRevenue,
      ...(activeFleetCount !== null ? { activeFleetCount } : {}),
    },
    dailyTrend,
    byRoute,
    byOperator,
  };
}

module.exports = {
  getTripPassengerManifest,
  getOccupancyReport,
  getRevenueSummaryReport,
};

