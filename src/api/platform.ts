import { api } from './client';

export const BUSINESS_CATEGORIES = [
  'Food',
  'Drinks',
  'Sweets',
  'Clothing',
  'Other Retail',
  'Beauty & Personal Care',
  'Fitness & Wellness',
  'Entertainment & Experiences',
  'Other Services',
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

export interface Offer {
  id: string;
  title: string;
  description: string;
  image: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  original_price: number;
  latitude: number;
  longitude: number;
  expiry_time: number;
  expiry_hours?: number | null;
  redemption_extension_hours?: number | null;
  redemption_deadline?: number | null;
  merchant_id: string;
  merchant_name: string;
  merchant_image?: string | null;
  created_at: number;
  is_active: boolean;
  distance?: number | null;
  claimed_by_user?: boolean | null;
  quantity?: number | null;
  quantity_remaining?: number | null;
  claim_count?: number | null;
  pending_claim_count?: number | null;
  redeemed_claim_count?: number | null;
  category?: string | null;
  is_recurring?: boolean | null;
  recurring_end_date?: string | null;
  recurring_start_time?: string | null;
  scheduled_start_time?: number | null;
  merchant_address?: string | null;
  merchant_formatted_address?: string | null;
  merchant_latitude?: number | null;
  merchant_longitude?: number | null;
  merchant_phone?: string | null;
  merchant_street?: string | null;
  merchant_street_number?: string | null;
  merchant_city?: string | null;
}

export interface CreateOfferData {
  title: string;
  description?: string;
  image?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  original_price: number;
  latitude: number;
  longitude: number;
  expiry_hours: number;
  redemption_extension_hours?: number;
  quantity?: number;
  is_recurring?: boolean;
  recurring_end_date?: string;
  recurring_start_time?: string;
  scheduled_start_time?: number;
}

export interface Claim {
  id: string;
  offer_id: string;
  offer_title: string;
  user_id: string;
  claimed_at: number;
  merchant_name: string;
  merchant_image?: string | null;
  status: string;
  expiry_time?: number | null;
  extended?: boolean | null;
  verification_code?: string | null;
  verification_token?: string | null;
  redeemed_at?: number | null;
  cancelled_at?: number | null;
  payment_status?: string | null;
  cancel_deadline?: number | null;
}

export interface MerchantClaim extends Claim {
  user_email: string;
  user_name: string;
  user_image?: string | null;
}

export interface MerchantAnalytics {
  total_offers?: number;
  active_offers?: number;
  total_claims?: number;
  completed_claims?: number;
  total_revenue?: number;
  claims_today?: number;
  claims_this_week?: number;
  claims_this_month?: number;
  [key: string]: unknown;
}

export interface BookmarkItem {
  offer_id: string;
  created_at?: number;
  is_live: boolean;
  is_missing: boolean;
  offer: Pick<Offer, 'id' | 'title' | 'image' | 'category' | 'scheduled_start_time' | 'merchant_name'> | null;
}

export interface DiscoveryExpiredOffer {
  id: string;
  title: string;
  image?: string | null;
  category?: string | null;
  merchant_name?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  original_price: number;
  expired_at: number;
  distance_km: number;
}

export interface DiscoveryUpcomingOffer {
  id: string;
  title: string;
  image?: string | null;
  category?: string | null;
  merchant_name?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  original_price: number;
  scheduled_start_time: number;
  distance_km: number;
}

export interface DiscoveryNearbyBusiness {
  id: string;
  name: string;
  business_category?: string | null;
  image?: string | null;
  distance_km: number;
  formatted_address?: string | null;
}

export interface DiscoveryPayload {
  recently_expired: DiscoveryExpiredOffer[];
  claimed_today: number;
  upcoming: DiscoveryUpcomingOffer[];
  nearby_businesses: DiscoveryNearbyBusiness[];
}

export interface ScanPreview {
  claim_id: string;
  offer_id: string;
  offer_title: string;
  expiry_time: number | null;
  customer_name_masked: string;
  status: string;
  redeemable: boolean;
  block_reason: string | null;
  verification_code: string | null;
  redeemed_at: number | null;
}

export interface NearbyOptions {
  q?: string;
  category?: string;
  sort?: 'newest' | 'nearest' | 'expiring' | 'discount';
}

export async function listNearbyOffers(lat: number, lng: number, radius = 3, options: NearbyOptions = {}): Promise<Offer[]> {
  const params: Record<string, string | number> = { lat, lng, radius };
  if (options.q?.trim()) params.q = options.q.trim();
  if (options.category?.trim()) params.category = options.category.trim();
  if (options.sort) params.sort = options.sort;
  const { data } = await api.get<Offer[]>('/offers', { params });
  return data;
}

export async function getOffer(id: string, lat?: number, lng?: number): Promise<Offer> {
  const { data } = await api.get<Offer>(`/offers/${id}`, {
    params: lat != null && lng != null ? { lat, lng } : undefined,
  });
  return data;
}

export async function getDiscovery(lat: number, lng: number, radius = 10, category?: string): Promise<DiscoveryPayload> {
  const params: Record<string, string | number> = { lat, lng, radius };
  if (category?.trim()) params.category = category.trim();
  const { data } = await api.get<DiscoveryPayload>('/explore/discovery', { params });
  return data;
}

export async function claimOffer(id: string): Promise<Claim> {
  const { data } = await api.post<Claim>(`/offers/${id}/claim`);
  return data;
}

export async function bookmarkOffer(id: string): Promise<{ bookmarked: boolean }> {
  const { data } = await api.post<{ bookmarked: boolean }>(`/offers/${id}/bookmark`);
  return data;
}

export async function unbookmarkOffer(id: string): Promise<{ bookmarked: boolean }> {
  const { data } = await api.delete<{ bookmarked: boolean }>(`/offers/${id}/bookmark`);
  return data;
}

export async function listBookmarks(): Promise<BookmarkItem[]> {
  const { data } = await api.get<{ bookmarks: BookmarkItem[] }>('/me/offer-bookmarks');
  return data.bookmarks;
}

export async function syncFavoriteCategories(categories: string[]): Promise<{ success: boolean; categories: string[] }> {
  const { data } = await api.put<{ success: boolean; categories: string[] }>('/me/favorite-categories', { categories });
  return data;
}

export async function listMyClaims(): Promise<Claim[]> {
  const { data } = await api.get<Claim[]>('/claims');
  return data;
}

export async function cancelClaim(id: string): Promise<Claim> {
  const { data } = await api.put<Claim>(`/claims/${id}/cancel`);
  return data;
}

export async function createOffer(payload: CreateOfferData): Promise<Offer> {
  const { data } = await api.post<Offer>('/offers', payload);
  return data;
}

export async function updateOffer(id: string, payload: Partial<CreateOfferData & { is_active: boolean; quantity_remaining: number | null }>): Promise<Offer> {
  const { data } = await api.put<Offer>(`/offers/${id}`, payload);
  return data;
}

export async function deleteOffer(id: string): Promise<void> {
  await api.delete(`/offers/${id}`);
}

export async function cancelRemainingOffer(id: string): Promise<Offer> {
  const { data } = await api.put<Offer>(`/offers/${id}/cancel-remaining`);
  return data;
}

export async function listMerchantOffers(): Promise<Offer[]> {
  const { data } = await api.get<Offer[]>('/merchant/offers');
  return data;
}

export async function listMerchantClaims(): Promise<MerchantClaim[]> {
  const { data } = await api.get<MerchantClaim[]>('/merchant/claims');
  return data;
}

export async function redeemClaim(id: string, verificationCode?: string): Promise<MerchantClaim> {
  const { data } = await api.put<MerchantClaim>(`/claims/${id}/redeem`, {
    verification_code: verificationCode || undefined,
  });
  return data;
}

export async function scanClaimToken(token: string): Promise<ScanPreview> {
  const { data } = await api.post<ScanPreview>('/claims/scan', { token });
  return data;
}

export async function generateRecurringOffers(): Promise<{ created: number; date: string }> {
  const { data } = await api.post<{ created: number; date: string }>('/merchant/generate-recurring');
  return data;
}

export async function toggleRecurringOffer(id: string): Promise<{ offer_id: string; is_recurring: boolean }> {
  const { data } = await api.put<{ offer_id: string; is_recurring: boolean }>(`/merchant/offers/${id}/toggle-recurring`);
  return data;
}

export async function merchantAnalytics(params: Record<string, string | number> = {}): Promise<MerchantAnalytics> {
  const { data } = await api.get<MerchantAnalytics>('/merchant/analytics', { params });
  return data;
}

export async function listCategories(): Promise<string[]> {
  const { data } = await api.get<string[]>('/categories');
  return Array.isArray(data) && data.length ? data : [...BUSINESS_CATEGORIES];
}
