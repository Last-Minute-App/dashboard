import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, login as apiLogin, register as apiRegister, User } from '../api/auth';
import { getStoredToken, setStoredToken } from '../api/client';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (p: Parameters<typeof apiRegister>[0]) => Promise<User>;
  logout: () => void;
  reloadMe: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: if a stored JWT exists, try to resolve it into a /auth/me
  // response. Failures (expired, banned, etc.) silently drop the token.
  useEffect(() => {
    const tok = getStoredToken();
    if (!tok) { setLoading(false); return; }
    (async () => {
      try {
        const me = await fetchMe();
        setUser(me);
      } catch {
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Global logout signal from axios 401 interceptor.
  useEffect(() => {
    const onLogout = () => { setUser(null); setStoredToken(null); };
    window.addEventListener('lmd:logout', onLogout);
    return () => window.removeEventListener('lmd:logout', onLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const r = await apiLogin(email, password);
    setStoredToken(r.access_token);
    setUser(r.user);
    return r.user;
  }, []);

  const register = useCallback<AuthState['register']>(async (p) => {
    setError(null);
    const r = await apiRegister(p);
    setStoredToken(r.access_token);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const reloadMe = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      setUser(null);
      setStoredToken(null);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, error, login, register, logout, reloadMe }),
    [user, loading, error, login, register, logout, reloadMe],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
