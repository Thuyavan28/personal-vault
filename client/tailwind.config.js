/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#cc001e',
          hover: '#b00019',
          light: '#e61937',
          glow: 'rgba(204, 0, 30, 0.3)',
          subtle: 'rgba(204, 0, 30, 0.1)',
        },
        surface: {
          DEFAULT: '#f0f4f5',
          card: '#ffffff',
          alt: '#f0f4f5',
          hover: '#e3eaed',
          border: '#0e0e0e',
          'border-dark': '#0e0e0e'
        },
        dark: {
          DEFAULT: '#0e0e0e',
          card: '#0e0e0e',
        },
        text: {
          primary: '#0e0e0e',
          secondary: '#0e0e0e',
          muted: '#555555'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(14, 14, 14, 0.05)',
        'card': '0 4px 12px rgba(14, 14, 14, 0.06)',
        'card-hover': '0 8px 24px rgba(204, 0, 30, 0.16)',
        'modal': '0 20px 60px rgba(14, 14, 14, 0.25)',
        'neon': '0 0 15px rgba(204, 0, 30, 0.35)',
        'neon-sm': '0 0 8px rgba(204, 0, 30, 0.2)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.98)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' }
        },
        tapBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shake': 'shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'tap': 'tapBounce 0.15s ease-out'
      }
    },
  },
  plugins: [],
}
