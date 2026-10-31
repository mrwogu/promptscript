/// <reference types='vitest' />
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

const browserFsShim = resolve(__dirname, 'src/shims/fs.ts');

export const BROWSER_NODE_ALIASES = {
  fs: browserFsShim,
  path: 'path-browserify',
  'node:path': 'path-browserify',
} as const;

// nxCopyAssetsPlugin skips gitignored folders, and dist is one of them.
// The declarations come from the typecheck target, which build depends on.
const copyPackageFiles = (): Plugin => ({
  name: 'copy-package-files',
  writeBundle(options) {
    const outDir = options.dir ?? resolve(__dirname, '../../dist/packages/browser-compiler');
    cpSync(
      resolve(__dirname, '../../dist/declarations/browser-compiler/packages/browser-compiler/src'),
      resolve(outDir, 'types'),
      { recursive: true, filter: (src) => !src.endsWith('.map') }
    );
    cpSync(resolve(__dirname, '../../LICENSE'), resolve(outDir, 'LICENSE'));
  },
});

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/browser-compiler',
  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md']), copyPackageFiles()],
  resolve: {
    // Keep prefixed imports browser-safe after the Deno portability sweep.
    alias: BROWSER_NODE_ALIASES,
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'BrowserCompiler',
      formats: ['es'] as const,
      fileName: 'index',
    },
    rollupOptions: {
      // Don't externalize - bundle everything for browser use
      external: [],
    },
    target: 'es2020',
    minify: false,
    emptyOutDir: true,
  },
  test: {
    name: 'browser-compiler',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/browser-compiler',
      provider: 'v8' as const,
    },
  },
}));
