import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TicketIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  BanknotesIcon,
} from '@heroicons/react/24/solid';
import { Button, Badge, Card, Alert } from '../components/ui';
import CancellationModal from '../components/booking/CancellationModal';
import { fetchMyBookings } from '../services/booking.service';
import { formatClockTime, formatDateLong, formatDuration } from '../utils/dateUtils';

const STATUS_TABS = [
  { id: '', label: 'All Bookings' },
  { id: 'CONFIRMED', label: 'Confirmed & Upcoming' },
  { id: 'CANCELLED', label: 'Cancelled & Refunded' },
];

const BUS_TYPE_LABELS = {
  AC_SLEEPER_2X1: 'AC Sleeper (2+1)',
  AC_SEATER_2X2: 'AC Seater (2+2)',
  NON_AC_SEATER_2X2: 'Non-AC Seater (2+2)',
};

export default function MyBookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pnrSearch, setPnrSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedForCancel, setSelectedForCancel] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const data = await fetchMyBookings(params);
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleStatusTabChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handlePnrLookup = (e) => {
    e.preventDefault();
    const cleaned = pnrSearch.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/booking/confirmation/${encodeURIComponent(cleaned)}`);
  };

  const handleCancelledSuccess = (result) => {
    const pnr = result?.booking?.pnr || selectedForCancel?.pnr;
    const refund = result?.cancellation?.refundAmount ?? result?.refundQuote?.refundAmount ?? 0;
    setSuccessMsg(
      `Booking ${pnr} cancelled successfully! Refund of ₹${Number(refund).toLocaleString(
        'en-IN'
      )} has been processed and reserved seats have been released.`
    );
    loadBookings();
  };

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              My Bookings &amp; E-Tickets
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View your digital boarding passes, download tickets, or manage cancellations &amp; instant refunds.
            </p>
          </div>

          {/* Quick PNR Lookup */}
          <form onSubmit={handlePnrLookup} className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Lookup by PNR (e.g. FLX-...)"
                value={pnrSearch}
                onChange={(e) => setPnrSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#73d200] w-56"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="cursor-pointer">
              Find Ticket
            </Button>
          </form>
        </div>

        {/* Status Feedback Alerts */}
        {successMsg && (
          <Alert type="success" onClose={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}
        {error && <Alert type="error">{error}</Alert>}

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id || 'ALL'}
                  type="button"
                  onClick={() => handleStatusTabChange(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#131b26] text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-semibold text-gray-500">
            Total Records: {pagination.total ?? bookings.length}
          </span>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-9 h-9 border-4 border-[#73d200] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-gray-500">Loading your travel history...</p>
          </div>
        ) : bookings.length === 0 ? (
          <Card padding="p-10" className="text-center space-y-4">
            <TicketIcon className="w-12 h-12 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900">No Bookings Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {statusFilter
                  ? `You don't have any ${statusFilter.toLowerCase()} bookings at the moment.`
                  : 'Ready to plan your next intercity coach journey across India? Search routes and book seats in seconds.'}
              </p>
            </div>
            <div>
              <Button variant="primary" onClick={() => navigate('/search')} className="cursor-pointer">
                Browse Scheduled Buses
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const trip = booking.trip || {};
              const route = trip.route || {};
              const bus = trip.bus || {};
              const operator = bus.operator || {};
              const passengers = booking.passengers || [];
              const cancellation = booking.cancellation || null;
              const isConfirmed = booking.status === 'CONFIRMED';
              const isFutureDeparture =
                trip.departureTime && new Date(trip.departureTime).getTime() > Date.now();
              const canCancel = isConfirmed && isFutureDeparture;

              return (
                <Card
                  key={booking.id}
                  padding="p-5 sm:p-6"
                  className={`border transition-all ${
                    isConfirmed
                      ? 'border-gray-200 hover:border-[#73d200]'
                      : 'border-gray-200 bg-gray-50/70'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Metadata Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-sm font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                          {booking.pnr}
                        </span>
                        <Badge
                          variant={isConfirmed ? 'success' : 'danger'}
                          icon={isConfirmed ? CheckCircleIcon : XCircleIcon}
                        >
                          {booking.status}
                        </Badge>
                        <Badge variant="operator">
                          {operator.companyName || operator.name || 'Express Carrier'}
                        </Badge>
                        {bus.busNumber && (
                          <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1">
                            <TruckIcon className="w-3.5 h-3.5 text-gray-400" />
                            {bus.busNumber} • {BUS_TYPE_LABELS[bus.busType] || bus.busType}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-gray-900">
                          ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Booked {formatDateLong(booking.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Journey Timeline & Passenger Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Route Timings */}
                      <div className="md:col-span-7 flex items-center gap-4">
                        <div>
                          <div className="text-lg font-black text-gray-900">
                            {formatClockTime(trip.departureTime)}
                          </div>
                          <div className="text-xs font-bold text-gray-800">{route.sourceCity}</div>
                          <div className="text-[11px] text-gray-400">
                            {formatDateLong(trip.departureTime)}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center px-2">
                          <span className="text-[10px] font-bold text-gray-400 mb-1">
                            {formatDuration(route.estimatedMinutes || 360)}
                          </span>
                          <div className="w-full flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#73d200]" />
                            <div className="flex-1 border-t border-dashed border-gray-300" />
                            <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-black text-gray-900">
                            {formatClockTime(trip.arrivalTime)}
                          </div>
                          <div className="text-xs font-bold text-gray-800">
                            {route.destinationCity}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {formatDateLong(trip.arrivalTime)}
                          </div>
                        </div>
                      </div>

                      {/* Seats & Passengers */}
                      <div className="md:col-span-5 bg-gray-50 rounded-xl p-3 border border-gray-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-gray-700 font-bold">
                          <span className="inline-flex items-center gap-1">
                            <UserGroupIcon className="w-3.5 h-3.5 text-gray-500" />
                            Passengers ({passengers.length})
                          </span>
                          <span className="font-mono text-gray-900">
                            Seats: {passengers.map((p) => p.seatNumber).join(', ') || '--'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {passengers.map((p) => `${p.fullName} (${p.age})`).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Cancellation & Refund Details (When Cancelled) */}
                    {!isConfirmed && cancellation && (
                      <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-rose-900 flex items-center gap-1.5">
                            <BanknotesIcon className="w-4 h-4 text-rose-600" />
                            Refund {cancellation.refundStatus || 'PROCESSED'}: ₹
                            {Number(cancellation.refundAmount || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] text-rose-700">
                            Reason: {cancellation.reason} • Fee deducted: ₹
                            {Number(cancellation.cancellationFee || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <Badge variant="neutral">Seats Released to Inventory</Badge>
                      </div>
                    )}

                    {/* Card Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                      <div className="text-[11px] text-gray-500">
                        {booking.payment?.paymentMethod && (
                          <span>
                            Paid via <strong>{booking.payment.paymentMethod.replace('_', ' ')}</strong>{' '}
                            {booking.payment.transactionReference &&
                              `(${booking.payment.transactionReference})`}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/booking/confirmation/${booking.pnr}`)}
                          className="inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <PrinterIcon className="w-3.5 h-3.5" />
                          View E-Ticket
                        </Button>

                        {canCancel && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setSelectedForCancel(booking)}
                            className="cursor-pointer"
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-xs text-gray-500 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 cursor-pointer"
              >
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Self-Service Cancellation Modal */}
      <CancellationModal
        booking={selectedForCancel}
        isOpen={Boolean(selectedForCancel)}
        onClose={() => setSelectedForCancel(null)}
        onCancelled={handleCancelledSuccess}
      />
    </div>
  );
}
