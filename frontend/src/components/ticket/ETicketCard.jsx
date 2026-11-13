import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  TruckIcon,
  WifiIcon,
  BoltIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  TicketIcon,
  CheckCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  QrCodeIcon,
} from '@heroicons/react/24/solid';
import { Badge, Card } from '../ui';
import { formatClockTime, formatDateLong, formatDuration } from '../../utils/dateUtils';

const BUS_TYPE_LABELS = {
  AC_SLEEPER_2X1: 'AC Sleeper (2+1)',
  AC_SEATER_2X2: 'AC Seater (2+2)',
  NON_AC_SEATER_2X2: 'Non-AC Seater (2+2)',
};

export default function ETicketCard({ booking }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const trip = booking?.trip || {};
  const route = trip.route || {};
  const bus = trip.bus || {};
  const operator = bus.operator || {};
  const passengers = booking?.passengers || [];
  const payment = booking?.payment || {};
  const stops = route.routeStops || [];
  const boardingStop = stops[0]?.stop;
  const droppingStop = stops[stops.length - 1]?.stop;

  useEffect(() => {
    if (!booking?.pnr) return;

    const payload = JSON.stringify({
      pnr: booking.pnr,
      tripId: booking.tripId || trip.id,
      busNumber: bus.busNumber,
      seats: passengers.map((p) => p.seatNumber),
      totalAmount: booking.totalAmount,
      status: booking.status,
    });

    QRCode.toDataURL(payload, {
      width: 160,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrCodeUrl)
      .catch((err) => {
        console.error('Failed to generate ticket QR code', err);
      });
  }, [booking, trip, bus, passengers]);

  return (
    <div
      id="printable-ticket"
      className="print-ticket-container bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Ticket Header Banner */}
      <div className="bg-[#131b26] text-white p-6 sm:p-7 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#73d200] flex items-center justify-center text-gray-900 font-black text-xl italic shadow-md">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight">Algions Express</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-[#73d200]">
                  Official E-Ticket
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Operated by {operator.companyName || operator.name || 'Verified Carrier'} • 24x7 Helpline:{' '}
                {operator.contactPhone || '1800-ALGIONS-BUS'}
              </p>
            </div>
          </div>

          <div className="sm:text-right bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-lg border border-white/10 sm:border-0">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              PNR Number
            </div>
            <div className="font-mono text-2xl font-black text-[#73d200] tracking-wider">
              {booking.pnr}
            </div>
            <div className="mt-1 flex sm:justify-end items-center gap-2">
              <Badge variant="success" icon={CheckCircleIcon}>
                {booking.status || 'CONFIRMED'}
              </Badge>
              {booking.createdAt && (
                <span className="text-[11px] text-gray-400">
                  Booked {formatDateLong(booking.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="p-6 sm:p-8 space-y-8">
        {/* Bus & Coach Specification Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-white border border-gray-200 px-3 py-1 rounded-lg">
              <TruckIcon className="w-4 h-4 text-[#73d200]" />
              {bus.busNumber || 'COACH-EXP'}
            </span>
            <span className="text-xs font-semibold text-gray-700">
              {BUS_TYPE_LABELS[bus.busType] || bus.busType || 'Deluxe Intercity Coach'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
            <span className="inline-flex items-center gap-1">
              <WifiIcon className="w-3.5 h-3.5 text-gray-500" />
              High-Speed Wi-Fi
            </span>
            <span className="inline-flex items-center gap-1">
              <BoltIcon className="w-3.5 h-3.5 text-gray-500" />
              USB Charging
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-gray-500" />
              GPS Tracked
            </span>
          </div>
        </div>

        {/* Journey Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 bg-white p-4 rounded-xl border border-gray-100">
          {/* Departure */}
          <div className="md:col-span-5 space-y-1">
            <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5 text-[#73d200]" />
              Departure
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {formatClockTime(trip.departureTime)}
            </div>
            <div className="text-sm font-bold text-gray-800">
              {route.sourceCity || 'Source Station'}
            </div>
            <div className="text-xs text-gray-500 flex items-start gap-1">
              <MapPinIcon className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <span>
                {boardingStop?.name
                  ? `${boardingStop.name}${boardingStop.landmark ? ` (${boardingStop.landmark})` : ''}`
                  : 'Main Intercity Terminal'}
              </span>
            </div>
            <div className="text-[11px] text-gray-400">
              {formatDateLong(trip.departureTime)}
            </div>
          </div>

          {/* Duration & Connector */}
          <div className="md:col-span-2 flex flex-col items-center justify-center text-center py-2 md:py-0">
            <div className="text-xs font-bold text-gray-500 mb-1">
              {formatDuration(route.estimatedMinutes || 360)}
            </div>
            <div className="w-full flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#73d200] shrink-0" />
              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
              <TruckIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-900 shrink-0" />
            </div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
              Direct Service
            </div>
          </div>

          {/* Arrival */}
          <div className="md:col-span-5 md:text-right space-y-1">
            <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center md:justify-end gap-1">
              <ClockIcon className="w-3.5 h-3.5 text-gray-900" />
              Arrival (Estimated)
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {formatClockTime(trip.arrivalTime)}
            </div>
            <div className="text-sm font-bold text-gray-800">
              {route.destinationCity || 'Destination Station'}
            </div>
            <div className="text-xs text-gray-500 flex items-start md:justify-end gap-1">
              <MapPinIcon className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <span>
                {droppingStop?.name
                  ? `${droppingStop.name}${droppingStop.landmark ? ` (${droppingStop.landmark})` : ''}`
                  : 'Central Bus Terminal'}
              </span>
            </div>
            <div className="text-[11px] text-gray-400">
              {formatDateLong(trip.arrivalTime)}
            </div>
          </div>
        </div>

        {/* QR Code & Boarding Pass Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200">
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 bg-white rounded-xl border border-gray-200 shadow-xs">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`QR code for PNR ${booking.pnr}`}
                className="w-36 h-36 object-contain"
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400">
                <QrCodeIcon className="w-12 h-12 animate-pulse" />
              </div>
            )}
            <div className="mt-2 text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Gate Boarding Pass
            </div>
            <div className="text-[10px] text-gray-400">Scan at bus entry</div>
          </div>

          <div className="md:col-span-8 space-y-3">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide">
              Official Boarding Validation
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Show this QR code to the coach conductor upon boarding at{' '}
              <strong className="text-gray-900">{route.sourceCity}</strong>. Biometric and government photo ID
              validation is required for all passengers prior to coach departure.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2 text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200">
                <EnvelopeIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{booking.contactEmail || 'passenger@booking.local'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200">
                <PhoneIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{booking.contactPhone || '+91 9876543210'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Manifest Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#73d200]" />
              Passenger Manifest & Reserved Seats ({passengers.length})
            </h4>
            <span className="text-xs text-gray-500 font-semibold">Seat Count: {passengers.length}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Passenger Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Seat No.</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {passengers.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{p.fullName}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {p.age} yrs • {p.gender}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-mono font-black text-gray-900 bg-[#73d200]/20 px-2 py-0.5 rounded text-xs">
                        <TicketIcon className="w-3 h-3 text-[#65b800]" />
                        {p.seatNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant="success">CONFIRMED</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment & Fare Receipt Section */}
        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                Payment Status
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="success" icon={CheckCircleIcon}>
                  {payment.paymentStatus || 'SUCCESS'}
                </Badge>
                <span className="text-xs font-semibold text-gray-700">
                  via {payment.paymentMethod?.replace('_', ' ') || 'UPI'}
                </span>
              </div>
            </div>

            {payment.transactionReference && (
              <div className="sm:text-right">
                <div className="text-[10px] uppercase font-bold text-gray-400">
                  Transaction Reference
                </div>
                <div className="font-mono text-xs font-bold text-gray-800">
                  {payment.transactionReference}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <span className="text-xs text-gray-600">
              Total Amount Paid (Inclusive of Base Fare, Add-ons & 5% GST):
            </span>
            <span className="text-2xl font-black text-gray-900">
              ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Important Passenger Guidelines */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 space-y-2.5">
          <h5 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <ShieldCheckIcon className="w-4 h-4 text-amber-700" />
            Important Boarding Terms & Guidelines
          </h5>
          <ol className="list-decimal list-inside text-xs text-amber-900/90 space-y-1 leading-relaxed">
            <li>
              <strong>Reporting Time:</strong> Arrive at the boarding point at least 15 minutes before the
              scheduled departure time ({formatClockTime(trip.departureTime)}).
            </li>
            <li>
              <strong>Mandatory Government Photo ID:</strong> All passengers must carry an original valid photo ID
              (Aadhaar Card, Voter ID, Driving License, or Passport) for boarding verification.
            </li>
            <li>
              <strong>Baggage Allowance:</strong> Each passenger is entitled to one piece of luggage up to 15 kg
              plus standard hand luggage.
            </li>
            <li>
              <strong>Cancellation & Rescheduling:</strong> Cancellations made &gt;24 hours before departure incur
              a nominal 10% fee. Manage your booking anytime from the My Bookings portal.
            </li>
          </ol>
        </div>
      </div>

      {/* Ticket Footer Tear-Off Style */}
      <div className="bg-gray-100 px-6 py-4 border-t border-dashed border-gray-300 text-center text-[11px] text-gray-500">
        Thank you for travelling with Algions Intercity Express. Have a comfortable and safe journey!
      </div>
    </div>
  );
}

