import React from 'react';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-ink-500">
      <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-10 text-ink-500">
      <div className="text-4xl mb-2">...</div>
      <div className="font-semibold text-ink-700">{title}</div>
      {hint && <div className="text-sm mt-1">{hint}</div>}
    </div>
  );
}

export function Pill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'green' | 'red' | 'blue' | 'gray';
}) {
  const cls =
    tone === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    tone === 'red'   ? 'bg-red-50 text-red-700 border-red-200' :
    tone === 'blue'  ? 'bg-sky-50 text-sky-700 border-sky-200' :
    tone === 'gray'  ? 'bg-ink-100 text-ink-700 border-ink-300' :
    'bg-brand-50 text-brand-700 border-brand-100';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

export function formatMs(ms: number | null | undefined): string {
  if (!ms) return '-';
  try {
    const d = new Date(ms);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '-';
  }
}

export function formatPrice(v: number | null | undefined): string {
  if (v == null) return '-';
  return `EUR ${Number(v).toFixed(2)}`;
}

export function discountedPrice(offer: {
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  original_price: number;
}): number {
  const discount = offer.discount_type === 'percentage'
    ? offer.original_price * (offer.discount_value / 100)
    : offer.discount_value;
  return Math.max(0, offer.original_price - discount);
}

export function discountLabel(offer: {
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}): string {
  return offer.discount_type === 'percentage'
    ? `${offer.discount_value}%`
    : `${formatPrice(offer.discount_value)} off`;
}

export function imageSrc(image: string | null | undefined): string | null {
  if (!image) return null;
  return image.startsWith('data:') || image.startsWith('http') ? image : `data:image/jpeg;base64,${image}`;
}

export function formatDistance(km: number | null | undefined): string {
  if (km == null) return 'Not available';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
