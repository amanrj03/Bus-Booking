import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TruckIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BoltIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';
import HeroSearchWidget from '../components/search/HeroSearchWidget';
import CouponHeroCard from '../components/coupon/CouponHeroCard';
import { Card } from '../components/ui';
import { fetchRoutes } from '../services/trip.service';

const FALLBACK_POPULAR_CORRIDORS = [
  { sourceCity: 'Delhi', destinationCity: 'Jaipur', estimatedMinutes: 330, distanceKm: 280, minFare: 599 },
  { sourceCity: 'Mumbai', destinationCity: 'Pune', estimatedMinutes: 225, distanceKm: 150, minFare: 399 },
  { sourceCity: 'Bangalore', destinationCity: 'Chennai', estimatedMinutes: 375, distanceKm: 350, minFare: 649 },
  { sourceCity: 'Delhi', destinationCity: 'Manali', estimatedMinutes: 720, distanceKm: 540, minFare: 1299 },
  { sourceCity: 'Pune', destinationCity: 'Goa', estimatedMinutes: 540, distanceKm: 450, minFare: 999 },
  { sourceCity: 'Bangalore', destinationCity: 'Hyderabad', estimatedMinutes: 510, distanceKm: 570, minFare: 1099 },
];

const FARE_HINTS = {
  'Delhi-Jaipur': 599,
  'Jaipur-Delhi': 599,
  'Mumbai-Pune': 399,
  'Pune-Mumbai': 399,
  'Bangalore-Chennai': 649,
  'Chennai-Bangalore': 649,
  'Delhi-Chandigarh': 499,
  'Delhi-Manali': 1299,
  'Pune-Goa': 999,
  'Bangalore-Hyderabad': 1099,
};

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [corridors, setCorridors] = useState(FALLBACK_POPULAR_CORRIDORS);

  useEffect(() => {
    let mounted = true;
    fetchRoutes({ isActive: true, limit: 50 })
      .then((data) => {
        if (!mounted || !data?.routes?.length) return;

        const citySet = new Set();
        data.routes.forEach((r) => {
          citySet.add(r.sourceCity);
          citySet.add(r.destinationCity);
        });
        setCities(Array.from(citySet).sort());

        const mapped = data.routes.slice(0, 6).map((r) => ({
          id: r.id,
          sourceCity: r.sourceCity,
          destinationCity: r.destinationCity,
          estimatedMinutes: r.estimatedMinutes,
          distanceKm: Number(r.distanceKm),
          minFare:
            FARE_HINTS[`${r.sourceCity}-${r.destinationCity}`] ||
            Math.round(Number(r.distanceKm) * 2.2),
        }));
        setCorridors(mapped);
      })
      .catch(() => {
        // Keep curated fallback corridors when API is offline or unreachable
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectCorridor = (corridor) => {
    const params = new URLSearchParams({
      sourceCity: corridor.sourceCity,
      destinationCity: corridor.destinationCity,
      date: getTodayDateString(),
      passengers: '1',
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* GoBus Hero Banner with 100% Full Uncropped Background Image & Floating Coupon Offer */}
      <section className="relative w-full bg-[#f8f9fa] select-none">
        {/* Full Scenic Background Image Container - 100% Visible, Zero Crop */}
        <div className="relative w-full overflow-hidden">
          <img
            src="/dashboardimage.png"
            alt="GoBus Intercity Scenic Mountain Fleet"
            className="w-full h-auto block select-none pointer-events-none"
          />

          {/* Subtle gradient overlay ensuring high contrast for text while keeping the bus vibrant */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15 pointer-events-none" />

          {/* Top-Right: Floating Coupon Card positioned on the scenic forest side (matches reference design) */}
          <div className="hidden sm:block absolute top-3 sm:top-5 md:top-7 right-4 sm:right-6 md:right-8 lg:right-12 z-20">
            <CouponHeroCard />
          </div>

          {/* Hero Heading: Compact typography positioned right above the search box */}
          <div className="absolute bottom-32 sm:bottom-20 md:bottom-24 lg:bottom-24 left-0 right-0 z-20 pointer-events-none">
            <div className="max-w-6xl mx-auto px-4">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                Book bus tickets online
              </h1>
            </div>
          </div>
        </div>

        {/* Mobile Coupon Card (visible below image on small screens) */}
        <div className="sm:hidden px-4 pt-3 flex justify-center">
          <CouponHeroCard />
        </div>

        {/* Prominent Search Widget - Positioned at 50% across the bottom edge of the hero image */}
        <div className="relative z-30 max-w-6xl mx-auto px-4 -mt-16 sm:-mt-18 md:-mt-20 lg:-mt-20">
          <HeroSearchWidget cities={cities} />
        </div>

        {/* Spacing for the 75% overlapping search box */}
        <div className="pb-8 sm:pb-10 md:pb-12" />
      </section>

      {/* Popular Indian Intercity Corridors */}
      <section className="max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#65b800]">
              High-Density Corridors
            </span>
            <h2 className="text-2xl font-black text-gray-900">Popular Bus Routes</h2>
          </div>
          <p className="text-sm text-gray-500">
            Click any corridor below to check today&apos;s live departures and available seats
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {corridors.map((corridor) => (
            <Card
              key={`${corridor.sourceCity}-${corridor.destinationCity}`}
              hoverable
              onClick={() => handleSelectCorridor(corridor)}
              className="cursor-pointer group border border-gray-200 hover:border-[#73d200] transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 text-base font-black text-gray-900 group-hover:text-[#65b800] transition-colors">
                    <span>{corridor.sourceCity}</span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-[#73d200]" />
                    <span>{corridor.destinationCity}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {formatDuration(corridor.estimatedMinutes)}
                    </span>
                    <span>•</span>
                    <span>{corridor.distanceKm} km</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    From
                  </span>
                  <span className="text-lg font-black text-gray-900">₹{corridor.minFare}</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600">
                <span>Daily Morning & Overnight Coaches</span>
                <span className="text-[#65b800] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  Explore <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Value Propositions */}
      <section className="bg-white border-t border-gray-200 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="flex items-start gap-3.5 bg-gray-50 border-gray-200">
              <div className="p-2.5 bg-[#73d200]/20 rounded-lg text-gray-900 shrink-0">
                <TruckIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Live Seat Concurrency</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Row-level locking guarantees zero double-booking across simultaneous passengers.
                </p>
              </div>
            </Card>

            <Card className="flex items-start gap-3.5 bg-gray-50 border-gray-200">
              <div className="p-2.5 bg-[#73d200]/20 rounded-lg text-gray-900 shrink-0">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Instant Re-Booking</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Cancelled seats return directly to live inventory with transparent refund tiers.
                </p>
              </div>
            </Card>

            <Card className="flex items-start gap-3.5 bg-gray-50 border-gray-200">
              <div className="p-2.5 bg-[#73d200]/20 rounded-lg text-gray-900 shrink-0">
                <BoltIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">AC Sleeper Comfort</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Charging points, high-speed Wi-Fi, water bottles, and GPS-tracked fleets.
                </p>
              </div>
            </Card>

            <Card className="flex items-start gap-3.5 bg-gray-50 border-gray-200">
              <div className="p-2.5 bg-[#73d200]/20 rounded-lg text-gray-900 shrink-0">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Simulated Checkout</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Safe end-to-end UPI, Card, and Net Banking simulation with instant PNR e-tickets.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
