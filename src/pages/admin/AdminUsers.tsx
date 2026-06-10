import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBanUser, adminListUsers, adminUnbanUser, Role } from '../../api/auth';
import { extractErrorMessage } from '../../api/client';
import { Empty, formatMs, Pill, Spinner } from '../../components/Ui';

type RoleFilter = '' | Role;
type BannedFilter = '' | 'true' | 'false';

const PAGE_SIZE = 25;

export default function AdminUsers() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<RoleFilter>('');
  const [banned, setBanned] = useState<BannedFilter>('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await adminListUsers({
        q: q.trim() || undefined,
        role: role || undefined,
        banned: banned === '' ? undefined : banned === 'true',
        limit: PAGE_SIZE,
        skip,
      });
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [q, role, banned, skip]);

  // Reset to page 1 whenever filters change.
  useEffect(() => { setSkip(0); }, [q, role, banned]);
  useEffect(() => { load(); }, [load]);

  async function toggleBan(u: any) {
    const action = u.banned ? 'unban' : 'ban';
    const confirmMsg = u.banned
      ? `Unban ${u.email}? They will be able to log in again.`
      : `Ban ${u.email}? Their existing session will be invalidated immediately and they won't be able to log back in.`;
    if (!window.confirm(confirmMsg)) return;
    setBusyId(u.id); setErr(null);
    try {
      if (u.banned) await adminUnbanUser(u.id);
      else          await adminBanUser(u.id, 'Banned from admin dashboard');
      // Optimistic local update so the row's pill flips instantly.
      setItems((arr) => arr.map((x) => x.id === u.id ? { ...x, banned: !u.banned } : x));
    } catch (e) {
      setErr(extractErrorMessage(e, `Could not ${action} user`));
    } finally {
      setBusyId(null);
    }
  }

  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingTo = Math.min(skip + items.length, total);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Users</h1>
      <p className="text-ink-500 mb-5">Search, filter, and ban or unban any user.</p>

      <div className="bg-white rounded-2xl shadow-card p-3 mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or name…"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition text-sm"
        />
        <select value={role} onChange={(e) => setRole(e.target.value as RoleFilter)}
          className="px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
          <option value="">All roles</option>
          <option value="consumer">Consumer</option>
          <option value="merchant">Partner</option>
          <option value="admin">Admin</option>
        </select>
        <select value={banned} onChange={(e) => setBanned(e.target.value as BannedFilter)}
          className="px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
          <option value="">Banned or active</option>
          <option value="true">Banned only</option>
          <option value="false">Active only</option>
        </select>
      </div>

      {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-8"><Spinner label="Loading users…" /></td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6}><Empty title="No users match your filters" hint="Try clearing the search or filters above." /></td></tr>
              )}
              {!loading && items.map((u) => (
                <tr key={u.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-900 break-all">{u.email}</td>
                  <td className="px-4 py-3 text-ink-700">{u.name || '—'}</td>
                  <td className="px-4 py-3">
                    {u.role === 'admin'    ? <Pill tone="blue">Admin</Pill> :
                     u.role === 'merchant' ? <Pill tone="default">Partner</Pill> :
                                              <Pill tone="gray">Consumer</Pill>}
                  </td>
                  <td className="px-4 py-3">
                    {u.banned ? <Pill tone="red">Banned</Pill> : <Pill tone="green">Active</Pill>}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatMs(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role === 'admin' ? (
                      <span className="text-xs text-ink-300">protected</span>
                    ) : (
                      <button
                        onClick={() => toggleBan(u)}
                        disabled={busyId === u.id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                          u.banned
                            ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'border-red-300 text-red-700 hover:bg-red-50'
                        } disabled:opacity-50`}
                      >
                        {busyId === u.id ? '…' : (u.banned ? 'Unban' : 'Ban')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
