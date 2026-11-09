import React from 'react';
import { X, Check } from 'lucide-react';

export default function SeatMapModal({ isOpen, onClose, selectedSeat, setSelectedSeat }) {
    if (!isOpen) return null;

    const rows = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Seat Reservation</h3>
                        <p className="text-xs text-gray-500">New York, NY — Boston, MA</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Bus Seat Layout Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                    {/* Steering Wheel Indicator */}
                    <div className="w-full max-w-[260px] flex justify-start mb-6">
                        <div className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center text-xs text-gray-500 font-bold">
                            ☸
                        </div>
                    </div>

                    {/* Seat Grid */}
                    <div className="w-full max-w-[260px] space-y-3">
                        {rows.map((rowNum) => {
                            const isOccupiedLeft = rowNum % 2 === 0;
                            const isOccupiedRight = rowNum % 3 === 0;
                            const seatA = `${rowNum}A`;
                            const seatB = `${rowNum}B`;

                            return (
                                <div key={rowNum} className="flex items-center justify-between text-xs">
                                    {/* Left Pair */}
                                    <div className="flex gap-2">
                                        <button
                                            disabled={isOccupiedLeft}
                                            onClick={() => setSelectedSeat(seatA)}
                                            className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold ${selectedSeat === seatA
                                                    ? 'border-[#73d200] bg-[#73d200] text-gray-900'
                                                    : isOccupiedLeft
                                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                                                        : 'border-gray-400 text-gray-600 hover:border-gray-800'
                                                }`}
                                        >
                                            {isOccupiedLeft ? <X className="w-4 h-4" /> : seatA}
                                        </button>
                                        <button
                                            disabled={isOccupiedLeft}
                                            onClick={() => setSelectedSeat(seatB)}
                                            className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold ${selectedSeat === seatB
                                                    ? 'border-[#73d200] bg-[#73d200] text-gray-900'
                                                    : isOccupiedLeft
                                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                                                        : 'border-gray-400 text-gray-600 hover:border-gray-800'
                                                }`}
                                        >
                                            {isOccupiedLeft ? <X className="w-4 h-4" /> : seatB}
                                        </button>
                                    </div>

                                    {/* Row Label */}
                                    <span className="text-gray-400 font-bold text-xs">{rowNum}</span>

                                    {/* Right Pair */}
                                    <div className="flex gap-2">
                                        <button
                                            disabled={isOccupiedRight}
                                            onClick={() => setSelectedSeat(`${rowNum}C`)}
                                            className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold ${selectedSeat === `${rowNum}C`
                                                    ? 'border-[#73d200] bg-[#73d200] text-gray-900'
                                                    : isOccupiedRight
                                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                                                        : 'border-gray-400 text-gray-600 hover:border-gray-800'
                                                }`}
                                        >
                                            {isOccupiedRight ? <X className="w-4 h-4" /> : `${rowNum}C`}
                                        </button>
                                        <button
                                            disabled={isOccupiedRight}
                                            onClick={() => setSelectedSeat(`${rowNum}D`)}
                                            className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold ${selectedSeat === `${rowNum}D`
                                                    ? 'border-[#73d200] bg-[#73d200] text-gray-900'
                                                    : isOccupiedRight
                                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                                                        : 'border-gray-400 text-gray-600 hover:border-gray-800'
                                                }`}
                                        >
                                            {isOccupiedRight ? <X className="w-4 h-4" /> : `${rowNum}D`}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium">
                            {selectedSeat ? `Selected Seat: ${selectedSeat}` : 'No seats reserved'}
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                            {selectedSeat ? '+ 6.39 US$' : '+ 0.00 US$'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-[#73d200] hover:bg-[#65b800] text-gray-900 font-bold px-6 py-2.5 rounded-lg text-sm shadow"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}