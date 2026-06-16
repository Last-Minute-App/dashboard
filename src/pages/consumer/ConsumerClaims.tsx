import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { extractErrorMessage } from '../../api/client';
import { cancelClaim, Claim, listMyClaims } from '../../api/platform';
import { Empty, formatMs, Pill, Spinner } from '../../components/Ui';

export default function ConsumerClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listMyClaims();
      setClaims(data.sort((a, b) => (b.claimed_at ?? 0) - (a.claimed_at ?? 0)));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load claims'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onCancel(claim: Claim) {
    const ok = window.confirm(`Cancel claim for "${claim.offer_title}"?`);
    if (!ok) return;
    setBusyId(claim.id);
    setErr(null);
    try {
      const updated = await cancelClaim(claim.id);
      setClaims((arr) => arr.map((c) => (c.id === claim.id ? { ...c, ...updated } : c)));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not cancel claim'));
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = useMemo(() => claims.filter((c) => c.status === 'claimed').length, [claims]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">My claims</h1>
      <p className="text-ink-500 mb-5">{activeCount} active claim{activeCount === 1 ? '' : 's'}.</p>

      <div className="flex justify-end mb-3">
        <button onClick={load} disabled={loading} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50">
          Refresh
        </button>
      </div>

      {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      {loading && <Spinner label="Loading claims..." />}
      {!loading && claims.length === 0 && <Empty title="No claims yet" hint="Claim an offer from Browse offers and it will appear here." />}
      {!loading && claims.length > 0 && (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-ink-900">{claim.offer_title}</h2>
                    <StatusPill status={claim.status} />
                  </div>
                  <div className="text-sm text-ink-500 mt-1">{claim.merchant_name}</div>
                  <div className="text-xs text-ink-500 mt-2">Claimed {formatMs(claim.claimed_at)} - Expires {formatMs(claim.expiry_time)}</div>
                  {claim.verification_code && (
                    <div className="mt-3 inline-flex flex-col rounded-lg border border-ink-200 bg-ink-50 px-3 py-2">
                      <span className="text-xs text-ink-500">Verification code</span>
                      <span className="font-mono text-lg font-semibold text-ink-900">{claim.verification_code}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onCancel(claim)}
                  disabled={claim.status !== 'claimed' || busyId === claim.id}
                  className="px-3 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                >
                  {busyId === claim.id ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = status === 'claimed' ? 'blue' : status === 'completed' || status === 'redeemed' ? 'green' : status === 'cancelled' ? 'gray' : 'red';
  const label = status === 'claimed' ? 'Active' : status === 'completed' || status === 'redeemed' ? 'Redeemed' : status.split('_').join(' ');
  return <Pill tone={tone}>{label}</Pill>;
}
