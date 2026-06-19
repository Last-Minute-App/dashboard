import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { extractErrorMessage } from '../../api/client';
import {
  bookmarkOffer,
  claimOffer,
  listBookmarks,
  listCategories,
  listNearbyOffers,
  Offer,
  unbookmarkOffer,
} from '../../api/platform';
import { useAuth } from '../../auth/AuthContext';
import { Empty, formatMs, formatPrice, Pill, Spinner } from '../../components/Ui';

const DEFAULT_LOCATION = { lat: 37.9838, lng: 23.7275 };

type Sort = 'newest' | 'nearest' | 'expiring' | 'discount';

export default function ConsumerHome() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<Sort>('nearest');
  const [radius, setRadius] = useState(3);
  const [lat, setLat] = useState(DEFAULT_LOCATION.lat);
  const [lng, setLng] = useState(DEFAULT_LOCATION.lng);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [locationNote, setLocationNote] = useState('Using Athens as the search center.');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listNearbyOffers(lat, lng, radius, { q, category, sort });
      setOffers(data);
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load offers'));
    } finally {
      setLoading(false);
    }
  }, [category, lat, lng, q, radius, sort]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
    listBookmarks()
      .then((items) => setBookmarked(new Set(items.map((item) => item.offer_id))))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationNote('Browser geolocation is not available. Adjust latitude and longitude manually.');
      return;
    }
    setLocationNote('Requesting browser location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setLocationNote('Using your browser location.');
      },
      () => setLocationNote('Location permission was not granted. Adjust latitude and longitude manually.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function onClaim(offer: Offer) {
    setBusyId(offer.id);
    setErr(null);
    try {
      await claimOffer(offer.id);
      setOffers((arr) => arr.map((o) => (o.id === offer.id ? {
        ...o,
        claimed_by_user: true,
        quantity_remaining: o.quantity_remaining == null ? o.quantity_remaining : Math.max(0, o.quantity_remaining - 1),
      } : o)));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not claim this offer'));
    } finally {
      setBusyId(null);
    }
  }

  async function onBookmark(offer: Offer) {
    setBusyId(offer.id);
    setErr(null);
    try {
      if (bookmarked.has(offer.id)) {
        await unbookmarkOffer(offer.id);
        setBookmarked((prev) => {
          const next = new Set(prev);
          next.delete(offer.id);
          return next;
        });
      } else {
        await bookmarkOffer(offer.id);
        setBookmarked((prev) => new Set(prev).add(offer.id));
      }
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not update bookmark'));
    } finally {
      setBusyId(null);
    }
  }

  const filtersActive = useMemo(() => Boolean(q.trim() || category || sort !== 'nearest' || radius !== 3), [category, q, radius, sort]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-2">Welcome, {user?.name || 'there'}!</h1>
      <p className="text-ink-500 mb-5">Browse live and scheduled offers using the same backend as the mobile app.</p>

      <div className="bg-white rounded-2xl shadow-card p-4 mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search offers or partners"
            className="md:col-span-2 px-3 py-2 rounded-lg border border-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
            className="px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
            <option value="nearest">Nearest</option>
            <option value="expiring">Expiring soon</option>
            <option value="discount">Best discount</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
          <input type="number" step="0.000001" value={lat} onChange={(e) => setLat(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-ink-300 text-sm" aria-label="Latitude" />
          <input type="number" step="0.000001" value={lng} onChange={(e) => setLng(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-ink-300 text-sm" aria-label="Longitude" />
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
            <option value={1}>1 km</option>
            <option value={3}>3 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
          </select>
          <button onClick={useCurrentLocation}
            className="px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800">
            Use my location
          </button>
        </div>
        <div className="text-xs text-ink-500">{locationNote}</div>
      </div>

      {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      {loading && <Spinner label="Loading offers..." />}
      {!loading && offers.length === 0 && (
        <Empty
          title={filtersActive ? 'No offers match these filters' : 'No offers nearby'}
          hint="Try a wider radius, a different category, or another location."
        />
      )}
      {!loading && offers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              bookmarked={bookmarked.has(offer.id)}
              busy={busyId === offer.id}
              onClaim={() => onClaim(offer)}
              onBookmark={() => onBookmark(offer)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  bookmarked,
  busy,
  onClaim,
  onBookmark,
}: {
  offer: Offer;
  bookmarked: boolean;
  busy: boolean;
  onClaim: () => void;
  onBookmark: () => void;
}) {
  const scheduled = !!offer.scheduled_start_time && offer.scheduled_start_time > Date.now();
  const soldOut = offer.quantity_remaining === 0;
  const canClaim = offer.is_active && !scheduled && !soldOut && !offer.claimed_by_user;
  const finalPrice = discountedPrice(offer);
  return (
    <article className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col">
      {offer.image && <img src={imageSrc(offer.image)} alt="" className="h-40 w-full object-cover bg-ink-100" />}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to={`/offers/${offer.id}`} className="font-semibold text-ink-900 leading-tight hover:text-brand-600">
              {offer.title}
            </Link>
            <div className="text-sm text-ink-500 mt-0.5">{offer.merchant_name}</div>
          </div>
          <Pill tone={scheduled ? 'blue' : offer.claimed_by_user ? 'green' : soldOut ? 'gray' : 'default'}>
            {scheduled ? 'Scheduled' : offer.claimed_by_user ? 'Claimed' : soldOut ? 'Sold out' : offer.category || 'Offer'}
          </Pill>
        </div>
        {offer.description && <p className="text-sm text-ink-700 mt-3">{offer.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-sm mt-4">
          <Metric label="Price" value={<><span className="font-semibold text-ink-900">{formatPrice(finalPrice)}</span> <span className="line-through text-ink-500">{formatPrice(offer.original_price)}</span></>} />
          <Metric label="Discount" value={discountLabel(offer)} />
          <Metric label={scheduled ? 'Starts' : 'Expires'} value={formatMs(scheduled ? offer.scheduled_start_time : offer.expiry_time)} />
          <Metric label="Distance" value={offer.distance != null ? `${offer.distance.toFixed(1)} km` : 'Not available'} />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClaim}
            disabled={!canClaim || busy}
            className="flex-1 px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
          >
            {offer.claimed_by_user ? 'Claimed' : busy ? 'Working...' : 'Claim offer'}
          </button>
          <button
            onClick={onBookmark}
            disabled={busy}
            className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
          >
            {bookmarked ? 'Saved' : 'Save'}
          </button>
          <Link
            to={`/offers/${offer.id}`}
            className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-ink-50 rounded-lg px-3 py-2">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="mt-0.5 text-ink-800">{value}</div>
    </div>
  );
}

function discountedPrice(offer: Offer): number {
  const discount = offer.discount_type === 'percentage'
    ? offer.original_price * (offer.discount_value / 100)
    : offer.discount_value;
  return Math.max(0, offer.original_price - discount);
}

function discountLabel(offer: Offer): string {
  return offer.discount_type === 'percentage'
    ? `${offer.discount_value}%`
    : `${formatPrice(offer.discount_value)} off`;
}

function imageSrc(image: string): string {
  return image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
}
