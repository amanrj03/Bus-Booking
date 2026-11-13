import React, { useState } from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, LockClosedIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Alert } from '../ui';

const DEMO_ACCOUNTS = [
  { label: 'Passenger', email: 'passenger@busbooking.local', password: 'Password123!' },
  { label: 'Operator', email: 'zingbus@busbooking.local', password: 'Password123!' },
  { label: 'Admin', email: 'admin@busbooking.local', password: 'Password123!' },
];

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setError('');
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
  };

  const handleToggleMode = () => {
    setIsRegister((prev) => !prev);
    setError('');
  };

  const handleFillDemo = (acc) => {
    setIsRegister(false);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({ name, email, password, phone });
      } else {
        await login({ email, password });
      }
      resetForm();
    } catch (err) {
      const validationMsg =
        err.errors && Array.isArray(err.errors)
          ? err.errors.map((eItem) => eItem.message).join('. ')
          : null;
      setError(validationMsg || err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={closeAuthModal}
    >
      {/* Background Image Container matching reference UI */}
      <div
        className="relative bg-white rounded-2xl overflow-hidden max-w-4xl w-full flex shadow-2xl min-h-[540px] bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80')`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        {/* Left Marketing Copy on Desktop */}
        <div className="hidden md:flex flex-col justify-end p-8 relative z-10 flex-1 text-white">
          <span className="inline-block bg-[#73d200] text-gray-900 font-black px-3 py-1 rounded text-xs uppercase tracking-wider w-fit mb-3">
            India Intercity Network
          </span>
          <h3 className="text-2xl font-black leading-tight mb-2">
            Travel across 35+ routes with instant e-tickets
          </h3>
          <p className="text-xs text-gray-200 max-w-xs">
            Manage reservations, download PDF boarding passes, or cancel seats with instant simulated refunds.
          </p>
        </div>

        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 z-20 bg-white/90 p-1.5 rounded-full hover:bg-white text-gray-800 shadow cursor-pointer"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Modal Card Overlay Right */}
        <div className="relative z-10 ml-auto w-full md:max-w-md bg-white p-7 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Header Brand */}
            <div className="flex justify-center mb-3">
              <span className="bg-[#73d200] text-gray-900 font-black px-4 py-1 rounded text-xl tracking-tighter italic">
                GoBus
              </span>
            </div>

            <h2 className="text-xl font-black text-center text-gray-900 mb-3">
              {isRegister ? 'Create Passenger Account' : 'Sign in to Continue'}
            </h2>

            {/* Benefits Checklist */}
            <ul className="space-y-1.5 mb-5 text-xs text-gray-600 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-[#73d200] shrink-0" />
                <span>Full control over your bookings anytime</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-[#73d200] shrink-0" />
                <span>Instant PNR e-tickets &amp; quick seat maps</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-[#73d200] shrink-0" />
                <span>Transparent cancellations &amp; refund tracking</span>
              </li>
            </ul>

            {error && (
              <Alert variant="error" className="mb-4 py-2.5">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <Input
                  label="Full Name"
                  icon={UserIcon}
                  type="text"
                  placeholder="Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}

              <Input
                label="Email Address"
                icon={EnvelopeIcon}
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {isRegister && (
                <Input
                  label="Mobile Number (Optional)"
                  icon={PhoneIcon}
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}

              <Input
                label="Password"
                icon={LockClosedIcon}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-2">
                {isRegister ? 'Create Account' : 'Sign in'}
              </Button>
            </form>

            {/* Quick Demo Account Pills (Login Mode) */}
            {!isRegister && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 text-center">
                  Quick Demo Login (Password123!)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.label}
                      type="button"
                      onClick={() => handleFillDemo(acc)}
                      className="text-[11px] font-bold py-1.5 px-2 rounded-lg bg-gray-100 hover:bg-[#73d200]/20 text-gray-800 transition-colors cursor-pointer"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Switch Mode */}
          <div className="text-center pt-4 mt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button
              type="button"
              onClick={handleToggleMode}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 hover:underline cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{isRegister ? 'Sign in here' : 'Register here'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
