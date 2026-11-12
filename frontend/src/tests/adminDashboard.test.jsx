import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import * as reportService from '../services/report.service';
import * as AuthContext from '../context/AuthContext';

// Mock recharts responsive container for jsdom testing
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  };
});

const mockRevenueData = {
  kpis: {
    grossBookingsCount: 650,
    confirmedBookingsCount: 575,
    cancelledBookingsCount: 75,
    totalPassengers: 1240,
    grossRevenue: 745000,
    confirmedRevenue: 670000,
    totalRefunded: 75000,
    retainedCancellationFees: 12500,
    netRevenue: 682500,
    activeFleetCount: 45,
  },
  dailyTrend: [
    { date: '2026-11-10', netRevenue: 150000, bookingsCount: 120 },
    { date: '2026-11-11', netRevenue: 195000, bookingsCount: 140 },
    { date: '2026-11-12', netRevenue: 235000, bookingsCount: 165 },
  ],
  byRoute: [
    { routeLabel: 'Delhi → Jaipur', revenue: 280000, bookingsCount: 220 },
    { routeLabel: 'Mumbai → Pune', revenue: 210000, bookingsCount: 175 },
  ],
  byOperator: [
    { operatorName: 'Zingbus Express', revenue: 320000, sharePercentage: 46.9 },
    { operatorName: 'IntrCity SmartBus', revenue: 235000, sharePercentage: 34.4 },
  ],
};

const mockOccupancyData = {
  summary: {
    totalTrips: 18,
    totalCapacity: 720,
    totalBookedSeats: 612,
    averageOccupancyRate: 85.0,
  },
  byRoute: [
    { routeLabel: 'Delhi → Jaipur', occupancyRate: 94.2, bookedSeats: 378, totalCapacity: 400 },
    { routeLabel: 'Mumbai → Pune', occupancyRate: 88.5, bookedSeats: 354, totalCapacity: 400 },
  ],
  trips: [],
};

describe('AdminDashboardPage Management & Analytics Suite', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders executive dashboard with live KPI metrics and Recharts visualizations', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { name: 'Admin Officer', email: 'admin@busbooking.local', role: 'ADMIN' },
    });

    vi.spyOn(reportService, 'fetchRevenueReport').mockResolvedValue(mockRevenueData);
    vi.spyOn(reportService, 'fetchOccupancyReport').mockResolvedValue(mockOccupancyData);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Executive Operations Dashboard')).toBeTruthy();
      expect(screen.getByText('ADMIN')).toBeTruthy();
    });

    // Check KPI cards
    expect(screen.getByText('₹6,82,500')).toBeTruthy();
    expect(screen.getByText('650')).toBeTruthy();
    expect(screen.getByText(/575 Confirmed/)).toBeTruthy();
    expect(screen.getByText(/75 Cancelled/)).toBeTruthy();
    expect(screen.getByText('1,240')).toBeTruthy();
    expect(screen.getByText(/85%/)).toBeTruthy();
    expect(screen.getByText(/45 Coaches/)).toBeTruthy();

    // Visualizations headers
    expect(screen.getByText(/Revenue & Booking Volume Trend/i)).toBeTruthy();
    expect(screen.getByText(/Carrier Market Share/i)).toBeTruthy();
    expect(screen.getByText(/Route Seat Occupancy \(%\)/i)).toBeTruthy();
  });

  it('triggers reload when Refresh button is clicked', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { name: 'Operator User', role: 'OPERATOR' },
    });

    const revSpy = vi.spyOn(reportService, 'fetchRevenueReport').mockResolvedValue(mockRevenueData);
    const occSpy = vi.spyOn(reportService, 'fetchOccupancyReport').mockResolvedValue(mockOccupancyData);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(revSpy).toHaveBeenCalledTimes(1);
      expect(occSpy).toHaveBeenCalledTimes(1);
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(revSpy).toHaveBeenCalledTimes(2);
      expect(occSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('falls back gracefully to seed baseline dataset when API returns empty metrics', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { name: 'Admin Officer', role: 'ADMIN' },
    });

    vi.spyOn(reportService, 'fetchRevenueReport').mockResolvedValue({
      kpis: {},
      dailyTrend: [],
      byRoute: [],
      byOperator: [],
    });
    vi.spyOn(reportService, 'fetchOccupancyReport').mockResolvedValue({
      summary: {},
      byRoute: [],
      trips: [],
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Executive Operations Dashboard')).toBeTruthy();
      // Verifies fallback numbers render cleanly
      expect(screen.getByText('₹6,70,000')).toBeTruthy();
      expect(screen.getByText('650')).toBeTruthy();
    });
  });
});
