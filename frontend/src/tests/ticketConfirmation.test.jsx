import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ETicketCard from '../components/ticket/ETicketCard';
import BookingConfirmationPage from '../pages/BookingConfirmationPage';
import * as bookingService from '../services/booking.service';

const sampleBooking = {
  id: 'bkg-101',
  pnr: 'BUS-20261112-TEST',
  status: 'CONFIRMED',
  totalAmount: 1365,
  contactEmail: 'traveler@example.com',
  contactPhone: '+91 9876543210',
  createdAt: '2026-11-12T10:00:00.000Z',
  trip: {
    id: 'trip-909',
    departureTime: '2026-11-12T21:00:00.000Z',
    arrivalTime: '2026-11-13T05:30:00.000Z',
    baseFare: 650,
    route: {
      sourceCity: 'Delhi',
      destinationCity: 'Jaipur',
      estimatedMinutes: 510,
      routeStops: [
        { stopOrder: 1, stop: { name: 'ISBT Kashmiri Gate', landmark: 'Platform 4' } },
        { stopOrder: 2, stop: { name: 'Sindhi Camp', landmark: 'Central Drop' } },
      ],
    },
    bus: {
      busNumber: 'DL-01-AB-9999',
      busType: 'AC_SLEEPER_2X1',
      amenities: ['WIFI', 'CHARGING_POINT', 'WATER_BOTTLE'],
      operator: {
        companyName: 'Zingbus Express',
        contactPhone: '+91 9811122233',
      },
    },
  },
  passengers: [
    {
      id: 'p-1',
      fullName: 'Aman Sharma',
      age: 26,
      gender: 'MALE',
      seatNumber: 'L1',
    },
    {
      id: 'p-2',
      fullName: 'Priya Sharma',
      age: 24,
      gender: 'FEMALE',
      seatNumber: 'L2',
    },
  ],
  seats: [
    { id: 's-1', seatNumber: 'L1', seatPrice: 650, status: 'CONFIRMED' },
    { id: 's-2', seatNumber: 'L2', seatPrice: 650, status: 'CONFIRMED' },
  ],
  payment: {
    id: 'pay-1',
    amount: 1365,
    paymentMethod: 'UPI',
    paymentStatus: 'SUCCESS',
    transactionReference: 'TXN-UPI-9876543210',
  },
};

describe('E-Ticket & Booking Confirmation Suite', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('ETicketCard Component', () => {
    it('renders PNR, carrier, coach specifications, and formatted timeline', async () => {
      render(<ETicketCard booking={sampleBooking} />);

      expect(screen.getByText('BUS-20261112-TEST')).toBeTruthy();
      expect(screen.getByText(/Zingbus Express/)).toBeTruthy();
      expect(screen.getByText('DL-01-AB-9999')).toBeTruthy();
      expect(screen.getByText('AC Sleeper (2+1)')).toBeTruthy();

      expect(screen.getAllByText('Delhi').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Jaipur').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/ISBT Kashmiri Gate/)).toBeTruthy();
      expect(screen.getByText(/Sindhi Camp/)).toBeTruthy();
    });

    it('renders passenger manifest table with all seats and details', () => {
      render(<ETicketCard booking={sampleBooking} />);

      expect(screen.getByText('Aman Sharma')).toBeTruthy();
      expect(screen.getByText(/26 yrs • MALE/)).toBeTruthy();
      expect(screen.getByText('L1')).toBeTruthy();

      expect(screen.getByText('Priya Sharma')).toBeTruthy();
      expect(screen.getByText(/24 yrs • FEMALE/)).toBeTruthy();
      expect(screen.getByText('L2')).toBeTruthy();

      expect(screen.getByText('₹1,365')).toBeTruthy();
      expect(screen.getByText('TXN-UPI-9876543210')).toBeTruthy();
    });

    it('generates and displays QR code image asynchronously', async () => {
      render(<ETicketCard booking={sampleBooking} />);

      await waitFor(() => {
        const qrImage = screen.getByAltText(/QR code for PNR BUS-20261112-TEST/i);
        expect(qrImage).toBeTruthy();
        expect(qrImage.src).toMatch(/^data:image\/png;base64,/);
      });
    });
  });

  describe('BookingConfirmationPage Integration', () => {
    it('renders confirmation header and triggers window.print() on action click', async () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/booking/confirmation/BUS-20261112-TEST',
              state: { booking: sampleBooking },
            },
          ]}
        >
          <Routes>
            <Route
              path="/booking/confirmation/:pnr"
              element={<BookingConfirmationPage />}
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Booking Confirmed!')).toBeTruthy();
      expect(screen.getAllByText('BUS-20261112-TEST').length).toBeGreaterThanOrEqual(1);

      const printBtn = screen.getByRole('button', { name: /Print E-Ticket/i });
      fireEvent.click(printBtn);
      expect(printSpy).toHaveBeenCalledTimes(1);
    });

    it('hydrates booking from API service when visiting directly via URL param', async () => {
      vi.spyOn(bookingService, 'fetchBookingByPnr').mockResolvedValue(sampleBooking);

      render(
        <MemoryRouter initialEntries={['/booking/confirmation/BUS-20261112-TEST']}>
          <Routes>
            <Route
              path="/booking/confirmation/:pnr"
              element={<BookingConfirmationPage />}
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Booking Confirmed!')).toBeTruthy();
        expect(screen.getByText('Aman Sharma')).toBeTruthy();
      });
    });

    it('renders error view when booking is not found by PNR', async () => {
      vi.spyOn(bookingService, 'fetchBookingByPnr').mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/booking/confirmation/UNKNOWN-PNR']}>
          <Routes>
            <Route
              path="/booking/confirmation/:pnr"
              element={<BookingConfirmationPage />}
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Booking Confirmation Not Found')).toBeTruthy();
      });
    });
  });
});
