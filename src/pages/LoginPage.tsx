import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const u = await login(email.trim().toLowerCase(), password);
      // Send each role to its home screen by default.
      const dest =
        (loc.state as any)?.from?.pathname ||
        (u.role === 'admin' ? '/admin' :
         u.role === 'merchant' ? '/partner' : '/');
      navigate(dest, { replace: true });
    } catch (e) {
      setErr(extractErrorMessage(e, 'Login failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 via-white to-ink-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand text-white text-2xl shadow-card mb-3">
            ⏱️
          </div>
          <h1 className="text-2xl font-bold text-ink-900">Last Minute Dashboard</h1>
          <p className="text-ink-500 mt-1">Sign in to manage offers, claims, and analytics</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required autoFocus autoComplete="email"
              className="w-full px-3 py-2.5 rounded-lg border border-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password"
              className="w-full px-3 py-2.5 rounded-lg border border-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {err && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="text-center text-sm text-ink-500">
            New here?{' '}
            <Link to="/signup" className="text-brand-600 font-medium hover:underline">
              Create an account
            </Link>
          </div>
        </form>

        <p className="text-center text-xs text-ink-500 mt-6">
          Consumers • Partners • Admins all log in here
        </p>
      </div>
    </div>
  );
}
