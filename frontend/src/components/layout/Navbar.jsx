import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';
import { SERVICE_ITEMS } from '../../config/servicesConfig';

export default function Navbar({ user = null, onOpenAuth = () => {}, onLogout = () => {} }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesDropdownRef = useRef(null);
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target)
      ) {
        setServicesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setServicesOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isServicesActive = location.pathname.startsWith('/services');

  return (
    <header className="bg-[#73d200] text-[#131b26] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left Side: Brand Logo & Navigation */}
        <div className="flex items-center gap-7">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 cursor-pointer font-black text-2xl tracking-tighter"
          >
            <span className="text-white text-3xl font-extrabold italic tracking-tight drop-shadow-xs">
              GoBus
            </span>
            <span className="text-[10px] bg-[#131b26] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              India
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 font-bold text-sm text-[#131b26]">
            {/* Plan Your Journey (clean link without chevron) */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `transition-colors hover:text-black py-1 ${
                  isActive ? 'text-black underline underline-offset-4' : 'text-[#131b26]'
                }`
              }
            >
              Plan Your Journey
            </NavLink>

            {/* Service Dropdown */}
            <div className="relative" ref={servicesDropdownRef}>
              <button
                type="button"
                onClick={() => setServicesOpen((prev) => !prev)}
                className={`flex items-center gap-1 py-1 font-bold transition-colors hover:text-black cursor-pointer ${
                  isServicesActive ? 'text-black underline underline-offset-4' : 'text-[#131b26]'
                }`}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
              >
                <span>Service</span>
                {servicesOpen ? (
                  <ChevronUpIcon className="w-4 h-4 text-[#131b26]" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-[#131b26]" />
                )}
              </button>

              {/* Dropdown Menu matching user reference screenshot */}
              {servicesOpen && (
                <div className="absolute top-full left-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-50 text-gray-800 animate-fadeIn">
                  {/* Upward pointing arrow triangle */}
                  <div className="absolute -top-1.5 left-5 w-3 h-3 bg-white rotate-45 border-t border-l border-gray-200" />

                  <div className="relative z-10">
                    {SERVICE_ITEMS.map((item) => (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={() => setServicesOpen(false)}
                        className="block px-4 py-2 text-[13px] font-semibold text-gray-800 hover:bg-[#73d200]/15 hover:text-black transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trip Tracker */}
            <NavLink
              to="/my-bookings"
              className={({ isActive }) =>
                `transition-colors hover:text-black py-1 ${
                  isActive ? 'text-black underline underline-offset-4' : 'text-[#131b26]'
                }`
              }
            >
              Trip Tracker
            </NavLink>

            {/* Help */}
            <NavLink
              to="/services/help"
              className={({ isActive }) =>
                `transition-colors hover:text-black py-1 ${
                  isActive ? 'text-black underline underline-offset-4' : 'text-[#131b26]'
                }`
              }
            >
              Help
            </NavLink>

            {/* Call to book phone number */}
            <a
              href="tel:8404855555"
              className="flex items-center gap-1.5 text-xs text-[#131b26] hover:text-black transition-colors py-1"
              title="Call to book bus ticket"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              <span>Call to book 8404855555</span>
            </a>
          </nav>
        </div>

        {/* Right Side: Language & Auth / User Profile */}
        <div className="flex items-center gap-3.5 text-xs font-semibold">
          {/* Language / Region Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 cursor-default bg-black/5 hover:bg-black/10 px-2.5 py-1 rounded-full transition-colors">
            <span className="text-sm">🇮🇳</span>
            <span className="font-bold text-[11px] text-gray-900">EN</span>
          </div>

          {/* Admin / Operator Portal Link */}
          {user && (user.role === 'ADMIN' || user.role === 'OPERATOR') && (
            <NavLink
              to="/admin"
              className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-white/30 hover:bg-white/50 text-[#131b26] font-bold text-xs transition-colors"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>{user.role === 'ADMIN' ? 'Admin' : 'Operator'}</span>
            </NavLink>
          )}

          {/* User Profile or Sign in / Register */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/30 px-3 py-1 rounded-full">
                <UserCircleIcon className="w-4 h-4 text-[#131b26]" />
                <span className="font-bold max-w-[120px] truncate text-[#131b26]">
                  {user.name}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="flex items-center gap-1 hover:underline text-gray-900 font-bold cursor-pointer text-xs"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden md:flex items-center gap-1.5 hover:bg-white/40 bg-white/25 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer font-bold text-[#131b26]"
            >
              <UserCircleIcon className="w-4 h-4" />
              <span>Register / Sign in</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="lg:hidden p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
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
        <div className="lg:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 shadow-lg">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-gray-900 border-b border-gray-100"
          >
            Plan Your Journey
          </NavLink>

          {/* Services Group */}
          <div className="border-b border-gray-100 pb-2">
            <span className="block text-xs uppercase font-extrabold text-gray-400 py-1">
              Services & Information
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {SERVICE_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-gray-700 hover:text-[#529600] py-1"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <NavLink
            to="/my-bookings"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-gray-900 border-b border-gray-100"
          >
            Trip Tracker / Manage Booking
          </NavLink>

          <NavLink
            to="/services/help"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-gray-900 border-b border-gray-100"
          >
            Help & Customer Care
          </NavLink>

          <a
            href="tel:8404855555"
            className="flex items-center gap-2 py-2 text-xs font-bold text-gray-800 border-b border-gray-100"
          >
            <PhoneIcon className="w-4 h-4 text-[#529600]" />
            <span>Call to book 8404855555</span>
          </a>

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
                Register / Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
