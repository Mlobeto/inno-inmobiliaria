/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Fondos ──────────────────────────────────────────────
        bgBase: '#0B0E0C',
        bgSurface: '#111714',
        bgElevated: '#161D19',

        // ── Acento principal — verde sage del logo ───────────────
        brand: {
          DEFAULT: '#5A8C72',
          dark: '#3D6B58',
          light: '#7FB99A',
          muted: '#2A4A3A',
          subtle: '#1A2D24',
        },

        // ── Textos ───────────────────────────────────────────────
        textPrimary: '#F0F4F2',
        textSecondary: '#8FA89C',
        textMuted: '#5A7066',
        textWhite: '#FFFFFF',

        // ── Bordes ───────────────────────────────────────────────
        borderBase: 'rgba(90,140,114,0.15)',
        borderStrong: 'rgba(90,140,114,0.30)',

        // ── Estados semánticos ───────────────────────────────────
        customRed: '#C0392B',
        customRedDark: '#922B21',
        customRedMuted: '#2D1010',

        customYellow: '#D4930A',
        customYellowMuted: '#2D2010',

        customGreen: '#5A8C72',
        customGreenDark: '#3D6B58',

        customBlue: '#3A6EA8',
        customBlueMuted: '#101E2D',

        // ── Legados (compatibilidad con clases existentes) ───────
        boton: '#5A8C72',
        secondary: '#8FA89C',
        customPurple: '#5A8C72',
        customPink: '#7FB99A',
        footer: '#0B0E0C',
      },
      fontFamily: {
        Montserrat: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        brand: '0 0 0 1px rgba(90,140,114,0.25)',
        brandGlow: '0 4px 24px rgba(90,140,114,0.15)',
      },
    },
  },
  plugins: [],
};
