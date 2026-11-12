import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Card } from './components/ui';
import HomePage from './pages/HomePage';

function PlaceholderView({ title }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <Card>
        <h2 className="text-xl font-black text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500">
          This module will be connected to live PostgreSQL APIs in upcoming commits.
        </p>
      </Card>
    </div>
  );
}

function AppShell() {
  const { user, openAuthModal, logout } = useAuth();

  return (
    <MainLayout user={user} onOpenAuth={openAuthModal} onLogout={logout}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<PlaceholderView title="Search Results & Filters" />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <PlaceholderView title="Manage My Bookings & E-Tickets" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
              <PlaceholderView title="Admin & Operator Management Portal" />
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
