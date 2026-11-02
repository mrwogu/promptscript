import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/formatters',
  test: {
    name: 'formatters',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: '../../coverage/packages/formatters/test-report.junit.xml',
    },
    coverage: {
      reportsDirectory: '../../coverage/packages/formatters',
      provider: 'v8' as const,
    },
  },
}));
