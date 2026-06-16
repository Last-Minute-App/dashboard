import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { extractErrorMessage } from '../../api/client';
import {
  cancelRemainingOffer,
  createOffer,
  deleteOffer,
  generateRecurringOffers,
  listMerchantOffers,
  Offer,
  toggleRecurringOffer,
  updateOffer,
} from '../../api/platform';
import { useAuth } from '../../auth/AuthContext';
import { Empty, formatMs, formatPrice, Pill, Spinner } from '../../components/Ui';

type Filter = 'all' | 'active' | 'scheduled' | 'expired' | 'soldout';

interface OfferFormState {
  title: string;
  description: string;
  image: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  original_price: string;
  latitude: string;
  longitude: string;
  expiry_hours: string;
  redemption_extension_hours: string;
  quantity: string;
  is_recurring: boolean;
  recurring_end_date: string;
  recurring_start_time: string;
  is_scheduled: boolean;
  scheduled_start_time: string;
}

const emptyForm: OfferFormState = {
  title: '',
  description: '',
  image: '',
  discount_type: 'percentage',
  discount_value: '',
  original_price: '',
  latitude: '',
  longitude: '',
  expiry_hours: '2',
  redemption_extension_hours: '0',
  quantity: '',
  is_recurring: false,
  recurring_end_date: '',
  recurring_start_time: '',
  is_scheduled: false,
  scheduled_start_time: '',
};

export default function PartnerOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('active');
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferFormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listMerchantOffers();
      setOffers(data.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0)));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Failed to load merchant offers'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      latitude: prev.latitude || String(user?.merchant_latitude ?? 37.9838),
      longitude: prev.longitude || String(user?.merchant_longitude ?? 23.7275),
    }));
  }, [user?.merchant_latitude, user?.merchant_longitude]);

  const filtered = useMemo(() => offers.filter((offer) => {
    const status = offerStatus(offer);
    if (filter === 'all') return true;
    return status === filter;
  }), [filter, offers]);

  function set<K extends keyof OfferFormState>(key: K, value: OfferFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function beginEdit(offer: Offer) {
    setEditing(offer);
    setOk(null);
    setErr(null);
    setForm({
      title: offer.title,
      description: offer.description || '',
      image: offer.image || '',
      discount_type: offer.discount_type,
      discount_value: String(offer.discount_value ?? ''),
      original_price: String(offer.original_price ?? ''),
      latitude: String(offer.latitude ?? user?.merchant_latitude ?? 37.9838),
      longitude: String(offer.longitude ?? user?.merchant_longitude ?? 23.7275),
      expiry_hours: String(offer.expiry_hours ?? 2),
      redemption_extension_hours: String(offer.redemption_extension_hours ?? 0),
      quantity: String(offer.quantity_remaining ?? offer.quantity ?? ''),
      is_recurring: !!offer.is_recurring,
      recurring_end_date: offer.recurring_end_date || '',
      recurring_start_time: utcHHMMToLocal(offer.recurring_start_time || ''),
      is_scheduled: !!offer.scheduled_start_time && offer.scheduled_start_time > Date.now(),
      scheduled_start_time: offer.scheduled_start_time ? msToLocalHHMM(offer.scheduled_start_time) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditing(null);
    setForm({
      ...emptyForm,
      latitude: String(user?.merchant_latitude ?? 37.9838),
      longitude: String(user?.merchant_longitude ?? 23.7275),
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusyId('form');
    setErr(null);
    setOk(null);
    try {
      const payload = buildPayload(form, Boolean(editing));
      const saved = editing ? await updateOffer(editing.id, payload) : await createOffer(payload);
      setOffers((arr) => editing ? arr.map((o) => (o.id === saved.id ? saved : o)) : [saved, ...arr]);
      setOk(editing ? 'Offer updated.' : 'Offer created.');
      resetForm();
    } catch (error) {
      setErr(extractErrorMessage(error, 'Could not save offer'));
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(offer: Offer) {
    if (!window.confirm(`Delete "${offer.title}"? Existing active claims may be cancelled by the backend.`)) return;
    setBusyId(offer.id);
    setErr(null);
    try {
      await deleteOffer(offer.id);
      setOffers((arr) => arr.filter((o) => o.id !== offer.id));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not delete offer'));
    } finally {
      setBusyId(null);
    }
  }

  async function onCancelRemaining(offer: Offer) {
    if (!window.confirm(`Cancel remaining availability for "${offer.title}"? Existing redeemed or claimed units are kept.`)) return;
    setBusyId(offer.id);
    setErr(null);
    try {
      const updated = await cancelRemainingOffer(offer.id);
      setOffers((arr) => arr.map((o) => (o.id === updated.id ? updated : o)));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not cancel remaining availability'));
    } finally {
      setBusyId(null);
    }
  }

  async function onToggleRecurring(offer: Offer) {
    setBusyId(offer.id);
    setErr(null);
    try {
      const updated = await toggleRecurringOffer(offer.id);
      setOffers((arr) => arr.map((o) => (o.id === offer.id ? { ...o, is_recurring: updated.is_recurring } : o)));
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not toggle recurring'));
    } finally {
      setBusyId(null);
    }
  }

  async function onGenerateRecurring() {
    setBusyId('generate');
    setErr(null);
    setOk(null);
    try {
      const result = await generateRecurringOffers();
      setOk(`Generated ${result.created} recurring offer${result.created === 1 ? '' : 's'} for ${result.date}.`);
      await load();
    } catch (e) {
      setErr(extractErrorMessage(e, 'Could not generate recurring offers'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">My offers</h1>
      <p className="text-ink-500 mb-5">Create, schedule, edit, recur, cancel remaining stock, and delete offers.</p>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card p-5 mb-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ink-900">{editing ? 'Edit offer' : 'Create offer'}</h2>
          {editing && <button type="button" onClick={resetForm} className="text-sm text-ink-600 font-semibold hover:text-ink-900">Cancel edit</button>}
        </div>
        {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        {ok && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{ok}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Title" value={form.title} onChange={(v) => set('title', v)} required />
          <Field label="Image base64 or data URL" value={form.image} onChange={(v) => set('image', v)} />
          <label className="block md:col-span-2">
            <span className="text-xs font-medium text-ink-500">Description</span>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm min-h-20" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-500">Discount type</span>
            <select value={form.discount_type} onChange={(e) => set('discount_type', e.target.value as 'percentage' | 'fixed')}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          <Field label="Discount value" type="number" value={form.discount_value} onChange={(v) => set('discount_value', v)} required />
          <Field label="Original price" type="number" value={form.original_price} onChange={(v) => set('original_price', v)} required />
          <Field label={editing ? 'Remaining quantity' : 'Quantity'} type="number" value={form.quantity} onChange={(v) => set('quantity', v)} />
          <Field label="Latitude" type="number" value={form.latitude} onChange={(v) => set('latitude', v)} required />
          <Field label="Longitude" type="number" value={form.longitude} onChange={(v) => set('longitude', v)} required />
          <label className="block">
            <span className="text-xs font-medium text-ink-500">Claim window</span>
            <select value={form.expiry_hours} onChange={(e) => set('expiry_hours', e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
              {[1, 2, 3, 4].map((h) => <option key={h} value={h}>{h} hour{h === 1 ? '' : 's'}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-500">Redemption extension</span>
            <select value={form.redemption_extension_hours} onChange={(e) => set('redemption_extension_hours', e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
              {[0, 1, 2, 3, 4].map((h) => <option key={h} value={h}>{h} hour{h === 1 ? '' : 's'}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="Schedule for later today" checked={form.is_scheduled} onChange={(v) => set('is_scheduled', v)} disabled={form.is_recurring} />
          {form.is_scheduled && <Field label="Scheduled local time" type="time" value={form.scheduled_start_time} onChange={(v) => set('scheduled_start_time', v)} required />}
          <Toggle label="Recurring offer" checked={form.is_recurring} onChange={(v) => set('is_recurring', v)} disabled={form.is_scheduled} />
          {form.is_recurring && (
            <>
              <Field label="Recurring end date" type="date" value={form.recurring_end_date} onChange={(v) => set('recurring_end_date', v)} required />
              <Field label="Recurring local start time" type="time" value={form.recurring_start_time} onChange={(v) => set('recurring_start_time', v)} required />
            </>
          )}
        </div>

        <div className="flex justify-end">
          <button disabled={busyId === 'form'} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50">
            {busyId === 'form' ? 'Saving...' : editing ? 'Update offer' : 'Create offer'}
          </button>
        </div>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          {(['active', 'scheduled', 'expired', 'soldout', 'all'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${filter === f ? 'bg-brand text-white border-brand' : 'bg-white text-ink-700 border-ink-300 hover:bg-ink-50'}`}>
              {f === 'soldout' ? 'Sold out' : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50">Refresh</button>
          <button onClick={onGenerateRecurring} disabled={busyId === 'generate'} className="px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 disabled:opacity-50">
            {busyId === 'generate' ? 'Generating...' : 'Generate recurring'}
          </button>
        </div>
      </div>

      {loading && <Spinner label="Loading offers..." />}
      {!loading && filtered.length === 0 && <Empty title="No offers in this view" />}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((offer) => (
            <OfferRow
              key={offer.id}
              offer={offer}
              busy={busyId === offer.id}
              onEdit={() => beginEdit(offer)}
              onDelete={() => onDelete(offer)}
              onCancelRemaining={() => onCancelRemaining(offer)}
              onToggleRecurring={() => onToggleRecurring(offer)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferRow({
  offer,
  busy,
  onEdit,
  onDelete,
  onCancelRemaining,
  onToggleRecurring,
}: {
  offer: Offer;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCancelRemaining: () => void;
  onToggleRecurring: () => void;
}) {
  const status = offerStatus(offer);
  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-ink-900">{offer.title}</h2>
            <StatusPill status={status} />
            {offer.is_recurring && <Pill tone="blue">Recurring</Pill>}
          </div>
          <div className="text-sm text-ink-500 mt-1">{offer.description || 'No description'}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-3">
            <Info label="Price" value={`${formatPrice(discountedPrice(offer))} / ${formatPrice(offer.original_price)}`} />
            <Info label="Claims" value={`${offer.claim_count ?? 0} total, ${offer.pending_claim_count ?? 0} pending`} />
            <Info label="Stock" value={offer.quantity == null ? 'Unlimited' : `${offer.quantity_remaining ?? 0}/${offer.quantity}`} />
            <Info label={status === 'scheduled' ? 'Starts' : 'Expires'} value={formatMs(status === 'scheduled' ? offer.scheduled_start_time : offer.expiry_time)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button onClick={onEdit} disabled={busy} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50">Edit</button>
          <button onClick={onCancelRemaining} disabled={busy || status === 'soldout'} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50">Cancel remaining</button>
          <button onClick={onToggleRecurring} disabled={busy} className="px-3 py-2 rounded-lg border border-ink-300 text-sm font-semibold hover:bg-ink-50 disabled:opacity-50">
            {offer.is_recurring ? 'Stop recurring' : 'Make recurring'}
          </button>
          <button onClick={onDelete} disabled={busy} className="px-3 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? 'any' : undefined}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-2 text-sm ${disabled ? 'opacity-50' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="h-4 w-4" />
      {label}
    </label>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-ink-50 rounded-lg px-3 py-2">
      <div className="text-ink-500">{label}</div>
      <div className="text-ink-800 font-medium mt-0.5">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: Filter }) {
  const tone = status === 'active' ? 'green' : status === 'scheduled' ? 'blue' : status === 'expired' ? 'gray' : 'red';
  const label = status === 'soldout' ? 'Sold out' : status[0].toUpperCase() + status.slice(1);
  return <Pill tone={tone}>{label}</Pill>;
}

function offerStatus(offer: Offer): Filter {
  if (offer.scheduled_start_time && offer.scheduled_start_time > Date.now()) return 'scheduled';
  if (offer.quantity != null && offer.quantity_remaining === 0) return 'soldout';
  if (!offer.is_active || offer.expiry_time <= Date.now()) return 'expired';
  return 'active';
}

function discountedPrice(offer: Offer): number {
  const discount = offer.discount_type === 'percentage'
    ? offer.original_price * (offer.discount_value / 100)
    : offer.discount_value;
  return Math.max(0, offer.original_price - discount);
}

function buildPayload(form: OfferFormState, editing: boolean) {
  const payload: {
    title: string;
    description: string;
    image?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    original_price: number;
    latitude: number;
    longitude: number;
    expiry_hours: number;
    redemption_extension_hours: number;
    quantity?: number;
    quantity_remaining?: number;
    is_recurring?: boolean;
    recurring_end_date?: string;
    recurring_start_time?: string;
    scheduled_start_time?: number;
  } = {
    title: form.title.trim(),
    description: form.description.trim(),
    discount_type: form.discount_type,
    discount_value: Number(form.discount_value),
    original_price: Number(form.original_price),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    expiry_hours: Number(form.expiry_hours),
    redemption_extension_hours: Number(form.redemption_extension_hours),
  };
  if (form.image.trim()) payload.image = form.image.trim();
  if (form.quantity.trim()) {
    if (editing) payload.quantity_remaining = Number(form.quantity);
    else payload.quantity = Number(form.quantity);
  }
  if (form.is_scheduled && form.scheduled_start_time) payload.scheduled_start_time = localHHMMToTodayMs(form.scheduled_start_time);
  if (form.is_recurring) {
    payload.is_recurring = true;
    payload.recurring_end_date = form.recurring_end_date;
    payload.recurring_start_time = localHHMMToUTC(form.recurring_start_time);
  } else {
    payload.is_recurring = false;
  }
  return payload;
}

function localHHMMToTodayMs(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

function localHHMMToUTC(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function utcHHMMToLocal(value: string): string {
  if (!value) return '';
  const [hours, minutes] = value.split(':').map(Number);
  const d = new Date();
  d.setUTCHours(hours, minutes, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function msToLocalHHMM(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
