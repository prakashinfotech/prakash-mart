import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    { pattern: /^from-/ },
    { pattern: /^to-/ },
    { pattern: /^via-/ },
    { pattern: /^bg-gradient-/ },
  ],
  theme: {
    extend: {
      colors: {
        primary: '#006FEE',
        'primary-dark': '#005BC4',
        'primary-tint': '#CCE3FD',
        'primary-50': '#E6F1FE',
        accent: '#7828C8',
        'accent-dark': '#5E18A2',
        'accent-tint': '#E4D4F4',
        ink: '#11181C',
        'ink-2': '#27272A',
        muted: '#71717A',
        'muted-2': '#A1A1AA',
        border: '#E4E4E7',
        'border-soft': '#F0F0F1',
        surface: '#FFFFFF',
        'surface-2': '#F4F4F5',
        'bg-page': '#FAFAFA',
        success: '#17C964',
        'success-tint': '#D1FAE5',
        warning: '#F5A524',
        'warning-tint': '#FEF3C7',
        error: '#F31260',
        'error-tint': '#FFE4E6',
        discount: '#17C964',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['12px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.5' }],
        md: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.4' }],
        xl: ['22px', { lineHeight: '1.3' }],
        '2xl': ['28px', { lineHeight: '1.2' }],
        '3xl': ['40px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        md: '14px',
        lg: '20px',
        pill: '999px',
      },
      boxShadow: {
        1: '0 1px 2px rgba(17,24,28,.04), 0 1px 4px rgba(17,24,28,.04)',
        2: '0 4px 8px -2px rgba(17,24,28,.06), 0 2px 4px -1px rgba(17,24,28,.04)',
        3: '0 12px 24px -6px rgba(17,24,28,.10), 0 4px 8px -2px rgba(17,24,28,.05)',
        glow: '0 0 0 4px #CCE3FD',
      },
      maxWidth: { container: '1320px' },
      transitionDuration: { DEFAULT: '150ms', slow: '220ms' },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (u: Record<string, unknown>) => void }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.tnum': {
          'font-variant-numeric': 'tabular-nums',
        },
      })
    },
  ],
} satisfies Config
