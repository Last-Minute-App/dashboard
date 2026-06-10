import React from 'react';

export default function PlaceholderPage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">{title}</h1>
      {subtitle && <p className="text-ink-500 mb-6">{subtitle}</p>}
      <div className="bg-white rounded-2xl shadow-card p-10 text-center text-ink-500">
        <div className="text-5xl mb-3">🚧</div>
        <div className="font-semibold text-ink-700">Coming up in the next phase</div>
        <div className="text-sm mt-1">This page will be built out next. The scaffold proves end-to-end auth and role-aware routing.</div>
      </div>
    </div>
  );
}
