/// <reference types='vitest' />
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/resolver',
  // Uncomment this if you are using workers.
  // worker: {
  //   plugins: [],
  // },
  test: {
    name: 'resolver',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/resolver',
      provider: 'v8' as const,
    },
  },
}));
