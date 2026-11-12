import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  TruckIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
} from '@heroicons/react/24/solid';
import MainLayout from './layouts/MainLayout';
import { Button, Badge, Input, Card } from './components/ui';

function HomePreview() {
  const [fromCity, setFromCity] = useState('Delhi');
  const [toCity, setToCity] = useState('Jaipur');

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center md:text-left">
          <div className="mb-3">
            <Badge variant="operator">Express Intercity Fleet</Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Intercity Bus Travel across India
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-8 max-w-2xl">
            Reliable, comfortable, and affordable bus tickets on high-density routes connecting Delhi, Jaipur, Mumbai, Pune, Bangalore, and more.
          </p>

          <Card padding="p-6" className="text-gray-800 max-w-4xl shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <Input
                label="From"
                icon={MapPinIcon}
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
              />
              <Input
                label="To"
                icon={MapPinIcon}
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
              />
              <Input
                label="Date"
                icon={CalendarDaysIcon}
                defaultValue="Today, 12 Nov"
                readOnly
              />
              <Button size="lg" fullWidth icon={ArrowRightIcon} iconPosition="right">
                Search Buses
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Feature Highlights */}
      <section className="max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverable className="flex items-start gap-4">
            <div className="p-3 bg-[#73d200]/20 rounded-lg text-gray-900">
              <TruckIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Live Seat Concurrency</h3>
              <p className="text-xs text-gray-500">
                PostgreSQL row-level locking ensures zero double-booking even under peak passenger demand.
              </p>
            </div>
          </Card>

          <Card hoverable className="flex items-start gap-4">
            <div className="p-3 bg-[#73d200]/20 rounded-lg text-gray-900">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Instant Re-Booking</h3>
              <p className="text-xs text-gray-500">
                Released seats become immediately available to passengers while retaining historical records.
              </p>
            </div>
          </Card>

          <Card hoverable className="flex items-start gap-4">
            <div className="p-3 bg-[#73d200]/20 rounded-lg text-gray-900">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Simulated Payments</h3>
              <p className="text-xs text-gray-500">
                End-to-end UPI, Card, and Net Banking booking simulation without external payment gateways.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function PlaceholderView({ title }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <Card>
        <h2 className="text-xl font-black text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500">
          This module will be connected to live PostgreSQL APIs in upcoming commits.
        </p>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePreview />} />
          <Route path="/search" element={<PlaceholderView title="Search Results & Filters" />} />
          <Route path="/my-bookings" element={<PlaceholderView title="Manage My Bookings & E-Tickets" />} />
          <Route path="/admin" element={<PlaceholderView title="Admin & Operator Management Portal" />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
