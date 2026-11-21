/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navidad: { DEFAULT: '#B3122E', dark: '#7E0B1F', light: '#D6304B' },
        pino: { DEFAULT: '#1F4D3A', dark: '#12321F', light: '#2E6B52' },
        oro: { DEFAULT: '#C9A24A', light: '#E7CD86', dark: '#9C7A2E' },
        crema: { DEFAULT: '#FBF6EC', dark: '#F1E7D3' },
        tinta: '#2A1A14',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(201,162,74,.35), 0 10px 40px -10px rgba(201,162,74,.45)',
        sheet: '0 -12px 40px -12px rgba(42,26,20,.35)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'none' } },
        twinkle: { '0%,100%': { opacity: .2 }, '50%': { opacity: 1 } },
        fall: { '0%': { transform: 'translateY(-10vh)' }, '100%': { transform: 'translateY(110vh)' } },
      },
      animation: {
        fadeUp: 'fadeUp .5s ease-out both',
        twinkle: 'twinkle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
