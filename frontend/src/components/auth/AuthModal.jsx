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
  const { isAuthModalOpen, closeAuthModal, login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showGooglePicker, setShowGooglePicker] = useState(false);

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
    setShowGooglePicker(false);
  };

  const handleToggleMode = () => {
    setIsRegister((prev) => !prev);
    setError('');
    setShowGooglePicker(false);
  };

  const handleFillDemo = (acc) => {
    setIsRegister(false);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setShowGooglePicker(false);
  };

  const handleGoogleSignIn = async (selectedProfile) => {
    setError('');
    setSubmitting(true);
    try {
      const googleProfile = selectedProfile || {
        email: email.trim() && email.includes('@') ? email.trim().toLowerCase() : 'infineamanrj1710@gmail.com',
        name: name.trim() || 'Aman Ranjan',
        picture: 'https://lh3.googleusercontent.com/a/default-user',
        sub: `google-${Date.now()}`,
      };

      await loginWithGoogle(googleProfile);
      resetForm();
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

            {/* Google OAuth Single Sign-On Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowGooglePicker((prev) => !prev)}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-gray-300 shadow-xs transition-all hover:border-gray-400 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Quick Google Account Selector Popup */}
              {showGooglePicker && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    Select Google Account
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleGoogleSignIn({
                        email: 'infineamanrj1710@gmail.com',
                        name: 'Aman Ranjan',
                        picture: 'https://lh3.googleusercontent.com/a/default-user',
                      })
                    }
                    className="w-full text-left p-2 rounded-lg bg-white hover:bg-[#73d200]/15 border border-gray-200 hover:border-[#73d200] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-900">Aman Ranjan</div>
                      <div className="text-[11px] text-gray-500">infineamanrj1710@gmail.com</div>
                    </div>
                    <span className="text-[10px] font-bold text-[#65b800] bg-[#73d200]/20 px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleGoogleSignIn({
                        email: 'rider.google@gmail.com',
                        name: 'Google Passenger',
                        picture: 'https://lh3.googleusercontent.com/a/default-user',
                      })
                    }
                    className="w-full text-left p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-900">Google Passenger</div>
                      <div className="text-[11px] text-gray-500">rider.google@gmail.com</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Separator */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-2 text-gray-400 font-bold">or continue with email</span>
                </div>
              </div>
            </div>

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
