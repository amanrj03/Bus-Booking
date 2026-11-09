import React from 'react';
import { User } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, openAuthModal }) {
    return (
        <header className="bg-[#73d200] text-[#131b26] shadow-sm sticky top-0 z-40">
            <div className="max-[#1200px] mx-auto px-4 h-14 flex items-center justify-between">
                {/* Brand Logo */}
                <div
                    onClick={() => setActivePage('home')}
                    className="flex items-center gap-1 cursor-pointer font-black text-2xl tracking-tighter"
                >
                    <span className="text-white text-3xl font-extrabold italic">FLIXBUS</span>
                </div>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-6 font-semibold text-sm">
                    <button onClick={() => setActivePage('home')} className="hover:underline flex items-center gap-1">
                        Plan Your Journey <span>▾</span>
                    </button>
                    <button className="hover:underline flex items-center gap-1">
                        Service <span>▾</span>
                    </button>
                    <button onClick={() => setActivePage('search')} className="hover:underline">
                        Manage My Booking
                    </button>
                    <button className="hover:underline">Trip Tracker</button>
                    <button className="hover:underline">Help</button>
                </nav>

                {/* Right Section / User Account */}
                <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                        <span className="text-base">🇺🇸</span>
                        <span>EN</span>
                    </div>
                    <button
                        onClick={openAuthModal}
                        className="flex items-center gap-1.5 hover:underline bg-white/20 px-3 py-1.5 rounded-full md:bg-transparent md:p-0"
                    >
                        <User className="w-4 h-4" />
                        <span>Register / Sign in</span>
                    </button>
                </div>
            </div>
        </header>
    );
}