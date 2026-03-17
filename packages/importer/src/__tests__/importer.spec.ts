import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { importFile } from '../importer.js';

const fixturesDir = resolve(__dirname, 'fixtures');

describe('importFile', () => {
  it('imports CLAUDE.md and produces .prs output', async () => {
    const result = await importFile(resolve(fixturesDir, 'sample-claude.md'));
    expect(result.prsContent).toContain('@meta {');
    expect(result.prsContent).toContain('@identity {');
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.totalConfidence).toBeGreaterThan(0);
  });

  it('imports with dry-run (returns result without side effects)', async () => {
    const result = await importFile(resolve(fixturesDir, 'sample-claude.md'), {
      dryRun: true,
    });
    expect(result.prsContent).toContain('@meta {');
    expect(result.warnings).toBeDefined();
  });

  it('imports copilot-instructions.md', async () => {
    const result = await importFile(resolve(fixturesDir, 'sample-copilot.md'));
    expect(result.prsContent).toContain('@meta {');
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it('imports .cursorrules', async () => {
    const result = await importFile(resolve(fixturesDir, 'sample-cursorrules'));
    expect(result.prsContent).toContain('@meta {');
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it('imports with explicit format override', async () => {
    const result = await importFile(resolve(fixturesDir, 'sample-claude.md'), {
      format: 'generic',
    });
    expect(result.prsContent).toContain('@meta {');
  });

  it('throws error for nonexistent file', async () => {
    await expect(importFile('/nonexistent/file.md')).rejects.toThrow();
  });

  it('throws error for empty file', async () => {
    // Create a temp empty file scenario - use inline approach
    const { writeFileSync, unlinkSync, mkdtempSync } = await import('fs');
    const { join } = await import('path');
    const tmpdir = mkdtempSync(join(resolve(__dirname, '..', '..'), '.tmp-'));
    const emptyFile = join(tmpdir, 'empty.md');
    writeFileSync(emptyFile, '');

    try {
      await expect(importFile(emptyFile)).rejects.toThrow('Empty file');
    } finally {
      unlinkSync(emptyFile);
      const { rmdirSync } = await import('fs');
      rmdirSync(tmpdir);
    }
  });

  it('generates yaml config string', async () => {
    const result = await importFile(resolve(fixturesDir, 'sample-claude.md'));
    expect(result.yamlConfig).toContain('targets:');
  });

  it('calculates total confidence score', async () => {
    const result = await importFile(resolve(fixturesDir, 'sample-claude.md'));
    expect(result.totalConfidence).toBeGreaterThan(0);
    expect(result.totalConfidence).toBeLessThanOrEqual(1);
  });
});
