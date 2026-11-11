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
        climate: {
          navy: '#0b132b',
          deep: '#1c2541',
          teal: '#3a506b',
          cyan: '#5bc0be',
          sky: '#6fffe9',
          surface: '#f8fafc',
          card: '#ffffff',
          darkCard: '#1e293b',
          darkBg: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}

