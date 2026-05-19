import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 18px 50px rgba(2, 6, 23, 0.22)',
      },
    },
  },
  plugins: [],
} satisfies Config;
