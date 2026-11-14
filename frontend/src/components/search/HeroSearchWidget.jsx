import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
} from '@heroicons/react/24/solid';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { Alert } from '../ui';
import CitySearchInput from './CitySearchInput';
import { getUnifiedCities } from '../../config/citiesConfig';

function getLocalDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HeroSearchWidget({
  cities = [],
  initialFrom = 'Delhi',
  initialTo = 'Jaipur',
  initialDate = getLocalDateString(0),
  initialPassengers = 1,
  onSearch,
}) {
  const navigate = useNavigate();
  const todayStr = getLocalDateString(0);

  const [tripType, setTripType] = useState('ONE_WAY');
  const [fromCity, setFromCity] = useState(initialFrom);
  const [toCity, setToCity] = useState(initialTo);
  const [travelDate, setTravelDate] = useState(initialDate);
  const [passengers, setPassengers] = useState(initialPassengers);
  const [swapped, setSwapped] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Combine default Indian cities catalog with any dynamic cities from API
  const unifiedCities = useMemo(() => getUnifiedCities(cities), [cities]);

  const handleSwapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
    setSwapped((prev) => !prev);
    setValidationError('');
  };

  const handleStepDay = (days) => {
    try {
      const parts = travelDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + days);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (d < today) return; // Do not go into the past

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setTravelDate(`${y}-${m}-${day}`);
    } catch {
      // fallback
    }
  };

  const formatDisplayDate = (dateStr) => {
    try {
      if (dateStr === todayStr) {
        const parts = dateStr.split('-');
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const dayNum = d.getDate();
        const monthShort = d.toLocaleString('en-US', { month: 'short' });
        return `Today, ${dayNum} ${monthShort}`;
      }
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const weekdayShort = d.toLocaleString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      return `${weekdayShort}, ${dayNum} ${monthShort}`;
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedFrom = fromCity.trim();
    const trimmedTo = toCity.trim();

    if (!trimmedFrom || !trimmedTo) {
      setValidationError('Please enter both origin and destination cities.');
      return;
    }

    if (trimmedFrom.toLowerCase() === trimmedTo.toLowerCase()) {
      setValidationError('Origin and destination cities must be different.');
      return;
    }

    setValidationError('');

    const payload = {
      sourceCity: trimmedFrom,
      destinationCity: trimmedTo,
      date: travelDate,
      passengers,
    };

    if (onSearch) {
      onSearch(payload);
      return;
    }

    const searchParams = new URLSearchParams({
      sourceCity: trimmedFrom,
      destinationCity: trimmedTo,
      date: travelDate,
      passengers: String(passengers),
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="bg-white text-gray-900 rounded-2xl shadow-xl p-5 md:p-6 w-full border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Radio Tabs: One Way vs Round Trip */}
        <div className="flex items-center gap-6 text-sm font-semibold text-gray-800">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="tripType"
              value="ONE_WAY"
              checked={tripType === 'ONE_WAY'}
              onChange={() => setTripType('ONE_WAY')}
              className="w-4 h-4 text-gray-900 accent-gray-900 focus:ring-0 cursor-pointer"
            />
            <span>One Way</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 hover:text-gray-900">
            <input
              type="radio"
              name="tripType"
              value="ROUND_TRIP"
              checked={tripType === 'ROUND_TRIP'}
              onChange={() => setTripType('ROUND_TRIP')}
              className="w-4 h-4 text-gray-900 accent-gray-900 focus:ring-0 cursor-pointer"
            />
            <span>Round Trip</span>
          </label>
        </div>

        {validationError && (
          <Alert variant="danger" onClose={() => setValidationError('')}>
            {validationError}
          </Alert>
        )}

        {/* Input Fields Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* FROM City with Custom Auto-Suggest Popover */}
          <div className="md:col-span-3">
            <CitySearchInput
              id="hero-from-city"
              label="From"
              value={fromCity}
              onChange={(val) => {
                setFromCity(val);
                setValidationError('');
              }}
              placeholder="Origin city"
              allCities={unifiedCities}
              hasError={Boolean(validationError && !fromCity)}
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 md:my-0 md:-mx-3 z-10 md:col-span-1">
            <button
              type="button"
              onClick={handleSwapCities}
              aria-label="Swap origin and destination"
              title="Swap origin and destination"
              className="w-9 h-9 rounded-full bg-white border border-gray-300 hover:border-[#73d200] hover:bg-[#73d200]/10 text-gray-700 flex items-center justify-center shadow-sm transition-all cursor-pointer"
            >
              <ArrowsRightLeftIcon
                className={`w-4 h-4 transition-transform duration-300 ${
                  swapped ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* TO City with Custom Auto-Suggest Popover */}
          <div className="md:col-span-3">
            <CitySearchInput
              id="hero-to-city"
              label="To"
              value={toCity}
              onChange={(val) => {
                setToCity(val);
                setValidationError('');
              }}
              placeholder="Destination city"
              allCities={unifiedCities}
              hasError={Boolean(validationError && !toCity)}
            />
          </div>

          {/* Departure Date with < > Step Buttons */}
          <div className="md:col-span-3 border border-gray-300 rounded-xl px-3 py-2 bg-white hover:border-gray-400 focus-within:border-[#73d200] transition-colors flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="hero-travel-date"
                  className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block"
                >
                  Departure
                </label>
                <div className="relative">
                  <span className="font-bold text-sm text-gray-900 block truncate cursor-pointer pointer-events-none">
                    {formatDisplayDate(travelDate)}
                  </span>
                  <input
                    id="hero-travel-date"
                    type="date"
                    min={todayStr}
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              </div>
            </div>

            {/* < > arrows for easy day switching */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => handleStepDay(-1)}
                disabled={travelDate <= todayStr}
                aria-label="Previous day"
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-600 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStepDay(1)}
                aria-label="Next day"
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Passengers Selector */}
          <div className="md:col-span-2 border border-gray-300 rounded-xl px-3 py-2.5 bg-white hover:border-gray-400 focus-within:border-[#73d200] transition-colors flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="hero-passengers"
                className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block"
              >
                Passengers
              </label>
              <select
                id="hero-passengers"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-sm text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value={1}>1 Adult</option>
                <option value={2}>2 Adults</option>
                <option value={3}>3 Adults</option>
                <option value={4}>4 Adults</option>
                <option value={5}>5 Adults</option>
                <option value={6}>6 Adults</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search CTA Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="w-full md:w-auto md:min-w-[180px] bg-[#73d200] hover:bg-[#65b800] text-gray-950 font-black text-base py-3 px-8 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Search</span>
          </button>
        </div>
      </form>
    </div>
  );
}
