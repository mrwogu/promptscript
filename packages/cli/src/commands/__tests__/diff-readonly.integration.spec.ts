import { lstat, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { diffCommand } from '../diff.js';

const temporaryDirectories: string[] = [];

async function snapshotFiles(root: string): Promise<string> {
  const entries: string[] = [];

  async function visit(directory: string): Promise<void> {
    const children = (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    for (const child of children) {
      const path = join(directory, child.name);
      const stat = await lstat(path);
      entries.push(
        [
          relative(root, path),
          String(stat.dev),
          String(stat.ino),
          String(stat.mode),
          String(stat.size),
          String(stat.mtimeMs),
          stat.isFile() ? (await readFile(path)).toString('base64') : '',
        ].join('\0')
      );
      if (child.isDirectory()) {
        await visit(path);
        continue;
      }
    }
  }

  await visit(root);
  return entries.join('\n');
}

afterEach(async () => {
  process.exitCode = undefined;
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('diffCommand read-only integration', () => {
  it('does not mutate a project while emitting a JSON report', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'promptscript-diff-readonly-command-'));
    temporaryDirectories.push(projectRoot);
    await mkdir(join(projectRoot, '.promptscript'), { recursive: true });
    await writeFile(
      join(projectRoot, 'promptscript.yaml'),
      [
        'id: readonly-diff',
        "syntax: '1.0.0'",
        'includePromptScriptSkill: false',
        'targets:',
        '  - github',
        '',
      ].join('\n')
    );
    await writeFile(
      join(projectRoot, '.promptscript/project.prs'),
      [
        '@meta {',
        '  id: "readonly-diff"',
        '  syntax: "1.0.0"',
        '}',
        '',
        '@identity {',
        '  """',
        '  Read-only diff fixture.',
        '  """',
        '}',
        '',
      ].join('\n')
    );

    const before = await snapshotFiles(projectRoot);
    const originalCwd = process.cwd();
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      process.chdir(projectRoot);
      await diffCommand({ format: 'json' });
      const reportOutput = consoleLog.mock.calls[0]?.[0];
      expect(typeof reportOutput).toBe('string');
      expect(JSON.parse(reportOutput as string)).toMatchObject({
        success: true,
        hasChanges: true,
      });
    } finally {
      process.chdir(originalCwd);
      consoleLog.mockRestore();
    }

    await expect(snapshotFiles(projectRoot)).resolves.toBe(before);
    await expect(
      readFile(join(projectRoot, '.promptscript/project.prs'), 'utf8')
    ).resolves.toContain('Read-only diff fixture.');
  });
});
