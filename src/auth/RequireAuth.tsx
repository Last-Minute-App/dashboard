import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from '../api/auth';

/**
 * Gate a subtree behind authentication AND (optionally) one or more roles.
 *
 * Usage:
 *   <RequireAuth>                 — any logged-in user
 *   <RequireAuth roles={['admin']}>
 *   <RequireAuth roles={['merchant', 'admin']}>
 */
export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-ink-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    // Authenticated but wrong role → bounce to their natural home.
    const home = user.role === 'admin' ? '/admin'
               : user.role === 'merchant' ? '/partner'
               : '/';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
