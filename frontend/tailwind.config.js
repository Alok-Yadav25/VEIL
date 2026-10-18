/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          bg: '#07080C',
          sub: '#0B0D13',
          card: '#11141D',
          interactive: '#171B26',
          text: '#F4F5F7',
          secondary: '#A1A7B5',
          muted: '#737B8C',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-strong': 'rgba(255, 255, 255, 0.14)',
        },
        accent: {
          violet: '#A78BFA',
          'violet-hover': '#9061F9',
          cyan: '#67E8F9',
          'cyan-hover': '#22D3EE',
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
        },
        midnight: {
          950: '#06090F',
          900: '#0B0F17',
          800: '#111726',
          700: '#1A233A',
        },
        surface: {
          dark: '#111827',
          'dark-elevated': '#1E293B',
          'dark-highlight': '#334155',
          light: '#F8FAFC',
          'light-elevated': '#FFFFFF',
          'light-highlight': '#E2E8F0',
        },
        brand: {
          violet: '#8B5CF6',
          'violet-hover': '#7C3AED',
          'violet-light': '#DDD6FE',
          cyan: '#06B6D4',
          'cyan-hover': '#0891B2',
          'cyan-light': '#CFFAFE',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
