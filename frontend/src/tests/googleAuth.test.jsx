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

describe('Google OAuth Single Sign-On Frontend Suite', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders "Continue with Google" button, shows account picker, and completes authentication', async () => {
    const googleSpy = vi.spyOn(authService, 'loginWithGoogle').mockResolvedValue({
      user: {
        id: 'u-google-1',
        name: 'Aman Ranjan',
        email: 'infineamanrj1710@gmail.com',
        role: 'PASSENGER',
      },
      token: 'jwt-google-mock-token-xyz',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Verify Continue with Google button appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeTruthy();
    });

    // Click Continue with Google to open account selector
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));

    // Select primary account
    await waitFor(() => {
      expect(screen.getByText('infineamanrj1710@gmail.com')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('infineamanrj1710@gmail.com'));

    // Verify service was called with Google credentials
    await waitFor(() => {
      expect(googleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'infineamanrj1710@gmail.com',
          name: 'Aman Ranjan',
        })
      );
      expect(localStorage.getItem('token')).toBe('jwt-google-mock-token-xyz');
      expect(screen.getByTestId('auth-status').textContent).toBe('Aman Ranjan');
    });
  });
});
