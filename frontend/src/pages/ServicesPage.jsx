import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  TicketIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  TvIcon,
  CheckCircleIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  SparklesIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/solid';

const SIDEBAR_LINKS = [
  { id: 'app', label: 'App', path: '/services/app' },
  { id: 'how-to-book', label: 'Book tickets your way', path: '/services/how-to-book' },
  { id: 'lounge', label: 'GoBus Lounge', path: '/services/lounge' },
  { id: 'luggage', label: 'Luggage', path: '/services/luggage' },
  { id: 'manage-booking', label: 'Manage My Booking', path: '/my-bookings', isExternal: true },
  { id: 'on-board', label: 'On board', path: '/services/on-board' },
  { id: 'regulations', label: 'Travel Guidelines', path: '/services/regulations' },
  { id: 'seat-reservations', label: 'Seat Reservations', path: '/services/seat-reservations' },
  { id: 'overview', label: 'Service Overview', path: '/services' },
];

export default function ServicesPage() {
  const { section } = useParams();
  const [additionalLuggageOpen, setAdditionalLuggageOpen] = useState(false);

  // Normalize section to valid tab or fallback to 'how-to-book'
  const currentSection = section || 'how-to-book';

  const currentMeta =
    SIDEBAR_LINKS.find((s) => s.id === currentSection) ||
    SIDEBAR_LINKS.find((s) => s.id === 'how-to-book');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb Navigation matching reference screenshots */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-gray-500 font-semibold"
        >
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <Link to="/services" className="hover:text-gray-900 transition-colors">
            Service
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-bold">{currentMeta.label}</span>
        </nav>

        {/* 2-Column Layout: Main Content (8 cols) + Right Sticky Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area */}
          <main className="lg:col-span-8 bg-white rounded-2xl shadow-xs border border-gray-200 p-6 sm:p-10 space-y-8">
            {/* TAB 1: Book tickets your way (Reference screenshot 2) */}
            {currentSection === 'how-to-book' && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
                    Book tickets your way
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    There are many options to <strong>book your bus ticket</strong>. Here, you can
                    find an overview of all booking options. This step-by-step guide helps you find
                    your way around and book your ticket <strong>online</strong>, via the{' '}
                    <strong>App</strong>, in our <strong>GoBus Lounge</strong>, or through one of our
                    third-party booking partners.
                  </p>
                </div>

                {/* Hero Feature Banner */}
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-xs relative">
                  <img
                    src="/dashboardimage.png"
                    alt="GoBus Luxury Intercity Fleet"
                    className="w-full h-64 object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                    <span className="text-white text-xs font-semibold tracking-wide drop-shadow-md">
                      Verified AC Sleepers & Executive Seaters across India
                    </span>
                  </div>
                </div>

                {/* Section: Booking on our website */}
                <div className="space-y-6">
                  <h2 className="text-lg font-black text-gray-900 border-b pb-2 border-gray-100">
                    Booking on our website
                  </h2>

                  <div className="space-y-5 text-xs sm:text-sm text-gray-700">
                    {/* Step 1 */}
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <h3 className="font-extrabold text-gray-900 flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#73d200] text-gray-950 font-black text-xs flex items-center justify-center">
                          1
                        </span>
                        <span>Step 1: Choose your trip with just 3 clicks</span>
                      </h3>
                      <ul className="list-disc list-inside pl-8 space-y-1 text-gray-600">
                        <li>
                          Select the boarding point, dropping point, and date of your outgoing and
                          return trip.
                        </li>
                        <li>Choose the number of passengers.</li>
                        <li>
                          Click <strong>Search</strong> to find your trip with the best price.
                        </li>
                      </ul>
                      <p className="pl-8 text-gray-500 text-xs pt-1">
                        Once you&apos;ve found your desired trip, you can reserve your favourite
                        seat(s) to add the trip to your cart. Your seats are reserved in the cart for{' '}
                        <strong>10 minutes</strong>, so you&apos;ll have enough time to proceed with
                        your booking. If you do not reserve a seat, one will be assigned to you.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <h3 className="font-extrabold text-gray-900 flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#73d200] text-gray-950 font-black text-xs flex items-center justify-center">
                          2
                        </span>
                        <span>Step 2: Pay for your bus tickets</span>
                      </h3>
                      <p className="pl-8 text-gray-600">
                        Enter active promo coupons such as <strong>HOPON9</strong> for instant fare
                        reductions. We support all major Indian payment methods: UPI (Google Pay,
                        PhonePe, Paytm), Debit & Credit Cards, and NetBanking.
                      </p>
                      <p className="pl-8 text-gray-500 text-xs">
                        Your booking confirmation and QR E-Ticket are generated instantly with zero
                        waiting time.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#73d200] hover:bg-[#65b800] text-gray-950 font-black text-sm transition-all shadow-xs"
                    >
                      <span>Book Bus Tickets Online</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Luggage Policy (Reference screenshot 3) */}
            {currentSection === 'luggage' && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
                    Luggage on a GoBus
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Each GoBus has plenty of space for your luggage. To make your trip as pleasant
                    and safe as possible, there are some regulations to regard.
                  </p>
                </div>

                <div className="text-sm font-bold text-gray-900">
                  Your GoBus ticket includes the{' '}
                  <span className="text-[#5b9e00] font-black uppercase">FREE</span> transportation
                  of:
                </div>

                {/* Visual Luggage Dimension Cards (matches reference screenshot 3 exactly) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Soft Bag / Backpack */}
                  <div className="border border-gray-200 rounded-2xl p-6 bg-white space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <BriefcaseIcon className="w-10 h-10" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-gray-900">7 kg</div>
                        <div className="text-xs text-gray-400 font-semibold">Max weight</div>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between text-xs text-gray-500 font-mono border-y border-gray-100 py-2">
                      <span>42 cm</span>
                      <span>30 cm</span>
                      <span>18 cm</span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 mb-1">
                        1x Soft Bag or Backpack
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        For safety reasons, you must stow your soft bag or backpack underneath your
                        seat, or in the overhead compartment above your seat.
                      </p>
                      <p className="text-[11px] text-gray-400 italic mt-2">
                        Note: Carry valuables (identification, electronics, medications) with you in
                        your soft bag or backpack.
                      </p>
                    </div>
                  </div>

                  {/* Checked Bag */}
                  <div className="border-2 border-[#73d200]/50 rounded-2xl p-6 bg-white space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <div className="w-20 h-20 rounded-2xl bg-[#73d200]/15 border border-[#73d200]/30 flex items-center justify-center text-[#549700]">
                        <BriefcaseIcon className="w-10 h-10" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-gray-900">20 kg</div>
                        <div className="text-xs text-gray-400 font-semibold">Max weight</div>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between text-xs text-gray-500 font-mono border-y border-gray-100 py-2">
                      <span>80 cm</span>
                      <span>50 cm</span>
                      <span>30 cm</span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 mb-1">
                        1x Checked Bag
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Your checked bag is to be stowed in the luggage compartment before you enter
                        the bus. Your bus driver is happy to help you with that. We recommend
                        labelling your bag with your name and address. In some cases GoBus will hand
                        out bag tags.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Guidance */}
                <div className="text-xs text-gray-600 space-y-2 pt-2">
                  <p>
                    We strongly recommend clearly labelling all luggage with your name, address, and
                    telephone number. If you need a luggage tag you can{' '}
                    <span className="text-[#529600] font-bold underline cursor-pointer">
                      download and print one here
                    </span>
                    .
                  </p>
                  <p>
                    Lost your bag? Please fill out our{' '}
                    <Link
                      to="/services/help"
                      className="text-[#529600] font-bold underline hover:text-black"
                    >
                      Lost & Found form
                    </Link>
                    .
                  </p>
                </div>

                {/* Collapsible Additional Luggage Accordion */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAdditionalLuggageOpen(!additionalLuggageOpen)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 text-left font-extrabold text-xs text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <span>Carrying more items? Additional Luggage</span>
                    {additionalLuggageOpen ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </button>

                  {additionalLuggageOpen && (
                    <div className="p-4 bg-white text-xs text-gray-600 space-y-2 border-t border-gray-200">
                      <p>
                        Need to carry more luggage? You can easily book an additional piece of
                        checked luggage (up to 20 kg) during checkout or through{' '}
                        <strong>Manage My Booking</strong> for just ₹99.
                      </p>
                      <p>
                        Special items such as musical instruments and sports gear must be booked in
                        advance due to limited coach cargo capacity.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Travel Regulations (Reference screenshot 4) */}
            {currentSection === 'regulations' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
                    Intercity Travel & Boarding Guidelines
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    This information is current as of November 2026 and is provided for passenger
                    compliance across all inter-state corridors in India.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-base font-extrabold text-gray-900">
                    Mandatory Passenger Identification
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    All adult passengers travelling on GoBus express coaches must present a valid
                    government-issued photo identification (Aadhaar Card, Driver&apos;s License,
                    Voter ID, or Passport) matching the passenger name specified on the booking
                    confirmation.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <h2 className="text-base font-extrabold text-gray-900">
                    Why GoBus collects passenger manifest data
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    As an authorized passenger carrier operating under Ministry of Road Transport
                    and Highways (MoRTH) regulations, GoBus is legally required to maintain
                    verified passenger manifests for every inter-state journey. This ensures quick
                    assistance during transit, real-time safety monitoring, and seamless insurance
                    coverage.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <h3 className="font-extrabold text-xs text-gray-900">
                    Boarding Point Check-in
                  </h3>
                  <p className="text-xs text-gray-600">
                    Please arrive at your scheduled boarding point 15 minutes before departure.
                    Coaches depart punctually according to central GPS schedule monitoring.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: GoBus Lounge */}
            {currentSection === 'lounge' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    GoBus Passenger Lounges
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Relax before your journey in our clean, air-conditioned passenger lounges
                    located at key boarding hubs across Delhi, Jaipur, Mumbai, Pune, and Bangalore.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                    <BuildingOfficeIcon className="w-5 h-5 text-[#65b800]" />
                    <h3 className="font-bold text-gray-900">Air-Conditioned Waiting Hall</h3>
                    <p className="text-gray-500">
                      Clean cushioned seating away from terminal traffic and heat.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                    <TvIcon className="w-5 h-5 text-[#65b800]" />
                    <h3 className="font-bold text-gray-900">Live Departure Monitors</h3>
                    <p className="text-gray-500">
                      Real-time coach tracking, bay assignments, and boarding announcements.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                    <SparklesIcon className="w-5 h-5 text-[#65b800]" />
                    <h3 className="font-bold text-gray-900">Free High-Speed Wi-Fi</h3>
                    <p className="text-gray-500">
                      Complimentary charging points and high-speed internet.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                    <ShieldCheckIcon className="w-5 h-5 text-[#65b800]" />
                    <h3 className="font-bold text-gray-900">Secure Cloakroom</h3>
                    <p className="text-gray-500">
                      Sanitized washrooms and supervised luggage holding before departure.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: On Board Amenities */}
            {currentSection === 'on-board' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    On Board Amenities
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Engineered for supreme comfort on long-haul and overnight journeys across
                    India.
                  </p>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  {[
                    'Ergonomic luxury recliner seats with generous legroom and footrests',
                    'Fully flat AC Sleeper berths with privacy curtains and clean sanitized linen',
                    'Individual USB and 230V multi-pin charging sockets at every berth',
                    'Live GPS vehicle tracking with shareable tracking links for family members',
                    'Complimentary sealed mineral water bottle upon boarding',
                    'Central HEPA air filtration and climate-controlled cabin temperature',
                  ].map((amenity, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <CheckCircleIcon className="w-5 h-5 text-[#65b800] shrink-0" />
                      <span className="font-semibold text-gray-800">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: App */}
            {currentSection === 'app' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    GoBus Mobile App
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Book tickets on the go, track your bus in real-time on live maps, and access
                    offline QR boarding passes with zero paper required.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#73d200]/10 border border-[#73d200]/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <DevicePhoneMobileIcon className="w-8 h-8 text-[#529600]" />
                    <div>
                      <h3 className="font-black text-gray-900 text-sm">Download the GoBus App</h3>
                      <p className="text-xs text-gray-600">Available on Android & iOS</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Enjoy exclusive mobile flash coupons, instant push notifications on boarding
                    gate updates, and 1-tap seat locks.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 7: Seat Reservations */}
            {currentSection === 'seat-reservations' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    Seat Reservations & Live Seat Locking
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Choose exactly where you want to sit. Pick lower or upper sleeper berths, window
                    seats, or panoramic front rows.
                  </p>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-gray-700">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-1">10-Minute Hold Guarantee</h3>
                    <p className="text-gray-600 text-xs">
                      When you select a seat, our real-time concurrency engine locks it exclusively
                      for your checkout session for 10 minutes. No other passenger can reserve it
                      while you enter details and pay.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: Safety & Sustainability */}
            {currentSection === 'safety' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    Safety & Security Standards
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your safety is our absolute priority. We operate under stringent fleet and driver
                    safety protocols.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                    <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-gray-900">Certified Dual Drivers</h3>
                    <p className="text-gray-500">
                      Mandatory two-driver rotation on routes exceeding 6 hours.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                    <PhoneIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-gray-900">24x7 Control Room</h3>
                    <p className="text-gray-500">
                      Central control room monitoring speeds, route compliance, and SOS alerts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'sustainability' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    Green & Sustainable Transit
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Travelling by bus produces up to 80% fewer carbon emissions per passenger-kilometer
                    compared to private vehicles. GoBus is committed to green, eco-friendly intercity
                    transit.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 9: Help & Customer Support */}
            {currentSection === 'help' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    Help & Customer Support
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Our dedicated 24x7 customer support desk is available to assist with booking
                    queries, cancellations, refunds, and luggage inquiries.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-5 rounded-2xl bg-[#73d200]/10 border border-[#73d200]/30 space-y-2">
                    <PhoneIcon className="w-6 h-6 text-[#5b9e00]" />
                    <h3 className="font-black text-sm text-gray-900">24x7 Customer Helpline</h3>
                    <p className="text-gray-600">
                      Call our toll-free support line anytime for instant booking assistance:
                    </p>
                    <a
                      href="tel:8404855555"
                      className="font-mono text-base font-black text-gray-950 block hover:underline"
                    >
                      8404855555 / 1800-102-3549
                    </a>
                  </div>

                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                    <TicketIcon className="w-6 h-6 text-gray-800" />
                    <h3 className="font-black text-sm text-gray-900">Manage Your Booking</h3>
                    <p className="text-gray-600">
                      Retrieve e-tickets, check live seat statuses, or cancel your booking:
                    </p>
                    <Link
                      to="/my-bookings"
                      className="inline-flex items-center gap-1 font-bold text-gray-900 hover:underline pt-1"
                    >
                      <span>Go to My Bookings</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Default overview if /services accessed */}
            {currentSection === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    All GoBus Services
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Explore all passenger services offered by GoBus, from luggage allowances and
                    comfortable on-board amenities to luxury transit lounges.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SIDEBAR_LINKS.filter((s) => s.id !== 'overview').map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      className="p-4 rounded-xl border border-gray-200 hover:border-[#73d200] hover:shadow-xs bg-gray-50/50 hover:bg-white transition-all space-y-1 block"
                    >
                      <h3 className="font-bold text-sm text-gray-900">{item.label}</h3>
                      <p className="text-xs text-gray-500">
                        View details and policies for {item.label}.
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Right Navigation Sidebar (matches reference design layout & screenshots) */}
          <aside className="lg:col-span-4 sticky top-20 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block px-3 py-1">
                Services & Information
              </span>

              {SIDEBAR_LINKS.map((link) => {
                const isActive = currentSection === link.id;
                return (
                  <Link
                    key={link.id}
                    to={link.path}
                    className={`block px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors ${
                      isActive
                        ? 'bg-[#e8f7cf] text-gray-950 font-black border-l-4 border-[#65b800]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Quick Helpline Card */}
            <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200 text-xs space-y-1.5">
              <div className="font-black text-gray-900">Need help booking?</div>
              <p className="text-gray-600 text-[11px]">
                Speak to our customer support team 24/7 for live booking assistance.
              </p>
              <a
                href="tel:8404855555"
                className="font-mono font-black text-[#4f9100] text-sm block pt-1 hover:underline"
              >
                📞 8404855555
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
