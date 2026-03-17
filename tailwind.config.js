/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dashboard-bg': '#f0f2f5',
        'card-bg': '#ffffff',
        'teal-dark': '#1b4f62',
        'teal-mid': '#247a8a',
        'teal-light': '#2e9db5',
        'gold': '#e8a020',
        'text-main': '#1e2d3a',
        'muted': '#6b7d8c',
        'border': '#dde3ea',
        'positive': '#1a9650',
        'negative': '#d62728',
        'neutral': '#f4a018',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(27,79,98,0.09)',
      },
      borderRadius: {
        'card': '10px',
      },
    },
  },
  plugins: [],
}
