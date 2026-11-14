import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  BriefcaseIcon,
  LockClosedIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { Button, Badge, Card, Input, Select, Alert } from '../components/ui';
import { createBooking } from '../services/booking.service';
import { releaseTripSeats } from '../services/trip.service';
import { formatClockTime } from '../utils/dateUtils';

const PAYMENT_TABS = [
  { id: 'UPI', label: 'UPI (GPay / PhonePe)', icon: DevicePhoneMobileIcon },
  { id: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCardIcon },
  { id: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCardIcon },
  { id: 'NET_BANKING', label: 'Net Banking', icon: BuildingLibraryIcon },
  { id: 'WALLET', label: 'Wallets', icon: BanknotesIcon },
];

const INDIAN_BANKS = [
  { value: 'HDFC Bank', label: 'HDFC Bank' },
  { value: 'ICICI Bank', label: 'ICICI Bank' },
  { value: 'State Bank of India', label: 'State Bank of India (SBI)' },
  { value: 'Axis Bank', label: 'Axis Bank' },
  { value: 'Kotak Mahindra Bank', label: 'Kotak Mahindra Bank' },
];

function loadInitialHold(locationState) {
  if (locationState?.trip && locationState?.lockedSeats?.length) {
    return locationState;
  }
  try {
    const raw = sessionStorage.getItem('bus_checkout_hold');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.trip && parsed?.lockedSeats?.length) {
        return parsed;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function formatCountdown(secondsRemaining) {
  const safe = Math.max(0, secondsRemaining);
  const mins = String(Math.floor(safe / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [holdData] = useState(() => loadInitialHold(location.state));
  const trip = holdData?.trip || null;
  const lockedSeats = holdData?.lockedSeats || [];
  const lockedUntil = holdData?.lockedUntil || null;

  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!lockedUntil) return 600;
    return Math.max(0, Math.floor((new Date(lockedUntil).getTime() - Date.now()) / 1000));
  });
  const [holdExpired, setHoldExpired] = useState(false);

  // Step 1: Passengers (one entry per locked seat)
  const [passengers, setPassengers] = useState(() =>
    lockedSeats.map((s, idx) => ({
      seatNumber: s.seatNumber,
      price: s.price,
      fullName: idx === 0 && user?.name ? user.name : '',
      age: '',
      gender: 'MALE',
    }))
  );

  // Step 3: Add-ons
  const [extraBaggage, setExtraBaggage] = useState(false);
  const [travelInsurance, setTravelInsurance] = useState(true);

  // Step 4: Contact Info
  const [contactEmail, setContactEmail] = useState(() => user?.email || '');
  const [contactPhone, setContactPhone] = useState(() => user?.phone || '');

  // Step 5: Simulated Payment
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('passenger@okaxis');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [cardLast4, setCardLast4] = useState('4242');
  const [walletProvider, setWalletProvider] = useState('Paytm Wallet');
  const [simulateFailure, setSimulateFailure] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState('');

  // Sync user email/phone if auth finishes hydrating after mount
  useEffect(() => {
    if (user?.email && !contactEmail) setContactEmail(user.email);
    if (user?.phone && !contactPhone) setContactPhone(user.phone);
    if (user?.name) {
      setPassengers((prev) =>
        prev.map((p, idx) => (idx === 0 && !p.fullName ? { ...p, fullName: user.name } : p))
      );
    }
  }, [user, contactEmail, contactPhone]);

  // 10-Minute Hold Countdown Timer
  useEffect(() => {
    if (!lockedUntil || !trip?.id) return undefined;

    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(lockedUntil).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        setHoldExpired(true);
        sessionStorage.removeItem('bus_checkout_hold');
        releaseTripSeats(
          trip.id,
          lockedSeats.map((s) => s.seatNumber)
        ).catch(() => {});
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockedUntil, trip?.id, lockedSeats]);

  const fareBreakdown = useMemo(() => {
    const seatSubtotal = lockedSeats.reduce((sum, s) => sum + Number(s.price || 0), 0);
    const baggageFee = extraBaggage ? 99 : 0;
    const insuranceFee = travelInsurance ? 29 * lockedSeats.length : 0;
    const taxable = seatSubtotal + baggageFee + insuranceFee;
    const gstAmount = Number((taxable * 0.05).toFixed(2));
    const totalAmount = Number((taxable + gstAmount).toFixed(2));
    return { seatSubtotal, baggageFee, insuranceFee, gstAmount, totalAmount };
  }, [lockedSeats, extraBaggage, travelInsurance]);

  const handlePassengerChange = (idx, field, value) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const handleReleaseAndGoBack = async () => {
    if (trip?.id && lockedSeats.length > 0) {
      setReleasing(true);
      try {
        await releaseTripSeats(
          trip.id,
          lockedSeats.map((s) => s.seatNumber)
        );
      } catch {
        // Proceed cleanly even if hold already expired
      } finally {
        setReleasing(false);
      }
    }
    sessionStorage.removeItem('bus_checkout_hold');
    navigate(-1);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (holdExpired) {
      setError('Your 10-minute seat hold has expired. Please re-select your seats.');
      return;
    }

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName.trim() || p.fullName.trim().length < 2) {
        setError(`Please enter a valid full name for Seat ${p.seatNumber}.`);
        return;
      }
      const ageNum = Number(p.age);
      if (!ageNum || ageNum < 1 || ageNum > 120) {
        setError(`Please enter a valid age (1–120) for Seat ${p.seatNumber}.`);
        return;
      }
    }

    if (!contactEmail.trim()) {
      setError('Please enter a valid contact email for E-Ticket delivery.');
      return;
    }

    const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
    if (!phoneRegex.test(contactPhone.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. +91 9876543210).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tripId: trip.id,
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        holdExpiresAt: lockedUntil || undefined,
        paymentMethod,
        paymentDetails: {
          upiId: paymentMethod === 'UPI' ? upiId.trim() : undefined,
          cardLast4:
            paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD'
              ? cardLast4
              : undefined,
          bankName: paymentMethod === 'NET_BANKING' ? bankName : undefined,
          walletProvider: paymentMethod === 'WALLET' ? walletProvider : undefined,
          simulateFailure,
        },
        addons: {
          extraBaggage,
          travelInsurance,
        },
        passengers: passengers.map((p) => ({
          fullName: p.fullName.trim(),
          age: Number(p.age),
          gender: p.gender,
          seatNumber: p.seatNumber,
        })),
      };

      const confirmation = await createBooking(payload);
      const enrichedConfirmation = {
        ...confirmation,
        trip,
        booking: {
          ...confirmation.booking,
          trip: confirmation.booking?.trip || trip,
          passengers: confirmation.passengers || [],
          seats: confirmation.bookingSeats || [],
          payment: confirmation.payment || null,
          fareSummary: confirmation.fareSummary || null,
        },
      };
      sessionStorage.removeItem('bus_checkout_hold');
      sessionStorage.setItem('bus_last_confirmation', JSON.stringify(enrichedConfirmation));
      navigate(`/booking/confirmation/${confirmation.booking.pnr}`, {
        state: enrichedConfirmation,
        replace: true,
      });
    } catch (err) {
      setError(
        err.message ||
          'Booking could not be finalized. Please verify your inputs or re-select seats.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!holdData || !trip || lockedSeats.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Card padding="p-8" className="space-y-4">
          <h2 className="text-xl font-black text-gray-900">No Active Seat Reservation</h2>
          <p className="text-sm text-gray-500">
            Select a bus and choose your seats first to begin your 10-minute checkout hold.
          </p>
          <div>
            <Button variant="primary" onClick={() => navigate('/search')}>
              Browse Scheduled Buses
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (holdExpired) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Card padding="p-8" className="space-y-4">
          <ClockIcon className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-gray-900">Seat Reservation Expired</h2>
          <p className="text-sm text-gray-500">
            Your 10-minute temporary hold has ended and seats have been released back to live inventory.
          </p>
          <div>
            <Button variant="primary" onClick={() => navigate('/search')}>
              Return to Search Results
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isTimerUrgent = secondsLeft <= 120;

  return (
    <div className="flex-1 bg-gray-50 pb-14">
      {/* Top Checkout Strip */}
      <div className="bg-[#131b26] text-white px-4 py-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReleaseAndGoBack}
              disabled={releasing}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Release Seats & Back</span>
            </button>
            <span className="text-gray-600">|</span>
            <span className="text-sm font-black">
              {trip.route?.sourceCity} → {trip.route?.destinationCity}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black ${
              isTimerUrgent
                ? 'bg-rose-500/20 text-rose-200 border border-rose-400/50 animate-pulse'
                : 'bg-[#73d200]/20 text-[#73d200] border border-[#73d200]/40'
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            <span>Seats Held For {formatCountdown(secondsLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Form + Sticky Summary Sidebar */}
      <form
        onSubmit={handleConfirmBooking}
        className="max-w-6xl mx-auto px-4 pt-6 flex flex-col lg:flex-row gap-6 items-start"
      >
        <div className="flex-1 w-full space-y-5">
          {error && (
            <Alert variant="danger" title="Checkout Notice" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Step 1: Passenger Details */}
          <Card padding="p-6" className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-full bg-[#73d200] text-gray-900 font-black text-xs flex items-center justify-center">
                1
              </span>
              <div>
                <h2 className="text-base font-black text-gray-900">Passenger Details</h2>
                <p className="text-xs text-gray-500">
                  Enter traveler details matching government ID for verification during boarding
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {passengers.map((p, idx) => (
                <div
                  key={p.seatNumber}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-gray-900">
                      <UserIcon className="w-4 h-4 text-[#65b800]" />
                      Passenger {idx + 1}
                    </span>
                    <Badge variant="operator">
                      Seat {p.seatNumber} • ₹{Number(p.price).toLocaleString('en-IN')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <Input
                        label="Full Name"
                        required
                        placeholder="e.g. Aarav Sharma"
                        value={p.fullName}
                        onChange={(e) => handlePassengerChange(idx, 'fullName', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        label="Age"
                        type="number"
                        min={1}
                        max={120}
                        required
                        placeholder="28"
                        value={p.age}
                        onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Select
                        label="Gender"
                        value={p.gender}
                        onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                        options={[
                          { value: 'MALE', label: 'Male' },
                          { value: 'FEMALE', label: 'Female' },
                          { value: 'OTHER', label: 'Other' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Step 2: Reserved Seats Confirmation */}
          <Card padding="p-6" className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-full bg-[#73d200] text-gray-900 font-black text-xs flex items-center justify-center">
                2
              </span>
              <div>
                <h2 className="text-base font-black text-gray-900">Seat Reservation Confirmation</h2>
                <p className="text-xs text-gray-500">
                  Your selected seats are temporarily locked exclusively for this session
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {lockedSeats.map((s) => (
                <div
                  key={s.seatNumber}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#73d200]/15 border border-[#73d200] text-xs font-extrabold text-gray-900"
                >
                  <CheckCircleIcon className="w-4 h-4 text-[#65b800]" />
                  <span>Seat {s.seatNumber}</span>
                  <span className="text-gray-600">₹{Number(s.price).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Step 3: Baggage & Travel Insurance Add-ons */}
          <Card padding="p-6" className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-full bg-[#73d200] text-gray-900 font-black text-xs flex items-center justify-center">
                3
              </span>
              <div>
                <h2 className="text-base font-black text-gray-900">Baggage & Travel Protection</h2>
                <p className="text-xs text-gray-500">
                  Optional add-ons for a worry-free intercity journey
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-start gap-3 transition-colors ${
                  extraBaggage
                    ? 'bg-[#73d200]/10 border-[#73d200]'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={extraBaggage}
                  onChange={(e) => setExtraBaggage(e.target.checked)}
                  className="mt-1 accent-[#73d200]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900 inline-flex items-center gap-1.5">
                      <BriefcaseIcon className="w-4 h-4 text-gray-600" />
                      Extra Luggage (+20kg)
                    </span>
                    <span className="text-xs font-black text-gray-900">+₹99</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add 1 additional check-in cabin suitcase per booking.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-start gap-3 transition-colors ${
                  travelInsurance
                    ? 'bg-[#73d200]/10 border-[#73d200]'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={travelInsurance}
                  onChange={(e) => setTravelInsurance(e.target.checked)}
                  className="mt-1 accent-[#73d200]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900 inline-flex items-center gap-1.5">
                      <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                      Trip Insurance
                    </span>
                    <span className="text-xs font-black text-gray-900">
                      +₹{29 * lockedSeats.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ₹29/passenger coverage for trip delays & medical emergencies.
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Step 4: Contact Information */}
          <Card padding="p-6" className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-full bg-[#73d200] text-gray-900 font-black text-xs flex items-center justify-center">
                4
              </span>
              <div>
                <h2 className="text-base font-black text-gray-900">Contact Information</h2>
                <p className="text-xs text-gray-500">
                  Your PNR E-Ticket and SMS boarding alerts will be delivered here
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="you@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <Input
                label="Mobile Number (+91)"
                type="tel"
                required
                placeholder="+91 9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </Card>

          {/* Step 5: Simulated Payment */}
          <Card padding="p-6" className="space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#73d200] text-gray-900 font-black text-xs flex items-center justify-center">
                  5
                </span>
                <div>
                  <h2 className="text-base font-black text-gray-900">Simulated Payment</h2>
                  <p className="text-xs text-gray-500">
                    Choose any simulated Indian payment mode — zero real charges apply
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <LockClosedIcon className="w-3.5 h-3.5" />
                Demo Gateway
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PAYMENT_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const active = paymentMethod === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPaymentMethod(tab.id)}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#131b26] text-white border-[#131b26] shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <TabIcon className={`w-5 h-5 ${active ? 'text-[#73d200]' : 'text-gray-500'}`} />
                    <span className="leading-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {paymentMethod === 'UPI' && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <Input
                  label="UPI ID / VPA"
                  placeholder="name@okaxis / name@ybl"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 text-xs">
                  {['passenger@okaxis', 'traveler@ybl', 'rider@paytm'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setUpiId(sample)}
                      className="px-2.5 py-1 rounded-md bg-white border border-gray-300 font-semibold text-gray-700 hover:border-[#73d200] cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD') && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Simulated Card Last 4 Digits"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                <Input label="Cardholder Name" defaultValue="Simulated Card Holder" readOnly />
              </div>
            )}

            {paymentMethod === 'NET_BANKING' && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Select
                  label="Select Indian Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  options={INDIAN_BANKS}
                />
              </div>
            )}

            {paymentMethod === 'WALLET' && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Select
                  label="Select Digital Wallet"
                  value={walletProvider}
                  onChange={(e) => setWalletProvider(e.target.value)}
                  options={[
                    { value: 'Paytm Wallet', label: 'Paytm Wallet' },
                    { value: 'PhonePe Wallet', label: 'PhonePe Wallet' },
                    { value: 'Amazon Pay Balance', label: 'Amazon Pay Balance' },
                  ]}
                />
              </div>
            )}

            <label className="inline-flex items-center gap-2 text-xs text-gray-500 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="accent-rose-600"
              />
              <span>Simulate bank payment decline (tests atomic transaction rollback)</span>
            </label>
          </Card>
        </div>

        {/* Sticky Order & Fare Summary Sidebar */}
        <aside className="w-full lg:w-96 shrink-0 lg:sticky lg:top-20 space-y-4">
          <Card padding="p-6" className="space-y-4 shadow-md border border-gray-200">
            <div>
              <Badge variant="operator">
                {trip.bus?.operator?.companyName || trip.bus?.operator?.name}
              </Badge>
              <h3 className="text-lg font-black text-gray-900 mt-2">
                {trip.route?.sourceCity} → {trip.route?.destinationCity}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Departure {formatClockTime(trip.departureTime)} • Coach {trip.bus?.busNumber}
              </p>
            </div>

            <div className="border-t border-b border-gray-100 py-3.5 space-y-2 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>
                  Base Seat Fare ({lockedSeats.length}{' '}
                  {lockedSeats.length === 1 ? 'seat' : 'seats'})
                </span>
                <span className="font-bold">
                  ₹{fareBreakdown.seatSubtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {fareBreakdown.baggageFee > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Extra Luggage (+20kg)</span>
                  <span className="font-bold">₹{fareBreakdown.baggageFee}</span>
                </div>
              )}

              {fareBreakdown.insuranceFee > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Trip Protection Insurance</span>
                  <span className="font-bold">₹{fareBreakdown.insuranceFee}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500 text-xs pt-1">
                <span>GST & Service Tax (5%)</span>
                <span className="font-semibold">₹{fareBreakdown.gstAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-gray-900">Total Payable</span>
              <span className="text-2xl font-black text-gray-900">
                ₹{fareBreakdown.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={submitting}
              icon={LockClosedIcon}
            >
              Pay ₹{fareBreakdown.totalAmount.toLocaleString('en-IN')} & Confirm
            </Button>

            <p className="text-[11px] text-center text-gray-400">
              Your seats are securely reserved and protected until payment completion.
            </p>
          </Card>
        </aside>
      </form>
    </div>
  );
}
