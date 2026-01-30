import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Smoke tests for the bundled CLI package.
 *
 * These tests verify that the published package works correctly,
 * specifically catching issues like incorrect version detection paths
 * that only manifest after bundling.
 *
 * Prerequisites: `nx build cli` must be run before these tests.
 */
describe('bundle smoke tests', () => {
  // From packages/cli/src/__tests__ -> root is 4 levels up
  const distRoot = join(__dirname, '..', '..', '..', '..', 'dist', 'packages', 'cli');
  const bundlePath = join(distRoot, 'index.js');
  const binPath = join(distRoot, 'bin', 'prs.js');

  const isBundleBuilt = (): boolean => {
    return existsSync(bundlePath) && existsSync(binPath);
  };

  const areDepsInstalled = (): boolean => {
    return existsSync(join(distRoot, 'node_modules'));
  };

  beforeAll(() => {
    if (!isBundleBuilt()) {
      return;
    }

    // Install dependencies if not present (using pnpm directly, no shell)
    if (!areDepsInstalled()) {
      execFileSync('pnpm', ['install', '--ignore-workspace'], {
        cwd: distRoot,
        stdio: 'ignore',
        timeout: 60000,
      });
    }
  });

  describe('version detection', () => {
    it('should report correct version from bundled package', () => {
      if (!isBundleBuilt()) {
        console.log('Skipping: bundle not built (run `nx build cli` first)');
        return;
      }

      const output = execFileSync('node', [binPath, '--version'], {
        encoding: 'utf-8',
        cwd: distRoot,
        timeout: 10000,
      });

      // Version should NOT be 0.0.0 (which indicates package.json not found)
      expect(output.trim()).not.toBe('0.0.0');

      // Version should match semver pattern
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
    });

    it('should report correct version in update-check command', () => {
      if (!isBundleBuilt()) {
        console.log('Skipping: bundle not built (run `nx build cli` first)');
        return;
      }

      const output = execFileSync('node', [binPath, 'update-check'], {
        encoding: 'utf-8',
        cwd: distRoot,
        timeout: 10000,
        env: {
          ...process.env,
          PROMPTSCRIPT_NO_UPDATE_CHECK: '1',
        },
      });

      // Should show @promptscript/cli with actual version, not 0.0.0
      expect(output).toMatch(/@promptscript\/cli v\d+\.\d+\.\d+/);
      expect(output).not.toContain('v0.0.0');
    });
  });

  describe('basic functionality', () => {
    it('should display help', () => {
      if (!isBundleBuilt()) {
        console.log('Skipping: bundle not built (run `nx build cli` first)');
        return;
      }

      const output = execFileSync('node', [binPath, '--help'], {
        encoding: 'utf-8',
        cwd: distRoot,
        timeout: 10000,
      });

      expect(output).toContain('prs');
      expect(output).toContain('compile');
      expect(output).toContain('validate');
      expect(output).toContain('init');
    });
  });
});
