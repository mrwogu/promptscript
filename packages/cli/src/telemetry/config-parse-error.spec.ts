import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('yaml', async (importOriginal) => {
  const actual = await importOriginal<typeof import('yaml')>();
  return {
    ...actual,
    parseDocument: vi.fn(() => {
      throw new Error('parser failure');
    }),
  };
});

import { resolveCliTelemetryConfig } from './config.js';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('resolveCliTelemetryConfig parser failures', () => {
  it('fails closed when user YAML parsing throws', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'promptscript-cli-config-'));
    directories.push(cwd);
    const userConfigPath = join(cwd, 'user.yaml');
    writeFileSync(userConfigPath, "version: '1'\n");

    const config = await resolveCliTelemetryConfig({ cwd, userConfigPath });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('configuration unavailable');
  });
});
