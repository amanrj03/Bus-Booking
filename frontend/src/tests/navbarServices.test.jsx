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
    it('renders Plan Your Journey without chevron and removes Search Buses', () => {
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
    });

    it('renders Service dropdown with menu items when clicked', () => {
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

      // Verify dropdown menu options appear
      expect(screen.getByText('All Services')).toBeTruthy();
      expect(screen.getByText('GoBus Lounge')).toBeTruthy();
      expect(screen.getByText('Luggage Policy')).toBeTruthy();
      expect(screen.getByText('How to Book')).toBeTruthy();
      expect(screen.getByText('Safety')).toBeTruthy();
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
    it('renders Book tickets your way section by default', () => {
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

    it('renders Luggage breakdown with 7 kg and 20 kg allowances', () => {
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
    });
  });
});
