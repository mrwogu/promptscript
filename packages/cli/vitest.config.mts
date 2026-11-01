import { configDefaults, defineConfig } from 'vitest/config';

/**
 * Specs that compile in a temp project, run Git, the CLI or the output worker as a process,
 * or load the whole CLI module graph. On a loaded runner one of them can take longer than
 * the 5 s that keeps a hanging unit spec visible, so they get their own timeout. Name a new
 * spec like that `*.integration.spec.ts` and it lands here by itself.
 *
 * `include` sits in the unit project only: with `extends: true` the root `include` would be
 * merged into this list and every spec would run twice.
 */
const INTEGRATION_SPECS = [
  '{src,tests}/**/*.integration.spec.ts',
  // A real compile, of a temp project or of the fixtures
  'src/__tests__/application-prompt-examples.spec.ts',
  'src/__tests__/application-prompts-guide.spec.ts',
  'src/__tests__/init-migrate-e2e.spec.ts',
  'src/__tests__/policy-engine-guide.spec.ts',
  'src/__tests__/prompt-bundle-parity.spec.ts',
  'src/__tests__/prompts-validation.spec.ts',
  'src/__tests__/runtime-contract.spec.ts',
  'src/commands/__tests__/check-policies.spec.ts',
  'src/commands/__tests__/validate-fix.spec.ts',
  'src/utils/__tests__/prompt-bundle-vectors.spec.ts',
  // Git, the CLI or the managed output worker as a child process
  'src/__tests__/bundle-smoke.spec.ts',
  'src/__tests__/managed-output-worker.spec.ts',
  'src/__tests__/update-check-smoke.spec.ts',
  'src/commands/approve/approve.spec.ts',
  'src/commands/approve/records.spec.ts',
  'src/commands/release/release-commands.spec.ts',
  'src/utils/__tests__/managed-output-worker-path.spec.ts',
  // The whole command graph on a cold import
  'src/__tests__/check-command.spec.ts',
  'src/__tests__/cli-flags.spec.ts',
  'src/__tests__/cli-guard-run.spec.ts',
  'src/__tests__/cli.spec.ts',
];

/** Long enough for a slow runner, short enough that a real hang still ends the job. */
const INTEGRATION_TIMEOUT_MS = 60_000;

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/cli',
  test: {
    name: 'cli',
    watch: false,
    globals: true,
    environment: 'node',
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/cli',
      provider: 'v8' as const,
    },
    projects: [
      {
        extends: true as const,
        test: {
          name: 'cli',
          include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          exclude: [...configDefaults.exclude, ...INTEGRATION_SPECS],
        },
      },
      {
        extends: true as const,
        test: {
          name: 'cli-integration',
          include: INTEGRATION_SPECS,
          testTimeout: INTEGRATION_TIMEOUT_MS,
          hookTimeout: INTEGRATION_TIMEOUT_MS,
        },
      },
    ],
  },
}));
