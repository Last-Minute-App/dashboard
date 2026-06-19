import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BusinessHours } from '../api/auth';
import { extractErrorMessage } from '../api/client';
import { BUSINESS_CATEGORIES } from '../api/platform';
import { useAuth } from '../auth/AuthContext';

const DAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
] as const;

const defaultHours: BusinessHours = DAYS.reduce((acc, [day]) => {
  acc[day] = { closed: false, open: '09:00', close: '17:00' };
  return acc;
}, {} as BusinessHours);

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'consumer' | 'merchant'>('consumer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [formattedAddress, setFormattedAddress] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [vatCountry, setVatCountry] = useState('GR');
  const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultHours);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const u = await register(cleanPayload({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        role,
        image: image.trim() || undefined,
        business_category: role === 'merchant' ? businessCategory.trim() : undefined,
        street: role === 'merchant' ? street.trim() : undefined,
        street_number: role === 'merchant' ? streetNumber.trim() : undefined,
        postal_code: role === 'merchant' ? postalCode.trim() : undefined,
        city: role === 'merchant' ? city.trim() : undefined,
        phone: role === 'merchant' ? phone.trim() : undefined,
        merchant_latitude: role === 'merchant' && lat.trim() ? Number(lat) : undefined,
        merchant_longitude: role === 'merchant' && lng.trim() ? Number(lng) : undefined,
        formatted_address: role === 'merchant' ? formattedAddress.trim() : undefined,
        business_hours: role === 'merchant' ? businessHours : undefined,
        iban: role === 'merchant' ? iban.trim() : undefined,
        account_holder_name: role === 'merchant' ? accountHolder.trim() : undefined,
        bank_name: role === 'merchant' ? bankName.trim() : undefined,
        vat_number: role === 'merchant' ? vatNumber.trim() : undefined,
        vat_country: role === 'merchant' ? vatCountry : undefined,
      }));
      navigate(u.role === 'merchant' ? '/partner' : '/', { replace: true });
    } catch (e) {
      setErr(extractErrorMessage(e, 'Signup failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  function setHours(day: typeof DAYS[number][0], field: 'closed' | 'open' | 'close', value: boolean | string) {
    const current = businessHours[day] || { closed: false, open: '09:00', close: '17:00' };
    setBusinessHours({
      ...businessHours,
      [day]: { ...current, [field]: value },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-brand-50 via-white to-ink-50">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-ink-900">Create your account</h1>
          <p className="text-ink-500 mt-1">Join as a consumer or a partner</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {(['consumer', 'merchant'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-3 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                  role === r
                    ? 'border-brand bg-brand-50 text-brand-700'
                    : 'border-ink-300 text-ink-700 hover:border-ink-500'
                }`}
              >
                {r === 'consumer' ? 'Customer' : 'Partner'}
              </button>
            ))}
          </div>

          <Section title="Account">
            <Field label="Full name" value={name} onChange={setName} required />
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
            <Field label="Image base64 or data URL" value={image} onChange={setImage} />
          </Section>

          {role === 'merchant' && (
            <>
              <Section title="Business">
                <label className="block">
                  <span className="text-xs font-medium text-ink-500">Business category</span>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white"
                  >
                    <option value="">Select category</option>
                    {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <Field label="Phone" value={phone} onChange={setPhone} />
              </Section>

              <Section title="Address">
                <Field label="Street" value={street} onChange={setStreet} />
                <Field label="Street number" value={streetNumber} onChange={setStreetNumber} />
                <Field label="Postal code" value={postalCode} onChange={setPostalCode} />
                <Field label="City" value={city} onChange={setCity} />
                <Field label="Latitude" type="number" value={lat} onChange={setLat} />
                <Field label="Longitude" type="number" value={lng} onChange={setLng} />
                <Field label="Formatted address" value={formattedAddress} onChange={setFormattedAddress} />
              </Section>

              <section>
                <h2 className="font-semibold text-ink-900 mb-3">Business hours</h2>
                <div className="space-y-2">
                  {DAYS.map(([day, label]) => {
                    const hours = businessHours[day] || { closed: false, open: '09:00', close: '17:00' };
                    return (
                      <div key={day} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr_120px] gap-2 items-center rounded-lg border border-ink-200 px-3 py-2">
                        <div className="text-sm font-medium text-ink-800">{label}</div>
                        <input type="time" value={hours.open || '09:00'} disabled={hours.closed}
                          onChange={(e) => setHours(day, 'open', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-ink-300 text-sm disabled:bg-ink-50" />
                        <input type="time" value={hours.close || '17:00'} disabled={hours.closed}
                          onChange={(e) => setHours(day, 'close', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-ink-300 text-sm disabled:bg-ink-50" />
                        <label className="flex items-center gap-2 text-sm text-ink-700">
                          <input type="checkbox" checked={!!hours.closed}
                            onChange={(e) => setHours(day, 'closed', e.target.checked)}
                            className="h-4 w-4" />
                          Closed
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>

              <Section title="Bank and tax">
                <Field label="IBAN" value={iban} onChange={setIban} />
                <Field label="Account holder" value={accountHolder} onChange={setAccountHolder} />
                <Field label="Bank name" value={bankName} onChange={setBankName} />
                <Field label="VAT number" value={vatNumber} onChange={setVatNumber} />
                <label className="block">
                  <span className="text-xs font-medium text-ink-500">VAT country</span>
                  <select value={vatCountry} onChange={(e) => setVatCountry(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm bg-white">
                    <option value="GR">Greece</option>
                    <option value="CY">Cyprus</option>
                  </select>
                </label>
              </Section>
            </>
          )}

          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

          <button type="submit" disabled={busy}
            className="w-full bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition">
            {busy ? 'Creating...' : 'Create account'}
          </button>

          <div className="text-center text-sm text-ink-500">
            Already have an account? <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
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
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        step={type === 'number' ? 'any' : undefined}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-300 text-sm"
      />
    </label>
  );
}

function cleanPayload<T extends Record<string, unknown>>(payload: T): T {
  const cleaned: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value === '' || value == null) return;
    cleaned[key] = value;
  });
  return cleaned as T;
}
