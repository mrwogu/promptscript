import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { GitResult } from '../release/git.js';

type Answer = GitResult | 'throw';

const git = vi.hoisted(() => ({
  script: [] as Array<Answer>,
  calls: [] as Array<{ args: string[]; env: Record<string, string | undefined> | undefined }>,
}));

vi.mock('../release/git.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../release/git.js')>()),
  runGit: (
    args: string[],
    _cwd: string,
    options?: { env?: Record<string, string | undefined> }
  ): Promise<GitResult> => {
    git.calls.push({ args, env: options?.env });
    const answer = git.script.shift();
    if (answer === undefined || answer === 'throw') return Promise.reject(new Error('no git'));
    return Promise.resolve(answer);
  },
}));

const { evalImportCommand } = await import('./import.js');

const ok = (stdout = ''): GitResult => ({ stdout, stderr: '', status: 0 });
const exit = (status: number, stderr = ''): GitResult => ({ stdout: '', stderr, status });
const INSIDE = ok('true\n');

let dir: string;
let file: string;
let err: string[];

beforeEach(async () => {
  git.script = [];
  git.calls = [];
  err = [];
  dir = await realpath(await mkdtemp(join(tmpdir(), 'promptscript-import-git-')));
  file = join(dir, 'samples.jsonl');
  await writeFile(file, '{}\n');
  vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  vi.spyOn(console, 'error').mockImplementation((...parts: unknown[]) => {
    err.push(parts.join(' '));
  });
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  await rm(dir, { recursive: true, force: true });
});

// The import stops at the sample file check or, when that passes, at the missing suite
async function check(...script: Answer[]): Promise<string> {
  git.script = script;
  err = [];
  await evalImportCommand(file, { cwd: dir, suite: 'refund', out: 'rows.jsonl' });
  process.exitCode = undefined;
  return err.join('\n');
}

describe('prs eval import sample file check, with a scripted Git', () => {
  it.each([
    ['rev-parse cannot be run', ['throw'] as Answer[], 'git could not be run'],
    ['rev-parse fails for another reason', [exit(129, 'usage')], 'exit 129'],
    ['rev-parse fails in a repository', [exit(128, 'fatal: bad index')], 'exit 128'],
    ['ls-files cannot be run', [INSIDE, 'throw'] as Answer[], 'git could not be run'],
    ['ls-files fails', [INSIDE, exit(128)], 'exit 128'],
    ['check-ignore cannot be run', [INSIDE, exit(1), 'throw'] as Answer[], 'git could not be run'],
    ['check-ignore fails', [INSIDE, exit(1), exit(128)], 'exit 128'],
  ])('refuses with PS6716 when %s', async (_name, script, reason) => {
    const shown = await check(...script, ...script);

    expect(shown).toContain('PS6716');
    expect(shown).toContain('could not tell');
    expect(shown).toContain(reason);
  });

  it('refuses a tracked file and a loose file', async () => {
    const tracked = await check(INSIDE, ok(), INSIDE, ok());
    const loose = await check(INSIDE, exit(1), exit(1), INSIDE, exit(1), exit(1));

    expect(tracked).toContain('tracked by Git');
    expect(loose).toContain('neither tracked nor ignored');
  });

  it.each([
    ['no repository', [exit(128, 'fatal: not a git repository (or any parent)')]],
    ['a bare repository', [ok('false\n')]],
    ['an ignored file', [INSIDE, exit(1), ok()]],
  ])('goes on past the check for %s', async (_name, script) => {
    const shown = await check(...script, ...script);

    expect(shown).not.toContain('PS6716');
    expect(shown).toContain('PS6200');
  });

  it('asks Git in English, in the directory of the file, and without the variables that redirect it', async () => {
    await check(exit(128, 'fatal: not a git repository'), exit(128, 'fatal: not a git repository'));

    for (const call of git.calls) {
      expect(call.env).toMatchObject({ LC_ALL: 'C', LANGUAGE: '' });
      expect(Object.keys(call.env ?? {})).toEqual(
        expect.arrayContaining(['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE'])
      );
      expect(call.env?.['GIT_DIR']).toBeUndefined();
    }
  });

  it('asks check-ignore without literal pathspecs, which it does not support', async () => {
    await check(INSIDE, exit(1), ok(), INSIDE, exit(1), ok());

    const ignore = git.calls.find((call) => call.args.includes('check-ignore'));
    const lsFiles = git.calls.find((call) => call.args.includes('ls-files'));
    expect(ignore?.args).toEqual(['check-ignore', '-q', '--no-index', '--', './samples.jsonl']);
    expect(Object.hasOwn(ignore?.env ?? {}, 'GIT_LITERAL_PATHSPECS')).toBe(true);
    expect(ignore?.env?.['GIT_LITERAL_PATHSPECS']).toBeUndefined();
    expect(lsFiles?.args[0]).toBe('--literal-pathspecs');
  });
});
