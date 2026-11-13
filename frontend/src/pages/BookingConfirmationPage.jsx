import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  TicketIcon,
  InformationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import { Button, Card, Alert } from '../components/ui';
import ETicketCard from '../components/ticket/ETicketCard';
import { fetchBookingByPnr } from '../services/booking.service';

function loadCachedBooking(pnr, locationState) {
  if (locationState?.booking?.pnr === pnr) {
    return locationState.booking;
  }
  if (locationState?.pnr === pnr) {
    return locationState;
  }
  try {
    const raw = sessionStorage.getItem('bus_last_confirmation');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.booking?.pnr === pnr) {
        return parsed.booking;
      }
      if (parsed?.pnr === pnr) {
        return parsed;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export default function BookingConfirmationPage() {
  const { pnr } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(() => loadCachedBooking(pnr, location.state));
  const [loading, setLoading] = useState(() => !booking?.trip?.route);
  const [error, setError] = useState('');
  const [copiedPnr, setCopiedPnr] = useState(false);

  useEffect(() => {
    // If we don't have complete booking details with trip route/bus, hydrate from API
    if (!booking || !booking?.trip?.route) {
      let isMounted = true;
      setLoading(true);
      setError('');

      fetchBookingByPnr(pnr)
        .then((data) => {
          if (!isMounted) return;
          if (data) {
            setBooking(data);
          } else {
            setError('Booking not found for the provided PNR code.');
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err.message || 'Failed to retrieve booking confirmation details.');
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [pnr, booking]);

  const handleCopyPnr = async () => {
    if (!booking?.pnr) return;
    try {
      await navigator.clipboard.writeText(booking.pnr);
      setCopiedPnr(true);
      setTimeout(() => setCopiedPnr(false), 2500);
    } catch {
      // Fallback for browsers with restricted clipboard permission
      setCopiedPnr(true);
      setTimeout(() => setCopiedPnr(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#73d200] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-600">
            Generating your official e-ticket and boarding pass...
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Card padding="p-8" className="space-y-4">
          <h2 className="text-xl font-black text-gray-900">Booking Confirmation Not Found</h2>
          <p className="text-sm text-gray-500">
            {error || `No booking records found for PNR "${pnr}". Please check the code or contact support.`}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="primary" onClick={() => navigate('/search')}>
              Browse Available Buses
            </Button>
            <Button variant="outline" onClick={() => navigate('/my-bookings')}>
              Go to My Bookings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Screen-Only Celebration & Action Banner */}
        <div className="no-print bg-emerald-600 text-white rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Booking Confirmed!
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100">
                  Your intercity coach reservation is locked and payment is verified.
                </p>
              </div>
            </div>

            {/* PNR Quick Action Pill */}
            <div className="flex items-center gap-2 bg-emerald-700/80 px-4 py-2 rounded-xl border border-emerald-500">
              <span className="text-[11px] uppercase font-bold text-emerald-200">PNR:</span>
              <span className="font-mono text-base font-black text-white">{booking.pnr}</span>
              <button
                type="button"
                onClick={handleCopyPnr}
                title="Copy PNR to clipboard"
                className="ml-1 text-emerald-200 hover:text-white cursor-pointer p-1 rounded hover:bg-emerald-600 transition-colors"
              >
                {copiedPnr ? (
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-[#73d200]" />
                ) : (
                  <ClipboardDocumentIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-500/50">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 text-xs font-black shadow-md cursor-pointer"
              >
                <PrinterIcon className="w-4 h-4" />
                Print E-Ticket
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 text-xs font-bold bg-white text-gray-900 hover:bg-gray-100 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download PDF
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/my-bookings')}
                className="text-xs font-bold text-emerald-100 hover:text-white underline cursor-pointer"
              >
                View My Bookings
              </button>
              <span className="text-emerald-400">•</span>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs font-bold text-emerald-100 hover:text-white cursor-pointer"
              >
                Book Another Trip
              </button>
            </div>
          </div>
        </div>

        {/* The Printable E-Ticket Card */}
        <ETicketCard booking={booking} />

        {/* Screen-Only Next Steps Guidance */}
        <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <Card padding="p-5" className="border-l-4 border-l-[#73d200]">
            <div className="text-xs font-black uppercase text-gray-900 mb-1 flex items-center gap-1.5">
              <InformationCircleIcon className="w-4 h-4 text-[#73d200]" />
              1. Digital SMS & Email
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              A copy of this ticket with live boarding instructions has been dispatched to{' '}
              <strong className="text-gray-800">{booking.contactEmail || 'your email'}</strong>.
            </p>
          </Card>

          <Card padding="p-5" className="border-l-4 border-l-[#131b26]">
            <div className="text-xs font-black uppercase text-gray-900 mb-1 flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 text-[#131b26]" />
              2. Live Bus Tracking
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              GPS bus tracker link will be enabled 30 minutes before scheduled departure so you can track your coach in real time.
            </p>
          </Card>

          <Card padding="p-5" className="border-l-4 border-l-rose-500">
            <div className="text-xs font-black uppercase text-gray-900 mb-1 flex items-center gap-1.5">
              <TicketIcon className="w-4 h-4 text-rose-500" />
              3. Self-Service Cancellation
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Need to modify or cancel? You can manage tickets anytime from the My Bookings portal with automated refund calculation.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

