import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PassengerManifestPage from '../pages/PassengerManifestPage';
import AuditLogsPage from '../pages/AuditLogsPage';
import * as reportService from '../services/report.service';

const sampleManifestData = {
  trip: {
    id: 'trip-test-101',
    departureTime: '2026-11-15T21:00:00.000Z',
    arrivalTime: '2026-11-16T04:00:00.000Z',
    status: 'SCHEDULED',
    baseFare: 650,
    route: { sourceCity: 'Delhi', destinationCity: 'Jaipur' },
    bus: {
      busNumber: 'DL-01-AB-1234',
      busType: 'AC_SLEEPER_2X1',
      totalSeats: 30,
      operator: { companyName: 'Zingbus Express' },
    },
  },
  metrics: {
    totalSeats: 30,
    bookedSeatsCount: 2,
    lockedSeatsCount: 0,
    availableSeatsCount: 28,
    occupancyRate: 6.7,
    confirmedPassengersCount: 2,
    confirmedRevenue: 1300,
  },
  manifest: [
    {
      seatNumber: 'L1',
      passengerName: 'Amitabh Sharma',
      age: 34,
      gender: 'MALE',
      pnr: 'FLX-DEL-1001',
      contactPhone: '+91 9876543210',
      contactEmail: 'amitabh@example.com',
      seatPrice: 650,
      bookingStatus: 'CONFIRMED',
    },
    {
      seatNumber: 'L2',
      passengerName: 'Deepika Sharma',
      age: 31,
      gender: 'FEMALE',
      pnr: 'FLX-DEL-1001',
      contactPhone: '+91 9876543210',
      contactEmail: 'amitabh@example.com',
      seatPrice: 650,
      bookingStatus: 'CONFIRMED',
    },
  ],
};

const sampleAuditLogs = {
  logs: [
    {
      id: 'log-1',
      action: 'BOOKING_CREATED',
      entity: 'Booking',
      entityId: 'bkg-uuid-1',
      createdAt: '2026-11-12T10:00:00.000Z',
      ipAddress: '127.0.0.1',
      user: { name: 'Aman Sharma', email: 'passenger@bus.local', role: 'PASSENGER' },
      details: { pnr: 'FLX-DEL-1001', seatNumbers: ['L1', 'L2'], totalAmount: 1300 },
    },
    {
      id: 'log-2',
      action: 'BOOKING_CANCELLED',
      entity: 'Booking',
      entityId: 'bkg-uuid-2',
      createdAt: '2026-11-12T11:00:00.000Z',
      ipAddress: '127.0.0.1',
      user: { name: 'Aman Sharma', email: 'passenger@bus.local', role: 'PASSENGER' },
      details: { pnr: 'FLX-MUM-2002', cancellationFee: 130, refundAmount: 1170 },
    },
  ],
  pagination: { page: 1, limit: 25, total: 2, totalPages: 1 },
};

describe('Passenger Manifest & Audit Log Viewer Suite', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('PassengerManifestPage Component', () => {
    it('renders passenger roster, seat numbers, and triggers print', async () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      vi.spyOn(reportService, 'fetchOccupancyReport').mockResolvedValue({
        trips: [
          {
            tripId: 'trip-test-101',
            routeLabel: 'Delhi → Jaipur',
            busNumber: 'DL-01-AB-1234',
            departureTime: '2026-11-15T21:00:00.000Z',
            occupancyRate: 6.7,
          },
        ],
      });
      vi.spyOn(reportService, 'fetchPassengerManifest').mockResolvedValue(sampleManifestData);

      render(
        <MemoryRouter initialEntries={['/admin/manifest?tripId=trip-test-101']}>
          <PassengerManifestPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Passenger Manifest & Boarding Roster/i)).toBeTruthy();
        expect(screen.getByText('Amitabh Sharma')).toBeTruthy();
        expect(screen.getByText('Deepika Sharma')).toBeTruthy();
        expect(screen.getByText('L1')).toBeTruthy();
        expect(screen.getByText('L2')).toBeTruthy();
      });

      // Verify on-board toggle check
      const checkboxes = screen.getAllByRole('checkbox');
      const firstPaxCheck = checkboxes[1]; // First is "Include Cancelled"
      expect(firstPaxCheck.checked).toBe(false);
      fireEvent.click(firstPaxCheck);
      expect(firstPaxCheck.checked).toBe(true);

      // Verify Print Manifest action
      const printBtn = screen.getByRole('button', { name: /Print Manifest/i });
      fireEvent.click(printBtn);
      expect(printSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('AuditLogsPage Component', () => {
    it('renders audit events, badges, and toggles inspection details', async () => {
      vi.spyOn(reportService, 'fetchAuditLogs').mockResolvedValue(sampleAuditLogs);

      render(
        <MemoryRouter>
          <AuditLogsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Security & Activity Audit Logs/i)).toBeTruthy();
        expect(screen.getByText('BOOKING_CREATED')).toBeTruthy();
        expect(screen.getByText('BOOKING_CANCELLED')).toBeTruthy();
      });

      // Inspect details toggle
      const inspectButtons = screen.getAllByRole('button', { name: /Inspect/i });
      fireEvent.click(inspectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/FLX-DEL-1001/i)).toBeTruthy();
      });
    });

    it('filters audit logs when action dropdown changes', async () => {
      const fetchSpy = vi.spyOn(reportService, 'fetchAuditLogs').mockResolvedValue(sampleAuditLogs);

      render(
        <MemoryRouter>
          <AuditLogsPage />
        </MemoryRouter>
      );

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

      const actionSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(actionSelect, { target: { value: 'BOOKING_CANCELLED' } });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith({
          page: 1,
          limit: 25,
          action: 'BOOKING_CANCELLED',
        });
      });
    });
  });
});
