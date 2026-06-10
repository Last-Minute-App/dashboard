import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: GitHub Pages publishes the site under /dashboard/ on the
// organisation page https://last-minute-app.github.io/. Setting `base`
// makes Vite emit asset URLs prefixed with that sub-path so the bundle
// resolves correctly both in production AND in `vite preview`.
export default defineConfig({
  plugins: [react()],
  base: '/dashboard/',
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
  },
});
