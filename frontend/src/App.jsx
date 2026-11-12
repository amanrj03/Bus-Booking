import React from 'react';
import {
  TruckIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-gray-900 bg-gray-50 selection:bg-[#73d200]/30">
      {/* Top Header / Navigation Bar */}
      <header className="bg-[#73d200] text-[#131b26] shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer font-black text-2xl tracking-tighter">
            <span className="text-white text-3xl font-extrabold italic tracking-tight">FLIXBUS</span>
            <span className="text-xs bg-[#131b26] text-white px-2 py-0.5 rounded font-bold uppercase">India</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 font-semibold text-sm">
            <a href="#search" className="hover:underline">Plan Journey</a>
            <a href="#routes" className="hover:underline">Popular Routes</a>
            <a href="#manage" className="hover:underline">Manage Booking</a>
            <a href="#help" className="hover:underline">Help</a>
          </nav>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
              <span className="text-base">🇮🇳</span>
              <span>₹ INR</span>
            </div>
            <button className="flex items-center gap-1.5 hover:underline bg-white/20 px-3 py-1.5 rounded-full md:bg-transparent md:p-0">
              <UserCircleIcon className="w-5 h-5 text-[#131b26]" />
              <span>Sign in / Register</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 px-4">
          <div className="max-w-5xl mx-auto text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Intercity Bus Travel across India
            </h1>
            <p className="text-gray-300 text-base md:text-lg mb-8 max-w-2xl">
              Reliable, comfortable, and affordable bus tickets on high-density routes connecting Delhi, Jaipur, Mumbai, Pune, Bangalore, and more.
            </p>

            <div className="bg-white rounded-xl shadow-2xl p-6 text-gray-800 max-w-4xl border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="border border-gray-300 rounded-lg p-2.5 bg-gray-50">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block">From</label>
                  <input
                    type="text"
                    defaultValue="Delhi (ISBT Kashmiri Gate)"
                    className="w-full bg-transparent font-semibold text-sm focus:outline-none"
                    readOnly
                  />
                </div>
                <div className="border border-gray-300 rounded-lg p-2.5 bg-gray-50">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block">To</label>
                  <input
                    type="text"
                    defaultValue="Jaipur (Sindhi Camp)"
                    className="w-full bg-transparent font-semibold text-sm focus:outline-none"
                    readOnly
                  />
                </div>
                <div className="border border-gray-300 rounded-lg p-2.5 bg-gray-50">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block">Date</label>
                  <input
                    type="text"
                    defaultValue="Today, 10 Nov"
                    className="w-full bg-transparent font-semibold text-sm focus:outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <button className="w-full bg-[#73d200] hover:bg-[#65b800] text-gray-900 font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]">
                    <span>Search Buses</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-[#73d200]/20 rounded-lg text-gray-900">
                <TruckIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Live Seat Concurrency</h3>
                <p className="text-xs text-gray-500">
                  PostgreSQL row-level locking ensures zero double-booking even under peak passenger demand.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-[#73d200]/20 rounded-lg text-gray-900">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Instant Re-Booking</h3>
                <p className="text-xs text-gray-500">
                  Released seats become immediately available to passengers while retaining historical records.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-[#73d200]/20 rounded-lg text-gray-900">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Simulated Payments</h3>
                <p className="text-xs text-gray-500">
                  End-to-end UPI, Card, and Net Banking booking simulation without external payment gateways.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 border-t border-gray-800 text-center text-xs">
        <p>© 2026 FLIXBUS Management System — Full-Stack Internship Assessment.</p>
      </footer>
    </div>
  );
}
