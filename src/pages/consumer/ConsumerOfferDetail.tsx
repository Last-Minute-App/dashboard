import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { extractErrorMessage } from '../../api/client';
import { bookmarkOffer, claimOffer, getOffer, Offer, unbookmarkOffer } from '../../api/platform';
import {
  discountedPrice,
  discountLabel,
  formatDistance,
  formatMs,
  formatPrice,
  imageSrc,
  Pill,
  Spinner,
} from '../../components/Ui';

const DEFAULT_LOCATION = { lat: 37.9838, lng: 23.7275 };

export default function ConsumerOfferDetail() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<'claim' | 'bookmark' | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await getOffer(id, DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
      setOffer(data);
      setBookmarked(false);
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load offer'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const status = useMemo(() => {
    if (!offer) return 'unknown';
    if (offer.scheduled_start_time && offer.scheduled_start_time > Date.now()) return 'scheduled';
    if (offer.claimed_by_user) return 'claimed';
    if (offer.quantity != null && offer.quantity_remaining === 0) return 'soldout';
    if (!offer.is_active || offer.expiry_time <= Date.now()) return 'expired';
    return 'active';
  }, [offer]);

  async function onClaim() {
    if (!offer) return;
    setBusy('claim');
    setErr(null);
    try {
      await claimOffer(offer.id);
      setOffer({
        ...offer,
        claimed_by_user: true,
        quantity_remaining: offer.quantity_remaining == null ? offer.quantity_remaining : Math.max(0, offer.quantity_remaining - 1),
      });
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not claim this offer'));
    } finally {
      setBusy(null);
    }
  }

  async function onBookmark() {
    if (!offer) return;
    setBusy('bookmark');
    setErr(null);
    try {
      if (bookmarked) {
        await unbookmarkOffer(offer.id);
        setBookmarked(false);
      } else {
        await bookmarkOffer(offer.id);
        setBookmarked(true);
      }
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not update bookmark'));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner label="Loading offer..." />;
  if (err && !offer) return <ErrorBlock err={err} />;
  if (!offer) return <ErrorBlock err="Offer not found." />;

  const img = imageSrc(offer.image);
  const finalPrice = discountedPrice(offer);
  const canClaim = status === 'active';
  const canBookmark = status === 'scheduled';
  const lat = offer.merchant_latitude ?? offer.latitude;
  const lng = offer.merchant_longitude ?? offer.longitude;
  const mapHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm font-semibold text-brand-600">Back to offers</Link>

      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

      <article className="bg-white rounded-2xl shadow-card overflow-hidden">
        {img ? (
          <img src={img} alt="" className="h-72 w-full object-cover bg-ink-100" />
        ) : (
          <div className="h-48 bg-ink-100 flex items-center justify-center text-ink-500">No image</div>
        )}
        <div className="p-5 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <StatusPill status={status} />
                {offer.category && <Pill tone="gray">{offer.category}</Pill>}
              </div>
              <h1 className="text-2xl font-bold text-ink-900">{offer.title}</h1>
              <p className="text-sm text-ink-500 mt-1">{offer.merchant_name}</p>
            </div>
            <div className="flex gap-2">
              {canBookmark && (
                <button
                  onClick={onBookmark}
                  disabled={busy === 'bookmark'}
                  className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50"
                >
                  {bookmarked ? 'Saved' : 'Save reminder'}
                </button>
              )}
              <button
                onClick={onClaim}
                disabled={!canClaim || busy === 'claim'}
                className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
              >
                {status === 'claimed' ? 'Claimed' : busy === 'claim' ? 'Claiming...' : 'Claim offer'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-emerald-600">{formatPrice(finalPrice)}</span>
            <span className="text-lg line-through text-ink-500">{formatPrice(offer.original_price)}</span>
            <Pill>{discountLabel(offer)}</Pill>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Metric label={status === 'scheduled' ? 'Starts' : 'Claim until'} value={formatMs(status === 'scheduled' ? offer.scheduled_start_time : offer.expiry_time)} />
            <Metric label="Redeem by" value={formatMs(offer.redemption_deadline ?? offer.expiry_time)} />
            <Metric label="Distance" value={formatDistance(offer.distance)} />
            <Metric label="Stock" value={offer.quantity == null ? 'Unlimited' : `${offer.quantity_remaining ?? 0}/${offer.quantity}`} />
          </div>

          {offer.description && (
            <section>
              <h2 className="font-semibold text-ink-900 mb-2">About this offer</h2>
              <p className="text-sm text-ink-700 leading-6">{offer.description}</p>
            </section>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 border border-ink-100 rounded-xl p-4">
            <div>
              <h2 className="font-semibold text-ink-900">Merchant location</h2>
              <p className="text-sm text-ink-600 mt-1">
                {offer.merchant_formatted_address || offer.merchant_address ||
                  [offer.merchant_street, offer.merchant_street_number, offer.merchant_city].filter(Boolean).join(' ') ||
                  'Address not available'}
              </p>
              {offer.merchant_phone && <p className="text-sm text-ink-500 mt-1">{offer.merchant_phone}</p>}
            </div>
            <a
              href={mapHref}
              target="_blank"
              rel="noreferrer"
              className="self-start px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800"
            >
              Open map
            </a>
          </section>
        </div>
      </article>
    </div>
  );
}

function ErrorBlock({ err }: { err: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <p className="text-red-700">{err}</p>
      <Link to="/" className="inline-block mt-4 text-sm font-semibold text-brand-600">Back to offers</Link>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-ink-50 rounded-lg px-3 py-2">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-ink-800">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = status === 'active' || status === 'claimed' ? 'green' : status === 'scheduled' ? 'blue' : status === 'soldout' ? 'red' : 'gray';
  const label = status === 'soldout' ? 'Sold out' : status[0].toUpperCase() + status.slice(1);
  return <Pill tone={tone}>{label}</Pill>;
}
