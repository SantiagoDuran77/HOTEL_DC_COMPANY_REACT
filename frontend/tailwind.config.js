/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#032854', // Color principal
          600: '#02203d',
          700: '#01182f',
          800: '#011020',
          900: '#000811',
        },
        secondary: {
          50: '#fdfaf3',
          100: '#f9f0d9',
          200: '#f2e0b3',
          300: '#e8cf8d',
          400: '#dbbf67',
          500: '#a28741', // Color secundario
          600: '#8a7236',
          700: '#725d2b',
          800: '#5a4820',
          900: '#423315',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#828282', // Gris corporativo
          600: '#6b7280',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    },
  },
  plugins: [],
}