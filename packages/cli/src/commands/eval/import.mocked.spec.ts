import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const mocks = vi.hoisted(() => ({
  create: undefined as undefined | ((...args: unknown[]) => unknown),
  suites: undefined as undefined | (() => unknown),
  resolve: undefined as
    undefined | ((original: (...args: string[]) => unknown, calls: number) => unknown),
  calls: 0,
}));

vi.mock('../../utils/write-file-atomic.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../utils/write-file-atomic.js')>();
  return {
    ...original,
    createFileExclusive: (...args: Parameters<typeof original.createFileExclusive>) =>
      mocks.create === undefined ? original.createFileExclusive(...args) : mocks.create(...args),
  };
});

vi.mock('@promptscript/eval', async (importOriginal) => {
  const original = await importOriginal<typeof import('@promptscript/eval')>();
  return {
    ...original,
    resolveProjectPath: (root: string, base: string, value: string) => {
      mocks.calls += 1;
      return mocks.resolve === undefined
        ? original.resolveProjectPath(root, base, value)
        : mocks.resolve(
            (...args) => original.resolveProjectPath(...(args as [string, string, string])),
            mocks.calls
          );
    },
    loadSuites: (...args: Parameters<typeof original.loadSuites>) =>
      mocks.suites === undefined ? original.loadSuites(...args) : mocks.suites(),
  };
});

const { evalImportCommand } = await import('./import.js');

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const SOURCE = `@meta {
  id: "acme-support"
  syntax: "1.6.0"
}

@prompts {
  refund-reply: {
    description: "Answer a customer refund request"
    model: { ref: "claude-sonnet-5-5", maxTokens: 800 }
    inputs: { message: { type: "string", description: "Customer message" } }
    system: "You answer refund requests for Acme customers."
    user: "Customer wrote: {{input.message}}"
  }
}
`;

const roots: string[] = [];
let err: string[];

async function project(): Promise<{ root: string; file: string }> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'promptscript-eval-import-m-')));
  roots.push(root);
  await mkdir(join(root, '.promptscript', 'evals'), { recursive: true });
  await writeFile(
    join(root, 'promptscript.yaml'),
    "version: '1'\nproject:\n  id: acme-support\ntargets:\n  - claude\nincludePromptScript: false\n"
  );
  await writeFile(join(root, '.promptscript', 'project.prs'), SOURCE);
  await writeFile(
    join(root, '.promptscript', 'evals', 'refund.eval.yaml'),
    'prompt: acme-support/refund-reply\ndataset: d.jsonl\nassertions:\n  - { id: a, kind: contains, values: ["a"] }\n'
  );
  const away = await realpath(await mkdtemp(join(tmpdir(), 'promptscript-samples-m-')));
  roots.push(away);
  const file = join(away, 'samples.jsonl');
  await writeFile(file, '{"prompt":"acme-support/refund-reply","inputs":{"message":"hi"}}\n');
  execFileSync('git', ['init', '-q'], { cwd: root });
  return { root, file };
}

beforeEach(() => {
  err = [];
  vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  vi.spyOn(console, 'error').mockImplementation((...parts: unknown[]) => {
    err.push(parts.join(' '));
  });
});

afterEach(async () => {
  vi.restoreAllMocks();
  mocks.create = undefined;
  mocks.suites = undefined;
  mocks.resolve = undefined;
  mocks.calls = 0;
  process.exitCode = undefined;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('prs eval import write races and bugs', () => {
  it('refuses with PS6713 when the output appears between the check and the write', async () => {
    const { root, file } = await project();
    mocks.create = () => {
      throw Object.assign(new Error('exists'), { code: 'EEXIST' });
    };

    await evalImportCommand(file, { cwd: root, suite: 'refund', out: 'rows.jsonl' });

    expect(process.exitCode).toBe(1);
    expect(err.join('\n')).toContain('PS6713');
    expect(err.join('\n')).toContain('appeared while the import ran');
    expect(existsSync(join(root, 'rows.jsonl'))).toBe(false);
  });

  it('refuses with PS6713 when the output directory resolves elsewhere at write time', async () => {
    const { root, file } = await project();
    mocks.resolve = (original, calls) =>
      calls === 1 ? original(root, root, 'rows.jsonl') : join(tmpdir(), 'escaped.jsonl');

    await evalImportCommand(file, { cwd: root, suite: 'refund', out: 'rows.jsonl' });

    expect(process.exitCode).toBe(1);
    expect(err.join('\n')).toContain('PS6713');
    expect(err.join('\n')).toContain('changed while the import ran');
    expect(existsSync(join(root, 'rows.jsonl'))).toBe(false);
    expect(existsSync(join(tmpdir(), 'escaped.jsonl'))).toBe(false);
  });

  it('reports an error that has no code as an unknown error', async () => {
    const { root, file } = await project();
    mocks.create = () => {
      throw new Error('disk on fire');
    };

    await evalImportCommand(file, { cwd: root, suite: 'refund', out: 'rows.jsonl' });

    expect(err.join('\n')).toContain('could not be written: an unknown error');
  });

  it('does not swallow an error that is not an eval error', async () => {
    const { root, file } = await project();
    mocks.suites = () => {
      throw new TypeError('a bug');
    };

    await expect(
      evalImportCommand(file, { cwd: root, suite: 'refund', out: 'rows.jsonl' })
    ).rejects.toThrow('a bug');
  });
});
