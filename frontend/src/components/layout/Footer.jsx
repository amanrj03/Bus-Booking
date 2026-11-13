import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  TruckIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/solid';

export default function Footer() {
  return (
    <footer className="bg-[#131b26] text-gray-400 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#73d200] text-2xl font-black italic tracking-tighter">
                GoBus
              </span>
              <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded font-bold uppercase">
                India
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 mb-4">
              Next-generation intercity bus booking platform connecting India&apos;s top corridors with reliable AC sleepers, real-time seat inventory, and instant e-tickets.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#73d200] font-semibold">
              <ShieldCheckIcon className="w-4 h-4 shrink-0" />
              <span>PostgreSQL Concurrency Protected</span>
            </div>
          </div>

          {/* Popular Indian Corridors */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Popular Indian Routes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/search?from=Delhi&to=Jaipur" className="hover:text-[#73d200] transition-colors">
                  Delhi ➔ Jaipur Buses
                </Link>
              </li>
              <li>
                <Link to="/search?from=Mumbai&to=Pune" className="hover:text-[#73d200] transition-colors">
                  Mumbai ➔ Pune Express
                </Link>
              </li>
              <li>
                <Link to="/search?from=Bangalore&to=Chennai" className="hover:text-[#73d200] transition-colors">
                  Bangalore ➔ Chennai AC
                </Link>
              </li>
              <li>
                <Link to="/search?from=Udaipur&to=Ahmedabad" className="hover:text-[#73d200] transition-colors">
                  Udaipur ➔ Ahmedabad Sleeper
                </Link>
              </li>
              <li>
                <Link to="/search?from=Delhi&to=Manali" className="hover:text-[#73d200] transition-colors">
                  Delhi ➔ Manali Volvo
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Passenger Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-[#73d200] transition-colors">
                  Search Bus Tickets
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-[#73d200] transition-colors">
                  Manage Booking / Cancel
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-[#73d200] transition-colors">
                  Print E-Ticket (PNR)
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#73d200] transition-colors">
                  Operator & Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              24/7 Support Desk
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-[#73d200] shrink-0" />
                <span>+91 1800-102-3549 (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-[#73d200] shrink-0" />
                <span>support@busbooking.local</span>
              </li>
              <li className="flex items-center gap-2 pt-1">
                <TruckIcon className="w-4 h-4 text-[#73d200] shrink-0" />
                <span>45+ Verified AC Coaches</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <p>© 2026 Bus Booking Management System — Algions AI Labs Internship Assessment.</p>
          <p>Simulated Payments Enabled • Local PostgreSQL 18</p>
        </div>
      </div>
    </footer>
  );
}
