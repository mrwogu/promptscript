import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { governanceCodeownersCommand } from '../commands/governance/codeowners.js';

const guide = readFileSync(
  new URL('../../../../docs/guides/codeowners.md', import.meta.url),
  'utf8'
);

const fences = (language: string): string[] =>
  [...guide.matchAll(new RegExp('```' + language + '\\n([\\s\\S]*?)```', 'g'))].map(
    (match) => match[1] ?? ''
  );

const directories: string[] = [];

afterAll(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('the CODEOWNERS guide', () => {
  it('shows the file its configuration and prompt produce', async () => {
    // Arrange
    const [config] = fences('yaml');
    const [source] = fences('promptscript');
    const shown = fences('text').find((text) => text.startsWith('# promptscript-generated'));
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'prs-codeowners-guide-')));
    directories.push(root);
    execFileSync('git', ['init', '-q'], { cwd: root });
    writeFileSync(
      join(root, 'promptscript.yaml'),
      `id: acme-support\nsyntax: 1.6.0\ntargets: []\n${config}`
    );
    mkdirSync(join(root, '.promptscript'));
    writeFileSync(join(root, '.promptscript', 'project.prs'), source ?? '');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    // Act
    await governanceCodeownersCommand({ cwd: root, format: 'json' });
    vi.restoreAllMocks();

    // Assert
    expect(process.exitCode).toBe(0);
    expect(readFileSync(join(root, '.github', 'CODEOWNERS'), 'utf8')).toBe(shown);
  });
});
