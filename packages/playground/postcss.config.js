import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: {
      config: resolve(__dirname, 'tailwind.config.js'),
    },
    autoprefixer: {},
  },
};
