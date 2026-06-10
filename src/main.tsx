import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// ─── GitHub Pages SPA deep-link reconstruction ──────────────────────
// public/404.html rewrites /dashboard/<path> → /dashboard/?p=/<path>&q=<qs>
// On boot, decode the `p` and `q` params back into a real URL so
// React Router sees the intended route on first paint.
(function restoreDeepLinkFrom404() {
  const url = new URL(window.location.href);
  const p = url.searchParams.get('p');
  if (p) {
    const q = url.searchParams.get('q');
    const restored =
      url.origin +
      url.pathname.replace(/\/$/, '') +
      p.replace(/~and~/g, '&') +
      (q ? '?' + q.replace(/~and~/g, '&') : '') +
      url.hash;
    window.history.replaceState(null, '', restored);
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/dashboard">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
