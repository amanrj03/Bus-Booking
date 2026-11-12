import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/solid';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { Button, Card, Alert } from '../ui';

const DEFAULT_INDIAN_CITIES = [
  'Delhi',
  'Jaipur',
  'Mumbai',
  'Pune',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Chandigarh',
  'Manali',
  'Udaipur',
  'Ahmedabad',
  'Goa',
  'Agra',
  'Lucknow',
  'Jodhpur',
];

function getLocalDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HeroSearchWidget({
  cities = DEFAULT_INDIAN_CITIES,
  initialFrom = 'Delhi',
  initialTo = 'Jaipur',
  initialDate = getLocalDateString(0),
  initialPassengers = 1,
  onSearch,
}) {
  const navigate = useNavigate();
  const todayStr = getLocalDateString(0);
  const tomorrowStr = getLocalDateString(1);

  const [fromCity, setFromCity] = useState(initialFrom);
  const [toCity, setToCity] = useState(initialTo);
  const [travelDate, setTravelDate] = useState(initialDate);
  const [passengers, setPassengers] = useState(initialPassengers);
  const [swapped, setSwapped] = useState(false);
  const [validationError, setValidationError] = useState('');

  const availableCities = cities.length > 0 ? cities : DEFAULT_INDIAN_CITIES;

  const handleSwapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
    setSwapped((prev) => !prev);
    setValidationError('');
  };

  const handlePassengersChange = (delta) => {
    setPassengers((prev) => Math.min(6, Math.max(1, prev + delta)));
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
    <Card padding="p-5 md:p-6" className="text-gray-800 w-full shadow-2xl border-0">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#73d200]/20 text-gray-900">
              One-Way Intercity Coach
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Zero convenience fee on direct UPI bookings
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400 font-semibold mr-1">Quick Date:</span>
            <button
              type="button"
              onClick={() => setTravelDate(todayStr)}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                travelDate === todayStr
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTravelDate(tomorrowStr)}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                travelDate === tomorrowStr
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tomorrow
            </button>
          </div>
        </div>

        {validationError && (
          <Alert variant="danger" onClose={() => setValidationError('')}>
            {validationError}
          </Alert>
        )}

        <datalist id="indian-bus-cities">
          {availableCities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* Origin + Swap + Destination */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row items-center gap-2 relative">
            <div className="w-full flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-gray-50 focus-within:bg-white focus-within:border-[#73d200] transition-colors flex items-center gap-2.5">
              <MapPinIcon className="w-5 h-5 text-[#65b800] shrink-0" />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="hero-from-city"
                  className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block"
                >
                  From
                </label>
                <input
                  id="hero-from-city"
                  list="indian-bus-cities"
                  value={fromCity}
                  onChange={(e) => {
                    setFromCity(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Enter origin city"
                  className="w-full bg-transparent font-bold text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSwapCities}
              aria-label="Swap origin and destination"
              title="Swap origin and destination"
              className="w-10 h-10 shrink-0 rounded-full bg-white border border-gray-300 hover:border-[#73d200] hover:bg-[#73d200]/10 text-gray-700 flex items-center justify-center shadow-sm transition-all cursor-pointer z-10 sm:-mx-4"
            >
              <ArrowsRightLeftIcon
                className={`w-4 h-4 transition-transform duration-300 ${
                  swapped ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className="w-full flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-gray-50 focus-within:bg-white focus-within:border-[#73d200] transition-colors flex items-center gap-2.5">
              <MapPinIcon className="w-5 h-5 text-gray-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="hero-to-city"
                  className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block"
                >
                  To
                </label>
                <input
                  id="hero-to-city"
                  list="indian-bus-cities"
                  value={toCity}
                  onChange={(e) => {
                    setToCity(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Enter destination city"
                  className="w-full bg-transparent font-bold text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Journey Date */}
          <div className="lg:col-span-2 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-gray-50 focus-within:bg-white focus-within:border-[#73d200] transition-colors flex items-center gap-2.5">
            <CalendarDaysIcon className="w-5 h-5 text-gray-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="hero-travel-date"
                className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block"
              >
                Departure
              </label>
              <input
                id="hero-travel-date"
                type="date"
                min={todayStr}
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Passengers Counter */}
          <div className="lg:col-span-2 border border-gray-300 rounded-xl px-3.5 py-2.5 bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <UserGroupIcon className="w-5 h-5 text-gray-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                  Passengers
                </span>
                <span className="font-bold text-sm text-gray-900">
                  {passengers} {passengers === 1 ? 'Seat' : 'Seats'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Decrease passengers"
                disabled={passengers <= 1}
                onClick={() => handlePassengersChange(-1)}
                className="w-7 h-7 rounded-md bg-white border border-gray-200 hover:border-gray-400 disabled:opacity-40 flex items-center justify-center text-gray-700 cursor-pointer"
              >
                <MinusIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Increase passengers"
                disabled={passengers >= 6}
                onClick={() => handlePassengersChange(1)}
                className="w-7 h-7 rounded-md bg-white border border-gray-200 hover:border-gray-400 disabled:opacity-40 flex items-center justify-center text-gray-700 cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="lg:col-span-2 flex">
            <Button
              type="submit"
              size="lg"
              fullWidth
              icon={MagnifyingGlassIcon}
              className="rounded-xl text-base py-3.5"
            >
              Search
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
