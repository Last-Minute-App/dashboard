import React from 'react';
import { useAuth } from '../../auth/AuthContext';

export default function PartnerHome() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-2">Partner Dashboard</h1>
      <p className="text-ink-500 mb-6">Hello, {user?.name || 'partner'}. Your offers, claims, and analytics will live here.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="My offers"       icon="🏷️" subtitle="Create, edit, and manage your live offers." />
        <Card title="Incoming claims" icon="📥" subtitle="See and redeem customer claims as they arrive." />
        <Card title="Analytics"       icon="📊" subtitle="Claims-per-day, revenue trends, top offers." />
      </div>
    </div>
  );
}

function Card({ title, icon, subtitle }: { title: string; icon: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold text-ink-900">{title}</div>
      <div className="text-sm text-ink-500 mt-1">{subtitle}</div>
      <div className="text-xs text-brand-600 font-medium mt-3">Coming in the next phase</div>
    </div>
  );
}
