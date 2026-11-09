import React, { useState } from 'react';
import { SlidersHorizontal, ChevronRight, Wifi, Zap, Bus } from 'lucide-react';

export default function SearchResultsPage({ onSelectTrip }) {
    const [selectedDateTab, setSelectedDateTab] = useState('Mon, Nov 9');

    const busResults = [
        {
            id: 1,
            operator: 'FlixBus',
            operatorType: 'flixbus',
            depTime: '01:30 PM',
            arrTime: '06:00 PM',
            duration: '4:30 hrs',
            fromStation: 'NYC Midtown (31st St & 8th Ave)',
            toStation: 'Boston (South Station)',
            price: '46.98',
            direct: true,
        },
        {
            id: 2,
            operator: 'Greyhound',
            operatorType: 'greyhound',
            depTime: '01:45 PM',
            arrTime: '06:50 PM',
            duration: '5:05 hrs',
            fromStation: 'New York Port Authority',
            toStation: 'Boston (South Station)',
            price: '47.98',
            direct: true,
        },
        {
            id: 3,
            operator: 'FlixBus',
            operatorType: 'flixbus',
            depTime: '01:45 PM',
            arrTime: '07:20 PM',
            duration: '5:35 hrs',
            fromStation: 'New York (Hudson Yards)',
            toStation: 'Cambridge',
            price: '50.98',
            direct: true,
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 pb-12">
            {/* Top Date Selection Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto flex items-center justify-between text-sm font-semibold">
                    <button
                        onClick={() => setSelectedDateTab('Sun, Nov 8')}
                        className={`flex-1 py-4 text-center border-b-2 ${selectedDateTab === 'Sun, Nov 8' ? 'border-[#73d200] text-gray-900' : 'border-transparent text-gray-400'}`}
                    >
                        Sun, Nov 8
                    </button>
                    <button
                        onClick={() => setSelectedDateTab('Mon, Nov 9')}
                        className={`flex-1 py-4 text-center border-b-2 ${selectedDateTab === 'Mon, Nov 9' ? 'border-[#73d200] text-gray-900 font-bold' : 'border-transparent text-gray-400'}`}
                    >
                        Mon, Nov 9
                    </button>
                    <button
                        onClick={() => setSelectedDateTab('Tue, Nov 10')}
                        className={`flex-1 py-4 text-center border-b-2 ${selectedDateTab === 'Tue, Nov 10' ? 'border-[#73d200] text-gray-900' : 'border-transparent text-gray-400'}`}
                    >
                        Tue, Nov 10
                    </button>
                </div>
            </div>

            {/* Results Header */}
            <div className="max-w-4xl mx-auto px-4 mt-6 flex items-center justify-between">
                <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-full text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filters</span>
                </button>
                <span className="text-xs text-gray-500 font-medium">31 results</span>
            </div>

            {/* Bus Cards List */}
            <div className="max-w-4xl mx-auto px-4 mt-4 space-y-4">
                {busResults.map((trip) => {
                    const priceParts = trip.price.split('.');
                    return (
                        <div key={trip.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            {/* Carrier Tag */}
                            <div className="mb-3">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${trip.operatorType === 'flixbus'
                                        ? 'bg-[#73d200]/20 text-gray-900'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {trip.operator}
                                </span>
                            </div>

                            {/* Timing & Station Route */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between max-w-md">
                                        <div>
                                            <span className="text-lg font-extrabold text-gray-900">{trip.depTime}</span>
                                            <p className="text-xs text-gray-600 mt-0.5">{trip.fromStation}</p>
                                        </div>

                                        <div className="flex flex-col items-center px-4">
                                            <span className="text-xs text-gray-400 font-medium">{trip.duration}</span>
                                            <div className="w-32 md:w-48 h-[1px] bg-gray-300 relative my-1">
                                                <div className="w-2 h-2 rounded-full bg-gray-400 absolute left-0 top-1/2 -translate-y-1/2" />
                                                <div className="w-2 h-2 rounded-full bg-gray-400 absolute right-0 top-1/2 -translate-y-1/2" />
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-lg font-extrabold text-gray-900">{trip.arrTime}</span>
                                            <p className="text-xs text-gray-600 mt-0.5">{trip.toStation}</p>
                                        </div>
                                    </div>

                                    {/* Amenities */}
                                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                                        <span className="border border-gray-200 rounded px-2 py-0.5 flex items-center gap-1 text-[11px] font-semibold">
                                            <Bus className="w-3 h-3" /> Bus Direct ▾
                                        </span>
                                        <Wifi className="w-3.5 h-3.5 text-gray-400" />
                                        <Zap className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                </div>

                                {/* Price & Continue Button */}
                                <div className="flex items-center justify-between md:flex-col md:items-end border-t md:border-t-0 pt-3 md:pt-0">
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-gray-900">${priceParts[0]}</span>
                                        <span className="text-xs font-bold text-gray-900 relative -top-2">.{priceParts[1]}</span>
                                    </div>
                                    <button
                                        onClick={() => onSelectTrip(trip)}
                                        className="bg-[#73d200] hover:bg-[#65b800] text-gray-900 font-bold px-5 py-2.5 rounded-lg flex items-center gap-1 text-sm shadow transition-colors"
                                    >
                                        <span>Continue</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}