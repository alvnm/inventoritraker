/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0a08',
          900: '#12100c',
          850: '#171410',
          800: '#1d1914',
          700: '#2a241b',
          600: '#3a3123',
          500: '#554836',
        },
        gold: {
          300: '#e8ce7a',
          400: '#d9b64a',
          500: '#c9a227',
          600: '#a3811c',
        },
        blood: {
          500: '#b03a3a',
          600: '#8f2626',
          700: '#6e1a1a',
        },
        parchment: '#e8ddc0',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(201,162,39,0.12), 0 8px 24px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
};
