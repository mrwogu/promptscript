import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLI_VERSION } from '../cli-version.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI_VERSION', () => {
  it('should be resolved statically from packages/cli/package.json', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8')) as {
      version?: unknown;
    };
    expect(CLI_VERSION).toBe(pkg.version);
  });

  it('should be a semantic version', () => {
    expect(CLI_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
