import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { importDirectory } from '../commands/import.js';

describe('importDirectory', () => {
  const testDir = join(tmpdir(), 'prs-import-dir-test-' + Date.now());

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(
      join(testDir, 'angular.instructions.md'),
      '---\napplyTo:\n  - "apps/admin/**/*.ts"\n---\n\n# Angular\n\nAngular rules.'
    );
    await writeFile(
      join(testDir, 'api.instructions.md'),
      '---\napplyTo:\n  - "apps/api/**/*.ts"\n---\n\n# API\n\nAPI rules.'
    );
    await writeFile(join(testDir, 'readme.md'), '# Not an instruction file');
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should combine instruction files into single @guards block', async () => {
    const result = await importDirectory(testDir);
    expect(result).toContain('@guards');
    expect(result).toContain('angular');
    expect(result).toContain('api');
    expect(result).toContain('apps/admin/**/*.ts');
    expect(result).toContain('apps/api/**/*.ts');
    expect(result).not.toContain('readme');
  });
});
