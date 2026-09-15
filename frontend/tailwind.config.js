/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        'surface-hover': '#24334a',
        border: '#334155',
        'primary-accent': '#6366f1',
        p0: '#ef4444',
        p1: '#f97316',
        p2: '#eab308',
        p3: '#22c55e',
        'text-primary': '#f1f5f9',
        'text-muted': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
        badge: '4px',
      }
    },
  },
  plugins: [],
}
