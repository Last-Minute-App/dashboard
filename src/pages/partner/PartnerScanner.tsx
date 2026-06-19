import React, { FormEvent, useState } from 'react';
import { extractErrorMessage } from '../../api/client';
import { redeemClaim, scanClaimToken, ScanPreview } from '../../api/platform';
import { formatMs, Pill } from '../../components/Ui';

export default function PartnerScanner() {
  const [token, setToken] = useState('');
  const [preview, setPreview] = useState<ScanPreview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState<'scan' | 'redeem' | null>(null);

  async function onScan(e: FormEvent) {
    e.preventDefault();
    setBusy('scan');
    setErr(null);
    setOk(null);
    setPreview(null);
    try {
      const data = await scanClaimToken(extractToken(token));
      setPreview(data);
    } catch (error) {
      setErr(extractErrorMessage(error, 'Could not validate this QR token'));
    } finally {
      setBusy(null);
    }
  }

  async function onRedeem() {
    if (!preview?.redeemable) return;
    setBusy('redeem');
    setErr(null);
    setOk(null);
    try {
      await redeemClaim(preview.claim_id, preview.verification_code || undefined);
      setOk('Claim redeemed.');
      setPreview({ ...preview, status: 'completed', redeemable: false, redeemed_at: Date.now() });
      setToken('');
    } catch (error) {
      setErr(extractErrorMessage(error, 'Could not redeem claim'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">QR verification</h1>
      <p className="text-ink-500 mb-5">Validate a customer QR token and redeem through the same backend flow as the mobile scanner.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <form onSubmit={onScan} className="bg-white rounded-2xl shadow-card p-5 space-y-4">
          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
          {ok && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{ok}</div>}

          <label className="block">
            <span className="text-xs font-medium text-ink-500">QR token or scanned URL</span>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm min-h-32 font-mono"
              placeholder="Paste the QR payload here"
            />
          </label>

          <div className="flex justify-end">
            <button
              disabled={busy === 'scan' || !token.trim()}
              className="px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 disabled:opacity-50"
            >
              {busy === 'scan' ? 'Checking...' : 'Validate QR'}
            </button>
          </div>
        </form>

        <aside className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-semibold text-ink-900">Scan result</h2>
          {!preview ? (
            <p className="text-sm text-ink-500 mt-2">A validated QR token will show the offer, customer, status, and redeem action here.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Pill tone={preview.redeemable ? 'green' : preview.status === 'completed' || preview.redeemed_at ? 'green' : 'red'}>
                  {preview.redeemable ? 'Ready to redeem' : preview.block_reason || preview.status}
                </Pill>
              </div>
              <div>
                <div className="text-xs text-ink-500">Offer</div>
                <div className="font-semibold text-ink-900">{preview.offer_title}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Customer</div>
                <div className="text-sm text-ink-800">{preview.customer_name_masked}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Info label="Claim" value={preview.claim_id.slice(0, 8)} />
                <Info label="Expires" value={formatMs(preview.expiry_time)} />
              </div>
              {preview.verification_code && (
                <div className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2">
                  <div className="text-xs text-ink-500">Verification code</div>
                  <div className="font-mono text-lg font-semibold text-ink-900">{preview.verification_code}</div>
                </div>
              )}
              <button
                onClick={onRedeem}
                disabled={!preview.redeemable || busy === 'redeem'}
                className="w-full px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
              >
                {busy === 'redeem' ? 'Redeeming...' : 'Confirm redemption'}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-ink-50 rounded-lg px-3 py-2">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="font-medium text-ink-800">{value}</div>
    </div>
  );
}

function extractToken(value: string): string {
  const raw = value.trim();
  try {
    const url = new URL(raw);
    return url.searchParams.get('token') || url.hash.replace(/^#/, '') || raw;
  } catch {
    return raw;
  }
}
