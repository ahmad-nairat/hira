import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0E',
        'bg-app': '#0E0E14',
        surface: { DEFAULT: '#13131B', 2: '#181822', 3: '#1E1E2A', hover: '#20202C' },
        border: { DEFAULT: '#25252F', strong: '#34343F', soft: '#1B1B23' },
        ink: {
          DEFAULT: '#F4F4F7',
          2: '#C8C8D2',
          3: '#898997',
          4: '#5F5F6B',
          5: '#3F3F4A',
        },
        primary: {
          DEFAULT: '#6D5EF7',
          hover: '#7e71f8',
          active: '#5b4ce4',
          soft: 'rgba(109, 94, 247, 0.14)',
          'soft-strong': 'rgba(109, 94, 247, 0.22)',
          br: 'rgba(109, 94, 247, 0.40)',
          ink: '#b3a8fc',
        },
        green: {
          DEFAULT: '#3FCB7E',
          soft: 'rgba(63, 203, 126, 0.14)',
          br: 'rgba(63, 203, 126, 0.35)',
          ink: '#6cdf9f',
        },
        amber: {
          DEFAULT: '#F4A857',
          soft: 'rgba(244, 168, 87, 0.14)',
          br: 'rgba(244, 168, 87, 0.35)',
          ink: '#f8c089',
        },
        rose: {
          DEFAULT: '#FF6B7B',
          soft: 'rgba(255, 107, 123, 0.13)',
          br: 'rgba(255, 107, 123, 0.32)',
          ink: '#ff95a1',
        },
        blue: {
          DEFAULT: '#5B9DF8',
          soft: 'rgba(91, 157, 248, 0.14)',
          br: 'rgba(91, 157, 248, 0.32)',
          ink: '#84b6fa',
        },
        teal: {
          DEFAULT: '#3DBFB1',
          soft: 'rgba(61, 191, 177, 0.14)',
          br: 'rgba(61, 191, 177, 0.32)',
          ink: '#6cd0c4',
        },
        pink: {
          DEFAULT: '#E370C7',
          soft: 'rgba(227, 112, 199, 0.14)',
          br: 'rgba(227, 112, 199, 0.32)',
          ink: '#ec9bd6',
        },
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Fraunces', 'Times New Roman', 'serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['10.5px', '14px'],
        xs: ['11.5px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
      boxShadow: {
        pop: '0 12px 32px rgba(0, 0, 0, 0.5)',
        modal: '0 30px 80px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease',
        'scale-in': 'scaleIn 180ms cubic-bezier(0.32, 0.72, 0, 1)',
        shake: 'shake 0.4s',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [forms({ strategy: 'class' })],
} satisfies Config
