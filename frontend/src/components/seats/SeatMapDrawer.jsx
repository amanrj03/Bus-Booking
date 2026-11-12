import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { Button, Badge, Alert } from '../ui';
import SeatItem from './SeatItem';
import { fetchTripSeatMap, lockTripSeats } from '../../services/trip.service';
import { formatClockTime } from '../../utils/dateUtils';
import { groupDeckRows, calculateSelectedSubtotal } from '../../utils/seatLayout';

const MAX_SELECTABLE_SEATS = 6;

export default function SeatMapDrawer({
  trip,
  isOpen,
  onClose,
  passengersRequested = 1,
}) {
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [liveTrip, setLiveTrip] = useState(trip);
  const [summary, setSummary] = useState({ total: 0, available: 0, locked: 0, booked: 0 });
  const [activeDeck, setActiveDeck] = useState(1);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState('');

  const loadSeatMap = useCallback(async () => {
    if (!trip?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchTripSeatMap(trip.id);
      setSeats(data.seats || []);
      if (data.trip) setLiveTrip(data.trip);
      setSummary(data.summary || { total: 0, available: 0, locked: 0, booked: 0 });
    } catch (err) {
      setError(err.message || 'Unable to load live seat inventory.');
    } finally {
      setLoading(false);
    }
  }, [trip?.id]);

  useEffect(() => {
    if (isOpen && trip?.id) {
      setActiveDeck(1);
      setSelectedNumbers([]);
      setLiveTrip(trip);
      loadSeatMap();
    }
  }, [isOpen, trip, loadSeatMap]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const deckCount = liveTrip?.bus?.deckCount || (liveTrip?.bus?.busType === 'AC_SLEEPER_2X1' ? 2 : 1);
  const isSleeperCoach = liveTrip?.bus?.busType === 'AC_SLEEPER_2X1';

  const rowsMap = useMemo(
    () => groupDeckRows(seats, activeDeck, isSleeperCoach),
    [seats, activeDeck, isSleeperCoach]
  );

  const subtotal = useMemo(
    () => calculateSelectedSubtotal(seats, selectedNumbers),
    [seats, selectedNumbers]
  );

  const handleToggleSeat = (seat) => {
    setError('');
    const alreadySelected = selectedNumbers.includes(seat.seatNumber);
    if (alreadySelected) {
      setSelectedNumbers((prev) => prev.filter((num) => num !== seat.seatNumber));
      return;
    }

    if (selectedNumbers.length >= MAX_SELECTABLE_SEATS) {
      setError(`You can reserve up to ${MAX_SELECTABLE_SEATS} seats per booking.`);
      return;
    }

    setSelectedNumbers((prev) => [...prev, seat.seatNumber]);
  };

  const handleProceedToCheckout = async () => {
    if (selectedNumbers.length === 0 || !trip?.id) return;
    setLocking(true);
    setError('');
    try {
      const lockResult = await lockTripSeats(trip.id, selectedNumbers, 10);
      const checkoutState = {
        trip: liveTrip,
        lockedSeats: lockResult.lockedSeats,
        lockedUntil: lockResult.lockedUntil,
        totalSeatPrice: lockResult.totalSeatPrice,
      };
      sessionStorage.setItem('bus_checkout_hold', JSON.stringify(checkoutState));
      onClose();
      navigate('/checkout', { state: checkoutState });
    } catch (err) {
      setError(
        err.message ||
          'Selected seats are no longer available. Refreshing live seat inventory...'
      );
      setSelectedNumbers([]);
      await loadSeatMap();
    } finally {
      setLocking(false);
    }
  };

  if (!isOpen || !trip) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Bus Seat Selection Drawer"
    >
      <div
        className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-[#131b26] text-white flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="operator">
                {liveTrip?.bus?.operator?.companyName || liveTrip?.bus?.operator?.name || 'Express'}
              </Badge>
              <span className="text-[11px] font-mono text-gray-300">
                {liveTrip?.bus?.busNumber}
              </span>
            </div>
            <h3 className="text-lg font-black">
              {liveTrip?.route?.sourceCity} → {liveTrip?.route?.destinationCity}
            </h3>
            <p className="text-xs text-gray-300">
              Departure {formatClockTime(liveTrip?.departureTime)} •{' '}
              {summary.available ?? liveTrip?.availableSeatsCount ?? 0} seats available
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadSeatMap}
              disabled={loading}
              title="Refresh live seat availability"
              className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close seat map"
              className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Legend & Deck Switcher */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white border-2 border-gray-400 inline-block" />
              Available
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#73d200] border-2 border-[#65b800] inline-block" />
              Selected
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-100 border-2 border-amber-300 inline-block" />
              Held
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-gray-100 border-2 border-gray-200 inline-block" />
              Booked
            </span>
          </div>

          {deckCount > 1 && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveDeck(1)}
                className={`py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  activeDeck === 1
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Lower Deck (L)
              </button>
              <button
                type="button"
                onClick={() => setActiveDeck(2)}
                className={`py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  activeDeck === 2
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Upper Deck (U)
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Coach Chassis Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 bg-gray-100">
          {error && (
            <div className="mb-4">
              <Alert variant="danger" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          {passengersRequested > 1 && selectedNumbers.length < passengersRequested && (
            <div className="mb-3 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-[#65b800] shrink-0" />
              <span>
                Select {passengersRequested} seats for your search ({selectedNumbers.length}/
                {passengersRequested} chosen)
              </span>
            </div>
          )}

          {loading && seats.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((r) => (
                <div key={r} className="h-10 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-4 max-w-xs mx-auto">
              {/* Driver Cabin Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-dashed border-gray-300">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  {activeDeck === 2 ? 'Upper Berth Cabin' : 'Front Door'}
                </span>
                <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs bg-gray-100 px-2.5 py-1 rounded-full">
                  <span aria-hidden="true" className="text-base leading-none">
                    ☸
                  </span>
                  <span>{activeDeck === 2 ? 'Upper' : 'Driver'}</span>
                </div>
              </div>

              {/* Seat Rows */}
              <div className="space-y-3">
                {rowsMap.map(({ rowNum, leftSeats, rightSeats }) => (
                  <div key={rowNum} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {leftSeats.map((s) => (
                        <SeatItem
                          key={s.tripSeatId || s.seatNumber}
                          seat={s}
                          isSleeperLayout={isSleeperCoach}
                          isSelected={selectedNumbers.includes(s.seatNumber)}
                          onToggle={handleToggleSeat}
                        />
                      ))}
                    </div>

                    <div className="flex-1 text-center text-[10px] font-bold text-gray-300 select-none">
                      R{rowNum}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rightSeats.map((s) => (
                        <SeatItem
                          key={s.tripSeatId || s.seatNumber}
                          seat={s}
                          isSleeperLayout={isSleeperCoach}
                          isSelected={selectedNumbers.includes(s.seatNumber)}
                          onToggle={handleToggleSeat}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Selection Summary & Checkout Footer */}
        <div className="px-5 py-4 bg-white border-t border-gray-200 space-y-3 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                Selected Seats ({selectedNumbers.length})
              </span>
              {selectedNumbers.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedNumbers.map((num) => (
                    <span
                      key={num}
                      className="px-2 py-0.5 rounded bg-[#73d200]/20 text-gray-900 font-extrabold text-xs"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-500 font-medium">
                  Tap available seats above to select
                </span>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                Seat Subtotal
              </span>
              <span className="text-xl font-black text-gray-900">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            fullWidth
            loading={locking}
            disabled={selectedNumbers.length === 0}
            onClick={handleProceedToCheckout}
            icon={ArrowRightIcon}
            iconPosition="right"
          >
            {selectedNumbers.length > 0
              ? `Lock ${selectedNumbers.length} ${
                  selectedNumbers.length === 1 ? 'Seat' : 'Seats'
                } & Continue (₹${subtotal.toLocaleString('en-IN')})`
              : 'Select Seats to Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
