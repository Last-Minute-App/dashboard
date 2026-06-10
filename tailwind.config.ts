import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mirrors the mobile app's accent colour for visual continuity.
        brand: {
          DEFAULT: '#FF6B35',
          50:  '#FFF1EA',
          100: '#FFE0CC',
          500: '#FF6B35',
          600: '#E0511C',
          700: '#B23F14',
        },
        ink: {
          900: '#0F1B2D',
          800: '#1F2937',
          700: '#374151',
          500: '#6B7280',
          300: '#D1D5DB',
          100: '#F3F4F6',
          50:  '#F9FAFB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
