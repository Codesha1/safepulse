/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/index.html', './client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065' },
        mint: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46' },
        ink: { 900: '#1e1b4b', 700: '#3b3a5c', 500: '#64648a', 400: '#8584a8' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', '"Plus Jakarta Sans Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(76, 29, 149, 0.10)',
        glow: '0 0 40px rgba(124, 58, 237, 0.35)',
        mint: '0 0 36px rgba(16, 185, 129, 0.35)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        pulseRing: { '0%': { transform: 'scale(.8)', opacity: '.7' }, '100%': { transform: 'scale(2.1)', opacity: '0' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        rise: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        dash: { to: { strokeDashoffset: '0' } },
        progress: { '0%': { width: '0%' }, '100%': { width: '100%' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2.8s cubic-bezier(.2,.6,.3,1) infinite',
        shimmer: 'shimmer 1.6s infinite',
        rise: 'rise .5s ease-out both',
        dash: 'dash 2.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
