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
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
