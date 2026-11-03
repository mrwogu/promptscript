import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileCommand } from '../commands/compile.js';

// Stale removal runs through the guarded worker. Here it cannot run, so the
// compile has to keep the files and fail instead of reporting success.
vi.mock('../utils/managed-output-cleanup.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/managed-output-cleanup.js')>();
  return {
    ...actual,
    removeStaleGeneratedFiles: async (files: readonly unknown[]) => ({
      removed: [],
      removedDirectories: [],
      ...(files.length > 0 ? { unresolvedSelfInvocation: true } : {}),
    }),
  };
});

const directories: string[] = [];

function source(agents: string[]): string {
  return `@meta { id: "unresolved" syntax: "1.6.0" }

@identity {
  """
  You are a helper.
  """
}
${
  agents.length > 0
    ? `\n@agents {\n${agents.map((name) => `  ${name}: {\n    description: "Agent ${name}"\n    content: "Review."\n  }`).join('\n')}\n}\n`
    : ''
}`;
}

beforeEach(() => {
  process.exitCode = undefined;
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('stale generated files without a guarded worker', () => {
  it('keeps the files and fails the compile', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'promptscript-unresolved-'));
    directories.push(directory);
    await mkdir(join(directory, '.promptscript'), { recursive: true });
    await writeFile(
      join(directory, 'promptscript.yaml'),
      `version: '1'
targets:
  - claude
includePromptScriptSkill: false
output:
  manifest: true
`
    );
    const entry = join(directory, '.promptscript', 'project.prs');
    await writeFile(entry, source(['reviewer']));
    await compileCommand({ cwd: directory });
    expect(process.exitCode).toBeUndefined();

    await writeFile(entry, source([]));
    await compileCommand({ cwd: directory });

    expect(process.exitCode).toBe(1);
    expect(existsSync(join(directory, '.claude/agents/reviewer.md'))).toBe(true);
  });
});
