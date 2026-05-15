/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'serif']
      },
      colors: {
        ink: '#0f172a',
        paper: '#f8f5ef',
        ember: '#d97706',
        sea: '#0f766e',
        moss: '#166534'
      },
      boxShadow: {
        glow: '0 20px 60px rgba(15, 23, 42, 0.16)'
      }
    }
  },
  plugins: []
};
