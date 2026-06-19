import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../api/auth';
import tiphopLogo from '../assets/tiphop_logo.png';

interface NavItem {
  label: string;
  to: string;
  icon: string;
}

const MENUS: Record<Role, NavItem[]> = {
  consumer: [
    { label: 'Browse offers', to: '/', icon: 'B' },
    { label: 'Map', to: '/map', icon: 'M' },
    { label: 'Saved offers', to: '/saved', icon: 'S' },
    { label: 'My claims', to: '/claims', icon: 'C' },
    { label: 'Profile', to: '/profile', icon: 'P' },
  ],
  merchant: [
    { label: 'Dashboard', to: '/partner', icon: 'D' },
    { label: 'Analytics', to: '/partner/analytics', icon: 'A' },
    { label: 'My offers', to: '/partner/offers', icon: 'O' },
    { label: 'Incoming claims', to: '/partner/claims', icon: 'C' },
    { label: 'QR verification', to: '/partner/scan', icon: 'Q' },
    { label: 'Profile', to: '/profile', icon: 'P' },
  ],
  admin: [
    { label: 'Overview', to: '/admin', icon: 'O' },
    { label: 'Users', to: '/admin/users', icon: 'U' },
    { label: 'Offers', to: '/admin/offers', icon: 'F' },
  ],
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const items = MENUS[user.role] || [];
  const roleLabel = user.role === 'merchant' ? 'Partner' : user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 md:min-h-screen bg-ink-900 text-white md:flex md:flex-col md:flex-shrink-0">
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-2">
          <img
            src={tiphopLogo}
            alt="tiphop"
            className="w-8 h-8 rounded-lg object-contain bg-white"
          />
          <div>
            <div className="font-bold text-sm leading-none">tiphop</div>
            <div className="text-xs text-white/60 mt-1">{roleLabel}</div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-x-auto md:overflow-x-visible flex md:flex-col">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/' || it.to === '/admin' || it.to === '/partner'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  isActive ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[11px] font-bold">{it.icon}</span>
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/10 hidden md:block">
          <div className="text-xs text-white/60 px-2 mb-2 truncate">{user.email}</div>
          <button
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
            className="w-full text-left text-sm px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-ink-100">
          <Link to="/" className="flex items-center gap-2 font-bold text-ink-900">
            <img src={tiphopLogo} alt="tiphop" className="w-7 h-7 rounded-lg object-contain" />
            tiphop
          </Link>
          <button
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
            className="text-sm text-brand-600 font-medium"
          >
            Sign out
          </button>
        </div>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
