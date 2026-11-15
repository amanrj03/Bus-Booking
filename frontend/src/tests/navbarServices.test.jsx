import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ServicesPage from '../pages/ServicesPage';

describe('Navbar and Services Suite', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Navbar Component', () => {
    it('renders Plan Your Journey without chevron and removes Search Buses and IN/EN selector', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      // Verify Plan Your Journey is present
      const planLink = screen.getByText('Plan Your Journey');
      expect(planLink).toBeTruthy();

      // Verify "Search Buses" is completely absent
      const searchBusesLink = screen.queryByText('Search Buses');
      expect(searchBusesLink).toBeNull();

      // Verify IN / EN indicator is removed from the header
      expect(screen.queryByText('EN')).toBeNull();
    });

    it('renders Service dropdown with exact matching menu items when clicked', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const serviceBtn = screen.getByRole('button', { name: /service/i });
      expect(serviceBtn).toBeTruthy();

      // Initially dropdown is not open
      expect(screen.queryByText('All Services')).toBeNull();

      // Click service button to open dropdown
      fireEvent.click(serviceBtn);

      // Verify dropdown menu options appear matching SERVICE_ITEMS
      expect(screen.getByText('All Services')).toBeTruthy();
      expect(screen.getByText('App')).toBeTruthy();
      expect(screen.getByText('Book tickets your way')).toBeTruthy();
      expect(screen.getByText('GoBus Lounge')).toBeTruthy();
      expect(screen.getByText('Luggage')).toBeTruthy();
      expect(screen.getByText('Manage My Booking')).toBeTruthy();
      expect(screen.getByText('On board')).toBeTruthy();
      expect(screen.getByText('Travel Guidelines')).toBeTruthy();
      expect(screen.getByText('Seat Reservations')).toBeTruthy();
      expect(screen.getByText('Safety')).toBeTruthy();
      expect(screen.getByText('Sustainability')).toBeTruthy();
      expect(screen.getByText('Customer Satisfaction')).toBeTruthy();
    });

    it('renders Trip Tracker, Help, and Call to book', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      expect(screen.getByText('Trip Tracker')).toBeTruthy();
      expect(screen.getByText('Help')).toBeTruthy();
      expect(screen.getByText(/Call to book 8404855555/i)).toBeTruthy();
    });
  });

  describe('ServicesPage Component', () => {
    it('renders All Services Overview when on /services without section param', () => {
      render(
        <MemoryRouter initialEntries={['/services']}>
          <Routes>
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:section" element={<ServicesPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should open All Services overview, NOT Book tickets your way as main page
      expect(
        screen.getByRole('heading', { level: 1, name: /All Services & Passenger Amenities/i })
      ).toBeTruthy();
      expect(
        screen.queryByRole('heading', { level: 1, name: /Book tickets your way/i })
      ).toBeNull();
    });

    it('renders Book tickets your way when on /services/how-to-book', () => {
      render(
        <MemoryRouter initialEntries={['/services/how-to-book']}>
          <Routes>
            <Route path="/services/:section" element={<ServicesPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /Book tickets your way/i })).toBeTruthy();
      expect(screen.getByText(/Choose your trip with just 3 clicks/i)).toBeTruthy();
    });

    it('renders Manage My Booking guide with CTA and accordions on /services/manage-booking', () => {
      render(
        <MemoryRouter initialEntries={['/services/manage-booking']}>
          <Routes>
            <Route path="/services/:section" element={<ServicesPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /Manage My Booking/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /Go to Manage My Booking/i })).toBeTruthy();
      expect(screen.getByText(/Edit Passenger and Contact Details/i)).toBeTruthy();
      expect(screen.getByText(/Reschedule Trip/i)).toBeTruthy();
      expect(screen.getByText(/Cancel Booking/i)).toBeTruthy();
    });

    it('renders Luggage breakdown with 7 kg and 20 kg allowances with dimensions', () => {
      render(
        <MemoryRouter initialEntries={['/services/luggage']}>
          <Routes>
            <Route path="/services/:section" element={<ServicesPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /Luggage on a GoBus/i })).toBeTruthy();
      expect(screen.getByText('7 kg')).toBeTruthy();
      expect(screen.getByText('20 kg')).toBeTruthy();
      expect(screen.getByText(/1x Soft Bag or Backpack/i)).toBeTruthy();
      expect(screen.getByText(/1x Checked Bag/i)).toBeTruthy();
      expect(screen.getByText(/42 cm \(H\)/i)).toBeTruthy();
      expect(screen.getByText(/80 cm \(H\)/i)).toBeTruthy();
    });
  });
});
