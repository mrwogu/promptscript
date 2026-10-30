import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PromptReleaseExperiment } from '@promptscript/core';
import { validateReleaseReport } from '../../__tests__/prompt-bundle-validators.js';
import type { ReleaseReport } from '../../utils/release-report.js';
import { approveCommand } from '../approve/approve.js';
import { releaseBuildCommand } from './build.js';
import { labelText } from './layout.js';
import { releasePromoteCommand } from './promote.js';
import { releaseRollbackCommand } from './rollback.js';
import { releaseSplitCommand } from './split.js';
import { releaseStatusCommand } from './status.js';

const ID = 'acme-support/refund-reply';
const V1 = 'https://getpromptscript.dev/schema/prompt-release-label/v1.json';
const V2 = 'https://getpromptscript.dev/schema/prompt-release-label/v2.json';

function source(system: string): string {
  return `@meta {
  id: "acme-support"
  syntax: "1.6.0"
  risk: "high"
}

@prompts {
  refund-reply: {
    description: "Answer a refund request"
    system: "${system}"
  }
}
`;
}

type Kind = 'plain' | 'approvals' | 'cap-error' | 'cap-warning' | 'single';

const POLICIES: Record<Kind, string> = {
  plain: '',
  single: '',
  approvals: `policies:
  - name: high-risk-signoff
    kind: required-approvals
    severity: error
    match: { minRisk: high }
    environments: [prod]
    approvals: [{ role: legal }]
`,
  'cap-error': `policies:
  - name: cap
    kind: max-experiment-weight
    severity: error
    match: { minRisk: high }
    maxWeight: 5
`,
  'cap-warning': `policies:
  - name: cap
    kind: max-experiment-weight
    severity: warning
    match: { minRisk: high }
    maxWeight: 5
`,
};

function config(kind: Kind): string {
  const environments = kind === 'single' ? '[prod]' : '[dev, staging, prod]';
  return `version: '1'
project:
  id: acme-support
targets:
  - claude
includePromptScriptSkill: false
releases:
  environments: ${environments}
governance:
  roles:
    legal: ['@acme/legal']
${POLICIES[kind]}`;
}

function git(root: string, ...args: string[]): string {
  return execFileSync(
    'git',
    ['-c', 'user.email=t@example.com', '-c', 'user.name=T', '-c', 'commit.gpgsign=false', ...args],
    { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

function commit(root: string, message: string): void {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '--allow-empty', '-m', message);
}

/** Run a command and capture its JSON report and its text output. */
async function capture(run: () => Promise<void>): Promise<{ report: unknown; text: string }> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  process.exitCode = undefined;
  await run();
  const printed = log.mock.calls.map((call) => String(call[0]));
  const text = [...printed, ...error.mock.calls.map((call) => String(call[0]))].join('\n');
  log.mockRestore();
  error.mockRestore();
  let report: unknown;
  try {
    report = JSON.parse(printed.at(-1) ?? '');
  } catch {
    report = undefined;
  }
  return { report, text };
}

async function json(run: () => Promise<void>): Promise<ReleaseReport> {
  const { report } = await capture(run);
  expect(validateReleaseReport(report), JSON.stringify(validateReleaseReport.errors)).toBe(true);
  const result = report as ReleaseReport;
  expect(process.exitCode).toBe(result.success ? 0 : 1);
  return result;
}

const build = (cwd: string): Promise<ReleaseReport> =>
  json(() => releaseBuildCommand({ cwd, format: 'json' }));
const promote = (cwd: string, to: string): Promise<ReleaseReport> =>
  json(() => releasePromoteCommand(ID, { cwd, format: 'json', to }));
const rollback = (cwd: string, env: string): Promise<ReleaseReport> =>
  json(() => releaseRollbackCommand(env, { cwd, format: 'json' }));
const status = (cwd: string, base?: string): Promise<ReleaseReport> =>
  json(() =>
    releaseStatusCommand({ cwd, format: 'json', ...(base === undefined ? {} : { base }) })
  );

function split(
  cwd: string,
  env: string,
  name: string | undefined,
  arm: string[],
  extra: { dryRun?: boolean } = {}
): Promise<ReleaseReport> {
  return json(() =>
    releaseSplitCommand(ID, { cwd, format: 'json', env, ...(name ? { name } : {}), arm, ...extra })
  );
}

function end(cwd: string, env: string, keep?: string): Promise<ReleaseReport> {
  return json(() =>
    releaseSplitCommand(ID, { cwd, format: 'json', env, end: true, ...(keep ? { keep } : {}) })
  );
}

async function approve(cwd: string, hash: string): Promise<void> {
  await capture(() =>
    approveCommand(`${ID}@${hash}`, {
      cwd,
      role: 'legal',
      approver: '@jane',
      format: 'json',
      env: 'prod',
    })
  );
  expect(process.exitCode).toBe(0);
}

/** `git rm` every committed approval record of one hash. */
async function removeApprovalsOf(root: string, hash: string): Promise<void> {
  const files = git(root, 'ls-files', '.promptscript/approvals')
    .split('\n')
    .filter((file) => file.endsWith('.json'));
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    if ((await readFile(join(root, file), 'utf8')).includes(hash)) git(root, 'rm', '-q', file);
  }
}

async function builtHash(root: string): Promise<string> {
  const manifest = JSON.parse(
    await readFile(join(root, '.promptscript', 'releases', 'manifest.json'), 'utf8')
  ) as { prompts: Array<{ contentHash: string }> };
  return manifest.prompts[0]?.contentHash ?? '';
}

const labelPath = (root: string, env: string): string =>
  join(root, '.promptscript', 'releases', `${env}.json`);
const labelFile = (root: string, env: string): Promise<string> =>
  readFile(labelPath(root, env), 'utf8');

interface LabelEntry {
  id: string;
  contentHash: string;
  experiment?: {
    name: string;
    arms: Array<{ variant: string; contentHash: string; weight: number }>;
  };
}

async function labelJson(
  root: string,
  env: string
): Promise<{ $schema: string; prompts: LabelEntry[] }> {
  return JSON.parse(await labelFile(root, env)) as { $schema: string; prompts: LabelEntry[] };
}

async function entryOf(root: string, env: string): Promise<LabelEntry | undefined> {
  return (await labelJson(root, env)).prompts.find((entry) => entry.id === ID);
}

function codes(report: ReleaseReport): string[] {
  return report.errors.map((error) => error.code ?? '');
}

interface Template {
  root: string;
  a: string;
  b: string;
  c: string;
}

const directories: string[] = [];
const templates = new Map<Kind, Template>();

/**
 * Three versions of the prompt. A is released everywhere, B only in dev, C is built and not
 * released. Built once per kind, then copied for every test.
 */
async function makeTemplate(kind: Kind): Promise<Template> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-split-template-'));
  directories.push(root);
  await mkdir(join(root, '.promptscript'), { recursive: true });
  await writeFile(join(root, 'promptscript.yaml'), config(kind));
  await writeFile(join(root, '.gitignore'), '.promptscript-release.lock\n');
  const write = (system: string): Promise<void> =>
    writeFile(join(root, '.promptscript', 'project.prs'), source(system));
  git(root, 'init', '-q');
  await write('You answer refund requests.');
  commit(root, 'init');

  await build(root);
  const a = await builtHash(root);
  const environments = kind === 'single' ? ['prod'] : ['dev', 'staging', 'prod'];
  for (const environment of environments) {
    if (environment === 'prod' && kind === 'approvals') {
      await approve(root, a);
      commit(root, 'approve A');
    }
    expect((await promote(root, environment)).success).toBe(true);
  }
  commit(root, 'A everywhere');
  if (kind === 'single') return { root, a, b: a, c: a };

  await write('You answer refund requests politely.');
  await build(root);
  const b = await builtHash(root);
  expect((await promote(root, 'dev')).success).toBe(true);
  commit(root, 'B in dev');

  await write('You answer refund requests in a warm tone.');
  await build(root);
  const c = await builtHash(root);
  commit(root, 'build C');
  return { root, a, b, c };
}

/** A fresh copy of the template of a kind, with its hashes. */
async function fixture(kind: Kind = 'plain'): Promise<Template> {
  const template = templates.get(kind);
  if (template === undefined) throw new Error(`template ${kind} is not built`);
  const root = await mkdtemp(join(tmpdir(), 'promptscript-split-'));
  directories.push(root);
  await cp(template.root, root, { recursive: true });
  return { ...template, root };
}

beforeAll(async () => {
  for (const kind of Object.keys(POLICIES) as Kind[]) {
    templates.set(kind, await makeTemplate(kind));
  }
}, 600_000);

beforeEach(() => {
  process.exitCode = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

afterAll(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('prs release split order', () => {
  it('refuses a split in the first environment', async () => {
    const { root, b } = await fixture();
    const before = await labelFile(root, 'dev');

    const result = await split(root, 'dev', 'warm-tone', [`warm@${b}=10`]);
    const ended = await end(root, 'dev');

    expect(codes(result)).toEqual(['PS5009']);
    expect(codes(ended)).toEqual(['PS5009']);
    expect(await labelFile(root, 'dev')).toBe(before);
  });

  it('tells a one-environment project to add an environment', async () => {
    const { root, a } = await fixture('single');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${a.slice(0, 15)}=10`]);

    expect(codes(result)).toEqual(['PS5009']);
    expect(result.errors[0]?.message).toContain('Add a later environment');
  });

  it('refuses a new arm that does not run upstream', async () => {
    const { root, c } = await fixture();
    const before = await labelFile(root, 'prod');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${c}=10`]);

    expect(codes(result)).toEqual(['PS5005']);
    expect(await labelFile(root, 'prod')).toBe(before);
  });

  it('refuses a new arm that runs only at weight 0 upstream', async () => {
    const { root, b } = await fixture();
    expect((await split(root, 'staging', 'warm-tone', [`warm@${b}=0`])).success).toBe(true);
    commit(root, 'staging at 0');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=5`]);

    expect(codes(result)).toEqual(['PS5005']);
  });

  it('accepts a new arm that runs with traffic upstream', async () => {
    const { root, a, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'staging');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);

    expect(result.success).toBe(true);
    const label = await labelJson(root, 'prod');
    expect(label.$schema).toBe(V2);
    expect(label.prompts[0]?.experiment?.arms).toEqual([
      { variant: 'control', contentHash: a, weight: 9000 },
      { variant: 'warm', contentHash: b, weight: 1000 },
    ]);
  });

  it('passes a weight-only change after staging moved on', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'staging');
    await split(root, 'prod', 'warm-tone', [`warm@${b}=5`]);
    commit(root, 'prod 5');
    const kept = await end(root, 'staging', 'warm');
    commit(root, 'staging keeps warm');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=50`]);

    expect(kept.success).toBe(true);
    expect(result.success).toBe(true);
    expect((await entryOf(root, 'prod'))?.experiment?.arms[1]?.weight).toBe(5000);
  });

  it('refuses a weight-only change when an approval of an existing arm is removed', async () => {
    const { root, b } = await fixture('approvals');
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    await approve(root, b);
    commit(root, 'staging and approval');
    const first = await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'prod');
    await removeApprovalsOf(root, b);
    commit(root, 'drop the approval of B');
    const before = await labelFile(root, 'prod');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=5`]);

    expect(first.success).toBe(true);
    expect(codes(result)).toEqual(['PS030']);
    expect(await labelFile(root, 'prod')).toBe(before);
  });

  it('refuses --end --keep of a hash that only ran as an upstream arm', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'staging');
    await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'prod');
    const before = await labelFile(root, 'prod');

    const result = await end(root, 'prod', 'warm');

    expect(codes(result)).toEqual(['PS5005']);
    expect(result.errors[0]?.message).toContain('Promote it to staging first');
    expect(await labelFile(root, 'prod')).toBe(before);
  });

  it('accepts --end --keep of the upstream entry hash and writes a v1 label', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    await end(root, 'staging', 'warm');
    commit(root, 'staging keeps warm');
    await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'prod');

    const result = await end(root, 'prod', 'warm');

    expect(result.success).toBe(true);
    expect(await labelFile(root, 'prod')).toBe(
      labelText({ $schema: V1, environment: 'prod', prompts: [{ id: ID, contentHash: b }] })
    );
  });
});

describe('prs release split upstream weight limit', () => {
  async function stagingRuns(root: string, b: string, percent: number): Promise<void> {
    expect((await split(root, 'staging', 'warm-tone', [`warm@${b}=${percent}`])).success).toBe(
      true
    );
    commit(root, 'staging');
  }

  it('accepts an upstream-only arm at its upstream weight', async () => {
    const { root, b } = await fixture();
    await stagingRuns(root, b, 10);

    expect((await split(root, 'prod', 'warm-tone', [`warm@${b}=10`])).success).toBe(true);
  });

  it('refuses an upstream-only arm above its upstream weight', async () => {
    const { root, b } = await fixture();
    await stagingRuns(root, b, 10);

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=11`]);

    expect(codes(result)).toEqual(['PS5005']);
    expect(result.errors[0]?.message).toContain('10 %');
    expect(result.errors[0]?.message).toContain('staging');
  });

  it('refuses control at 0 even when the arm is the upstream entry hash', async () => {
    const { root, b } = await fixture();
    await json(() => releasePromoteCommand(ID, { cwd: root, format: 'json', to: 'staging' }));
    commit(root, 'staging holds B');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=100`]);

    expect(codes(result)).toEqual(['PS5009']);
    expect(result.errors[0]?.message).toContain('0.01 %');
  });

  it('refuses a weight-only change above the upstream weight', async () => {
    const { root, b } = await fixture();
    await stagingRuns(root, b, 10);
    const first = await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'prod');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=20`]);

    expect(first.success).toBe(true);
    expect(codes(result)).toEqual(['PS5005']);
  });

  it('lets an arm that is the upstream entry hash run up to 99.99 %', async () => {
    const { root, a, b } = await fixture();
    await json(() => releasePromoteCommand(ID, { cwd: root, format: 'json', to: 'staging' }));
    commit(root, 'staging holds B');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=99.99`]);

    expect(result.success).toBe(true);
    expect((await entryOf(root, 'prod'))?.experiment?.arms).toEqual([
      { variant: 'control', contentHash: a, weight: 1 },
      { variant: 'warm', contentHash: b, weight: 9999 },
    ]);
  });

  it('asks to pause an arm that no longer runs upstream', async () => {
    const { root, b } = await fixture();
    await stagingRuns(root, b, 10);
    await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'prod');
    await end(root, 'staging');
    commit(root, 'staging ends');

    const refused = await split(root, 'prod', 'warm-tone', [`warm@${b}=5`]);
    const paused = await split(root, 'prod', 'warm-tone', [`warm@${b}=0`]);

    expect(codes(refused)).toEqual(['PS5005']);
    expect(refused.errors[0]?.message).toContain('weight 0');
    expect(paused.success).toBe(true);
  });
});

describe('prs release split', () => {
  it('starts, changes and ends an experiment, writing v2 then v1', async () => {
    const { root, b } = await fixture();
    const plain = await labelFile(root, 'staging');

    const started = await split(root, 'staging', 'warm-tone', [`warm@${b}=5`]);
    const v2 = await labelFile(root, 'staging');
    const changed = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    const ended = await end(root, 'staging');

    expect(started.success).toBe(true);
    expect(JSON.parse(v2).$schema).toBe(V2);
    expect(changed.success).toBe(true);
    expect(ended.success).toBe(true);
    expect(await labelFile(root, 'staging')).toBe(plain);
  });

  it('removes an arm that is left out and adds the new one', async () => {
    const { root, a, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`one@${b}=10`]);

    const result = await split(root, 'staging', 'warm-tone', [`two@${b}=5`]);

    expect(result.success).toBe(true);
    expect((await entryOf(root, 'staging'))?.experiment?.arms).toEqual([
      { variant: 'control', contentHash: a, weight: 9500 },
      { variant: 'two', contentHash: b, weight: 500 },
    ]);
    expect(result.changes.map((change) => [change.action, change.experiment?.variant])).toEqual([
      ['unchanged', undefined],
      ['updated', 'control'],
      ['created', 'two'],
      ['removed', 'one'],
    ]);
  });

  it('keeps the order of the running arms when the flags come in another order', async () => {
    const { root, b, c } = await fixture();
    await promote(root, 'staging');
    await promote(root, 'dev');
    expect((await split(root, 'staging', 'warm-tone', [`cool@${c}=10`])).success).toBe(true);
    commit(root, 'staging');
    expect((await split(root, 'prod', 'warm-tone', [`warm@${b}=10`])).success).toBe(true);
    const both = await split(root, 'prod', 'warm-tone', [`warm@${b}=10`, `cool@${c}=5`]);
    commit(root, 'prod');

    const reordered = await split(root, 'prod', 'warm-tone', [`cool@${c}=6`, `warm@${b}=10`]);

    expect(both.errors).toEqual([]);
    expect(reordered.errors).toEqual([]);
    expect((await entryOf(root, 'prod'))?.experiment?.arms.map((arm) => arm.variant)).toEqual([
      'control',
      'warm',
      'cool',
    ]);
  });

  it('prints the gates of an arm in text mode', async () => {
    const { root, b } = await fixture('approvals');
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    await approve(root, b);
    commit(root, 'staging and approval');

    const { text } = await capture(() =>
      releaseSplitCommand(ID, { cwd: root, env: 'prod', name: 'warm-tone', arm: [`warm@${b}=10`] })
    );

    expect(text).toContain(`Gates for ${ID}@`);
  });

  it('refuses a new experiment name on a running experiment', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    const result = await split(root, 'staging', 'other-name', [`warm@${b}=10`]);

    expect(codes(result)).toEqual(['PS5009']);
    expect(result.errors[0]?.message).toContain('End it first');
  });

  it('refuses a variant that changes its hash', async () => {
    const { root, a, b } = await fixture();
    await json(() => releasePromoteCommand(ID, { cwd: root, format: 'json', to: 'staging' }));
    await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'prod');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${a}=10`]);

    expect(codes(result)).toEqual(['PS5009']);
  });

  it('refuses an arm hash equal to control or to another arm', async () => {
    const { root, a, b } = await fixture();

    const control = await split(root, 'staging', 'warm-tone', [`warm@${a}=10`]);
    const twice = await split(root, 'staging', 'warm-tone', [`x@${b}=1`, `y@${b.slice(0, 20)}=1`]);

    expect(codes(control)).toEqual(['PS5009']);
    expect(codes(twice)).toEqual(['PS5009']);
  });

  it.each([
    ['no arm', undefined, []],
    ['no name', undefined, ['warm@aaaaaaaa=10']],
    ['a bad percent', 'warm-tone', ['warm@aaaaaaaa=0x10']],
  ])('refuses %s before it reads anything', async (_name, name, arm) => {
    const { root } = await fixture();
    const before = await labelFile(root, 'staging');

    const result = await split(root, 'staging', name, arm);

    expect(codes(result)).toEqual(['PS5009']);
    expect(await labelFile(root, 'staging')).toBe(before);
  });

  it('refuses an unknown environment', async () => {
    const { root, b } = await fixture();

    const result = await split(root, 'qa', 'warm-tone', [`warm@${b}=10`]);

    expect(codes(result)).toEqual(['PS5002']);
  });

  it('resolves an 8-hex prefix and refuses an ambiguous or unknown one', async () => {
    const { root, b } = await fixture();
    const hex = b.slice('sha256-'.length);

    const prefixed = await split(root, 'staging', 'warm-tone', [`warm@${hex.slice(0, 8)}=10`]);
    const unknown = await split(root, 'staging', 'warm-tone', ['warm@00000000=10']);

    expect(prefixed.success).toBe(true);
    expect((await entryOf(root, 'staging'))?.experiment?.arms[1]?.contentHash).toBe(b);
    expect(codes(unknown)).toEqual(['PS5003']);
    // Every bundle of the project would have to start with the same 8 digits to be ambiguous.
    expect(unknown.errors[0]?.message).toContain('00000000');
  });

  it('refuses an arm whose bundle is missing or does not verify', async () => {
    const { root, b, c } = await fixture();
    await rm(join(root, '.promptscript', 'releases', 'bundles', `${c}.json`));
    const missing = await split(root, 'prod', 'warm-tone', [`warm@${c}=10`]);
    await writeFile(join(root, '.promptscript', 'releases', 'bundles', `${b}.json`), '{}\n');

    const broken = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    expect(codes(missing)).toEqual(['PS5003']);
    expect(codes(broken)).toEqual(['PS5004']);
  });

  it('refuses a prompt the environment does not hold', async () => {
    const { root, b } = await fixture();
    await rm(labelPath(root, 'prod'));

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);

    expect(codes(result)).toEqual(['PS5003']);
    expect(result.errors[0]?.message).toContain('promote');
  });

  it('refuses --end without an experiment and --keep of an unknown arm', async () => {
    const { root, b } = await fixture();
    const none = await end(root, 'staging');
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    const unknown = await end(root, 'staging', 'hot');

    expect(codes(none)).toEqual(['PS5009']);
    expect(codes(unknown)).toEqual(['PS5009']);
    expect(unknown.errors[0]?.message).toContain('control, warm');
  });

  it('writes nothing and takes no lock under --dry-run', async () => {
    const { root, b } = await fixture();
    const before = await labelFile(root, 'staging');
    // A foreign lock would make a real run fail with PS5007.
    await writeFile(
      join(root, '.promptscript-release.lock'),
      JSON.stringify({ acquiredAt: Date.now(), pid: process.pid, token: 'other' })
    );

    const result = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`], { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.changes.map((change) => change.action)).toEqual([
      'unchanged',
      'created',
      'created',
    ]);
    expect(await labelFile(root, 'staging')).toBe(before);
  });

  it('is a no-op for the same split', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    const before = await labelFile(root, 'staging');

    const result = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    expect(result.success).toBe(true);
    expect(result.changes).toMatchObject([{ action: 'unchanged', id: ID }]);
    expect(await labelFile(root, 'staging')).toBe(before);
  });

  it('warns about runtime readers when an experiment starts, not on a weight change', async () => {
    const { root, b } = await fixture();

    const started = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    const changed = await split(root, 'staging', 'warm-tone', [`warm@${b}=20`]);
    const ended = await end(root, 'staging');

    expect(started.warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining('runtime that reads label v2'),
    ]);
    expect(changed.warnings).toEqual([]);
    expect(ended.warnings).toEqual([]);
  });

  it('refuses an arm with traffic under max-experiment-weight at severity error', async () => {
    const { root, b } = await fixture('cap-error');
    const before = await labelFile(root, 'staging');

    const refused = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    const paused = await split(root, 'staging', 'warm-tone', [`warm@${b}=0`]);

    expect(codes(refused)).toEqual(['PS030']);
    expect(refused.gates?.some((gate) => gate.checks.some((c) => c.status === 'unavailable'))).toBe(
      true
    );
    expect(paused.success).toBe(true);
    expect(before).not.toBe(await labelFile(root, 'staging'));
  });

  it('passes with a warning under max-experiment-weight at severity warning', async () => {
    const { root, b } = await fixture('cap-warning');

    const result = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    expect(result.success).toBe(true);
    expect(result.warnings.some((warning) => warning.code === 'PS030')).toBe(true);
  });

  it('keeps the experiments of other prompts', async () => {
    const { root, b } = await fixture();
    const other = 'acme-support/other-prompt';
    const label = await labelJson(root, 'staging');
    const entry = { id: other, contentHash: b };
    await writeFile(
      labelPath(root, 'staging'),
      labelText({
        $schema: V1,
        environment: 'staging',
        prompts: [...label.prompts, entry],
      })
    );

    const result = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    expect(result.success).toBe(true);
    expect((await labelJson(root, 'staging')).prompts.map((item) => item.id)).toEqual([other, ID]);
  });

  it('reports one change per arm', async () => {
    const { root, a, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=5`]);

    const changed = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    const ended = await end(root, 'staging');

    const path = '.promptscript/releases/staging.json';
    expect(changed.changes).toEqual([
      { path, action: 'unchanged', id: ID, contentHash: a },
      {
        path,
        action: 'updated',
        id: ID,
        contentHash: a,
        experiment: { name: 'warm-tone', variant: 'control', weight: 9000, previousWeight: 9500 },
      },
      {
        path,
        action: 'updated',
        id: ID,
        contentHash: b,
        experiment: { name: 'warm-tone', variant: 'warm', weight: 1000, previousWeight: 500 },
      },
    ]);
    expect(ended.changes.filter((change) => change.action === 'removed')).toHaveLength(2);
  });

  it('prints the arms and the commit hint as text', async () => {
    const { root, b } = await fixture();

    const { text } = await capture(() =>
      releaseSplitCommand(ID, {
        cwd: root,
        env: 'staging',
        name: 'warm-tone',
        arm: [`warm@${b}=10`],
      })
    );

    expect(text).toContain(`Split ${ID} in staging, experiment warm-tone:`);
    expect(text).toMatch(/control\s+sha256-[0-9a-f]{12}\s+90 %/);
    expect(text).toMatch(/warm\s+sha256-[0-9a-f]{12}\s+10 %/);
    expect(text).toContain('Commit .promptscript/releases/staging.json to record the release.');
  });

  it('prints how an experiment ended and a dry run in text', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    const dry = await capture(() =>
      releaseSplitCommand(ID, { cwd: root, env: 'staging', end: true, dryRun: true })
    );
    const real = await capture(() =>
      releaseSplitCommand(ID, { cwd: root, env: 'staging', end: true })
    );

    expect(dry.text).toContain('Dry run: would end experiment warm-tone');
    expect(real.text).toContain(`Ended experiment warm-tone of ${ID} in staging`);
  });

  it('refuses while another release command holds the lock', async () => {
    const { root, b } = await fixture();
    await writeFile(
      join(root, '.promptscript-release.lock'),
      JSON.stringify({ acquiredAt: Date.now(), pid: process.pid, token: 'other' })
    );

    const result = await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    expect(codes(result)).toEqual(['PS5007']);
    expect(existsSync(join(root, '.promptscript-release.lock'))).toBe(true);
  });

  it('refuses a promote on an entry with a running experiment and points to split', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    const result = await promote(root, 'staging');

    expect(codes(result)).toEqual(['PS5010']);
    expect(result.errors[0]?.message).toContain('prs release split');
  });

  it('refuses a change that the gates refuse and says the label is unchanged', async () => {
    const { root, b } = await fixture('approvals');
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'staging');
    const before = await labelFile(root, 'prod');

    const result = await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);

    expect(result.success).toBe(false);
    expect(result.gates?.some((gate) => !gate.passed)).toBe(true);
    expect(await labelFile(root, 'prod')).toBe(before);
  });
});

/** A label written by hand, the way a pull request could edit it. */
async function writeExperiment(
  root: string,
  environment: string,
  contentHash: string,
  arms: Array<[string, string, number]>
): Promise<void> {
  const total = arms.reduce((sum, arm) => sum + arm[2], 0);
  const list = [
    { variant: 'control', contentHash, weight: 10000 - total },
    ...arms.map(([variant, hash, weight]) => ({ variant, contentHash: hash, weight })),
  ];
  const experiment = { name: 'warm-tone', arms: list } as unknown as PromptReleaseExperiment;
  await writeFile(
    labelPath(root, environment),
    labelText({
      $schema: V2,
      environment,
      prompts: [{ id: ID, contentHash, experiment }],
    })
  );
}

describe('experiments in rollback', () => {
  /** Staging runs B at 10 %, prod runs it at 1 % and then ends; B is approved for prod. */
  async function endedRepository(approveB: boolean): Promise<Template> {
    const fixed = await fixture('approvals');
    const { root, b } = fixed;
    if (approveB) await approve(root, b);
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'staging');
    expect((await split(root, 'prod', 'warm-tone', [`warm@${b}=1`])).success).toBe(true);
    commit(root, 'prod one percent');
    expect((await end(root, 'prod')).success).toBe(true);
    commit(root, 'prod ends');
    return fixed;
  }

  it('runs the gates for an arm with 1 % that comes back', async () => {
    const { root, b } = await endedRepository(true);
    await removeApprovalsOf(root, b);
    commit(root, 'drop the approval of B');
    const before = await labelFile(root, 'prod');

    const result = await rollback(root, 'prod');

    expect(codes(result)).toEqual(['PS030']);
    expect(result.errors[0]?.message).toContain(`${ID}@`);
    expect(await labelFile(root, 'prod')).toBe(before);
  });

  it('brings the v2 label back when the gates pass', async () => {
    const { root, a, b } = await endedRepository(true);

    const result = await rollback(root, 'prod');

    expect(result.success).toBe(true);
    expect((await labelJson(root, 'prod')).$schema).toBe(V2);
    expect((await entryOf(root, 'prod'))?.experiment?.arms).toEqual([
      { variant: 'control', contentHash: a, weight: 9900 },
      { variant: 'warm', contentHash: b, weight: 100 },
    ]);
    expect(result.changes.some((change) => change.experiment?.variant === 'warm')).toBe(true);
  });

  it('warns when a restored arm runs more than the environment before allows', async () => {
    const { root, b } = await endedRepository(true);
    await end(root, 'staging');
    commit(root, 'staging ends');

    const result = await rollback(root, 'prod');

    expect(result.success).toBe(true);
    expect(result.warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining('but staging no longer runs it'),
    ]);
    expect(result.warnings[0]?.message).toContain(b.slice(0, 'sha256-'.length + 12));
  });

  it('still rolls back when the label before does not read, with no limit warning', async () => {
    const { root } = await endedRepository(true);
    await writeFile(labelPath(root, 'staging'), '{ not json');
    commit(root, 'break staging');

    const result = await rollback(root, 'prod');

    expect(result.success).toBe(true);
    expect(result.warnings.map((warning) => warning.message)).toEqual([]);
  });

  it('restores v1 bytes when it undoes a split', async () => {
    const { root, b } = await fixture();
    const plain = await labelFile(root, 'staging');
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'split');

    const result = await rollback(root, 'staging');

    expect(result.success).toBe(true);
    expect(await labelFile(root, 'staging')).toBe(plain);
  });

  it('prints the arm lines of a rollback', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'split');
    await end(root, 'staging');
    commit(root, 'end');

    const { text } = await capture(() => releaseRollbackCommand('staging', { cwd: root }));

    expect(text).toContain(`${ID} warm none -> 10 %`);
  });

  it('refuses a restored arm whose bundle is gone', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'split');
    await end(root, 'staging');
    commit(root, 'end');
    await rm(join(root, '.promptscript', 'releases', 'bundles', `${b}.json`));
    const before = await labelFile(root, 'staging');

    const result = await rollback(root, 'staging');

    expect(codes(result)).toEqual(['PS5003']);
    expect(await labelFile(root, 'staging')).toBe(before);
  });

  it('refuses to bring an experiment back into the first environment', async () => {
    const { root, a, b } = await fixture();
    await writeExperiment(root, 'dev', b, [['warm', a, 1000]]);
    commit(root, 'hand edit');
    await writeFile(
      labelPath(root, 'dev'),
      labelText({ $schema: V1, environment: 'dev', prompts: [{ id: ID, contentHash: b }] })
    );
    commit(root, 'plain again');

    const result = await rollback(root, 'dev');

    expect(codes(result)).toEqual(['PS5009']);
  });
});

describe('experiments in status', () => {
  it('lists every arm with its weight and fails on an arm without a bundle', async () => {
    const { root, a, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    const listed = await status(root);
    await rm(join(root, '.promptscript', 'releases', 'bundles', `${b}.json`));
    const broken = await status(root);

    const entry = listed.environments.find((item) => item.name === 'staging')?.prompts[0];
    expect(listed.success).toBe(true);
    expect(entry?.experiment?.name).toBe('warm-tone');
    expect(
      entry?.experiment?.arms.map((arm) => [arm.variant, arm.contentHash, arm.weight])
    ).toEqual([
      ['control', a, 9000],
      ['warm', b, 1000],
    ]);
    expect(entry?.experiment?.arms.every((arm) => arm.exists && arm.verified)).toBe(true);
    expect(broken.success).toBe(false);
    expect(codes(broken)).toContain('PS5003');
    const arm = broken.environments.find((item) => item.name === 'staging')?.prompts[0]?.experiment
      ?.arms[1];
    expect(arm).toMatchObject({ exists: false, verified: false });
  });

  it('prints the arms of an experiment as text', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);

    const { text } = await capture(() => releaseStatusCommand({ cwd: root }));

    expect(text).toContain('experiment warm-tone');
    expect(text).toMatch(/warm\s+sha256-[0-9a-f]{12}\s+10 %\s+ok/);
  });

  it('keeps judging an arm at weight 0 as no traffic and an arm with traffic as exposure', async () => {
    const { root, b } = await fixture('cap-error');
    await split(root, 'staging', 'warm-tone', [`warm@${b}=0`]);
    const quiet = await status(root);
    await writeExperiment(root, 'staging', (await entryOf(root, 'staging'))?.contentHash ?? '', [
      ['warm', b, 1000],
    ]);

    const loud = await status(root);

    expect(quiet.warnings.some((warning) => warning.code === 'PS030')).toBe(false);
    expect(loud.warnings.some((warning) => warning.code === 'PS030')).toBe(true);
  });
});

describe('experiments in status --base', () => {
  /** Staging runs B at `staging` percent, prod at `prod` percent; committed and tagged. */
  async function baseWithSplit(kind: Kind, staging: number, prod: number): Promise<Template> {
    const fixed = await fixture(kind);
    const { root, a, b } = fixed;
    await writeExperiment(root, 'staging', a, [['warm', b, staging * 100]]);
    await writeExperiment(root, 'prod', a, [['warm', b, prod * 100]]);
    commit(root, 'base');
    git(root, 'tag', 'base');
    return fixed;
  }

  it('judges a weight change against the weight upstream', async () => {
    const { root, a, b } = await baseWithSplit('plain', 10, 5);
    await writeExperiment(root, 'prod', a, [['warm', b, 5000]]);

    const result = await status(root, 'base');

    expect(codes(result)).toEqual(['PS5005']);
    expect(result.errors[0]?.message).toContain('10 %');
  });

  it('runs the gates for an arm when the weight passes the order', async () => {
    const { root, a, b } = await baseWithSplit('approvals', 50, 5);
    await writeExperiment(root, 'prod', a, [['warm', b, 5000]]);

    const result = await status(root, 'base');

    expect(codes(result)).toEqual(['PS030']);
    expect(result.changes.map((change) => change.action)).toEqual([
      'unchanged',
      'updated',
      'updated',
    ]);
  });

  it('judges an arm rename as a change and gates the arm', async () => {
    const { root, a, b } = await baseWithSplit('approvals', 50, 5);
    await writeExperiment(root, 'prod', a, [['hot', b, 500]]);

    const result = await status(root, 'base');

    expect(codes(result)).toEqual(['PS030']);
    expect(result.changes.map((change) => [change.action, change.experiment?.variant])).toEqual([
      ['unchanged', undefined],
      ['unchanged', 'control'],
      ['created', 'hot'],
      ['removed', 'warm'],
    ]);
  });

  it('refuses a hand-added arm that does not run upstream', async () => {
    const { root, a, c } = await fixture();
    commit(root, 'base');
    git(root, 'tag', 'base');
    await writeExperiment(root, 'prod', a, [['warm', c, 500]]);

    const result = await status(root, 'base');

    expect(codes(result)).toEqual(['PS5005']);
  });

  it('refuses an experiment in the first environment', async () => {
    const { root, a, b } = await fixture();
    commit(root, 'base');
    git(root, 'tag', 'base');
    await writeExperiment(root, 'dev', b, [['warm', a, 500]]);

    const result = await status(root, 'base');

    expect(codes(result)).toEqual(['PS5009']);
  });

  it('passes a split made with the command', async () => {
    const { root, b } = await fixture();
    commit(root, 'base');
    git(root, 'tag', 'base');
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    await split(root, 'prod', 'warm-tone', [`warm@${b}=10`]);

    const result = await status(root, 'base');

    expect(result.success).toBe(true);
    expect(result.changes.filter((change) => change.experiment !== undefined)).toHaveLength(4);
  });

  it('passes a revert of the last split', async () => {
    const { root, b } = await fixture();
    const plain = await labelFile(root, 'staging');
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'split');
    git(root, 'tag', 'base');
    await writeFile(labelPath(root, 'staging'), plain);

    const result = await status(root, 'base');

    expect(result.success).toBe(true);
    expect(result.warnings.some((warning) => warning.message.includes('was removed'))).toBe(true);
  });
});

describe('arms that the environment before no longer runs', () => {
  /** Staging runs B at 10 %, then dev moves on to C. */
  async function movedOn(): Promise<Template> {
    const fixed = await fixture();
    expect((await split(fixed.root, 'staging', 'warm-tone', [`warm@${fixed.b}=10`])).success).toBe(
      true
    );
    commit(fixed.root, 'staging split');
    expect((await promote(fixed.root, 'dev')).success).toBe(true);
    return fixed;
  }

  it('warns in plain status for each such arm', async () => {
    const { root } = await movedOn();

    const result = await status(root);

    expect(result.success).toBe(true);
    expect(result.warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining('but dev no longer runs it'),
    ]);
  });

  it('warns in status --base for a rolled back arm and does not fail', async () => {
    const { root, b } = await fixture();
    await split(root, 'staging', 'warm-tone', [`warm@${b}=10`]);
    commit(root, 'staging split');
    const v2 = await labelFile(root, 'staging');
    await end(root, 'staging');
    commit(root, 'staging ends');
    git(root, 'tag', 'base');
    await writeFile(labelPath(root, 'staging'), v2);
    expect((await promote(root, 'dev')).success).toBe(true);

    const result = await status(root, 'base');

    expect(result.success).toBe(true);
    expect(result.warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining([expect.stringContaining('but dev no longer runs it')])
    );
  });
});

describe('unreadable bundles in status --base', () => {
  it('fails the command, not just the entry, on an error that is no release error', async () => {
    if (process.getuid?.() === 0) return;
    const { root, a, c } = await fixture();
    commit(root, 'base');
    git(root, 'tag', 'base');
    await writeExperiment(root, 'prod', a, [['warm', c, 0]]);
    const file = join(root, '.promptscript', 'releases', 'bundles', `${c}.json`);
    await chmod(file, 0o000);

    try {
      const result = await status(root, 'base');

      expect(result.success).toBe(false);
    } finally {
      await chmod(file, 0o644);
    }
  });
});
