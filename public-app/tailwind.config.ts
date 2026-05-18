import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marketing / 404 — dark
        'dark-bg': '#0A0A12',
        'dark-surface': '#14141F',
        'dark-surface-2': '#16161F',
        'dark-border': 'rgba(255, 255, 255, 0.08)',
        'dark-border-soft': 'rgba(255, 255, 255, 0.04)',
        'dark-text': '#FFFFFF',
        'dark-text-2': '#D9D6E5',
        'dark-text-3': '#8B87A3',
        'dark-text-4': '#5E5B76',
        'dark-grid': '#3A3A48',
        'mk-purple': '#8B6FFF',
        'mk-purple-2': '#A48FFF',
        'mk-green': '#4ADE80',
        'mk-amber': '#F5A524',
        // Careers / Job / Apply / Offer — light
        ink: '#0D1832',
        'ink-2': '#5B6478',
        'ink-3': '#8A92A6',
        surface: '#FFFFFF',
        'surface-2': '#F3F5FA',
        'surface-3': '#E8ECF3',
        'lt-border': '#E2E6EF',
        brand: {
          DEFAULT: '#3B6DF0',
          ink: '#1E48BA',
          soft: 'rgba(59, 109, 240, 0.06)',
          'soft-strong': 'rgba(59, 109, 240, 0.12)',
        },
        rose: '#E54664',
        amber: '#E5A524',
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        instr: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '15px'],
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(13, 24, 50, 0.04), 0 1px 3px rgba(13, 24, 50, 0.04)',
        modal: '0 30px 80px rgba(13, 24, 50, 0.16)',
        lift: '0 12px 32px rgba(13, 24, 50, 0.08)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease',
        'scale-in': 'scaleIn 180ms cubic-bezier(0.32, 0.72, 0, 1)',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [forms({ strategy: 'class' })],
} satisfies Config
