import React, { useState } from 'react';
import { Search, ArrowLeftRight, Calendar, User, Globe, Wifi, CheckCircle2, Users, Info } from 'lucide-react';

export default function HomePage({ onSearch }) {
    const [tripType, setTripType] = useState('one-way');
    const [from, setFrom] = useState('Udaipur');
    const [to, setTo] = useState('Boston, MA');
    const [date, setDate] = useState('Today, Nov 9');
    const [passengers, setPassengers] = useState('1 Adult');
    const [findAccommodation, setFindAccommodation] = useState(true);

    const handleSwap = () => {
        const temp = from;
        setFrom(to);
        setTo(temp);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        onSearch({ from, to, date, passengers });
    };

    return (
        <div className="min-h-[calc(100vh-56px)] bg-gray-50 flex flex-col justify-between">
            {/* Hero Container */}
            <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white min-h-[380px] flex flex-col justify-center px-4 overflow-hidden">
                {/* Background Image Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80')` }}
                />

                <div className="max-w-5xl mx-auto w-full relative z-10 pt-6 pb-20">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight drop-shadow-md">
                        Bus Travel in the US
                    </h1>

                    {/* Search Card Container */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="bg-white rounded-xl shadow-2xl p-4 md:p-6 text-gray-800 border border-gray-100"
                    >
                        {/* Trip Type Radio */}
                        <div className="flex gap-6 mb-4 font-semibold text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="trip"
                                    checked={tripType === 'one-way'}
                                    onChange={() => setTripType('one-way')}
                                    className="accent-[#73d200] w-4 h-4"
                                />
                                One Way
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="trip"
                                    checked={tripType === 'round-trip'}
                                    onChange={() => setTripType('round-trip')}
                                    className="accent-[#73d200] w-4 h-4"
                                />
                                Round Trip
                            </label>
                        </div>

                        {/* Main Form Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                            {/* From & To Inputs */}
                            <div className="md:col-span-5 flex flex-col sm:flex-row items-center border rounded-lg overflow-hidden bg-gray-50 border-gray-300">
                                <div className="flex-1 px-3 py-2 w-full">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block">From</label>
                                    <input
                                        type="text"
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        className="w-full bg-transparent font-medium text-sm focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSwap}
                                    className="p-2 text-gray-500 hover:bg-gray-200 border-x border-gray-200 transition-colors"
                                >
                                    <ArrowLeftRight className="w-4 h-4" />
                                </button>
                                <div className="flex-1 px-3 py-2 w-full">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block">To</label>
                                    <input
                                        type="text"
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        className="w-full bg-transparent font-medium text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Date Input */}
                            <div className="md:col-span-3 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block">Departure</label>
                                    <input
                                        type="text"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-transparent font-medium text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Passengers Dropdown */}
                            <div className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 flex items-center justify-between">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block">Passengers / Bikes</label>
                                    <select
                                        value={passengers}
                                        onChange={(e) => setPassengers(e.target.value)}
                                        className="bg-transparent font-medium text-sm focus:outline-none cursor-pointer"
                                    >
                                        <option value="1 Adult">1 Adult</option>
                                        <option value="2 Adults">2 Adults</option>
                                    </select>
                                </div>
                            </div>

                            {/* Search Action Button */}
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    className="w-full bg-[#73d200] hover:bg-[#65b800] text-gray-900 font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>Search</span>
                                </button>
                            </div>
                        </div>

                        {/* Checkbox Option */}
                        <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                            <input
                                type="checkbox"
                                id="acc"
                                checked={findAccommodation}
                                onChange={(e) => setFindAccommodation(e.target.checked)}
                                className="accent-[#73d200] rounded"
                            />
                            <label htmlFor="acc" className="cursor-pointer">Find my accommodation</label>
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                    </form>
                </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="max-w-5xl mx-auto w-full px-4 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-lg bg-[#73d200]/20 flex items-center justify-center mb-3">
                            <Globe className="w-6 h-6 text-gray-800" />
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Connecting you to the world</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Endless possibilities. Discover over 8,000 destinations across more than 40 countries.
                        </p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-lg bg-[#73d200]/20 flex items-center justify-center mb-3">
                            <Wifi className="w-6 h-6 text-gray-800" />
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Comfort on the go</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Kick back with free Wi-Fi, power outlets, and extra leg space. That's what modern buses are all about.
                        </p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-lg bg-[#73d200]/20 flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-6 h-6 text-gray-800" />
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Choose, book, travel</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            From your screen to your seat in seconds. You do the booking, we'll take care of the rest.
                        </p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-lg bg-[#73d200]/20 flex items-center justify-center mb-3">
                            <Users className="w-6 h-6 text-gray-800" />
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Go together</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Why adding another car on the road when you can choose collective travel instead?
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}