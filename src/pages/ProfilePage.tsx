import React, { FormEvent, useEffect, useState } from 'react';
import { updateMe, User } from '../api/auth';
import { extractErrorMessage } from '../api/client';
import { BUSINESS_CATEGORIES } from '../api/platform';
import { useAuth } from '../auth/AuthContext';

type ProfileForm = Partial<Pick<User,
  'name' | 'image' | 'business_category' | 'street' | 'street_number' | 'postal_code' | 'city' |
  'phone' | 'iban' | 'account_holder_name' | 'bank_name' | 'vat_number' | 'vat_country' |
  'merchant_latitude' | 'merchant_longitude' | 'formatted_address'
>>;

export default function ProfilePage() {
  const { user, reloadMe } = useAuth();
  const [form, setForm] = useState<ProfileForm>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      image: user.image || '',
      business_category: user.business_category || '',
      street: user.street || '',
      street_number: user.street_number || '',
      postal_code: user.postal_code || '',
      city: user.city || '',
      phone: user.phone || '',
      iban: user.iban || '',
      account_holder_name: user.account_holder_name || '',
      bank_name: user.bank_name || '',
      vat_number: user.vat_number || '',
      vat_country: user.vat_country || 'GR',
      merchant_latitude: user.merchant_latitude ?? undefined,
      merchant_longitude: user.merchant_longitude ?? undefined,
      formatted_address: user.formatted_address || '',
    });
  }, [user]);

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      await updateMe(cleanPayload(form));
      await reloadMe();
      setOk('Profile updated.');
    } catch (error) {
      setErr(extractErrorMessage(error, 'Could not update profile'));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Profile</h1>
      <p className="text-ink-500 mb-5">Manage account details shared across the mobile app and dashboard.</p>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card p-5 space-y-5">
        {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        {ok && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{ok}</div>}

        <Section title="Account">
          <Field label="Name" value={form.name || ''} onChange={(v) => set('name', v)} required />
          <Field label="Email" value={user.email} disabled />
          <Field label="Image base64 or data URL" value={form.image || ''} onChange={(v) => set('image', v)} />
        </Section>

        {user.role === 'merchant' && (
          <>
            <Section title="Business">
              <label className="block">
                <span className="text-xs font-medium text-ink-500">Category</span>
                <select value={form.business_category || ''} onChange={(e) => set('business_category', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
                  <option value="">Select category</option>
                  {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <Field label="Phone" value={form.phone || ''} onChange={(v) => set('phone', v)} />
            </Section>
            <Section title="Address">
              <Field label="Street" value={form.street || ''} onChange={(v) => set('street', v)} />
              <Field label="Street number" value={form.street_number || ''} onChange={(v) => set('street_number', v)} />
              <Field label="Postal code" value={form.postal_code || ''} onChange={(v) => set('postal_code', v)} />
              <Field label="City" value={form.city || ''} onChange={(v) => set('city', v)} />
              <Field label="Latitude" type="number" value={form.merchant_latitude ?? ''} onChange={(v) => set('merchant_latitude', v === '' ? undefined : Number(v))} />
              <Field label="Longitude" type="number" value={form.merchant_longitude ?? ''} onChange={(v) => set('merchant_longitude', v === '' ? undefined : Number(v))} />
              <Field label="Formatted address" value={form.formatted_address || ''} onChange={(v) => set('formatted_address', v)} />
            </Section>
            <Section title="Bank and tax">
              <Field label="IBAN" value={form.iban || ''} onChange={(v) => set('iban', v)} />
              <Field label="Account holder" value={form.account_holder_name || ''} onChange={(v) => set('account_holder_name', v)} />
              <Field label="Bank name" value={form.bank_name || ''} onChange={(v) => set('bank_name', v)} />
              <Field label="VAT number" value={form.vat_number || ''} onChange={(v) => set('vat_number', v)} />
              <label className="block">
                <span className="text-xs font-medium text-ink-500">VAT country</span>
                <select value={form.vat_country || 'GR'} onChange={(e) => set('vat_country', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
                  <option value="GR">Greece</option>
                  <option value="CY">Cyprus</option>
                </select>
              </label>
            </Section>
          </>
        )}

        <div className="flex justify-end">
          <button disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-ink-900 mb-3">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  disabled,
}: {
  label: string;
  value: string | number;
  onChange?: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        disabled={disabled}
        step={type === 'number' ? 'any' : undefined}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm disabled:bg-ink-50 disabled:text-ink-500"
      />
    </label>
  );
}

function cleanPayload(form: ProfileForm): Partial<User> {
  const payload: Partial<User> = {};
  Object.entries(form).forEach(([key, value]) => {
    if (value === '' || value == null) return;
    (payload as Record<string, unknown>)[key] = value;
  });
  return payload;
}
