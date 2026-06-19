import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { extractErrorMessage } from '../../api/client';
import { BookmarkItem, listBookmarks, unbookmarkOffer } from '../../api/platform';
import { Empty, formatMs, imageSrc, Pill, Spinner } from '../../components/Ui';

export default function ConsumerBookmarks() {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setItems(await listBookmarks());
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load saved offers'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(item: BookmarkItem) {
    setBusyId(item.offer_id);
    setErr(null);
    try {
      await unbookmarkOffer(item.offer_id);
      setItems((prev) => prev.filter((x) => x.offer_id !== item.offer_id));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not remove saved offer'));
    } finally {
      setBusyId(null);
    }
  }

  const liveCount = useMemo(() => items.filter((x) => x.is_live).length, [items]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Saved offers</h1>
      <p className="text-ink-500 mb-5">{liveCount} saved offer{liveCount === 1 ? '' : 's'} now live.</p>

      <div className="flex justify-end mb-3">
        <button onClick={load} disabled={loading} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50">
          Refresh
        </button>
      </div>

      {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      {loading && <Spinner label="Loading saved offers..." />}
      {!loading && items.length === 0 && <Empty title="No saved offers" hint="Scheduled offers you save from Browse or Map will appear here." />}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <SavedRow
              key={item.offer_id}
              item={item}
              busy={busyId === item.offer_id}
              onRemove={() => remove(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedRow({ item, busy, onRemove }: { item: BookmarkItem; busy: boolean; onRemove: () => void }) {
  const offer = item.offer;
  const img = imageSrc(offer?.image);
  const missing = item.is_missing || !offer;

  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="w-full sm:w-24 h-24 rounded-xl bg-ink-100 overflow-hidden flex-shrink-0">
          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-ink-900 truncate">{offer?.title || 'Unavailable offer'}</h2>
            <Pill tone={missing ? 'gray' : item.is_live ? 'green' : 'blue'}>
              {missing ? 'Unavailable' : item.is_live ? 'Live now' : 'Scheduled'}
            </Pill>
          </div>
          <p className="text-sm text-ink-500 mt-1">{offer?.merchant_name || 'This saved offer may have been removed.'}</p>
          <p className="text-xs text-ink-500 mt-2">
            {offer?.scheduled_start_time ? `Starts ${formatMs(offer.scheduled_start_time)}` : 'Saved reminder'}
          </p>
        </div>
        <div className="flex gap-2 sm:flex-col sm:items-stretch">
          {offer && (
            <Link
              to={`/offers/${offer.id}`}
              className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-600 text-center"
            >
              View
            </Link>
          )}
          <button
            onClick={onRemove}
            disabled={busy}
            className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
