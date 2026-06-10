import React, { useCallback, useEffect, useState } from 'react';
import { adminDeleteOffer, adminListOffers, AdminOfferRow } from '../../api/auth';
import { extractErrorMessage } from '../../api/client';
import { Empty, formatMs, formatPrice, Pill, Spinner } from '../../components/Ui';

type StatusFilter = '' | 'active' | 'expired';

const PAGE_SIZE = 25;

export default function AdminOffers() {
  const [items, setItems] = useState<AdminOfferRow[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await adminListOffers({
        q: q.trim() || undefined,
        status: (status || undefined) as 'active' | 'expired' | undefined,
        limit: PAGE_SIZE,
        skip,
      });
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load offers'));
    } finally {
      setLoading(false);
    }
  }, [q, status, skip]);

  useEffect(() => { setSkip(0); }, [q, status]);
  useEffect(() => { load(); }, [load]);

  async function onForceDelete(o: AdminOfferRow) {
    const ok = window.confirm(
      `Force-delete offer "${o.title}" by ${o.merchant_email || o.merchant_name}?\n\n` +
      `This will:\n` +
      `• Cancel any active claims (consumers will see them disappear)\n` +
      `• Remove all bookmarks for this offer\n` +
      `• Delete the offer document\n\n` +
      `This action cannot be undone.`
    );
    if (!ok) return;
    setBusyId(o.id); setErr(null);
    try {
      await adminDeleteOffer(o.id);
      setItems((arr) => arr.filter((x) => x.id !== o.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not delete offer'));
    } finally {
      setBusyId(null);
    }
  }

  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingTo = Math.min(skip + items.length, total);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Offers</h1>
      <p className="text-ink-500 mb-5">Search and force-delete any offer. Active claims will be auto-cancelled.</p>

      <div className="bg-white rounded-2xl shadow-card p-3 mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or partner…"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
          <option value="">All statuses</option>
          <option value="active">Active only</option>
          <option value="expired">Expired only</option>
        </select>
      </div>

      {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Partner</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Expires</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8"><Spinner label="Loading offers…" /></td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7}><Empty title="No offers match your filters" /></td></tr>
              )}
              {!loading && items.map((o) => (
                <tr key={o.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-900 max-w-xs">
                    <div className="truncate">{o.title}</div>
                    {o.category && <div className="text-xs text-ink-500 mt-0.5">{o.category}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink-700 font-medium">{o.merchant_name || '—'}</div>
                    <div className="text-xs text-ink-500 break-all">{o.merchant_email || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {o.discounted_price != null && o.original_price != null ? (
                      <>
                        <span className="font-medium">{formatPrice(o.discounted_price)}</span>
                        <span className="text-ink-500 line-through ml-1 text-xs">{formatPrice(o.original_price)}</span>
                      </>
                    ) : (
                      <span>{formatPrice(o.original_price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {o.is_active
                      ? <Pill tone="green">Active</Pill>
                      : <Pill tone="gray">Expired</Pill>}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatMs(o.expiry_time_ms)}</td>
                  <td className="px-4 py-3 text-ink-500">{formatMs(o.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onForceDelete(o)}
                      disabled={busyId === o.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === o.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100 text-xs text-ink-500">
          <div>{loading ? 'Loading…' : `${total === 0 ? 0 : skip + 1}–${showingTo} of ${total}`}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              disabled={skip === 0 || loading}
              className="px-2 py-1 rounded border border-ink-300 hover:bg-ink-50 disabled:opacity-50"
            >Prev</button>
            <span>Page {page} / {pages}</span>
            <button
              onClick={() => setSkip(skip + PAGE_SIZE)}
              disabled={skip + PAGE_SIZE >= total || loading}
              className="px-2 py-1 rounded border border-ink-300 hover:bg-ink-50 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
