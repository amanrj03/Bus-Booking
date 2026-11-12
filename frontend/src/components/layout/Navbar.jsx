import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  TicketIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';

export default function Navbar({ user = null, onOpenAuth = () => {}, onLogout = () => {} }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `transition-colors hover:underline flex items-center gap-1.5 ${
      isActive ? 'underline font-extrabold text-black' : 'text-[#131b26]'
    }`;

  return (
    <header className="bg-[#73d200] text-[#131b26] shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 cursor-pointer font-black text-2xl tracking-tighter"
        >
          <span className="text-white text-3xl font-extrabold italic tracking-tight drop-shadow-xs">
            FLIXBUS
          </span>
          <span className="text-[10px] bg-[#131b26] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            India
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 font-semibold text-sm">
          <NavLink to="/" end className={navLinkClass}>
            <span>Plan Your Journey</span>
            <ChevronDownIcon className="w-3.5 h-3.5" />
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            <span>Search Buses</span>
          </NavLink>
          <NavLink to="/my-bookings" className={navLinkClass}>
            <TicketIcon className="w-4 h-4" />
            <span>Manage My Booking</span>
          </NavLink>
          {user && (user.role === 'ADMIN' || user.role === 'OPERATOR') && (
            <NavLink to="/admin" className={navLinkClass}>
              <ShieldCheckIcon className="w-4 h-4" />
              <span>{user.role === 'ADMIN' ? 'Admin Portal' : 'Operator Portal'}</span>
            </NavLink>
          )}
        </nav>

        {/* Right Section: Currency & Account */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="hidden sm:flex items-center gap-1 cursor-default bg-black/5 px-2.5 py-1 rounded-full">
            <span className="text-sm">🇮🇳</span>
            <span>₹ INR</span>
          </div>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/30 px-3 py-1 rounded-full">
                <UserCircleIcon className="w-4 h-4 text-[#131b26]" />
                <span className="font-bold max-w-[120px] truncate">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="flex items-center gap-1 hover:underline text-gray-900 font-bold cursor-pointer"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden md:flex items-center gap-1.5 hover:underline bg-white/25 hover:bg-white/40 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer font-bold"
            >
              <UserCircleIcon className="w-4 h-4" />
              <span>Sign in / Register</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="md:hidden p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-[#131b26]" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-[#131b26]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 shadow-lg">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-gray-900 border-b border-gray-100"
          >
            Plan Your Journey
          </NavLink>
          <NavLink
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-gray-900 border-b border-gray-100"
          >
            Search Buses
          </NavLink>
          <NavLink
            to="/my-bookings"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-gray-900 border-b border-gray-100"
          >
            Manage My Booking
          </NavLink>
          {user && (user.role === 'ADMIN' || user.role === 'OPERATOR') && (
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-900 border-b border-gray-100"
            >
              {user.role === 'ADMIN' ? 'Admin Portal' : 'Operator Portal'}
            </NavLink>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">🇮🇳 Currency: ₹ INR</span>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Logout ({user.name})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="bg-[#73d200] text-gray-900 text-xs font-bold px-4 py-2 rounded-lg"
              >
                Sign in / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
