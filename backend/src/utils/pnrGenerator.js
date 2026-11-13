const crypto = require('node:crypto');

/**
 * Derives a 3-letter uppercase city code for Indian PNR formatting (e.g. Delhi -> DEL, Mumbai -> MUM).
 */
function getCityCode(cityName = 'IND') {
  const cleaned = String(cityName).replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (cleaned.length >= 3) return cleaned.slice(0, 3);
  return cleaned.padEnd(3, 'X');
}

/**
 * Generates a realistic unique PNR code matching format: GB-DEL-2611-9876
 *
 * @param {string} [sourceCity]
 * @param {Date} [date]
 * @returns {string}
 */
function generatePnrCode(sourceCity = 'IND', date = new Date()) {
  const cityCode = getCityCode(sourceCity);
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const randomDigits = crypto.randomInt(1000, 10000);
  return `GB-${cityCode}-${yy}${mm}-${randomDigits}`;
}

/**
 * Computes authoritative server-side INR fare breakdown (including 5% GST) from locked TripSeat prices.
 *
 * @param {Array<{ price: number | string }>} seats
 * @param {{ extraBaggage?: boolean, travelInsurance?: boolean }} [addons]
 */
function calculateBookingFareSummary(seats = [], addons = {}) {
  const seatSubtotal = seats.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const baggageFee = addons.extraBaggage ? 99 : 0;
  const insuranceFee = addons.travelInsurance ? 29 * seats.length : 0;
  const taxableBase = seatSubtotal + baggageFee + insuranceFee;
  const gstAmount = Number((taxableBase * 0.05).toFixed(2));
  const totalAmount = Number((taxableBase + gstAmount).toFixed(2));

  return {
    seatSubtotal: Number(seatSubtotal.toFixed(2)),
    baggageFee,
    insuranceFee,
    gstAmount,
    totalAmount,
  };
}

const PAYMENT_METHOD_PREFIX = {
  UPI: 'UPI',
  NET_BANKING: 'NBK',
  DEBIT_CARD: 'CRD',
  CREDIT_CARD: 'CRD',
  WALLET: 'WLT',
};

/**
 * Generates a simulated payment transaction reference (e.g. TXN-SIM-UPI-482910).
 */
function generateSimulatedTxnRef(paymentMethod = 'UPI') {
  const prefix = PAYMENT_METHOD_PREFIX[paymentMethod] || 'PAY';
  const digits = crypto.randomInt(100000, 1000000);
  return `TXN-SIM-${prefix}-${digits}`;
}

module.exports = {
  getCityCode,
  generatePnrCode,
  calculateBookingFareSummary,
  generateSimulatedTxnRef,
};
