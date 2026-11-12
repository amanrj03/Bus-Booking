import React, { useEffect, useState } from 'react';
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowPathIcon,
  BanknotesIcon,
} from '@heroicons/react/24/solid';
import { Modal, Button, Badge, Alert, Select } from '../ui';
import { fetchCancellationQuote, cancelBooking } from '../../services/booking.service';
import { formatClockTime, formatDateLong } from '../../utils/dateUtils';

const COMMON_REASONS = [
  'Change of travel plans',
  'Medical emergency',
  'Bus timing mismatch',
  'Found alternative travel',
  'Duplicate booking',
  'Other personal reasons',
];

export default function CancellationModal({ booking, isOpen, onClose, onCancelled }) {
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (!isOpen || !booking) {
      setQuote(null);
      setError('');
      return;
    }

    let isMounted = true;
    setLoadingQuote(true);
    setError('');

    fetchCancellationQuote(booking.id)
      .then((data) => {
        if (!isMounted) return;
        setQuote(data?.refundQuote || null);
      })
      .catch((err) => {
        if (!isMounted) return;
        // Fallback calculation if offline or local simulation
        const total = Number(booking.totalAmount || 0);
        const depMs = new Date(booking.trip?.departureTime || Date.now()).getTime();
        const hrs = (depMs - Date.now()) / (1000 * 60 * 60);
        const feePct = hrs > 24 ? 10 : hrs >= 12 ? 25 : 50;
        const fee = Math.round(((total * feePct) / 100) * 100) / 100;
        setQuote({
          hoursRemaining: Math.max(0, Math.round(hrs * 10) / 10),
          feePercentage: feePct,
          cancellationFee: fee,
          refundAmount: Math.round((total - fee) * 100) / 100,
          policyText: `${feePct}% cancellation fee applied based on departure window`,
        });
      })
      .finally(() => {
        if (isMounted) setLoadingQuote(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, booking]);

  const handleConfirmCancel = async () => {
    if (!booking) return;

    setSubmitting(true);
    setError('');

    const finalReason = reason === 'Other personal reasons' && customReason.trim()
      ? customReason.trim()
      : reason;

    try {
      const result = await cancelBooking(booking.id, { reason: finalReason });
      if (onCancelled) {
        onCancelled(result);
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to cancel booking. Please try again or contact support.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  const trip = booking.trip || {};
  const route = trip.route || {};
  const seats = (booking.passengers || []).map((p) => p.seatNumber).join(', ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Cancel Booking & Refund Request"
      subtitle={`PNR: ${booking.pnr} • ${route.sourceCity || 'Source'} → ${route.destinationCity || 'Destination'}`}
    >
      <div className="p-6 space-y-5">
        {error && <Alert type="error">{error}</Alert>}

        {/* Journey Quick Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-700 font-semibold">
            <span>Departure Time:</span>
            <span className="font-bold text-gray-900">
              {formatClockTime(trip.departureTime)} ({formatDateLong(trip.departureTime)})
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-700 font-semibold">
            <span>Reserved Seats to Release:</span>
            <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
              {seats || 'All seats'}
            </span>
          </div>
        </div>

        {/* Refund Calculation Box */}
        {loadingQuote ? (
          <div className="py-6 text-center text-xs text-gray-500 space-y-2">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-[#73d200] mx-auto" />
            <p>Calculating live cancellation refund against departure policy...</p>
          </div>
        ) : quote ? (
          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-amber-600" />
                {quote.hoursRemaining} hours before departure
              </span>
              <Badge variant="warning">{quote.feePercentage}% Fee Applied</Badge>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-amber-200/80 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Original Fare Paid:</span>
                <span className="font-semibold text-gray-900">
                  ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Cancellation Deduction ({quote.feePercentage}%):</span>
                <span className="font-semibold">
                  - ₹{Number(quote.cancellationFee || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-dashed border-gray-200 text-sm font-black text-emerald-700">
                <span>Net Refund to Original Payment:</span>
                <span>₹{Number(quote.refundAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 italic leading-relaxed pt-1">
              * Refund will be processed immediately back to your original payment method (simulated instant refund).
            </p>
          </div>
        ) : null}

        {/* Reason for Cancellation */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 block">
            Reason for Cancellation:
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#73d200]"
          >
            {COMMON_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {reason === 'Other personal reasons' && (
            <input
              type="text"
              placeholder="Please specify reason (optional)"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#73d200]"
            />
          )}
        </div>

        {/* Notice of Seat Release */}
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ExclamationTriangleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            Permanent Seat Release Warning
          </div>
          <p className="text-[11px] text-rose-700 leading-relaxed">
            Once confirmed, this cancellation cannot be reversed. Your reserved seats will be immediately
            returned to live seat inventory for other travelers to book.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Keep Booking
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmCancel}
            disabled={submitting || loadingQuote}
            className="cursor-pointer"
          >
            {submitting ? 'Processing Cancellation...' : 'Confirm Cancellation & Refund'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
