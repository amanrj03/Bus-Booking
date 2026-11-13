import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SeatItem from '../components/seats/SeatItem';
import SeatMapDrawer from '../components/seats/SeatMapDrawer';
import * as tripService from '../services/trip.service';
import {
  groupDeckRows,
  calculateSelectedSubtotal,
  computeAvailabilitySummary,
} from '../utils/seatLayout';

const sample2x2Seats = [
  { tripSeatId: 'ts-1', seatNumber: '1A', deck: 1, row: 1, column: 1, seatType: 'WINDOW', price: 650, status: 'AVAILABLE', isAccessible: true },
  { tripSeatId: 'ts-2', seatNumber: '1B', deck: 1, row: 1, column: 2, seatType: 'AISLE', price: 600, status: 'LOCKED', isAccessible: true },
  { tripSeatId: 'ts-3', seatNumber: '1C', deck: 1, row: 1, column: 3, seatType: 'AISLE', price: 600, status: 'BOOKED', isAccessible: false },
  { tripSeatId: 'ts-4', seatNumber: '1D', deck: 1, row: 1, column: 4, seatType: 'WINDOW', price: 650, status: 'AVAILABLE', isAccessible: false },
];

const sampleSleeperSeats = [
  { tripSeatId: 'sl-1', seatNumber: 'L1A', deck: 1, row: 1, column: 1, seatType: 'SLEEPER', price: 950, status: 'AVAILABLE', isAccessible: true },
  { tripSeatId: 'sl-2', seatNumber: 'L1B', deck: 1, row: 1, column: 2, seatType: 'AISLE', price: 800, status: 'BOOKED', isAccessible: false },
  { tripSeatId: 'sl-3', seatNumber: 'L1C', deck: 1, row: 1, column: 3, seatType: 'WINDOW', price: 850, status: 'AVAILABLE', isAccessible: false },
  { tripSeatId: 'sl-4', seatNumber: 'U1A', deck: 2, row: 1, column: 1, seatType: 'SLEEPER', price: 950, status: 'AVAILABLE', isAccessible: false },
];

describe('Seat Layout Utilities & Availability Render Tests', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('seatLayout pure utilities', () => {
    it('groups 2x2 coach rows with columns 1-2 left and 3-4 right', () => {
      const rows = groupDeckRows(sample2x2Seats, 1, false);
      expect(rows).toHaveLength(1);
      expect(rows[0].leftSeats.map((s) => s.seatNumber)).toEqual(['1A', '1B']);
      expect(rows[0].rightSeats.map((s) => s.seatNumber)).toEqual(['1C', '1D']);
    });

    it('groups 2x1 sleeper decks with column 1 left and columns 2-3 right', () => {
      const lower = groupDeckRows(sampleSleeperSeats, 1, true);
      const upper = groupDeckRows(sampleSleeperSeats, 2, true);
      expect(lower[0].leftSeats.map((s) => s.seatNumber)).toEqual(['L1A']);
      expect(lower[0].rightSeats.map((s) => s.seatNumber)).toEqual(['L1B', 'L1C']);
      expect(upper[0].leftSeats.map((s) => s.seatNumber)).toEqual(['U1A']);
    });

    it('computes selected subtotal and availability status summary', () => {
      expect(calculateSelectedSubtotal(sample2x2Seats, ['1A', '1D'])).toBe(1300);
      expect(computeAvailabilitySummary(sample2x2Seats)).toEqual({
        total: 4,
        available: 2,
        locked: 1,
        booked: 1,
      });
    });
  });

  describe('SeatItem component states', () => {
    it('renders AVAILABLE seat with price and triggers onToggle', () => {
      const onToggle = vi.fn();
      render(<SeatItem seat={sample2x2Seats[0]} onToggle={onToggle} />);

      const btn = screen.getByRole('button', { name: /Seat 1A/i });
      expect(btn.disabled).toBe(false);
      expect(btn.textContent).toContain('1A');
      expect(btn.textContent).toContain('₹650');

      fireEvent.click(btn);
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('renders SELECTED state with GoBus lime styling and aria-pressed=true', () => {
      render(<SeatItem seat={sample2x2Seats[0]} isSelected onToggle={() => {}} />);

      const btn = screen.getByRole('button', { name: /Seat 1A, Selected/i });
      expect(btn.getAttribute('aria-pressed')).toBe('true');
      expect(btn.className).toContain('bg-[#73d200]');
    });

    it('disables BOOKED and LOCKED seats cleanly', () => {
      const onToggle = vi.fn();
      render(
        <div>
          <SeatItem seat={sample2x2Seats[1]} onToggle={onToggle} />
          <SeatItem seat={sample2x2Seats[2]} onToggle={onToggle} />
        </div>
      );

      const lockedBtn = screen.getByRole('button', { name: /Seat 1B, Held/i });
      const bookedBtn = screen.getByRole('button', { name: /Seat 1C, Booked/i });

      expect(lockedBtn.disabled).toBe(true);
      expect(lockedBtn.textContent).toContain('Hold');
      expect(bookedBtn.disabled).toBe(true);

      fireEvent.click(lockedBtn);
      fireEvent.click(bookedBtn);
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('SeatMapDrawer interaction & deck switching', () => {
    const mockTrip = {
      id: 'trip-1',
      departureTime: '2026-11-25T06:00:00.000Z',
      baseFare: 800,
      availableSeatsCount: 3,
      route: { sourceCity: 'Delhi', destinationCity: 'Manali' },
      bus: {
        busNumber: 'DL01SL2026',
        busType: 'AC_SLEEPER_2X1',
        deckCount: 2,
        operator: { companyName: 'Zingbus Express' },
      },
    };

    beforeEach(() => {
      vi.spyOn(tripService, 'fetchTripSeatMap').mockResolvedValue({
        trip: mockTrip,
        seats: sampleSleeperSeats,
        summary: computeAvailabilitySummary(sampleSleeperSeats),
      });
      vi.spyOn(tripService, 'lockTripSeats').mockResolvedValue({
        tripId: 'trip-1',
        lockedSeats: [{ tripSeatId: 'sl-1', seatNumber: 'L1A', price: 950 }],
        lockedUntil: '2026-11-25T06:10:00.000Z',
        totalSeatPrice: 950,
      });
    });

    it('renders steering wheel indicator, switches decks, and computes live subtotal on selection', async () => {
      render(
        <MemoryRouter>
          <SeatMapDrawer trip={mockTrip} isOpen onClose={() => {}} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Seat L1A/i })).toBeTruthy();
      });

      // Driver cabin steering wheel icon present
      expect(screen.getByText('☸')).toBeTruthy();

      // Switch to Upper Deck and verify U1A renders
      fireEvent.click(screen.getByRole('button', { name: /Upper Deck/i }));
      expect(screen.getByRole('button', { name: /Seat U1A/i })).toBeTruthy();

      // Switch back to Lower Deck and select L1A (₹950)
      fireEvent.click(screen.getByRole('button', { name: /Lower Deck/i }));
      fireEvent.click(screen.getByRole('button', { name: /Seat L1A/i }));

      const cta = screen.getByRole('button', { name: /Lock 1 Seat & Continue/i });
      expect(cta.disabled).toBe(false);
      expect(cta.textContent).toContain('₹950');
    });
  });
});
