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
        dark: {
          base: '#090d16',
          surface: '#0e1422',
          elevated: '#141c2e',
          overlay: '#1a243a',
          border: '#1e293b',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
