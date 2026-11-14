import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { filterCities } from '../../config/citiesConfig';

export default function CitySearchInput({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter city',
  allCities = [],
  onSelectNext,
  hasError = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter cities based on current input value
  const suggestions = useMemo(() => {
    return filterCities(allCities, value);
  }, [allCities, value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight index when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions]);

  const handleSelectCity = (cityName) => {
    onChange(cityName);
    setIsOpen(false);
    if (onSelectNext) {
      setTimeout(() => onSelectNext(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, suggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? Math.max(0, suggestions.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[highlightedIndex]) {
        handleSelectCity(suggestions[highlightedIndex].name);
      } else if (value.trim()) {
        handleSelectCity(value.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Highlight matching search text
  const renderHighlighted = (text, query) => {
    if (!query || !query.trim()) return text;
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;

    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + q.length);
    const after = text.substring(idx + q.length);

    return (
      <>
        {before}
        <span className="text-[#529600] font-black underline underline-offset-2">
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Box Card */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`border rounded-xl px-3.5 py-2.5 bg-white transition-all cursor-text flex items-center gap-2.5 ${
          hasError
            ? 'border-red-400 ring-2 ring-red-100'
            : isOpen
            ? 'border-[#73d200] ring-2 ring-[#73d200]/20'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <MapPinIcon
          className={`w-5 h-5 shrink-0 transition-colors ${
            isOpen ? 'text-[#73d200]' : 'text-gray-400'
          }`}
        />
        <div className="flex-1 min-w-0">
          <label
            htmlFor={id}
            className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block cursor-text select-none"
          >
            {label}
          </label>
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={value}
            autoComplete="off"
            spellCheck="false"
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent font-bold text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {/* Clear Button (shown when non-empty) */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear"
            aria-label="Clear city"
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Auto-Suggest Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <span>
              {value.trim()
                ? `Matching Cities (${suggestions.length})`
                : 'Popular Indian Destinations'}
            </span>
            <span className="text-[10px] text-gray-400 lowercase font-normal">
              click or press enter
            </span>
          </div>

          {/* Suggestions List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {suggestions.length > 0 ? (
              suggestions.map((city, idx) => {
                const isSelected = idx === highlightedIndex;
                return (
                  <button
                    key={`${city.name}-${city.state}`}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectCity(city.name)}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#73d200]/15' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#73d200] text-gray-950 font-black'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <MapPinIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-gray-900 truncate">
                          {renderHighlighted(city.name, value)}
                        </div>
                        {city.hub && (
                          <div className="text-[11px] text-gray-500 truncate">
                            {city.hub}
                          </div>
                        )}
                      </div>
                    </div>

                    {city.state && (
                      <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                        {city.state}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-gray-500">
                  No popular destinations matching &quot;
                  <span className="font-bold text-gray-800">{value}</span>&quot;
                </p>
                {value.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelectCity(value.trim())}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#73d200]/20 hover:bg-[#73d200]/30 text-gray-900 font-bold text-xs transition-colors"
                  >
                    <span>Use &quot;{value.trim()}&quot; as city</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
