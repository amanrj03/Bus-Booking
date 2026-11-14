import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Card } from './components/ui';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import CheckoutPage from './pages/CheckoutPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import PassengerManifestPage from './pages/PassengerManifestPage';
import AuditLogsPage from './pages/AuditLogsPage';

function AppShell() {
  const { user, openAuthModal, logout } = useAuth();

  return (
    <MainLayout user={user} onOpenAuth={openAuthModal} onLogout={logout}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/booking/confirmation/:pnr" element={<BookingConfirmationPage />} />
        <Route path="/ticket/:pnr" element={<BookingConfirmationPage />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manifest"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
              <PassengerManifestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <AuthModal />
    </MainLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
