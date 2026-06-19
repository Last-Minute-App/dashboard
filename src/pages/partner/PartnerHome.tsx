import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { extractErrorMessage } from '../../api/client';
import { listMerchantClaims, listMerchantOffers, merchantAnalytics, MerchantAnalytics } from '../../api/platform';
import { useAuth } from '../../auth/AuthContext';
import { Spinner } from '../../components/Ui';

export default function PartnerHome() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [offerCount, setOfferCount] = useState(0);
  const [activeClaims, setActiveClaims] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [a, offers, claims] = await Promise.all([
          merchantAnalytics().catch(() => null),
          listMerchantOffers(),
          listMerchantClaims(),
        ]);
        if (!live) return;
        setAnalytics(a);
        setOfferCount(offers.length);
        setActiveClaims(claims.filter((c) => c.status === 'claimed').length);
      } catch (e) {
        if (live) setErr(extractErrorMessage(e, 'Could not load partner dashboard'));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const stats = useMemo(() => [
    ['Total offers', analytics?.total_offers ?? offerCount],
    ['Active offers', analytics?.active_offers ?? 'View offers'],
    ['Active claims', activeClaims],
    ['Redeemed claims', analytics?.completed_claims ?? analytics?.total_claims ?? 'View claims'],
  ], [activeClaims, analytics, offerCount]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-2">Partner dashboard</h1>
      <p className="text-ink-500 mb-6">Hello, {user?.name || 'partner'}. Manage the same offers and claims used by the mobile app.</p>

      {loading && <Spinner label="Loading dashboard..." />}
      {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

      {!loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(([label, value]) => (
              <div key={String(label)} className="bg-white rounded-2xl shadow-card p-4">
                <div className="text-xs text-ink-500">{label}</div>
                <div className="text-xl font-bold text-ink-900 mt-1">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard title="Analytics" text="Review KPIs, trend buckets, top offers, revenue, and insights." to="/partner/analytics" />
            <ActionCard title="My offers" text="Create, edit, schedule, recur, cancel remaining stock, or delete offers." to="/partner/offers" />
            <ActionCard title="Incoming claims" text="Review customer claims and redeem them with verification codes." to="/partner/claims" />
            <ActionCard title="QR verification" text="Validate a customer QR token and confirm redemption." to="/partner/scan" />
            <ActionCard title="Business profile" text="Keep business category, address, phone, tax, and bank details current." to="/profile" />
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ title, text, to }: { title: string; text: string; to: string }) {
  return (
    <Link to={to} className="bg-white rounded-2xl shadow-card p-5 block hover:ring-2 hover:ring-brand/30 transition">
      <div className="font-semibold text-ink-900">{title}</div>
      <div className="text-sm text-ink-500 mt-1">{text}</div>
      <div className="text-sm text-brand-600 font-semibold mt-4">Open</div>
    </Link>
  );
}
