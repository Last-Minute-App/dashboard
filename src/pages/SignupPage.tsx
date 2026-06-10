import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../api/client';

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'consumer' | 'merchant'>('consumer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const u = await register({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        role,
        business_category: role === 'merchant' ? (businessCategory.trim() || undefined) : undefined,
      });
      navigate(u.role === 'merchant' ? '/partner' : '/', { replace: true });
    } catch (e) {
      setErr(extractErrorMessage(e, 'Signup failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-brand-50 via-white to-ink-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-ink-900">Create your account</h1>
          <p className="text-ink-500 mt-1">Join as a consumer or a partner</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['consumer', 'merchant'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-3 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                  role === r
                    ? 'border-brand bg-brand-50 text-brand-700'
                    : 'border-ink-300 text-ink-700 hover:border-ink-500'
                }`}
              >
                {r === 'consumer' ? 'I’m a Customer' : 'I’m a Partner'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg border border-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
              className="w-full px-3 py-2.5 rounded-lg border border-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Password</label>
            <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
              className="w-full px-3 py-2.5 rounded-lg border border-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition" />
          </div>
          {role === 'merchant' && (
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Business category</label>
              <input value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)}
                placeholder="Food, Beauty & Personal Care, …"
                className="w-full px-3 py-2.5 rounded-lg border border-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition" />
              <p className="text-xs text-ink-500 mt-1">Required for partners. Full onboarding (address, hours, etc.) can be added later from the partner profile.</p>
            </div>
          )}

          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

          <button type="submit" disabled={busy}
            className="w-full bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition">
            {busy ? 'Creating…' : 'Create account'}
          </button>

          <div className="text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
