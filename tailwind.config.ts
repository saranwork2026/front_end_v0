import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

// Tailwind v3 translation of the previous v4 `@theme` block. Every color maps to the
// CSS custom properties defined in src/index.css so the palette matches 1:1.
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        gold: { DEFAULT: 'var(--gold)', foreground: 'var(--gold-foreground)', soft: 'var(--gold-soft)' },
        heart: { DEFAULT: 'var(--heart)', foreground: 'var(--heart-foreground)', soft: 'var(--heart-soft)' },
        cream: { DEFAULT: 'var(--cream)', deep: 'var(--cream-deep)' },
        success: { DEFAULT: 'var(--success)', foreground: 'var(--success-foreground)', soft: 'var(--success-soft)' },
        warning: { DEFAULT: 'var(--warning)', foreground: 'var(--warning-foreground)', soft: 'var(--warning-soft)' },
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'ui-serif', 'Georgia', 'serif'],
      },
      keyframes: {
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out both',
        rise: 'rise 0.5s ease-out both',
      },
    },
  },
  plugins: [animate],
} satisfies Config
