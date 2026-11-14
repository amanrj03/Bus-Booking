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
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import { SERVICE_ITEMS } from '../config/servicesConfig';

export default function ServicesPage() {
  const { section } = useParams();

  // Accordion states
  const [additionalLuggageOpen, setAdditionalLuggageOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState('passenger');

  // Image load fallback states
  const [backpackImgError, setBackpackImgError] = useState(false);
  const [suitcaseImgError, setSuitcaseImgError] = useState(false);

  // If section is omitted (/services), default to 'overview'
  const currentSection = section || 'overview';

  const currentMeta =
    SERVICE_ITEMS.find((s) => s.id === currentSection) ||
    SERVICE_ITEMS.find((s) => s.id === 'overview') ||
    SERVICE_ITEMS[0];

  const toggleAccordion = (key) => {
    setActiveAccordion((prev) => (prev === key ? null : key));
  };

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
            {/* 1. ALL SERVICES OVERVIEW (When clicking All Services / Service Overview) */}
            {currentSection === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
                    All Services & Passenger Amenities
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Explore all GoBus travel solutions designed for comfortable, punctual, and
                    secure intercity journeys across India. Choose an option below to view detailed
                    guidelines and amenities.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {SERVICE_ITEMS.filter((item) => item.id !== 'overview').map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      className="group p-5 rounded-2xl border border-gray-200 hover:border-[#73d200] hover:shadow-md bg-white transition-all space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-[#529600] transition-colors">
                            {item.label}
                          </h3>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-[#73d200] group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {item.id === 'how-to-book' &&
                            'Complete 3-click reservation guide, 10-minute hold guarantee & payment methods.'}
                          {item.id === 'manage-booking' &&
                            'Reschedule trips, change passenger details, manage seats, or cancel tickets.'}
                          {item.id === 'luggage' &&
                            'Included 7 kg soft bag and 20 kg checked luggage dimensions and policies.'}
                          {item.id === 'lounge' &&
                            'Air-conditioned transit passenger lounges in Delhi, Jaipur, Mumbai, & Bangalore.'}
                          {item.id === 'on-board' &&
                            'Ergonomic luxury recliners, AC Sleeper berths, charging ports & Wi-Fi.'}
                          {item.id === 'app' &&
                            'Book on the go, live bus tracking on maps, and paperless QR boarding passes.'}
                          {item.id === 'seat-reservations' &&
                            'Live 2-deck visual seat selection with lock concurrency protection.'}
                          {item.id === 'regulations' &&
                            'Mandatory government ID verification and intercity transit compliance.'}
                          {item.id === 'safety' &&
                            'Certified dual drivers, 24x7 GPS monitoring, and fleet safety standards.'}
                          {item.id === 'sustainability' &&
                            'Eco-friendly travel producing up to 80% fewer carbon emissions.'}
                          {item.id === 'help' &&
                            '24/7 dedicated customer assistance, toll-free helpline, and inquiry desk.'}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#529600] pt-2 inline-flex items-center gap-1">
                        <span>Learn more</span>
                        <span>→</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 2. BOOK TICKETS YOUR WAY (Reference Screenshot 2) */}
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

                {/* Booking on our website steps */}
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

            {/* 3. MANAGE MY BOOKING (Reference Screenshot 1) */}
            {currentSection === 'manage-booking' && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
                    Manage My Booking
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong>Manage My Booking</strong> is a platform where you can easily manage
                    all your booking and travel details and download all documentation and boarding
                    passes.
                  </p>
                </div>

                {/* Hero Banner with GoBus Coach */}
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-xs relative">
                  <img
                    src="/dashboardimage.png"
                    alt="GoBus Coach Fleet"
                    className="w-full h-60 object-cover object-center"
                  />
                </div>

                {/* Prominent Go to Manage My Booking CTA Button */}
                <div>
                  <Link
                    to="/my-bookings"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#73d200] hover:bg-[#65b800] text-gray-950 font-black text-sm transition-all shadow-xs"
                  >
                    <span>Go to Manage My Booking</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>

                {/* The 5 Accordions matching FlixBus Reference Screenshot 1 */}
                <div className="space-y-3 pt-2">
                  {/* Accordion 1 */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('passenger')}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 text-left font-extrabold text-xs sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <span>Edit Passenger and Contact Details</span>
                      {activeAccordion === 'passenger' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    {activeAccordion === 'passenger' && (
                      <div className="p-4 bg-white text-xs sm:text-sm text-gray-600 space-y-2 border-t border-gray-200 leading-relaxed">
                        <p>
                          Need to correct a passenger name or update the phone number and email
                          address linked to your reservation?
                        </p>
                        <p>
                          You can edit passenger contact details anytime up to 2 hours before the
                          scheduled departure directly through your booking management portal.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Accordion 2 */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('reschedule')}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 text-left font-extrabold text-xs sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <span>Reschedule Trip</span>
                      {activeAccordion === 'reschedule' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    {activeAccordion === 'reschedule' && (
                      <div className="p-4 bg-white text-xs sm:text-sm text-gray-600 space-y-2 border-t border-gray-200 leading-relaxed">
                        <p>
                          Change your journey date or switch to another scheduled bus on the same
                          route up to 4 hours before coach departure.
                        </p>
                        <p>
                          Any fare difference between the original and new trip will be displayed
                          transparently before confirmation.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Accordion 3 */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('seats')}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 text-left font-extrabold text-xs sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <span>Manage Seats and Luggage</span>
                      {activeAccordion === 'seats' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    {activeAccordion === 'seats' && (
                      <div className="p-4 bg-white text-xs sm:text-sm text-gray-600 space-y-2 border-t border-gray-200 leading-relaxed">
                        <p>
                          Switch your seat berth (upper sleeper, lower sleeper, or executive recliner)
                          based on real-time availability on the bus map.
                        </p>
                        <p>
                          You can also add additional pieces of checked luggage (up to 20 kg per bag)
                          for ₹99 per item.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Accordion 4 */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('cancel')}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 text-left font-extrabold text-xs sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <span>Cancel Booking</span>
                      {activeAccordion === 'cancel' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    {activeAccordion === 'cancel' && (
                      <div className="p-4 bg-white text-xs sm:text-sm text-gray-600 space-y-2 border-t border-gray-200 leading-relaxed">
                        <p>
                          Cancel individual passenger seats or your complete booking with instant
                          automated refund calculation according to our cancellation slabs:
                        </p>
                        <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                          <li>&gt; 24 hours prior to departure: 90% refund</li>
                          <li>12 to 24 hours prior: 75% refund</li>
                          <li>4 to 12 hours prior: 50% refund</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Accordion 5 */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('delays')}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 text-left font-extrabold text-xs sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <span>Manage Delays and Cancellations</span>
                      {activeAccordion === 'delays' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    {activeAccordion === 'delays' && (
                      <div className="p-4 bg-white text-xs sm:text-sm text-gray-600 space-y-2 border-t border-gray-200 leading-relaxed">
                        <p>
                          In the rare event of traffic or weather delays exceeding 60 minutes, you are
                          entitled to complimentary rebooking on the next available coach or a 100%
                          full refund.
                        </p>
                        <p>
                          Our central operations dispatch sends live SMS and WhatsApp alerts to all
                          ticketed passengers.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. LUGGAGE POLICY (Reference Screenshot 3) */}
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
                  {/* Card 1: 1x Soft Bag or Backpack (7 kg) */}
                  <div className="border border-gray-200 rounded-2xl p-6 bg-white space-y-4 relative flex flex-col justify-between">
                    <div>
                      {/* Image & Weight Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-28 h-28 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 overflow-hidden">
                          {!backpackImgError ? (
                            <img
                              src="/images/luggage-backpack.png"
                              alt="1x Soft Bag or Backpack (7 kg)"
                              onError={() => setBackpackImgError(true)}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            /* Fallback vector illustration of lime-green backpack */
                            <svg
                              className="w-20 h-20 text-[#73d200]"
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect x="25" y="25" width="50" height="60" rx="14" fill="#73d200" />
                              <rect x="35" y="15" width="30" height="15" rx="6" stroke="#4a8600" strokeWidth="4" />
                              <rect x="33" y="45" width="34" height="28" rx="6" fill="#5eb000" />
                              <line x1="50" y1="45" x2="50" y2="73" stroke="#ffffff" strokeWidth="2" strokeDasharray="2 2" />
                              <circle cx="50" cy="35" r="4" fill="#ffffff" />
                            </svg>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-black text-gray-900">7 kg</div>
                          <div className="text-xs text-gray-400 font-semibold">Max weight</div>
                        </div>
                      </div>

                      {/* Dimension guide callout */}
                      <div className="flex items-center justify-between text-xs text-gray-500 font-mono border-y border-gray-100 py-2.5 px-1 bg-gray-50/60 rounded-lg mb-3">
                        <span className="font-bold">42 cm (H)</span>
                        <span>×</span>
                        <span className="font-bold">30 cm (W)</span>
                        <span>×</span>
                        <span className="font-bold">18 cm (D)</span>
                      </div>

                      <h3 className="font-extrabold text-sm text-gray-900 mb-1.5">
                        1x Soft Bag or Backpack
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        For safety reasons, you must stow your soft bag or backpack underneath your
                        seat, or in the overhead compartment above your seat.
                      </p>
                    </div>

                    <p className="text-[11px] text-gray-500 italic pt-2 border-t border-gray-100">
                      Note: Carry valuables (identification, electronics, medications) with you in
                      your soft bag or backpack.
                    </p>
                  </div>

                  {/* Card 2: 1x Checked Bag (20 kg) */}
                  <div className="border-2 border-[#73d200]/50 rounded-2xl p-6 bg-white space-y-4 relative flex flex-col justify-between">
                    <div>
                      {/* Image & Weight Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-28 h-28 rounded-2xl bg-[#73d200]/10 border border-[#73d200]/25 flex items-center justify-center p-2 overflow-hidden">
                          {!suitcaseImgError ? (
                            <img
                              src="/images/luggage-suitcase.png"
                              alt="1x Checked Bag (20 kg)"
                              onError={() => setSuitcaseImgError(true)}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            /* Fallback vector illustration of lime-green rolling suitcase */
                            <svg
                              className="w-20 h-20 text-[#73d200]"
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect x="38" y="10" width="24" height="20" rx="3" stroke="#374151" strokeWidth="4" />
                              <rect x="25" y="24" width="50" height="62" rx="10" fill="#73d200" stroke="#549700" strokeWidth="2" />
                              <line x1="33" y1="40" x2="67" y2="40" stroke="#549700" strokeWidth="3" />
                              <line x1="33" y1="55" x2="67" y2="55" stroke="#549700" strokeWidth="3" />
                              <line x1="33" y1="70" x2="67" y2="70" stroke="#549700" strokeWidth="3" />
                              <circle cx="34" cy="90" r="5" fill="#1f2937" />
                              <circle cx="66" cy="90" r="5" fill="#1f2937" />
                            </svg>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-black text-gray-900">20 kg</div>
                          <div className="text-xs text-gray-400 font-semibold">Max weight</div>
                        </div>
                      </div>

                      {/* Dimension guide callout */}
                      <div className="flex items-center justify-between text-xs text-gray-500 font-mono border-y border-gray-100 py-2.5 px-1 bg-gray-50/60 rounded-lg mb-3">
                        <span className="font-bold">80 cm (H)</span>
                        <span>×</span>
                        <span className="font-bold">50 cm (W)</span>
                        <span>×</span>
                        <span className="font-bold">30 cm (D)</span>
                      </div>

                      <h3 className="font-extrabold text-sm text-gray-900 mb-1.5">
                        1x Checked Bag
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Your checked bag is to be stowed in the luggage compartment before you enter
                        the bus. Your bus driver is happy to help you with that. We recommend
                        labelling your bag with your name and address. In some cases GoBus will hand
                        out bag tags.
                      </p>
                    </div>

                    <p className="text-[11px] text-[#549700] font-semibold pt-2 border-t border-gray-100">
                      ✓ Included free with every confirmed passenger ticket.
                    </p>
                  </div>
                </div>

                {/* Additional Guidance & Lost & Found */}
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
                    className="w-full flex items-center justify-between p-4 bg-gray-50 text-left font-extrabold text-xs sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors"
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

            {/* 5. GOBUS TRANSIT LOUNGES */}
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

            {/* 6. ON BOARD AMENITIES */}
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

            {/* 7. APP */}
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

            {/* 8. SEAT RESERVATIONS */}
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
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-[#529600]" />
                      <span>10-Minute Hold Guarantee</span>
                    </h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      When you select a seat on our 2-deck bus map, our real-time concurrency engine
                      locks it exclusively for your checkout session for 10 minutes. No other
                      passenger can reserve it while you enter details and pay.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 9. TRAVEL GUIDELINES (Reference Screenshot 4) */}
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

            {/* 10. SAFETY */}
            {currentSection === 'safety' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    Safety & Security Standards
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your safety is our absolute priority. Every coach undergoes pre-trip mechanical
                    checks, breathalyzer driver audits, and continuous GPS speed monitoring.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                    <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-gray-900">Certified Dual Drivers</h3>
                    <p className="text-gray-500">
                      Mandatory two-driver rotation on journeys exceeding 6 hours.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                    <PhoneIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-gray-900">24x7 Emergency SOS</h3>
                    <p className="text-gray-500">
                      Central control room monitoring route deviation, speeds, and emergency calls.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 11. SUSTAINABILITY */}
            {currentSection === 'sustainability' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    Sustainability & Green Transit
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Travelling by bus produces up to 80% fewer carbon emissions per
                    passenger-kilometer compared to private cars, making GoBus the greenest way to
                    travel between Indian cities.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-900">
                  <h3 className="font-bold text-sm">Low-Carbon Fleet</h3>
                  <p>
                    Our fleet uses modern BS-VI engines and optimized aerodynamics to minimize fuel
                    consumption and particulate emissions across Indian highway corridors.
                  </p>
                </div>
              </div>
            )}

            {/* 12. CUSTOMER SATISFACTION & HELP */}
            {currentSection === 'help' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                    Customer Satisfaction & Support
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Our dedicated 24x7 customer support desk is available to answer all questions
                    regarding booking, cancellations, manifests, and schedules.
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
          </main>

          {/* Right Navigation Sidebar (SERVICES & INFORMATION) */}
          <aside className="lg:col-span-4 sticky top-20 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block px-3 py-1">
                Services & Information
              </span>

              {SERVICE_ITEMS.map((link) => {
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
