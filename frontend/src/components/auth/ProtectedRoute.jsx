import React from 'react';
import { LockClosedIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../ui';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, openAuthModal } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#73d200] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Card className="space-y-4 py-8">
          <div className="w-12 h-12 rounded-full bg-[#73d200]/20 text-gray-900 flex items-center justify-center mx-auto">
            <LockClosedIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Sign in Required</h2>
          <p className="text-xs text-gray-500">
            You must be signed in to access this section. Please log in with your account credentials.
          </p>
          <Button onClick={openAuthModal} fullWidth>
            Sign in / Register
          </Button>
        </Card>
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Card className="space-y-4 py-8 border-rose-200 bg-rose-50/30">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldExclamationIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Access Denied (403)</h2>
          <p className="text-xs text-gray-600">
            Your current role (<span className="font-bold">{user.role}</span>) does not have permission to view this portal. Required:{' '}
            <span className="font-bold">{allowedRoles.join(' or ')}</span>.
          </p>
        </Card>
      </div>
    );
  }

  return children;
}
