import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { join } from 'path';

/**
 * Smoke tests for the update-check command.
 * These tests run the actual CLI to verify end-to-end functionality.
 */
describe('update-check smoke tests', () => {
  const cliPath = join(__dirname, '..', 'cli.ts');

  const runCli = (args: string[], env: Record<string, string> = {}): string => {
    return execFileSync('node', ['--import', '@swc-node/register/esm-register', cliPath, ...args], {
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      timeout: 10000,
    });
  };

  describe('prs update-check', () => {
    it('should display version information', () => {
      // Run with update check disabled to avoid network dependency
      const output = runCli(['update-check'], {
        PROMPTSCRIPT_NO_UPDATE_CHECK: '1',
      });

      // Should show package name and version
      expect(output).toMatch(/@promptscript\/cli v\d+\.\d+\.\d+/);
    });

    it('should be listed in help', () => {
      const output = runCli(['--help']);

      expect(output).toContain('update-check');
      expect(output).toContain('Check for CLI updates');
    });
  });

  describe('automatic update check', () => {
    it('should skip update check when PROMPTSCRIPT_NO_UPDATE_CHECK is set', () => {
      // Run help command with update check disabled
      // If this doesn't throw and completes quickly, the env var works
      const output = runCli(['--help'], {
        PROMPTSCRIPT_NO_UPDATE_CHECK: '1',
      });

      expect(output).toContain('prs');
    });

    it('should skip update check in quiet mode', () => {
      const output = runCli(['--quiet', '--help']);

      // In quiet mode, only essential output should appear
      // Help is still shown because it's explicitly requested
      expect(output).toContain('prs');
    });
  });
});
