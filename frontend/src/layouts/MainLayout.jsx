import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function MainLayout({ children, user, onOpenAuth, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-gray-900 bg-gray-50 selection:bg-[#73d200]/30">
      <Navbar user={user} onOpenAuth={onOpenAuth} onLogout={onLogout} />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
