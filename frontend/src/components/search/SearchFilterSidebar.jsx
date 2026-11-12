import React from 'react';
import { AdjustmentsHorizontalIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Card, Select, Button } from '../ui';

const DEPARTURE_WINDOWS = [
  { value: '', label: 'Any Time' },
  { value: 'MORNING', label: 'Morning (05:00 – 11:59)' },
  { value: 'AFTERNOON', label: 'Afternoon (12:00 – 16:59)' },
  { value: 'EVENING', label: 'Evening (17:00 – 20:59)' },
  { value: 'NIGHT', label: 'Night (21:00 – 04:59)' },
];

const BUS_TYPES = [
  { value: '', label: 'All Coach Types' },
  { value: 'AC_SLEEPER_2X1', label: 'AC Sleeper (2+1)' },
  { value: 'AC_SEATER_2X2', label: 'AC Seater (2+2)' },
  { value: 'NON_AC_SEATER_2X2', label: 'Non-AC Seater (2+2)' },
];

const SORT_OPTIONS = [
  { value: 'departure_asc', label: 'Earliest Departure' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'duration_asc', label: 'Fastest Journey' },
];

export default function SearchFilterSidebar({
  filters,
  onUpdateFilter,
  onResetFilters,
}) {
  return (
    <Card padding="p-5" className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-black text-gray-900 text-sm">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-[#65b800]" />
          <span>Filters & Sorting</span>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#65b800] hover:underline cursor-pointer"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Sort By */}
      <Select
        label="Sort By"
        value={filters.sortBy}
        onChange={(e) => onUpdateFilter('sortBy', e.target.value)}
        options={SORT_OPTIONS}
      />

      {/* Coach Type */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-2">
          Coach Category
        </span>
        <div className="space-y-1.5">
          {BUS_TYPES.map((type) => {
            const active = filters.busType === type.value;
            return (
              <button
                key={type.value || 'ALL'}
                type="button"
                onClick={() => onUpdateFilter('busType', type.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#73d200]/15 border-[#73d200] text-gray-900'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Departure Window */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-2">
          Departure Time
        </span>
        <div className="space-y-1.5">
          {DEPARTURE_WINDOWS.map((win) => {
            const active = filters.departureWindow === win.value;
            return (
              <button
                key={win.value || 'ANY'}
                type="button"
                onClick={() => onUpdateFilter('departureWindow', win.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {win.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Price Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
            Max Seat Fare
          </span>
          <span className="text-xs font-black text-gray-900">
            ₹{Number(filters.maxPrice || 3000).toLocaleString('en-IN')}
          </span>
        </div>
        <input
          type="range"
          min={300}
          max={3000}
          step={50}
          value={filters.maxPrice || 3000}
          onChange={(e) => onUpdateFilter('maxPrice', Number(e.target.value))}
          className="w-full accent-[#73d200] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-0.5">
          <span>₹300</span>
          <span>₹3,000+</span>
        </div>
      </div>

      <Button variant="outline" size="sm" fullWidth onClick={onResetFilters}>
        Clear All Filters
      </Button>
    </Card>
  );
}
