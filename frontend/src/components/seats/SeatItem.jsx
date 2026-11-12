import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SeatItem({
  seat,
  isSelected = false,
  isSleeperLayout = false,
  onToggle,
}) {
  const status = seat.status;
  const isAvailable = status === 'AVAILABLE';
  const isBooked = status === 'BOOKED';
  const isLocked = status === 'LOCKED';
  const isDisabled = !isAvailable && !isSelected;

  const isSleeperBerth = isSleeperLayout || seat.seatType === 'SLEEPER';

  let stateClasses =
    'bg-white text-gray-800 border-gray-400 hover:border-gray-900 hover:bg-gray-50 cursor-pointer';
  if (isSelected) {
    stateClasses =
      'bg-[#73d200] text-gray-900 border-[#65b800] font-black shadow-sm ring-2 ring-[#73d200]/30 cursor-pointer';
  } else if (isBooked) {
    stateClasses = 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed';
  } else if (isLocked) {
    stateClasses = 'bg-amber-100 text-amber-800 border-amber-300 cursor-not-allowed opacity-90';
  }

  const sizeClasses = isSleeperBerth ? 'w-12 h-20 rounded-lg' : 'w-10 h-10 rounded-lg';

  const statusLabel = isSelected
    ? 'Selected'
    : isBooked
    ? 'Booked'
    : isLocked
    ? 'Held'
    : `Available • ₹${seat.price}`;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onToggle(seat)}
      title={`Seat ${seat.seatNumber} (${seat.seatType}) — ${statusLabel}`}
      aria-label={`Seat ${seat.seatNumber}, ${statusLabel}`}
      aria-pressed={isSelected}
      className={`relative border-2 flex flex-col items-center justify-center transition-all select-none ${sizeClasses} ${stateClasses}`}
    >
      {isBooked ? (
        <XMarkIcon className="w-4 h-4 text-gray-300" />
      ) : (
        <>
          <span className="text-[11px] font-extrabold leading-none">{seat.seatNumber}</span>
          {isAvailable && !isSelected && (
            <span className="text-[9px] font-semibold text-gray-400 mt-0.5 leading-none">
              ₹{seat.price}
            </span>
          )}
          {isSelected && (
            <span className="text-[9px] font-extrabold text-gray-900 mt-0.5 leading-none">
              ₹{seat.price}
            </span>
          )}
          {isLocked && (
            <span className="text-[8px] font-bold uppercase text-amber-700 mt-0.5 leading-none">
              Hold
            </span>
          )}
        </>
      )}

      {seat.isAccessible && isAvailable && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-500 ring-1 ring-white"
        />
      )}
    </button>
  );
}
