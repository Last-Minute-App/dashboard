import React, { useEffect, useState } from 'react';
import { adminStats } from '../../api/auth';
import { extractErrorMessage } from '../../api/client';

export default function AdminHome() {
  const [data, setData] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const d = await adminStats();
        if (live) setData(d);
      } catch (e) {
        if (live) setErr(extractErrorMessage(e, 'Could not load stats'));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Platform overview</h1>
      <p className="text-ink-500 mb-6">Live counts straight from MongoDB Atlas.</p>

      {loading && <div className="text-ink-500">Loading…</div>}
      {err && <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

      {data && (
        <div className="space-y-6">
          <Section title="Users">
            <Stat label="Total"     value={data.users.total} />
            <Stat label="Consumers" value={data.users.consumers} />
            <Stat label="Partners"  value={data.users.partners} />
            <Stat label="Admins"    value={data.users.admins} />
            <Stat label="Banned"    value={data.users.banned} accent={data.users.banned > 0 ? 'red' : undefined} />
          </Section>
          <Section title="Offers">
            <Stat label="Total"   value={data.offers.total} />
            <Stat label="Active"  value={data.offers.active} accent="green" />
            <Stat label="Expired" value={data.offers.expired} />
          </Section>
          <Section title="Claims">
            <Stat label="Total"      value={data.claims.total} />
            <Stat label="Today"      value={data.claims.today} />
            <Stat label="This week"  value={data.claims.this_week} />
            <Stat label="This month" value={data.claims.this_month} />
            <Stat label="Redeemed"   value={data.claims.redeemed} accent="green" />
            <Stat label="Cancelled"  value={data.claims.cancelled} />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="font-semibold text-ink-900 mb-3">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">{children}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: 'green' | 'red' }) {
  const accentCls =
    accent === 'green' ? 'text-emerald-700' :
    accent === 'red'   ? 'text-red-700' :
    'text-ink-900';
  return (
    <div className="bg-ink-50 rounded-xl px-3 py-3">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`text-xl font-bold mt-0.5 ${accentCls}`}>{value}</div>
    </div>
  );
}
