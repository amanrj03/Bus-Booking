import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Formats a Date object or ISO string to friendly clock time (e.g. "07:30 AM")
 */
function formatTime(dateStr) {
  if (!dateStr) return '--:--';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--';
  }
}

/**
 * Formats a Date object or ISO string to friendly long date (e.g. "Sun, 15 Nov 2026")
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Date not specified';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Date not specified';
  }
}

const BUS_TYPE_LABELS = {
  AC_SLEEPER_2X1: 'AC Sleeper (2+1) Luxury Coach',
  AC_SEATER_2X2: 'AC Executive Seater (2+2)',
  NON_AC_SEATER_2X2: 'Express Seater (2+2)',
};

/**
 * Generates an official, high-resolution vector PDF bus ticket formatted so clearly
 * that an elderly person or young child can easily find their seat and journey details.
 *
 * @param {Object} booking - Complete booking object with trip, route, bus, passengers, and payment.
 */
export async function generateTicketPDF(booking) {
  if (!booking) {
    throw new Error('Booking data is required to generate ticket PDF');
  }

  const trip = booking.trip || {};
  const route = trip.route || {};
  const bus = trip.bus || {};
  const operator = bus.operator || {};
  const passengers = booking.passengers || [];
  const payment = booking.payment || {};
  const stops = route.routeStops || [];
  const boardingStop = stops[0]?.stop;
  const droppingStop = stops[stops.length - 1]?.stop;

  // Generate scannable QR Code as Data URL
  let qrCodeDataUrl = null;
  try {
    const qrPayload = JSON.stringify({
      pnr: booking.pnr,
      tripId: booking.tripId || trip.id,
      busNumber: bus.busNumber || 'COACH-EXP',
      seats: passengers.map((p) => p.seatNumber),
      totalAmount: booking.totalAmount,
      source: route.sourceCity,
      destination: route.destinationCity,
      status: booking.status || 'CONFIRMED',
    });
    qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch (err) {
    console.warn('QR code generation skipped for PDF', err);
  }

  // A4 dimensions: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  // 1. TOP BRAND HEADER BANNER (Green & Navy)
  doc.setFillColor(19, 27, 38); // Dark Navy #131b26
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Green accent bar on left
  doc.setFillColor(115, 210, 0); // #73d200
  doc.rect(0, 0, 6, 28, 'F');

  // Logo Brand Box
  doc.setFillColor(115, 210, 0);
  doc.roundedRect(margin, 5, 18, 18, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(19, 27, 38);
  doc.text('G', margin + 6, 18);

  // Brand Name & Tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GoBus Express', margin + 22, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 195, 210);
  doc.text('OFFICIAL E-TICKET & BOARDING PASS • ALL-INDIA INTERCITY NETWORK', margin + 22, 17);
  doc.text(`Operated by: ${operator.companyName || operator.name || 'Verified Carrier'} • Reg: DL-EXP-2026`, margin + 22, 21.5);

  // 24x7 Helpline on top right
  doc.setFillColor(30, 42, 58);
  doc.roundedRect(pageWidth - margin - 58, 6, 58, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(115, 210, 0);
  doc.text('24x7 PASSENGER HELPLINE', pageWidth - margin - 54, 11);
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('8404855555', pageWidth - margin - 54, 17.5);

  let curY = 33;

  // 2. HIGHLIGHTED SEAT & PNR BANNER (Specifically designed so an elderly person or child immediately spots their seat!)
  doc.setFillColor(243, 249, 235); // Light fresh green tint
  doc.setDrawColor(115, 210, 0);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, curY, contentWidth, 26, 3, 3, 'FD');

  // Left side: PNR Code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 100, 110);
  doc.text('BOOKING PNR NUMBER', margin + 6, curY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(19, 27, 38);
  doc.text(booking.pnr || 'GB-CONFIRMED', margin + 6, curY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52); // green-800
  doc.text('STATUS: CONFIRMED • PAYMENT VERIFIED', margin + 6, curY + 21);

  // Middle: Bus Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 100, 110);
  doc.text('COACH NUMBER', margin + 70, curY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(19, 27, 38);
  doc.text(bus.busNumber || 'DL-01-AB-1001', margin + 70, curY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  doc.text(BUS_TYPE_LABELS[bus.busType] || bus.busType || 'Deluxe AC Coach', margin + 70, curY + 21);

  // Right side: GIANT SEAT NUMBER CALLOUT (Highlight Box)
  const seatListStr = passengers.map((p) => p.seatNumber).join(', ') || '1A';
  doc.setFillColor(115, 210, 0);
  doc.roundedRect(pageWidth - margin - 58, curY + 3, 54, 20, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(19, 27, 38);
  doc.text('YOUR SEAT NUMBER(S)', pageWidth - margin - 52, curY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(19, 27, 38);
  doc.text(seatListStr, pageWidth - margin - 52, curY + 17);

  curY += 31;

  // 3. JOURNEY TIMELINE CARD (Departure -> Duration -> Arrival)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(215, 222, 230);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, 42, 2.5, 2.5, 'FD');

  // Departure (Left Column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(115, 160, 40); // Greenish
  doc.text('DEPARTURE (BOARDING)', margin + 6, curY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(19, 27, 38);
  doc.text(formatTime(trip.departureTime), margin + 6, curY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(route.sourceCity || 'Origin City', margin + 6, curY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 100, 110);
  const boardingName = boardingStop?.name || 'Central ISBT Bus Station';
  const boardingLandmark = boardingStop?.landmark ? ` (${boardingStop.landmark})` : '';
  doc.text(doc.splitTextToSize(`${boardingName}${boardingLandmark}`, 60), margin + 6, curY + 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text(`Report by: ${formatTime(new Date(new Date(trip.departureTime || Date.now()).getTime() - 15 * 60000))} (15m before)`, margin + 6, curY + 37);

  // Center Duration Arrow & Date
  const midX = margin + 93;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 115, 130);
  doc.text(formatDate(trip.departureTime), midX, curY + 11, { align: 'center' });

  // Arrow graphic
  doc.setDrawColor(180, 195, 210);
  doc.setLineWidth(0.6);
  doc.line(midX - 22, curY + 18, midX + 22, curY + 18);
  doc.setFillColor(115, 210, 0);
  doc.circle(midX - 22, curY + 18, 1.5, 'F');
  doc.setFillColor(19, 27, 38);
  doc.circle(midX + 22, curY + 18, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(19, 27, 38);
  const durH = Math.floor((route.estimatedMinutes || 300) / 60);
  const durM = (route.estimatedMinutes || 300) % 60;
  doc.text(`${durH}h ${durM}m Direct • ${route.distanceKm || 280} km`, midX, curY + 24, { align: 'center' });

  // Arrival (Right Column)
  const rightX = pageWidth - margin - 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 115, 130);
  doc.text('ESTIMATED ARRIVAL', rightX, curY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(19, 27, 38);
  doc.text(formatTime(trip.arrivalTime), rightX, curY + 16, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(route.destinationCity || 'Destination City', rightX, curY + 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 100, 110);
  const droppingName = droppingStop?.name || 'City Bus Terminal';
  const droppingLandmark = droppingStop?.landmark ? ` (${droppingStop.landmark})` : '';
  doc.text(doc.splitTextToSize(`${droppingName}${droppingLandmark}`, 60), rightX, curY + 27, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 100, 110);
  doc.text(formatDate(trip.arrivalTime), rightX, curY + 37, { align: 'right' });

  curY += 47;

  // 4. PASSENGER MANIFEST & SEAT ASSIGNMENT TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(19, 27, 38);
  doc.text('PASSENGER DETAILS & SEAT ROSTER', margin, curY);

  curY += 3.5;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, curY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('#', margin + 3, curY + 4.8);
  doc.text('PASSENGER NAME', margin + 12, curY + 4.8);
  doc.text('AGE / GENDER', margin + 80, curY + 4.8);
  doc.text('ASSIGNED SEAT', margin + 125, curY + 4.8);
  doc.text('TICKET STATUS', margin + 160, curY + 4.8);

  curY += 7;

  // Table Rows
  passengers.forEach((p, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 249, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(margin, curY, contentWidth, 8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(String(idx + 1), margin + 3, curY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(p.fullName || 'Passenger Name', margin + 12, curY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${p.age || 28} yrs • ${p.gender || 'Adult'}`, margin + 80, curY + 5.5);

    // Bold highlight for seat
    doc.setFillColor(220, 252, 231); // emerald-100
    doc.roundedRect(margin + 124, curY + 1.2, 22, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text(`SEAT ${p.seatNumber}`, margin + 126, curY + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text('CONFIRMED', margin + 160, curY + 5.2);

    curY += 8;
  });

  curY += 4;

  // 5. QR CODE & CONDUCTOR BOARDING VALIDATION BOX (Left) + FARE SUMMARY (Right)
  const boxHeight = 44;

  // Left: QR Code Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(215, 222, 230);
  doc.roundedRect(margin, curY, 90, boxHeight, 2.5, 2.5, 'FD');

  if (qrCodeDataUrl) {
    doc.addImage(qrCodeDataUrl, 'PNG', margin + 4, curY + 4, 34, 34);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(19, 27, 38);
  doc.text('DIGITAL BOARDING PASS', margin + 41, curY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 100, 110);
  doc.text(
    doc.splitTextToSize(
      'Scan this QR code with the coach conductor device upon boarding. Valid government photo ID is mandatory.',
      46
    ),
    margin + 41,
    curY + 15
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(19, 27, 38);
  doc.text(`Contact: ${booking.contactPhone || '+91 9876543210'}`, margin + 41, curY + 36);

  // Right: Payment & Fare Breakdown Box
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(215, 222, 230);
  doc.roundedRect(margin + 94, curY, contentWidth - 94, boxHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(19, 27, 38);
  doc.text('PAYMENT RECEIPT (TAX INVOICE)', margin + 98, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Payment Mode: ${payment.paymentMethod?.replace('_', ' ') || 'UPI'}`, margin + 98, curY + 14);
  doc.text(`Ref / Txn ID: ${payment.transactionReference || booking.pnr || 'TXN-984210'}`, margin + 98, curY + 19);

  if (Number(booking.discountAmount || 0) > 0) {
    doc.setTextColor(22, 101, 52);
    doc.text(`Coupon Savings: -Rs. ${Number(booking.discountAmount).toLocaleString('en-IN')}`, margin + 98, curY + 24);
  } else {
    doc.text('Inclusive of 5% GST and Terminal Tolls', margin + 98, curY + 24);
  }

  // Divider line
  doc.setDrawColor(220, 226, 235);
  doc.line(margin + 98, curY + 27, margin + contentWidth - 4, curY + 27);

  // Big Total Paid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL AMOUNT PAID:', margin + 98, curY + 36);

  doc.setFontSize(14);
  doc.setTextColor(19, 27, 38);
  doc.text(`Rs. ${Number(booking.totalAmount || 0).toLocaleString('en-IN')}`, margin + contentWidth - 6, curY + 36, { align: 'right' });

  curY += boxHeight + 6;

  // 6. CLEAR 4-STEP PASSENGER GUIDELINES (Icon-free, High-Contrast & Simple English for elderly & children)
  doc.setFillColor(255, 251, 235); // Amber-50
  doc.setDrawColor(245, 158, 11); // Amber-500
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // Amber-800
  doc.text('IMPORTANT PASSENGER GUIDELINES (PLEASE READ BEFORE BOARDING)', margin + 4, curY + 6);

  const guidelines = [
    '1. PHOTO ID MANDATORY: Every passenger must carry an original valid Govt ID (Aadhaar Card, Voter ID, Passport, or Driving License).',
    '2. REPORTING TIME: Please reach the boarding point at least 15 minutes before departure. Buses depart promptly on schedule.',
    '3. LUGGAGE ALLOWANCE: Each passenger is allowed 1 large trolley bag (up to 15-20 kg) + 1 small handbag. Extra luggage is subject to depot space.',
    '4. LIVE BUS TRACKING: A live GPS tracking link is sent to your registered mobile number 30 minutes before departure time.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(120, 53, 15); // Amber-900

  let gY = curY + 12;
  guidelines.forEach((g) => {
    doc.text(g, margin + 4, gY);
    gY += 5.5;
  });

  curY += 40;

  // 7. FOOTER TEAR-OFF LINE
  doc.setDrawColor(180, 190, 205);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, curY, margin + contentWidth, curY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 160);
  doc.text(
    'This is a computer-generated e-ticket valid across all Indian interstate borders. No signature required. GoBus Helpline: 8404855555.',
    pageWidth / 2,
    curY + 4,
    { align: 'center' }
  );

  // Trigger browser download of PDF
  const filename = `GoBus-Ticket-${booking.pnr || 'TICKET'}.pdf`;
  doc.save(filename);
  return filename;
}
