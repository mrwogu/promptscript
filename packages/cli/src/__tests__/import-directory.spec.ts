import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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

  it('should handle instruction files without frontmatter', async () => {
    const noFrontmatterDir = join(tmpdir(), 'prs-import-nofm-' + Date.now());
    await mkdir(noFrontmatterDir, { recursive: true });
    await writeFile(
      join(noFrontmatterDir, 'plain.instructions.md'),
      '# Plain Instructions\n\nNo frontmatter here.'
    );

    const result = await importDirectory(noFrontmatterDir);
    expect(result).toContain('@guards');
    expect(result).toContain('plain');
    expect(result).toContain('No frontmatter here.');

    await rm(noFrontmatterDir, { recursive: true, force: true });
  });

  it('should throw when directory has no instruction files', async () => {
    const emptyDir = join(tmpdir(), 'prs-import-empty-' + Date.now());
    await mkdir(emptyDir, { recursive: true });
    await writeFile(join(emptyDir, 'readme.md'), '# Not an instruction file');

    await expect(importDirectory(emptyDir)).rejects.toThrow('No .instructions.md files found');

    await rm(emptyDir, { recursive: true, force: true });
  });
});

describe('importCommand directory mode', () => {
  const testDir = join(tmpdir(), 'prs-import-cmd-dir-' + Date.now());

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(
      join(testDir, 'rules.instructions.md'),
      '---\napplyTo:\n  - "src/**/*.ts"\n---\n\n# Rules\n\nSome rules.'
    );
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should output to console in dry-run mode', async () => {
    const { importCommand } = await import('../commands/import.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await importCommand(testDir, { dryRun: true });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('@guards'));
    consoleSpy.mockRestore();
  });

  it('should write imported file to output directory', async () => {
    const { importCommand } = await import('../commands/import.js');
    const outputDir = join(tmpdir(), 'prs-import-cmd-out-' + Date.now());
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await importCommand(testDir, { output: outputDir });

    const { readFile: rf } = await import('fs/promises');
    const output = await rf(join(outputDir, 'imported.prs'), 'utf-8');
    expect(output).toContain('@guards');
    expect(output).toContain('rules');

    consoleSpy.mockRestore();
    await rm(outputDir, { recursive: true, force: true });
  });
});
