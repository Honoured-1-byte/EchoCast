/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-custom': 'music-bounce 1s infinite',
      },
      keyframes: {
        'music-bounce': {
          '0%, 100%': { height: '10%' },
          '50%': { height: '100%' },
        }
      }
    },
  },
  plugins: [],
}