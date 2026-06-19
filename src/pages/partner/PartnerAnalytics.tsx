import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { extractErrorMessage } from '../../api/client';
import { merchantAnalytics } from '../../api/platform';
import { formatPrice, Spinner } from '../../components/Ui';

type RangeKey = 'today' | 'week' | 'month' | 'year' | 'all';
type TrendMetric = 'claims' | 'redeems' | 'revenue';

const RANGES: RangeKey[] = ['today', 'week', 'month', 'year', 'all'];

interface AnalyticsKpis {
  offers_created?: number;
  offers_claimed?: number;
  offers_redeemed?: number;
  expired_offers?: number;
  cancelled_offers?: number;
  no_shows?: number;
  redemption_rate?: number;
  estimated_revenue?: number;
}

interface AnalyticsPayload {
  range?: RangeKey;
  from_ts?: number;
  to_ts?: number;
  is_current_period?: boolean;
  kpis?: AnalyticsKpis;
  trend?: { buckets?: Array<Record<string, number | string>> };
  top_offers?: Array<{
    id: string;
    title: string;
    claims?: number;
    redeems?: number;
    redemption_rate?: number;
  }>;
  insights?: Array<Record<string, unknown>>;
  total_offers?: number;
  active_offers?: number;
  total_claims?: number;
  completed_claims?: number;
  total_revenue?: number;
}

export default function PartnerAnalytics() {
  const [range, setRange] = useState<RangeKey>('week');
  const [metric, setMetric] = useState<TrendMetric>('claims');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const tzOffset = -new Date().getTimezoneOffset();
      setData(await merchantAnalytics({ range, tz_offset_minutes: tzOffset }) as AnalyticsPayload);
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load analytics'));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const kpis = data?.kpis;
  const chartData = useMemo(() => {
    const buckets = data?.trend?.buckets || [];
    return buckets.map((b, index) => ({
      label: String(b.label ?? index + 1),
      claims: Number(b.claims ?? 0),
      redeems: Number(b.redeems ?? 0),
      revenue: Number(b.revenue ?? 0),
    }));
  }, [data]);

  const cards = [
    ['Estimated revenue', kpis?.estimated_revenue != null ? formatPrice(kpis.estimated_revenue) : formatPrice(data?.total_revenue)],
    ['Offers created', kpis?.offers_created ?? data?.total_offers ?? 0],
    ['Offers claimed', kpis?.offers_claimed ?? data?.total_claims ?? 0],
    ['Offers redeemed', kpis?.offers_redeemed ?? data?.completed_claims ?? 0],
    ['Redemption rate', kpis?.redemption_rate != null ? `${kpis.redemption_rate}%` : '-'],
    ['No-shows', kpis?.no_shows ?? 0],
    ['Expired offers', kpis?.expired_offers ?? 0],
    ['Cancelled offers', kpis?.cancelled_offers ?? 0],
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Analytics</h1>
      <p className="text-ink-500 mb-5">Track offer creation, claims, redemptions, revenue, top offers, and demand patterns.</p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${range === r ? 'bg-brand text-white border-brand' : 'bg-white text-ink-700 border-ink-300 hover:bg-ink-50'}`}
            >
              {r === 'all' ? 'All time' : r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50">
          Refresh
        </button>
      </div>

      {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      {loading && <Spinner label="Loading analytics..." />}

      {!loading && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map(([label, value]) => (
              <div key={label} className="bg-white rounded-2xl shadow-card p-4">
                <div className="text-xs text-ink-500">{label}</div>
                <div className="text-xl font-bold text-ink-900 mt-1">{value}</div>
              </div>
            ))}
          </div>

          <section className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-semibold text-ink-900">Trend</h2>
              <div className="flex gap-2">
                {(['claims', 'redeems', 'revenue'] as TrendMetric[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${metric === m ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-300 hover:bg-ink-50'}`}
                  >
                    {m === 'redeems' ? 'Redeems' : m[0].toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {chartData.length === 0 ? (
              <p className="text-sm text-ink-500">No trend buckets returned for this range.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => metric === 'revenue' ? formatPrice(Number(value)) : value} />
                    <Bar dataKey={metric} fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-semibold text-ink-900 mb-3">Top offers</h2>
              {!data.top_offers?.length ? (
                <p className="text-sm text-ink-500">No top offers returned for this range.</p>
              ) : (
                <div className="space-y-3">
                  {data.top_offers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between gap-3 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="font-medium text-ink-900 truncate">{offer.title}</div>
                        <div className="text-xs text-ink-500">{offer.claims ?? 0} claims, {offer.redeems ?? 0} redeems</div>
                      </div>
                      <div className="text-sm font-semibold text-ink-900">{offer.redemption_rate ?? 0}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-semibold text-ink-900 mb-3">Insights</h2>
              {!data.insights?.length ? (
                <p className="text-sm text-ink-500">No insights returned for this range yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.insights.map((ins, i) => (
                    <div key={i} className="rounded-lg bg-brand-50 border border-brand-100 px-3 py-2 text-sm text-ink-800">
                      {formatInsight(ins)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function formatInsight(ins: Record<string, unknown>): string {
  if (ins.key === 'best_hour') {
    return `Best hour: ${String(ins.from_hour ?? '').padStart(2, '0')}:00-${String(ins.to_hour ?? '').padStart(2, '0')}:00`;
  }
  if (ins.key === 'best_dow') {
    return `Best day: ${String(ins.dow ?? 'n/a')} with ${String(ins.uplift_pct ?? 0)}% uplift`;
  }
  if (ins.key === 'top_category') {
    return `Top category: ${String(ins.category ?? 'n/a')} at ${String(ins.rate ?? 0)}% redemption`;
  }
  return String(ins.key ?? 'Insight');
}
