import { api } from './client';

export type Role = 'consumer' | 'merchant' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  business_category?: string | null;
  image?: string | null;
  language?: 'en' | 'el' | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/login', { email, password });
  return data;
}

export async function register(payload: {
  email: string; password: string; name: string;
  role: 'consumer' | 'merchant';
  business_category?: string;
}): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/register', payload);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function adminStats(): Promise<any> {
  const { data } = await api.get('/admin/stats');
  return data;
}

export async function adminListUsers(params: {
  role?: Role; banned?: boolean; q?: string; limit?: number; skip?: number;
} = {}): Promise<{ total: number; items: any[]; skip: number; limit: number }> {
  const { data } = await api.get('/admin/users', { params });
  return data;
}

export async function adminBanUser(id: string, reason?: string): Promise<void> {
  await api.put(`/admin/users/${id}/ban`, { reason: reason ?? null });
}

export async function adminUnbanUser(id: string): Promise<void> {
  await api.put(`/admin/users/${id}/unban`);
}

export interface AdminOfferRow {
  id: string;
  title: string;
  merchant_id: string;
  merchant_name: string;
  merchant_email: string | null;
  original_price: number | null;
  discounted_price: number | null;
  expiry_time_ms: number | null;
  is_active: boolean;
  category: string | null;
  quantity: number | null;
  quantity_remaining: number | null;
  created_at: number | null;
}

export async function adminListOffers(params: {
  status?: 'active' | 'expired'; q?: string; limit?: number; skip?: number;
} = {}): Promise<{ total: number; items: AdminOfferRow[]; skip: number; limit: number }> {
  const { data } = await api.get('/admin/offers', { params });
  return data;
}

export async function adminDeleteOffer(id: string): Promise<void> {
  await api.delete(`/admin/offers/${id}`);
}
