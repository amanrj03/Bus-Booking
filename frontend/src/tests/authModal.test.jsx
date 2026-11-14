import React, { useEffect } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import AuthModal from '../components/auth/AuthModal';
import * as authService from '../services/auth.service';
import { AuthProvider, useAuth } from '../context/AuthContext';

function TestConsumer() {
  const { openAuthModal, user } = useAuth();
  useEffect(() => {
    openAuthModal();
  }, [openAuthModal]);

  return (
    <div>
      <span data-testid="auth-status">{user ? user.name : 'Logged Out'}</span>
      <AuthModal />
    </div>
  );
}

describe('Authentication Modal Suite', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders streamlined email/password modal without Google login', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Ensure Google login is not present
    expect(screen.queryByText(/Continue with Google/i)).toBeNull();
    expect(screen.queryByText(/Select Google Account/i)).toBeNull();

    // Verify email and password fields exist
    expect(screen.getByLabelText(/Email Address/i)).toBeTruthy();
    expect(screen.getByLabelText(/Password/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Sign in$/i })).toBeTruthy();
  });

  it('populates demo credentials and logs in successfully', async () => {
    const loginSpy = vi.spyOn(authService, 'loginUser').mockResolvedValue({
      user: {
        id: 'u-demo-1',
        name: 'Demo Passenger',
        email: 'passenger@busbooking.local',
        role: 'PASSENGER',
      },
      token: 'jwt-passenger-token',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Click demo passenger account button
    const passengerDemoBtn = screen.getByRole('button', { name: /^Passenger$/i });
    fireEvent.click(passengerDemoBtn);

    const emailInput = screen.getByLabelText(/Email Address/i);
    expect(emailInput.value).toBe('passenger@busbooking.local');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'passenger@busbooking.local',
        password: 'Password123!',
      });
      expect(localStorage.getItem('token')).toBe('jwt-passenger-token');
      expect(screen.getByTestId('auth-status').textContent).toBe('Demo Passenger');
    });
  });

  it('toggles to registration mode with required fields', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Click toggle to register
    const registerToggle = screen.getByRole('button', { name: /Register here/i });
    fireEvent.click(registerToggle);

    expect(screen.getByRole('heading', { name: /Create Passenger Account/i })).toBeTruthy();
    expect(screen.getByLabelText(/Full Name/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeTruthy();
  });
});
