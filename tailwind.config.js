/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        glow: {
          indigo: '#6366f1',
          emerald: '#10b981',
          violet: '#8b5cf6',
          amber: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}

