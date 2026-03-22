import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { upgradeCommand } from '../upgrade.js';

describe('upgradeCommand', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prs-upgrade-'));
    origCwd = process.cwd();
    process.chdir(tmpDir);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(origCwd);
    rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should upgrade syntax to latest version', async () => {
    const { mkdirSync } = await import('fs');
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
      `@meta {\n  id: "test"\n  syntax: "1.0.0"\n}\n\n@identity {\n  """\n  test\n  """\n}\n`
    );

    await upgradeCommand({ dryRun: false });

    const content = readFileSync(join(tmpDir, '.promptscript', 'project.prs'), 'utf-8');
    expect(content).toContain('syntax: "1.1.0"');
  });

  it('should skip files already at latest', async () => {
    const { mkdirSync } = await import('fs');
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
      `@meta {\n  id: "test"\n  syntax: "1.1.0"\n}\n`
    );

    await upgradeCommand({ dryRun: false });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Skipped'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('0 file(s) upgraded'));
  });

  it('should not write files in dry-run mode', async () => {
    const { mkdirSync } = await import('fs');
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
      `@meta {\n  id: "test"\n  syntax: "1.0.0"\n}\n`
    );

    await upgradeCommand({ dryRun: true });

    const content = readFileSync(join(tmpDir, '.promptscript', 'project.prs'), 'utf-8');
    expect(content).toContain('syntax: "1.0.0"');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Would upgrade'));
  });

  it('should skip files without @meta', async () => {
    const { mkdirSync } = await import('fs');
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(join(tmpDir, '.promptscript', 'context.prs'), `@context { "just context" }`);

    await upgradeCommand({ dryRun: false });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('0 file(s) upgraded'));
  });

  it('should handle empty .promptscript directory', async () => {
    // No .promptscript dir at all
    await upgradeCommand({ dryRun: false });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('0 file(s) upgraded'));
  });
});
