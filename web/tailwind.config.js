/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1120',
        surface: '#111A2E',
        surfaceHover: '#182540',
        accent: '#3B82F6',
        cyan: '#22D3EE',
        positive: '#10B981',
        negative: '#F43F5E',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glass: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        glow: '0 0 15px rgba(59, 130, 246, 0.15)',
      },
      borderColor: {
        glass: 'rgba(255,255,255,0.06)'
      }
    },
  },
  plugins: [],
}
