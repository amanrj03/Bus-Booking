import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseYMD(dateStr) {
  try {
    const parts = (dateStr || '').split('-');
    if (parts.length === 3) {
      return {
        year: Number(parts[0]),
        month: Number(parts[1]) - 1,
        day: Number(parts[2]),
      };
    }
  } catch {
    // fallback
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
  };
}

function toYMD(year, monthIndex, day) {
  const y = year;
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DepartureDatePicker({
  value,
  minDate,
  onChange,
  onStepDay,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const nativeInputRef = useRef(null);

  const selectedParsed = parseYMD(value);
  const minParsed = parseYMD(minDate);

  // View state for the calendar (viewYear and viewMonth)
  const [viewYear, setViewYear] = useState(selectedParsed.year);
  const [viewMonth, setViewMonth] = useState(selectedParsed.month);

  // Sync view when selected value changes
  useEffect(() => {
    const p = parseYMD(value);
    setViewYear(p.year);
    setViewMonth(p.month);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayNum = d.getDate();
      const monthShort = d.toLocaleString('en-US', { month: 'short' });

      if (minDate && dateStr === minDate) {
        return `Today, ${dayNum} ${monthShort}`;
      }

      // Check if tomorrow
      const minParts = minDate.split('-');
      const minD = new Date(Number(minParts[0]), Number(minParts[1]) - 1, Number(minParts[2]));
      minD.setDate(minD.getDate() + 1);
      const tomStr = toYMD(minD.getFullYear(), minD.getMonth(), minD.getDate());
      if (dateStr === tomStr) {
        return `Tomorrow, ${dayNum} ${monthShort}`;
      }

      const weekdayShort = d.toLocaleString('en-US', { weekday: 'short' });
      return `${weekdayShort}, ${dayNum} ${monthShort}`;
    } catch {
      return dateStr;
    }
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewYear === minParsed.year && viewMonth <= minParsed.month) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day) => {
    const ymd = toYMD(viewYear, viewMonth, day);
    onChange(ymd);
    setIsOpen(false);
  };

  const handleQuickSelect = (offsetDays) => {
    const minParts = minDate.split('-');
    const target = new Date(Number(minParts[0]), Number(minParts[1]) - 1, Number(minParts[2]));
    target.setDate(target.getDate() + offsetDays);
    const ymd = toYMD(target.getFullYear(), target.getMonth(), target.getDate());
    onChange(ymd);
    setIsOpen(false);
  };

  // Build grid of days for viewYear & viewMonth
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday

  // Minimum allowed date check
  const isPastDay = (day) => {
    const thisYMD = toYMD(viewYear, viewMonth, day);
    return thisYMD < minDate;
  };

  const isSelectedDay = (day) => {
    return (
      viewYear === selectedParsed.year &&
      viewMonth === selectedParsed.month &&
      day === selectedParsed.day
    );
  };

  const isTodayDay = (day) => {
    return (
      viewYear === minParsed.year &&
      viewMonth === minParsed.month &&
      day === minParsed.day
    );
  };

  const canGoPrevMonth =
    viewYear > minParsed.year ||
    (viewYear === minParsed.year && viewMonth > minParsed.month);

  // Generate Year options (current year to current year + 2)
  const currentYear = minParsed.year;
  const yearOptions = [currentYear, currentYear + 1, currentYear + 2];

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Departure Trigger Box */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`border rounded-xl px-3 py-2 bg-white transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
          isOpen
            ? 'border-[#73d200] ring-2 ring-[#73d200]/20'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Calendar Icon - Clicking this explicitly opens the calendar */}
          <button
            type="button"
            aria-label="Open departure calendar"
            className="p-0.5 rounded text-gray-500 hover:text-[#529600] transition-colors cursor-pointer"
          >
            <CalendarDaysIcon
              className={`w-5 h-5 transition-colors ${
                isOpen ? 'text-[#73d200]' : 'text-gray-400'
              }`}
            />
          </button>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block select-none">
              Departure
            </span>
            <span className="font-bold text-sm text-gray-900 block truncate select-none">
              {formatDisplayDate(value)}
            </span>
          </div>
        </div>

        {/* < > arrows for easy day switching */}
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onStepDay(-1)}
            disabled={value <= minDate}
            aria-label="Previous day"
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-600 transition-colors cursor-pointer"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onStepDay(1)}
            aria-label="Next day"
            className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          >
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hidden native input for fallback accessibility */}
      <input
        ref={nativeInputRef}
        type="date"
        min={minDate}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(false);
        }}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Floating Interactive Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-76 sm:w-80 text-gray-900 animate-fadeIn select-none">
          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 text-xs">
            <button
              type="button"
              onClick={() => handleQuickSelect(0)}
              className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer ${
                value === minDate
                  ? 'bg-[#73d200] text-gray-950 font-black'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(1)}
              className="px-3 py-1 rounded-full font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              Tomorrow
            </button>
          </div>

          {/* Month & Year Selectors with Next / Prev Arrows */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!canGoPrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 text-gray-700 transition-colors cursor-pointer"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            {/* Selectable Month and Year Dropdowns */}
            <div className="flex items-center gap-1.5">
              {/* Month Select */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-black text-gray-900 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((mName, mIdx) => {
                  const isMonthPast =
                    viewYear === minParsed.year && mIdx < minParsed.month;
                  return (
                    <option key={mName} value={mIdx} disabled={isMonthPast}>
                      {mName}
                    </option>
                  );
                })}
              </select>

              {/* Year Select */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-black text-gray-900 focus:outline-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAY_NAMES.map((wd) => (
              <span
                key={wd}
                className="text-[11px] font-bold text-gray-400 py-1"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty slots before first day of month */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {/* Day Numbers */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isPastDay(day);
              const selected = isSelectedDay(day);
              const isToday = isTodayDay(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    selected
                      ? 'bg-[#73d200] text-gray-950 font-black scale-105 shadow-xs'
                      : disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : isToday
                      ? 'border border-[#73d200] text-gray-900 font-extrabold hover:bg-[#73d200]/20 cursor-pointer'
                      : 'text-gray-700 hover:bg-[#73d200]/20 hover:text-black cursor-pointer'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer date hint */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Selected date:</span>
            <span className="font-extrabold text-gray-900">
              {formatDisplayDate(value)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
