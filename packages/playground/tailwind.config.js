import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [resolve(__dirname, 'index.html'), resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}')],
  theme: {
    extend: {
      colors: {
        'ps-primary': '#6366f1',
        'ps-secondary': '#818cf8',
        'ps-bg': '#0f172a',
        'ps-surface': '#1e293b',
        'ps-border': '#334155',
      },
    },
  },
  plugins: [],
};
