import React from 'react';
import {
  TruckIcon,
  WifiIcon,
  BoltIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';
import { Button, Badge, Card } from '../ui';
import { formatClockTime, formatDuration } from '../../utils/dateUtils';

const BUS_TYPE_LABELS = {
  AC_SLEEPER_2X1: 'AC Sleeper (2+1)',
  AC_SEATER_2X2: 'AC Seater (2+2)',
  NON_AC_SEATER_2X2: 'Non-AC Seater (2+2)',
};

export default function TripResultCard({ trip, passengersRequested = 1, onSelectSeats }) {
  const route = trip.route || {};
  const bus = trip.bus || {};
  const operator = bus.operator || {};
  const amenities = bus.amenities || {};
  const stops = route.routeStops || [];

  const firstStop = stops[0]?.stop;
  const lastStop = stops[stops.length - 1]?.stop;
  const intermediateStopsCount = Math.max(0, stops.length - 2);

  const availableSeats = trip.availableSeatsCount ?? 0;
  const isSoldOut = availableSeats < passengersRequested || availableSeats === 0;
  const displayPrice = Number(trip.minSeatPrice ?? trip.baseFare ?? 0);

  return (
    <Card
      hoverable
      padding="p-5"
      className="border border-gray-200 hover:border-[#73d200] transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Operator + Journey Timeline + Amenities */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="operator">{operator.companyName || operator.name || 'Express'}</Badge>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
              <TruckIcon className="w-3.5 h-3.5 text-gray-500" />
              {BUS_TYPE_LABELS[bus.busType] || bus.busType}
            </span>
            {bus.busNumber && (
              <span className="text-[11px] font-mono text-gray-400">{bus.busNumber}</span>
            )}
          </div>

          {/* Journey Timeline */}
          <div className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-4">
              <div className="text-xl sm:text-2xl font-black text-gray-900">
                {formatClockTime(trip.departureTime)}
              </div>
              <div className="text-xs font-bold text-gray-800 truncate">{route.sourceCity}</div>
              {firstStop && (
                <div className="text-[11px] text-gray-500 flex items-center gap-1 truncate mt-0.5">
                  <MapPinIcon className="w-3 h-3 text-[#65b800] shrink-0" />
                  <span className="truncate">{firstStop.stationName}</span>
                </div>
              )}
            </div>

            <div className="col-span-4 flex flex-col items-center px-1">
              <span className="text-[11px] font-bold text-gray-500 mb-1">
                {formatDuration(route.estimatedMinutes)}
              </span>
              <div className="w-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#73d200] shrink-0" />
                <div className="flex-1 h-[2px] bg-gray-300 relative" />
                <span className="w-2 h-2 rounded-full bg-gray-800 shrink-0" />
              </div>
              <span className="text-[10px] text-gray-400 font-medium mt-1">
                {intermediateStopsCount > 0
                  ? `${intermediateStopsCount} intermediate ${
                      intermediateStopsCount === 1 ? 'stop' : 'stops'
                    }`
                  : 'Direct Express'}
              </span>
            </div>

            <div className="col-span-4 text-right">
              <div className="text-xl sm:text-2xl font-black text-gray-900">
                {formatClockTime(trip.arrivalTime)}
              </div>
              <div className="text-xs font-bold text-gray-800 truncate">
                {route.destinationCity}
              </div>
              {lastStop && (
                <div className="text-[11px] text-gray-500 truncate mt-0.5">
                  {lastStop.stationName}
                </div>
              )}
            </div>
          </div>

          {/* Amenities Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {amenities.wifi && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                <WifiIcon className="w-3.5 h-3.5 text-[#65b800]" />
                Wi-Fi
              </span>
            )}
            {amenities.chargingPort && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                <BoltIcon className="w-3.5 h-3.5 text-amber-500" />
                USB Charging
              </span>
            )}
            {amenities.gpsTracking && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                GPS Tracked
              </span>
            )}
            {amenities.waterBottle && (
              <span className="text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                Water Bottle
              </span>
            )}
          </div>
        </div>

        {/* Right: Fare, Availability, and Select Seats CTA */}
        <div className="md:w-48 md:border-l md:border-gray-100 md:pl-5 flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
          <div className="md:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
              Starting Fare
            </span>
            <div className="text-2xl font-black text-gray-900">
              ₹{displayPrice.toLocaleString('en-IN')}
            </div>
            <div className="mt-1">
              {isSoldOut ? (
                <Badge variant="danger">
                  {availableSeats === 0
                    ? 'Sold Out'
                    : `Only ${availableSeats} left`}
                </Badge>
              ) : (
                <Badge variant={availableSeats <= 6 ? 'warning' : 'success'}>
                  {availableSeats} {availableSeats === 1 ? 'seat' : 'seats'} left
                </Badge>
              )}
            </div>
          </div>

          <Button
            size="md"
            fullWidth
            disabled={isSoldOut}
            onClick={() => onSelectSeats(trip)}
            icon={ChevronRightIcon}
            iconPosition="right"
            className="md:mt-2 shrink-0 w-auto md:w-full"
          >
            Select Seats
          </Button>
        </div>
      </div>
    </Card>
  );
}
