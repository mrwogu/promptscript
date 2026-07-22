import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getLatestSyntaxVersion } from '@promptscript/core';
import { upgradeCommand } from '../upgrade.js';

describe('upgradeCommand', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prs-upgrade-'));
    origCwd = process.cwd();
    process.chdir(tmpDir);
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(origCwd);
    process.exitCode = undefined;
    rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should upgrade syntax to latest version', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
      `@meta {\n  id: "test"\n  syntax: "1.0.0"\n}\n\n@identity {\n  """\n  test\n  """\n}\n`
    );

    await upgradeCommand({ dryRun: false });

    const content = readFileSync(join(tmpDir, '.promptscript', 'project.prs'), 'utf-8');
    expect(content).toContain(`syntax: "${getLatestSyntaxVersion()}"`);
  });

  it('should skip files already at latest', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    const latest = getLatestSyntaxVersion();
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
      `@meta {\n  id: "test"\n  syntax: "${latest}"\n}\n`
    );

    await upgradeCommand({ dryRun: false });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Skipped'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('0 file(s) upgraded'));
  });

  it('should not write files in dry-run mode', async () => {
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
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'context.prs'),
      `@context {\n  """\n  just context\n  """\n}\n`
    );

    await upgradeCommand({ dryRun: false });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('0 file(s) upgraded'));
  });

  it('should abort all writes when any file is invalid', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    const validPath = join(tmpDir, '.promptscript', 'a-valid.prs');
    const invalidPath = join(tmpDir, '.promptscript', 'b-invalid.prs');
    const original = `@meta {\n  id: "test"\n  syntax: "1.0.0"\n}\n`;
    writeFileSync(validPath, original);
    writeFileSync(invalidPath, '@meta {');

    await upgradeCommand({ dryRun: false });

    expect(process.exitCode).toBe(1);
    expect(readFileSync(validPath, 'utf-8')).toBe(original);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('no PromptScript files'));
  });

  it('should reject syntax versions newer than supported', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    const filePath = join(tmpDir, '.promptscript', 'project.prs');
    const original = `@meta {\n  id: "test"\n  syntax: "99.0.0"\n}\n`;
    writeFileSync(filePath, original);

    await upgradeCommand({ dryRun: false });

    expect(process.exitCode).toBe(1);
    expect(readFileSync(filePath, 'utf-8')).toBe(original);
  });

  it('should not follow symbolic links', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    const outsidePath = join(tmpDir, 'outside.prs');
    const linkedPath = join(tmpDir, '.promptscript', 'linked.prs');
    const original = `@meta {\n  id: "outside"\n  syntax: "1.0.0"\n}\n`;
    writeFileSync(outsidePath, original);
    symlinkSync(outsidePath, linkedPath);

    await upgradeCommand({ dryRun: false });

    expect(process.exitCode).toBeUndefined();
    expect(readFileSync(outsidePath, 'utf-8')).toBe(original);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('symbolic link'));
  });

  it('should update the parsed meta block and preserve file mode', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    const filePath = join(tmpDir, '.promptscript', 'project.prs');
    writeFileSync(
      filePath,
      `# @meta { syntax: "0.1.0" }\n@meta {\n  id: "test"\n  # } inside a comment\n  syntax: "1.0.0"\n}\n`
    );
    chmodSync(filePath, 0o640);

    await upgradeCommand({ dryRun: false });

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('# @meta { syntax: "0.1.0" }');
    expect(content).toContain(`syntax: "${getLatestSyntaxVersion()}"`);
    expect(statSync(filePath).mode & 0o777).toBe(0o640);
  });

  it('should handle empty .promptscript directory', async () => {
    // No .promptscript dir at all
    await upgradeCommand({ dryRun: false });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('0 file(s) upgraded'));
  });

  it('should fail when the project directory cannot be scanned', async () => {
    writeFileSync(join(tmpDir, '.promptscript'), 'not a directory');

    await upgradeCommand({ dryRun: false });

    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Cannot scan'));
  });
});
