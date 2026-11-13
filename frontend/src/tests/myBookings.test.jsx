import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyBookingsPage from '../pages/MyBookingsPage';
import * as bookingService from '../services/booking.service';

const futureDeparture = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();
const futureArrival = new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString();

const confirmedBooking = {
  id: 'bkg-conf-1',
  pnr: 'FLX-DEL-2026-1111',
  status: 'CONFIRMED',
  totalAmount: 1000,
  createdAt: '2026-11-12T08:00:00.000Z',
  trip: {
    id: 'trip-1',
    departureTime: futureDeparture,
    arrivalTime: futureArrival,
    route: { sourceCity: 'Delhi', destinationCity: 'Jaipur', estimatedMinutes: 360 },
    bus: {
      busNumber: 'DL01AB1111',
      busType: 'AC_SLEEPER_2X1',
      operator: { companyName: 'Zingbus Express' },
    },
  },
  passengers: [{ id: 'p-1', fullName: 'Rahul Verma', age: 29, gender: 'MALE', seatNumber: 'L1' }],
  payment: { paymentMethod: 'UPI', paymentStatus: 'SUCCESS', transactionReference: 'TXN-SIM-UPI-1001' },
  cancellation: null,
};

const cancelledBooking = {
  id: 'bkg-canc-2',
  pnr: 'FLX-MUM-2026-2222',
  status: 'CANCELLED',
  totalAmount: 800,
  createdAt: '2026-11-10T10:00:00.000Z',
  trip: {
    id: 'trip-2',
    departureTime: futureDeparture,
    arrivalTime: futureArrival,
    route: { sourceCity: 'Mumbai', destinationCity: 'Pune', estimatedMinutes: 210 },
    bus: {
      busNumber: 'MH02XY2222',
      busType: 'AC_SEATER_2X2',
      operator: { companyName: 'IntrCity SmartBus' },
    },
  },
  passengers: [{ id: 'p-2', fullName: 'Neha Singh', age: 25, gender: 'FEMALE', seatNumber: '1A' }],
  payment: { paymentMethod: 'DEBIT_CARD', paymentStatus: 'REFUNDED', transactionReference: 'TXN-SIM-CRD-2002' },
  cancellation: {
    cancellationFee: 80,
    refundAmount: 720,
    reason: 'Change of travel plans',
    refundStatus: 'PROCESSED',
  },
};

describe('Passenger Portal: MyBookingsPage & CancellationModal Suite', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders booking history with confirmed and cancelled refund details', async () => {
    vi.spyOn(bookingService, 'fetchMyBookings').mockResolvedValue({
      bookings: [confirmedBooking, cancelledBooking],
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FLX-DEL-2026-1111')).toBeTruthy();
      expect(screen.getByText('FLX-MUM-2026-2222')).toBeTruthy();
    });

    expect(screen.getByText('Delhi')).toBeTruthy();
    expect(screen.getByText('Jaipur')).toBeTruthy();
    expect(screen.getByText(/Refund PROCESSED: ₹720/)).toBeTruthy();
    expect(screen.getByText(/Fee deducted: ₹80/)).toBeTruthy();
  });

  it('switches status filter tabs and queries filtered bookings', async () => {
    const fetchSpy = vi.spyOn(bookingService, 'fetchMyBookings').mockResolvedValue({
      bookings: [confirmedBooking],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const cancelledTab = screen.getByRole('button', { name: /Cancelled & Refunded/i });
    fireEvent.click(cancelledTab);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith({ page: 1, limit: 10, status: 'CANCELLED' });
    });
  });

  it('opens CancellationModal, displays refund quote, cancels booking, and refreshes list', async () => {
    const fetchSpy = vi.spyOn(bookingService, 'fetchMyBookings').mockResolvedValue({
      bookings: [confirmedBooking],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    vi.spyOn(bookingService, 'fetchCancellationQuote').mockResolvedValue({
      bookingId: confirmedBooking.id,
      pnr: confirmedBooking.pnr,
      refundQuote: {
        hoursRemaining: 36,
        tier: 'TIER_1_STANDARD',
        feePercentage: 10,
        totalAmount: 1000,
        cancellationFee: 100,
        refundAmount: 900,
      },
    });

    const cancelSpy = vi.spyOn(bookingService, 'cancelBooking').mockResolvedValue({
      booking: { ...confirmedBooking, status: 'CANCELLED' },
      cancellation: { cancellationFee: 100, refundAmount: 900, refundStatus: 'PROCESSED' },
      releasedSeats: ['L1'],
    });

    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel Booking/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cancel Booking/i }));

    await waitFor(() => {
      expect(screen.getByText('Cancel Booking & Refund Request')).toBeTruthy();
      expect(screen.getByText(/36 hours before departure/i)).toBeTruthy();
      expect(screen.getByText('10% Fee Applied')).toBeTruthy();
      expect(screen.getByText('- ₹100')).toBeTruthy();
      expect(screen.getByText('₹900')).toBeTruthy();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation & Refund/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith('bkg-conf-1', {
        reason: 'Change of travel plans',
      });
      expect(screen.getByText(/Booking FLX-DEL-2026-1111 cancelled successfully/i)).toBeTruthy();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('renders clean empty state when user has no bookings', async () => {
    vi.spyOn(bookingService, 'fetchMyBookings').mockResolvedValue({
      bookings: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Bookings Found')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Browse Scheduled Buses/i })).toBeTruthy();
    });
  });
});

