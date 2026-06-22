import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        serif: [
          'var(--font-playfair)',
          'Georgia',
          'serif',
        ],
        mono: [
          '"SF Mono"',
          'SFMono-Regular',
          '"Fira Code"',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2D6A4F',
          600: '#1B4332',
          700: '#163829',
          800: '#112d21',
          900: '#0c2118',
          950: '#061310',
        },
        gold: {
          400: '#F5D07A',
          500: '#E4A835',
          600: '#C9901A',
          700: '#A97515',
        },
      },
    },
  },
  plugins: [],
}

export default config
