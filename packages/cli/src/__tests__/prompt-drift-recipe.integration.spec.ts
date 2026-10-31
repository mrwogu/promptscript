import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { createMockProvider, type MockAnswer } from '@promptscript/eval';
import { defaultFileSystem, defaultPrompts } from '../services.js';
import { evalRunCommand, type EvalCommandServices } from '../commands/eval/run.js';

const REPO = new URL('../../../../', import.meta.url).pathname;
const EXAMPLE = join(REPO, 'examples', 'runtime-node');
const PROMPTSCRIPT = '.promptscript';
const BASELINE = join(PROMPTSCRIPT, 'eval-reports', 'prod-baseline.json');
const GENERATED = [join(PROMPTSCRIPT, 'eval-cache'), join(PROMPTSCRIPT, 'eval-reports')];
const UPDATE_COMMAND =
  'UPDATE_DRIFT_EXAMPLE=true pnpm exec vitest run --config packages/cli/vitest.config.mts prompt-drift-recipe';

const answer = (decision: string, inputTokens: number, latencyMs: number): MockAnswer => ({
  text: JSON.stringify({ decision, reply: 'Thanks for writing. Here is what happens next.' }),
  usage: { inputTokens, outputTokens: 18 },
  latencyMs,
});

const ANSWERS: Record<string, MockAnswer> = {
  'broken-kettle': answer('approve', 96, 410),
  'late-return': answer('deny', 94, 380),
  'large-order': answer('escalate', 95, 450),
  'last-day': answer('approve', 94, 400),
};

const roots: string[] = [];

const noNetwork = vi.fn(() => {
  throw new Error('no network in the drift example check');
});

function services(patch: Partial<EvalCommandServices>): EvalCommandServices {
  return { fs: defaultFileSystem, prompts: defaultPrompts, cwd: process.cwd(), env: {}, ...patch };
}

/** The example without the files the test writes, in a temp directory. */
async function freshCopy(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-drift-example-'));
  roots.push(root);
  cpSync(EXAMPLE, root, {
    recursive: true,
    filter: (source) => !GENERATED.some((dir) => source === join(EXAMPLE, dir)),
  });
  mkdirSync(join(root, PROMPTSCRIPT, 'eval-reports'), { recursive: true });
  return root;
}

/** Every file under a directory as `relative path -> bytes`, in a fixed order. */
function treeOf(root: string, dir: string): Map<string, string> {
  const files = new Map<string, string>();
  const walk = (current: string): void => {
    if (!existsSync(current)) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else files.set(relative(root, path), readFileSync(path, 'utf8'));
    }
  };
  walk(join(root, dir));
  return new Map([...files].sort(([a], [b]) => a.localeCompare(b)));
}

function replaceCommitted(copy: string): void {
  for (const dir of GENERATED) {
    rmSync(join(EXAMPLE, dir), { recursive: true, force: true });
    cpSync(join(copy, dir), join(EXAMPLE, dir), { recursive: true });
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', noNetwork);
  noNetwork.mockClear();
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  process.exitCode = undefined;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('the drift example cache', () => {
  it('is what the CLI records from the scripted answers, with no network', async () => {
    const copy = await freshCopy();
    const mock = createMockProvider(ANSWERS);
    process.exitCode = undefined;

    await evalRunCommand(
      [],
      { cwd: copy, label: 'prod', cache: 'record', maxCost: '1', format: 'json', out: BASELINE },
      services({ createProvider: () => () => mock })
    );

    const code = process.exitCode;
    process.exitCode = undefined;
    expect(code ?? 0).toBe(0);
    expect(mock.calls).toHaveLength(4);
    expect(fetch).not.toHaveBeenCalled();
    const label = JSON.parse(
      readFileSync(join(copy, PROMPTSCRIPT, 'releases', 'prod.json'), 'utf8')
    );
    const baseline = JSON.parse(readFileSync(join(copy, BASELINE), 'utf8'));
    expect(baseline.suites[0].prompt.contentHash).toBe(label.prompts[0].contentHash);
    if (process.env['UPDATE_DRIFT_EXAMPLE'] === 'true') replaceCommitted(copy);
    for (const dir of GENERATED) {
      expect(
        [...treeOf(copy, dir)],
        `${dir} differs from what the CLI writes. Review why, then run: ${UPDATE_COMMAND}`
      ).toEqual([...treeOf(EXAMPLE, dir)]);
    }
  });
});
