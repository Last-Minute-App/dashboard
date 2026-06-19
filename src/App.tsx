import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import AppShell from './layouts/AppShell';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import ConsumerHome from './pages/consumer/ConsumerHome';
import ConsumerClaims from './pages/consumer/ConsumerClaims';
import ConsumerBookmarks from './pages/consumer/ConsumerBookmarks';
import ConsumerMap from './pages/consumer/ConsumerMap';
import ConsumerOfferDetail from './pages/consumer/ConsumerOfferDetail';
import PartnerHome from './pages/partner/PartnerHome';
import PartnerAnalytics from './pages/partner/PartnerAnalytics';
import PartnerOffers from './pages/partner/PartnerOffers';
import PartnerClaims from './pages/partner/PartnerClaims';
import PartnerScanner from './pages/partner/PartnerScanner';
import AdminHome from './pages/admin/AdminHome';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOffers from './pages/admin/AdminOffers';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Authenticated shell — children render inside the sidebar layout. */}
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          {/* CONSUMER ROOT (also default landing for unmatched roles) */}
          <Route path="/"        element={<RoleRouter />} />
          <Route path="/map"     element={<RequireAuth roles={['consumer']}><ConsumerMap /></RequireAuth>} />
          <Route path="/saved"   element={<RequireAuth roles={['consumer']}><ConsumerBookmarks /></RequireAuth>} />
          <Route path="/offers/:id" element={<RequireAuth roles={['consumer']}><ConsumerOfferDetail /></RequireAuth>} />
          <Route path="/claims"  element={<RequireAuth roles={['consumer']}><ConsumerClaims /></RequireAuth>} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* PARTNER */}
          <Route path="/partner"          element={<RequireAuth roles={['merchant']}><PartnerHome /></RequireAuth>} />
          <Route path="/partner/analytics" element={<RequireAuth roles={['merchant']}><PartnerAnalytics /></RequireAuth>} />
          <Route path="/partner/offers"   element={<RequireAuth roles={['merchant']}><PartnerOffers /></RequireAuth>} />
          <Route path="/partner/claims"   element={<RequireAuth roles={['merchant']}><PartnerClaims /></RequireAuth>} />
          <Route path="/partner/scan"     element={<RequireAuth roles={['merchant']}><PartnerScanner /></RequireAuth>} />

          {/* ADMIN */}
          <Route path="/admin"        element={<RequireAuth roles={['admin']}><AdminHome /></RequireAuth>} />
          <Route path="/admin/users"  element={<RequireAuth roles={['admin']}><AdminUsers /></RequireAuth>} />
          <Route path="/admin/offers" element={<RequireAuth roles={['admin']}><AdminOffers /></RequireAuth>} />
        </Route>

        {/* Catch-all — send to login if not authed, else to role home. */}
        <Route path="*" element={<RoleRouter fallback />} />
      </Routes>
    </AuthProvider>
  );
}

/**
 * Sends each role to its natural landing page. Used both for "/" and for
 * any unknown route (so deep-linked URLs don't 404 on the SPA itself).
 */
function RoleRouter({ fallback = false }: { fallback?: boolean }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')    return <Navigate to="/admin" replace />;
  if (user.role === 'merchant') return <Navigate to="/partner" replace />;
  // consumer
  return fallback ? <Navigate to="/" replace /> : <ConsumerHome />;
}
