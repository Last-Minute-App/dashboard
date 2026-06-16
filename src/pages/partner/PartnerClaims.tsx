import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { extractErrorMessage } from '../../api/client';
import { listMerchantClaims, MerchantClaim, redeemClaim } from '../../api/platform';
import { Empty, formatMs, Pill, Spinner } from '../../components/Ui';

export default function PartnerClaims() {
  const [claims, setClaims] = useState<MerchantClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [redeemTarget, setRedeemTarget] = useState<MerchantClaim | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listMerchantClaims();
      setClaims(data.sort((a, b) => (b.claimed_at ?? 0) - (a.claimed_at ?? 0)));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load incoming claims'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = useMemo(() => claims.filter((c) => c.status === 'claimed').length, [claims]);

  async function onRedeem(e: FormEvent) {
    e.preventDefault();
    if (!redeemTarget) return;
    setBusyId(redeemTarget.id);
    setErr(null);
    try {
      const updated = await redeemClaim(redeemTarget.id, verificationCode.trim() || undefined);
      setClaims((arr) => arr.map((c) => (c.id === redeemTarget.id ? { ...c, ...updated } : c)));
      setRedeemTarget(null);
      setVerificationCode('');
    } catch (error) {
      setErr(extractErrorMessage(error, 'Could not redeem claim'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Incoming claims</h1>
      <p className="text-ink-500 mb-5">{activeCount} claim{activeCount === 1 ? '' : 's'} awaiting redemption.</p>

      <div className="flex justify-end mb-3">
        <button onClick={load} disabled={loading} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50">
          Refresh
        </button>
      </div>

      {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      {loading && <Spinner label="Loading claims..." />}
      {!loading && claims.length === 0 && <Empty title="No incoming claims" hint="Customer claims will appear here as soon as offers are claimed." />}
      {!loading && claims.length > 0 && (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-ink-900">{claim.offer_title}</h2>
                    <StatusPill status={claim.status} />
                  </div>
                  <div className="text-sm text-ink-500 mt-1">{claim.user_name} - {claim.user_email}</div>
                  <div className="text-xs text-ink-500 mt-2">Claimed {formatMs(claim.claimed_at)} - Expires {formatMs(claim.expiry_time)}</div>
                  {claim.verification_code && (
                    <div className="text-xs text-ink-500 mt-2">Expected code: <span className="font-mono text-ink-900">{claim.verification_code}</span></div>
                  )}
                </div>
                <button
                  onClick={() => { setRedeemTarget(claim); setVerificationCode(''); }}
                  disabled={claim.status !== 'claimed' || busyId === claim.id}
                  className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
                >
                  {busyId === claim.id ? 'Redeeming...' : 'Redeem'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {redeemTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={onRedeem} className="bg-white rounded-2xl shadow-card p-5 w-full max-w-md">
            <h2 className="font-semibold text-ink-900">Redeem claim</h2>
            <p className="text-sm text-ink-500 mt-1">{redeemTarget.offer_title} for {redeemTarget.user_name}</p>
            <label className="block mt-4">
              <span className="text-xs font-medium text-ink-500">Verification code</span>
              <input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder={redeemTarget.verification_code || 'Optional for legacy claims'}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm font-mono"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setRedeemTarget(null)} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50">Cancel</button>
              <button disabled={busyId === redeemTarget.id} className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50">
                Confirm redemption
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = status === 'claimed' ? 'blue' : status === 'completed' || status === 'redeemed' ? 'green' : status === 'cancelled' ? 'gray' : 'red';
  const label = status === 'claimed' ? 'Awaiting redemption' : status === 'completed' || status === 'redeemed' ? 'Redeemed' : status.split('_').join(' ');
  return <Pill tone={tone}>{label}</Pill>;
}
