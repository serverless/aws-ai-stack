/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        sm: '100%', // Full width on small screens
        md: '640px', // Maximum width of 640px on medium screens
        lg: '768px', // Maximum width of 768px on large screens
        xl: '1024px', // Maximum width of 1024px on extra-large screens
        '2xl': '1200px', // Maximum width of 1200px on double-extra-large screens
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FD5750',
          dark: '#FF746F',
        },
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(-2px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
};
