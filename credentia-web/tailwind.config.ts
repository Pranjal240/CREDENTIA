import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import animate from 'tailwindcss-animate'

// Every colour reads a space separated RGB triplet from globals.css so that
// opacity modifiers such as bg-brand/20 keep working.
const rgb = (name: string) => `rgb(var(${name}) / <alpha-value>)`

const smoothSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000] as const
const smooth = Object.fromEntries(smoothSteps.map((s) => [s, rgb(`--smooth-${s}`)]))

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        background: rgb('--background'),
        foreground: rgb('--foreground'),
        card: { DEFAULT: rgb('--card'), foreground: rgb('--card-foreground') },
        popover: { DEFAULT: rgb('--popover'), foreground: rgb('--popover-foreground') },
        primary: { DEFAULT: rgb('--primary'), foreground: rgb('--primary-foreground') },
        secondary: { DEFAULT: rgb('--secondary'), foreground: rgb('--secondary-foreground') },
        muted: { DEFAULT: rgb('--muted'), foreground: rgb('--muted-foreground') },
        accent: {
          DEFAULT: rgb('--accent'),
          foreground: rgb('--accent-foreground'),
          hover: rgb('--brand-hover'),
        },
        destructive: {
          DEFAULT: rgb('--destructive'),
          top: rgb('--destructive-top'),
          fg: rgb('--destructive-fg'),
          foreground: rgb('--destructive-fg'),
        },
        border: rgb('--border'),
        input: rgb('--input'),
        ring: rgb('--ring'),
        brand: {
          DEFAULT: rgb('--brand'),
          hover: rgb('--brand-hover'),
          secondary: rgb('--brand-secondary'),
          ink: rgb('--brand-ink'),
        },
        'on-brand': rgb('--on-brand'),
        success: rgb('--success'),
        warning: rgb('--warning'),
        danger: rgb('--danger'),
        smooth,
        // There is deliberately no `base` colour: it would also turn the `text-base` font size
        // utility into a colour and paint headings black.
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin-slow': 'spin 4s linear infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
      },
    },
  },
  plugins: [
    animate,
    // Input capability variants used by the SmoothUI ports (44px touch targets on touch screens).
    plugin(({ addVariant }) => {
      addVariant('pointer-coarse', '@media (pointer: coarse)')
      addVariant('pointer-fine', '@media (pointer: fine)')
    }),
  ],
}

export default config
