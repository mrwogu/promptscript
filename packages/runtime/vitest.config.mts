import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/runtime',
  test: {
    name: 'runtime',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: '../../coverage/packages/runtime/test-report.junit.xml',
    },
    coverage: {
      reportsDirectory: '../../coverage/packages/runtime',
      provider: 'v8' as const,
    },
  },
}));
