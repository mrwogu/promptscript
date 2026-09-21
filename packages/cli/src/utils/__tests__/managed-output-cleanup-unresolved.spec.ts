import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FormatterOutput } from '@promptscript/compiler';
import {
  cleanupManagedOutputs,
  createHookOutputSafely,
  removeHookOutputIfUnchanged,
  rewriteHookOutputIfUnchanged,
} from '../managed-output-cleanup.js';

// Fail-closed suite: no resolvable self-invocation means every guarded
// operation must skip, report nothing removed, and leave files untouched.
vi.mock('../../runtime/self-invocation.js', () => ({
  resolveSelfInvocation: () => undefined,
}));

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

describe('guarded cleanup without a resolvable self-invocation', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
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

  it('skips obsolete file removal and reports the unresolved runtime', async () => {
    const project = await createProject('cleanup-unresolved-');
    const rules = join(project, '.factory', 'rules');
    await mkdir(rules, { recursive: true });
    await writeFile(join(rules, 'stale.md'), `${GENERATED_MARKER}\n\n# Stale\n`);

    const result = await cleanupManagedOutputs(createMonolithOutputs(), {
      outputRoot: project,
    });

    expect(result.removed).toEqual([]);
    expect(result.unresolvedSelfInvocation).toBe(true);
    await expect(readFile(join(rules, 'stale.md'), 'utf-8')).resolves.toContain('# Stale');
  });

  it('refuses hook rewrites when the worker cannot be spawned', async () => {
    const project = await createProject('cleanup-unresolved-rewrite-');
    const hookFile = join(project, '.claude', 'settings.json');
    await mkdir(join(project, '.claude'), { recursive: true });
    await writeFile(hookFile, '{}\n');

    const rewritten = await rewriteHookOutputIfUnchanged(
      hookFile,
      project,
      '{}\n',
      '{"hooks":[]}\n'
    );

    expect(rewritten).toBe(false);
    await expect(readFile(hookFile, 'utf-8')).resolves.toBe('{}\n');
  });

  it('refuses hook removals when the worker cannot be spawned', async () => {
    const project = await createProject('cleanup-unresolved-remove-');
    const hookFile = join(project, '.claude', 'settings.json');
    await mkdir(join(project, '.claude'), { recursive: true });
    await writeFile(hookFile, '{}\n');

    const removed = await removeHookOutputIfUnchanged(hookFile, project, '{}\n');

    expect(removed).toBe(false);
    await expect(readFile(hookFile, 'utf-8')).resolves.toBe('{}\n');
  });

  it('refuses hook creation, including missing ancestor directories', async () => {
    const project = await createProject('cleanup-unresolved-create-');
    const hookFile = join(project, '.claude', 'nested', 'settings.json');

    const created = await createHookOutputSafely(hookFile, project, '{}\n');

    expect(created).toBe(false);
    await expect(readFile(hookFile, 'utf-8')).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
