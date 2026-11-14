import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, fetchCurrentUser, loginWithGoogle as loginWithGoogleService } from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (credentials) => {
    const { user: loggedInUser, token } = await loginUser(credentials);
    localStorage.setItem('token', token);
    setUser(loggedInUser);
    setIsAuthModalOpen(false);
    return loggedInUser;
  };

  const register = async (payload) => {
    const { user: registeredUser, token } = await registerUser(payload);
    localStorage.setItem('token', token);
    setUser(registeredUser);
    setIsAuthModalOpen(false);
    return registeredUser;
  };

  const loginWithGoogle = async (googlePayload) => {
    const { user: googleUser, token } = await loginWithGoogleService(googlePayload);
    localStorage.setItem('token', token);
    setUser(googleUser);
    setIsAuthModalOpen(false);
    return googleUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAuthModalOpen,
    login,
    register,
    loginWithGoogle,
    logout,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
