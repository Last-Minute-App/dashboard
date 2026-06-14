import axios, { AxiosInstance } from 'axios';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'https://last-minute-app-904761941913.europe-west1.run.app';

const TOKEN_KEY = 'lmd_jwt';

export function getStoredToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore (private mode etc.) */
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 20000,
});

// Attach JWT to every request when present.
api.interceptors.request.use((cfg) => {
  const tok = getStoredToken();
  if (tok) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>).Authorization = `Bearer ${tok}`;
  }
  return cfg;
});

// Auto-logout on 401 (token expired/invalidated). 403 is intentionally
// NOT auto-logout — banned users get 403 too, but rendering a clear
// “Account suspended” screen is more helpful than silently bouncing
// them back to login.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      const here = window.location.pathname;
      if (!here.endsWith('/login')) {
        setStoredToken(null);
        // Soft-redirect; AuthContext picks it up on next render.
        window.dispatchEvent(new Event('lmd:logout'));
      }
    }
    return Promise.reject(err);
  },
);

// Normalise a FastAPI / axios error into a user-readable string.
// Mirrors the mobile-side `normalizeBackendError` so the UX is consistent.
export function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as any;
  const detail = e?.response?.data?.detail;
  if (detail == null) return e?.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((d: any) => d?.msg).filter((m: any) => typeof m === 'string');
    if (msgs.length) return msgs.join('; ');
  }
  if (typeof detail === 'object' && typeof detail.msg === 'string') return detail.msg;
  return fallback;
}
