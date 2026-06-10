import React from 'react';
import { useAuth } from '../../auth/AuthContext';

export default function ConsumerHome() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-2">Welcome, {user?.name || 'there'}!</h1>
      <p className="text-ink-500 mb-6">Browse offers near you. Coming up in the next phase.</p>
      <div className="bg-white rounded-2xl shadow-card p-8 text-center text-ink-500">
        <div className="text-5xl mb-3">🎁</div>
        <div className="font-semibold text-ink-700">Offer browsing coming soon</div>
        <div className="text-sm mt-1">The next phase wires up the live offer list, filters, and claim flow.</div>
      </div>
    </div>
  );
}
