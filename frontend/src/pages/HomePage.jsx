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
import { Badge, Card } from '../components/ui';
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
      {/* GoBus Hero Banner */}
      <section className="relative bg-gradient-to-br from-[#131b26] via-gray-900 to-gray-800 text-white pt-14 pb-20 px-4 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#73d200]/10 blur-3xl pointer-events-none"
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="operator">Express Intercity Fleet</Badge>
            <span className="text-xs font-semibold text-gray-300">
              35+ Indian Corridors • 45+ Luxury AC & Sleeper Coaches
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight leading-tight max-w-3xl">
            Low-cost intercity bus travel across India.
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-8 max-w-2xl">
            Book verified AC Sleepers and Executive Seaters with live seat concurrency, transparent ₹ INR pricing, and instant e-tickets.
          </p>

          <HeroSearchWidget cities={cities} />
        </div>
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
