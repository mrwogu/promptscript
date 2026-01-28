/// <reference types='vitest' />
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// Read version from CLI package.json (source of truth for releases)
const cliPackagePath = resolve(__dirname, '../cli/package.json');
const cliPackage = JSON.parse(readFileSync(cliPackagePath, 'utf-8')) as { version: string };

export default defineConfig({
  root: __dirname,
  base: './',
  cacheDir: '../../node_modules/.vite/packages/playground',
  plugins: [react(), nxViteTsPaths()],
  define: {
    __APP_VERSION__: JSON.stringify(cliPackage.version),
  },
  resolve: {
    alias: {
      // Provide browser shims for Node.js modules used by dependencies
      fs: resolve(__dirname, '../browser-compiler/src/shims/fs.ts'),
      path: 'path-browserify',
    },
  },
  build: {
    outDir: '../../dist/packages/playground',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  test: {
    name: 'playground',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/playground',
      provider: 'v8' as const,
    },
  },
});
