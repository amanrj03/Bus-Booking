import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activePage, setActivePage] = useState('home'); // 'home' | 'search' | 'checkout'
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleSearchSubmit = () => {
    setActivePage('search');
  };

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setActivePage('checkout');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-gray-900 bg-white selection:bg-[#73d200]/30">
      {/* Shared Navigation Toolbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        openAuthModal={() => setIsAuthOpen(true)}
      />

      {/* Dynamic View Router */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage onSearch={handleSearchSubmit} />
        )}
        {activePage === 'search' && (
          <SearchResultsPage onSelectTrip={handleSelectTrip} />
        )}
        {activePage === 'checkout' && (
          <CheckoutPage selectedTrip={selectedTrip} onBack={() => setActivePage('search')} />
        )}
      </main>

      {/* Global Registration / Sign-In Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}