/**
 * Computes individual seat fare in INR based on trip baseFare and physical seat type.
 * Matches seed dynamics: SLEEPER +₹150, WINDOW +₹50, AISLE/MIDDLE +₹0.
 *
 * @param {number} baseFare
 * @param {'WINDOW' | 'AISLE' | 'MIDDLE' | 'SLEEPER'} seatType
 * @returns {number}
 */
function calculateSeatPrice(baseFare, seatType) {
  const base = Number(baseFare);
  let surcharge = 0;

  if (seatType === 'SLEEPER') {
    surcharge = 150;
  } else if (seatType === 'WINDOW') {
    surcharge = 50;
  }

  return Number((base + surcharge).toFixed(2));
}

/**
 * Generates TripSeat inventory rows for a scheduled Trip from a Bus's physical Seat templates.
 *
 * @param {string} tripId
 * @param {Array<{ id: string, seatNumber: string, seatType: string }>} seats
 * @param {number} baseFare
 * @returns {Array<{ tripId: string, seatId: string, seatNumber: string, price: number, status: 'AVAILABLE' }>}
 */
function buildTripSeatInventory(tripId, seats, baseFare) {
  return seats.map((seat) => ({
    tripId,
    seatId: seat.id,
    seatNumber: seat.seatNumber,
    price: calculateSeatPrice(baseFare, seat.seatType),
    status: 'AVAILABLE',
  }));
}

module.exports = {
  calculateSeatPrice,
  buildTripSeatInventory,
};
