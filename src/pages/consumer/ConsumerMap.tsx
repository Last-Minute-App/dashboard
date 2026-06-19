import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { extractErrorMessage } from '../../api/client';
import {
  bookmarkOffer,
  DiscoveryPayload,
  getDiscovery,
  listCategories,
  listNearbyOffers,
  Offer,
  unbookmarkOffer,
} from '../../api/platform';
import {
  discountedPrice,
  discountLabel,
  Empty,
  formatDistance,
  formatMs,
  formatPrice,
  imageSrc,
  Pill,
  Spinner,
} from '../../components/Ui';

const DEFAULT_LOCATION = { lat: 37.9838, lng: 23.7275 };

export default function ConsumerMap() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [discovery, setDiscovery] = useState<DiscoveryPayload | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState(3);
  const [lat, setLat] = useState(DEFAULT_LOCATION.lat);
  const [lng, setLng] = useState(DEFAULT_LOCATION.lng);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [locationNote, setLocationNote] = useState('Using Athens as the map center.');

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listNearbyOffers(lat, lng, radius, { category, sort: 'nearest' });
      setOffers(data);
      if (data.length === 0) {
        setDiscovery(await getDiscovery(lat, lng, Math.max(10, radius), category || undefined));
      } else {
        setDiscovery(null);
      }
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load map offers'));
    } finally {
      setLoading(false);
    }
  }, [category, lat, lng, radius]);

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

  async function toggleBookmark(offer: Offer) {
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
      setErr(extractErrorMessage(e, 'Could not update saved offer'));
    } finally {
      setBusyId(null);
    }
  }

  const visible = useMemo(() => offers.slice(0, 20), [offers]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Map</h1>
      <p className="text-ink-500 mb-5">Inspect nearby live offers and upcoming saved opportunities around a location.</p>

      <div className="bg-white rounded-2xl shadow-card p-4 mb-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
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
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={useCurrentLocation}
            className="px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800">
            Use location
          </button>
        </div>
        <div className="text-xs text-ink-500">{locationNote}</div>
      </div>

      {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      {loading && <Spinner label="Loading map..." />}
      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="relative min-h-[520px] bg-[#e8eef1]">
              <iframe
                title="OpenStreetMap location"
                className="absolute inset-0 w-full h-full border-0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.03}%2C${lat - 0.02}%2C${lng + 0.03}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">{visible.length} nearby offers</h2>
              <button onClick={load} disabled={loading} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50">
                Refresh
              </button>
            </div>
            {visible.length === 0 ? (
              <DiscoveryBlocks discovery={discovery} />
            ) : (
              visible.map((offer) => (
                <MapOfferCard
                  key={offer.id}
                  offer={offer}
                  bookmarked={bookmarked.has(offer.id)}
                  busy={busyId === offer.id}
                  onBookmark={() => toggleBookmark(offer)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MapOfferCard({
  offer,
  bookmarked,
  busy,
  onBookmark,
}: {
  offer: Offer;
  bookmarked: boolean;
  busy: boolean;
  onBookmark: () => void;
}) {
  const img = imageSrc(offer.image);
  const scheduled = !!offer.scheduled_start_time && offer.scheduled_start_time > Date.now();
  return (
    <div className="bg-white rounded-2xl shadow-card p-3">
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-xl bg-ink-100 overflow-hidden flex-shrink-0">
          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 items-start justify-between">
            <Link to={`/offers/${offer.id}`} className="font-semibold text-ink-900 leading-tight hover:text-brand-600">
              {offer.title}
            </Link>
            <Pill tone={scheduled ? 'blue' : 'default'}>{scheduled ? 'Scheduled' : discountLabel(offer)}</Pill>
          </div>
          <p className="text-sm text-ink-500 mt-1">{offer.merchant_name}</p>
          <div className="mt-2 text-xs text-ink-500">
            {formatPrice(discountedPrice(offer))} / {formatDistance(offer.distance)}
          </div>
          <div className="mt-3 flex gap-2">
            <Link to={`/offers/${offer.id}`} className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-600">
              Details
            </Link>
            {scheduled && (
              <button onClick={onBookmark} disabled={busy} className="px-3 py-1.5 rounded-lg border border-ink-300 text-xs font-semibold hover:bg-ink-50 disabled:opacity-50">
                {bookmarked ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscoveryBlocks({ discovery }: { discovery: DiscoveryPayload | null }) {
  if (!discovery) return <Empty title="No offers on this map" hint="Try a wider radius or another category." />;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="text-sm font-semibold text-ink-900">Discovery</div>
        <div className="text-sm text-ink-500 mt-1">{discovery.claimed_today} offer{discovery.claimed_today === 1 ? '' : 's'} claimed nearby today.</div>
      </div>
      <DiscoveryList title="Upcoming" items={discovery.upcoming.map((o) => ({
        id: o.id,
        title: o.title,
        meta: `${o.merchant_name || 'Merchant'} - starts ${formatMs(o.scheduled_start_time)}`,
      }))} />
      <DiscoveryList title="Recently expired" items={discovery.recently_expired.map((o) => ({
        id: o.id,
        title: o.title,
        meta: `${o.merchant_name || 'Merchant'} - expired ${formatMs(o.expired_at)}`,
      }))} />
      <DiscoveryList title="Nearby businesses" items={discovery.nearby_businesses.map((b) => ({
        id: b.id,
        title: b.name,
        meta: `${b.business_category || 'Business'} - ${formatDistance(b.distance_km)}`,
      }))} />
    </div>
  );
}

function DiscoveryList({ title, items }: { title: string; items: { id: string; title: string; meta: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-white rounded-2xl shadow-card p-4">
      <h3 className="font-semibold text-ink-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="text-sm">
            <div className="font-medium text-ink-800">{item.title}</div>
            <div className="text-xs text-ink-500">{item.meta}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
