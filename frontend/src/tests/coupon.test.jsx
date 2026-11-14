import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import CouponHeroCard from '../components/coupon/CouponHeroCard';
import * as couponService from '../services/coupon.service';

describe('CouponHeroCard Component Suite', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the featured coupon details and code', async () => {
    vi.spyOn(couponService, 'fetchActiveCoupons').mockResolvedValue([
      {
        id: 'c-1',
        code: 'HOPON9',
        description: 'Flat 15% off your festive travels',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        expiryDate: '2026-11-30T23:59:59.000Z',
      },
    ]);

    render(<CouponHeroCard />);

    await waitFor(() => {
      expect(screen.getByText(/Flat 15% off your festive travels/i)).toBeTruthy();
      expect(screen.getByText('HOPON9')).toBeTruthy();
    });
  });

  it('dismisses when close button is clicked and persists in sessionStorage', async () => {
    vi.spyOn(couponService, 'fetchActiveCoupons').mockResolvedValue([
      {
        id: 'c-1',
        code: 'HOPON9',
        description: 'Flat 15% off your festive travels',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        expiryDate: '2026-11-30T23:59:59.000Z',
      },
    ]);

    render(<CouponHeroCard />);

    await waitFor(() => {
      expect(screen.getByText('HOPON9')).toBeTruthy();
    });

    const hideButton = screen.getByRole('button', { name: /hide coupon offer/i });
    fireEvent.click(hideButton);

    expect(screen.queryByText('HOPON9')).toBeNull();
    expect(sessionStorage.getItem('gobus_hide_hero_coupon')).toBe('true');
  });

  it('does not display if previously dismissed in the same session', () => {
    sessionStorage.setItem('gobus_hide_hero_coupon', 'true');

    render(<CouponHeroCard />);

    expect(screen.queryByText(/Flat 15% off/i)).toBeNull();
    expect(screen.queryByText('HOPON9')).toBeNull();
  });
});
