import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FormatterOutput } from '@promptscript/compiler';

const GENERATED_MARKER =
  '<!-- PromptScript 2026-07-15T00:00:00.000Z | source: project.prs | target: factory - do not edit -->';

function createMonolithOutputs(): Map<string, FormatterOutput> {
  return new Map([
    [
      'AGENTS.md',
      {
        path: 'AGENTS.md',
        content: '# AGENTS.md\n',
        managedOutputDirectories: ['.factory/rules'],
      },
    ],
  ]);
}

describe('managed output worker path resolution', () => {
  const temporaryDirectories: string[] = [];

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.doUnmock('node:fs');
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true }))
    );
  });

  async function createProject(prefix: string): Promise<string> {
    const project = await mkdtemp(join(tmpdir(), prefix));
    temporaryDirectories.push(project);
    return project;
  }

  it('should not probe the filesystem on a deno standalone binary', async () => {
    vi.stubGlobal('Deno', { build: { standalone: true } });
    const probed: string[] = [];
    vi.doMock('node:fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:fs')>();
      return {
        ...actual,
        existsSync: (path: Parameters<typeof actual.existsSync>[0]) => {
          probed.push(String(path));
          return actual.existsSync(path);
        },
      };
    });
    const { cleanupManagedOutputs } = await import('../managed-output-cleanup.js');
    const project = await createProject('cleanup-standalone-');

    await cleanupManagedOutputs(createMonolithOutputs(), { outputRoot: project });

    expect(probed.filter((path) => path.includes('managed-output-worker'))).toEqual([]);
  });

  it('should fail closed when the worker probe is refused', async () => {
    // Deno raises NotCapable when the process lacks read access to the probed
    // path. The throw must not escape the guarded operations.
    vi.doMock('node:fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:fs')>();
      return {
        ...actual,
        existsSync: (path: Parameters<typeof actual.existsSync>[0]) => {
          if (String(path).includes('managed-output-worker')) {
            throw Object.assign(new Error('Requires read access'), { name: 'NotCapable' });
          }
          return actual.existsSync(path);
        },
      };
    });
    const { cleanupManagedOutputs } = await import('../managed-output-cleanup.js');
    const project = await createProject('cleanup-notcapable-');
    const rules = join(project, '.factory', 'rules');
    await mkdir(rules, { recursive: true });
    await writeFile(join(rules, 'stale.md'), `${GENERATED_MARKER}\n\n# Stale\n`);

    const result = await cleanupManagedOutputs(createMonolithOutputs(), { outputRoot: project });

    expect(result.unresolvedSelfInvocation).toBe(true);
    expect(result.removed).toEqual([]);
    await expect(readFile(join(rules, 'stale.md'), 'utf-8')).resolves.toContain('# Stale');
  });
});
