const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { recordAudit, AUDIT_ACTIONS } = require('./audit.service');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(str) {
  return typeof str === 'string' && UUID_REGEX.test(str);
}

/**
 * Calculates cancellation fee deduction and refund amount based on time before departure:
 * - > 24 hours: 10% fee, 90% refund (Tier 1)
 * - 12 to 24 hours: 25% fee, 75% refund (Tier 2)
 * - 0 to < 12 hours: 50% fee, 50% refund (Tier 3)
 * - <= 0 hours (past departure): non-refundable, cannot cancel
 */
function calculateCancellationRefund(totalAmount, departureTime, now = new Date()) {
  const departureDate = new Date(departureTime);
  const nowDate = new Date(now);
  const diffMs = departureDate.getTime() - nowDate.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  if (hoursRemaining <= 0) {
    throw new AppError(
      'Cannot cancel booking after scheduled coach departure time.',
      400
    );
  }

  let tier;
  let feePercentage;
  let policyText;

  if (hoursRemaining > 24) {
    tier = 'TIER_1_STANDARD';
    feePercentage = 10;
    policyText = 'Standard cancellation (> 24 hrs before departure): 10% deduction, 90% refund';
  } else if (hoursRemaining >= 12) {
    tier = 'TIER_2_MODERATE';
    feePercentage = 25;
    policyText = 'Mid-window cancellation (12–24 hrs before departure): 25% deduction, 75% refund';
  } else {
    tier = 'TIER_3_LATE';
    feePercentage = 50;
    policyText = 'Late cancellation (< 12 hrs before departure): 50% deduction, 50% refund';
  }

  const total = Number(totalAmount || 0);
  const fee = Math.round(((total * feePercentage) / 100) * 100) / 100;
  const refund = Math.round((total - fee) * 100) / 100;

  return {
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    tier,
    feePercentage,
    totalAmount: total,
    cancellationFee: fee,
    refundAmount: refund,
    policyText,
  };
}

/**
 * Verifies caller authorization against booking record.
 */
function verifyCancellationAuth(booking, actorUser, guestCredentials = {}) {
  if (!actorUser) {
    // Unauthenticated guest verification via contactEmail/phone
    const guestEmail = guestCredentials.contactEmail?.trim().toLowerCase();
    const guestPhone = guestCredentials.contactPhone?.trim();

    const matchesEmail =
      guestEmail && guestEmail === booking.contactEmail?.toLowerCase();
    const matchesPhone =
      guestPhone &&
      guestPhone.replace(/\D/g, '').endsWith(booking.contactPhone?.replace(/\D/g, '') || '');

    if (!matchesEmail && !matchesPhone) {
      throw new AppError(
        'Authentication required or matching contact email/phone required to cancel booking.',
        401
      );
    }
    return;
  }

  if (actorUser.role === 'ADMIN') {
    return;
  }

  if (actorUser.role === 'OPERATOR') {
    const busOperatorUserId = booking.trip?.bus?.operator?.userId;
    if (busOperatorUserId !== actorUser.userId) {
      throw new AppError('Forbidden: Cannot cancel booking for another operator fleet.', 403);
    }
    return;
  }

  if (actorUser.role === 'PASSENGER') {
    const isOwner = booking.userId === actorUser.userId;
    const matchesEmail =
      booking.userId === null &&
      actorUser.email?.toLowerCase() === booking.contactEmail?.toLowerCase();

    if (!isOwner && !matchesEmail) {
      throw new AppError('Forbidden: You can only cancel your own bookings.', 403);
    }
  }
}

/**
 * Previews cancellation refund quote for a given booking ID or PNR without modifying state.
 */
async function quoteBookingCancellation(identifier, actorUser, guestCredentials = {}) {
  const where = isUuid(identifier) ? { id: identifier } : { pnr: identifier };

  const booking = await prisma.booking.findFirst({
    where,
    include: {
      trip: {
        include: {
          route: true,
          bus: {
            include: { operator: true },
          },
        },
      },
      payment: true,
      cancellation: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found for cancellation quote', 404);
  }

  if (booking.status === 'CANCELLED' || booking.cancellation) {
    throw new AppError('This booking is already cancelled.', 400);
  }

  verifyCancellationAuth(booking, actorUser, guestCredentials);

  const refundQuote = calculateCancellationRefund(
    booking.totalAmount,
    booking.trip.departureTime
  );

  return {
    bookingId: booking.id,
    pnr: booking.pnr,
    status: booking.status,
    totalAmount: Number(booking.totalAmount),
    departureTime: booking.trip.departureTime,
    refundQuote,
  };
}

/**
 * Executes atomic booking cancellation:
 * 1. Validates ownership and pre-departure eligibility.
 * 2. Computes tiered cancellation fee and refund amount.
 * 3. Transitions Booking status to CANCELLED.
 * 4. Transitions Payment status to REFUNDED.
 * 5. Creates a Cancellation record with fee, refund, and reason.
 * 6. Marks BookingSeat records as CANCELLED.
 * 7. Releases locked/booked TripSeat records back to AVAILABLE immediately.
 * 8. Creates a BOOKING_CANCELLED AuditLog record inside the same transaction.
 */
async function cancelBooking(identifier, payload = {}, actorUser = null, ipAddress = null) {
  const where = isUuid(identifier) ? { id: identifier } : { pnr: identifier };

  const booking = await prisma.booking.findFirst({
    where,
    include: {
      trip: {
        include: {
          route: true,
          bus: {
            include: { operator: true },
          },
        },
      },
      passengers: true,
      seats: true,
      payment: true,
      cancellation: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found for cancellation', 404);
  }

  if (booking.status === 'CANCELLED' || booking.cancellation) {
    throw new AppError('This booking has already been cancelled.', 400);
  }

  verifyCancellationAuth(booking, actorUser, {
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
  });

  const now = new Date();
  const refundQuote = calculateCancellationRefund(
    booking.totalAmount,
    booking.trip.departureTime,
    now
  );

  const reason = payload.reason?.trim() || 'Passenger requested cancellation';
  const seatNumbers = booking.passengers.map((p) => p.seatNumber);

  return prisma.$transaction(async (tx) => {
    // 1. Update Booking status to CANCELLED
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    });

    // 2. Update Payment status to REFUNDED
    let updatedPayment = null;
    if (booking.payment) {
      updatedPayment = await tx.payment.update({
        where: { id: booking.payment.id },
        data: { paymentStatus: 'REFUNDED' },
      });
    }

    // 3. Update BookingSeat records to CANCELLED
    await tx.bookingSeat.updateMany({
      where: { bookingId: booking.id },
      data: { status: 'CANCELLED' },
    });

    // 4. Release TripSeat records back to AVAILABLE for other passengers
    await tx.tripSeat.updateMany({
      where: {
        tripId: booking.tripId,
        OR: [
          { currentBookingId: booking.id },
          { seatNumber: { in: seatNumbers }, status: 'BOOKED', currentBookingId: null },
        ],
      },
      data: {
        status: 'AVAILABLE',
        lockedUntil: null,
        currentBookingId: null,
      },
    });

    // 5. Create Cancellation record
    const cancellation = await tx.cancellation.create({
      data: {
        bookingId: booking.id,
        cancellationFee: refundQuote.cancellationFee,
        refundAmount: refundQuote.refundAmount,
        reason,
        refundStatus: 'PROCESSED',
      },
    });

    // 6. Record central AuditLog inside transaction
    await recordAudit({
      userId: actorUser?.userId || booking.userId || null,
      action: AUDIT_ACTIONS.BOOKING_CANCELLED,
      entity: 'Booking',
      entityId: booking.id,
      details: {
        pnr: booking.pnr,
        tripId: booking.tripId,
        cancellationFee: refundQuote.cancellationFee,
        refundAmount: refundQuote.refundAmount,
        tier: refundQuote.tier,
        releasedSeats: seatNumbers,
        reason,
      },
      ipAddress,
      tx,
    });

    return {
      booking: {
        ...updatedBooking,
        totalAmount: Number(updatedBooking.totalAmount),
      },
      payment: updatedPayment
        ? {
            ...updatedPayment,
            amount: Number(updatedPayment.amount),
          }
        : null,
      cancellation: {
        ...cancellation,
        cancellationFee: Number(cancellation.cancellationFee),
        refundAmount: Number(cancellation.refundAmount),
      },
      refundQuote,
      releasedSeats: seatNumbers,
    };
  });
}

module.exports = {
  calculateCancellationRefund,
  quoteBookingCancellation,
  cancelBooking,
};
