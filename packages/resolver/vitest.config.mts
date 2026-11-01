import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/resolver',
  test: {
    name: 'resolver',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: '../../coverage/packages/resolver/test-report.junit.xml',
    },
    coverage: {
      reportsDirectory: '../../coverage/packages/resolver',
      provider: 'v8' as const,
    },
  },
}));
