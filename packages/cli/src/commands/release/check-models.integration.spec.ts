import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashPromptBundle, PROMPT_BUNDLE_SCHEMA_URL } from '@promptscript/core';
import { validateReleaseReport } from '../../__tests__/prompt-bundle-validators.js';
import type { ReleaseReport } from '../../utils/release-report.js';
import { shortHash } from './layout.js';
import { releaseStatusCommand, type ReleaseStatusOptions } from './status.js';

const LABEL_V1 = 'https://getpromptscript.dev/schema/prompt-release-label/v1.json';
const LABEL_V2 = 'https://getpromptscript.dev/schema/prompt-release-label/v2.json';

const EVIL = 'acme-\u202e\u009bevil';

function profileYaml(id: string, status: string, date?: string, successor?: string): string {
  const retirement = date === undefined ? '' : `      retirementDate: '${date}'\n`;
  const next = successor === undefined ? '' : `      successor: ${successor}\n`;
  return `    "${id}":
      provider: acme
      family: acme-family
      version: '1'
      displayName: "${id}"
      apiId: "${id}-api"
      status: ${status}
${retirement}${next}`;
}

const CONFIG = `version: '1'
project:
  id: acme-support
targets:
  - claude
includePromptScriptSkill: false
releases:
  environments: [staging, prod]
models:
  profiles:
${profileYaml('acme-retired', 'retired', '2026-06-15', 'acme-current')}${profileYaml('acme-nodate', 'retired')}${profileYaml('acme-soon', 'deprecated', '2026-11-20')}${profileYaml('acme-later', 'deprecated', '2026-12-20')}${profileYaml('acme-past', 'deprecated', '2026-10-01')}${profileYaml('acme-dateless', 'deprecated')}${profileYaml('acme-current', 'current')}${profileYaml('acme-\\u202e\\u009bevil', 'retired', '2026-06-15')}`;

const directories: string[] = [];

function git(root: string, ...args: string[]): string {
  return execFileSync(
    'git',
    ['-c', 'user.email=t@example.com', '-c', 'user.name=T', '-c', 'commit.gpgsign=false', ...args],
    { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

async function project(config = CONFIG): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-check-models-'));
  directories.push(root);
  await mkdir(join(root, '.promptscript', 'releases', 'bundles'), { recursive: true });
  await writeFile(join(root, 'promptscript.yaml'), config);
  await writeFile(join(root, '.promptscript', 'project.prs'), '@meta { id: "acme-support" }\n');
  git(root, 'init', '-q');
  git(root, 'commit', '-q', '--allow-empty', '-m', 'init');
  return root;
}

interface BundleModel {
  ref: string;
  profile?: string;
  provider: string;
  apiId: string;
  params: Record<string, unknown>;
}

/** A hand-made model of a bundle: the profile `acme-x` runs `acme-x-api` of provider acme. */
function modelOf(profile: string, fields: Partial<BundleModel> = {}): BundleModel {
  return {
    ref: profile,
    profile,
    provider: 'acme',
    apiId: `${profile}-api`,
    params: {},
    ...fields,
  };
}

/** A bundle file that verifies. `salt` makes two bundles of one id differ. */
async function bundle(
  root: string,
  id: string,
  model: BundleModel | undefined,
  salt = ''
): Promise<string> {
  const body: Record<string, unknown> = {
    $schema: PROMPT_BUNDLE_SCHEMA_URL,
    id,
    description: `Answer ${salt}`,
    messages: [{ role: 'system', content: `You answer ${salt}.` }],
    inputs: {},
    governance: {},
    provenance: { entry: '.promptscript/project.prs', segments: [] },
    ...(model === undefined ? {} : { model }),
  };
  const contentHash = hashPromptBundle(body);
  const file = join(root, '.promptscript', 'releases', 'bundles', `${contentHash}.json`);
  await writeFile(file, `${JSON.stringify({ ...body, contentHash }, null, 2)}\n`);
  return contentHash;
}

interface Arm {
  variant: string;
  contentHash: string;
  weight: number;
}

interface Entry {
  id: string;
  contentHash: string;
  arms?: Arm[];
}

async function label(root: string, environment: string, entries: Entry[]): Promise<void> {
  const experiments = entries.some((entry) => entry.arms !== undefined);
  const prompts = entries.map(({ id, contentHash, arms }) => ({
    id,
    contentHash,
    ...(arms === undefined ? {} : { experiment: { name: 'warm', arms } }),
  }));
  const body = { $schema: experiments ? LABEL_V2 : LABEL_V1, environment, prompts };
  await writeFile(
    join(root, '.promptscript', 'releases', `${environment}.json`),
    `${JSON.stringify(body, null, 2)}\n`
  );
}

/** Two arms around a control arm; weights sum to 10000. */
function arms(control: string, others: Array<[string, string, number]>): Arm[] {
  const rest = others.reduce((total, [, , weight]) => total + weight, 0);
  return [
    { variant: 'control', contentHash: control, weight: 10000 - rest },
    ...others.map(([variant, contentHash, weight]) => ({ variant, contentHash, weight })),
  ];
}

async function capture(
  run: () => Promise<void>
): Promise<{ report: unknown; text: string; exitCode: number | string | undefined }> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  process.exitCode = undefined;
  await run();
  const exitCode = process.exitCode;
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
  process.exitCode = undefined;
  return { report, text, exitCode };
}

async function status(
  cwd: string,
  options: Partial<ReleaseStatusOptions> = {}
): Promise<ReleaseReport> {
  const { report, exitCode } = await capture(() =>
    releaseStatusCommand({ cwd, format: 'json', ...options })
  );
  expect(validateReleaseReport(report), JSON.stringify(validateReleaseReport.errors)).toBe(true);
  const result = report as ReleaseReport;
  expect(exitCode).toBe(result.success ? 0 : 1);
  return result;
}

const check = (cwd: string, extra: Partial<ReleaseStatusOptions> = {}): Promise<ReleaseReport> =>
  status(cwd, { checkModels: true, ...extra });

const ID = 'acme/reply';
const EXP = 'acme/exp-reply';
const GONE = 'acme/gone-reply';

/** The proof case: a retired model in prod, a retiring arm and an unknown model in staging. */
async function proofProject(): Promise<{
  root: string;
  hashes: { retired: string; current: string; soon: string; later: string; gone: string };
}> {
  const root = await project();
  const hashes = {
    retired: await bundle(root, ID, modelOf('acme-retired'), 'r'),
    current: await bundle(root, EXP, modelOf('acme-current'), 'c'),
    soon: await bundle(root, EXP, modelOf('acme-soon'), 's'),
    later: await bundle(root, EXP, modelOf('acme-later'), 'l'),
    gone: await bundle(root, GONE, modelOf('acme-gone'), 'g'),
  };
  await label(root, 'prod', [{ id: ID, contentHash: hashes.retired }]);
  await label(root, 'staging', [
    {
      id: EXP,
      contentHash: hashes.current,
      arms: arms(hashes.current, [
        ['b', hashes.soon, 2500],
        ['c', hashes.later, 2500],
      ]),
    },
    { id: GONE, contentHash: hashes.gone },
  ]);
  return { root, hashes };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
});

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  process.exitCode = undefined;
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('release status --check-models', () => {
  it('flags the retired entry and the retiring arm, and warns on the unknown model', async () => {
    const { root, hashes } = await proofProject();

    const report = await check(root);

    expect(report.success).toBe(false);
    expect(report.errors.map((error) => error.code)).toEqual(['PS5011', 'PS5011']);
    const [arm, prod] = report.errors;
    expect(prod?.location?.file).toBe('.promptscript/releases/prod.json');
    expect(prod?.message).toContain(
      `prod: ${ID} at ${shortHash(hashes.retired)} runs acme-retired (acme/acme-retired-api), which is retired since 2026-06-15.`
    );
    expect(prod?.message).toContain('Point the prompt at acme-current, run prs release build');
    expect(arm?.location?.file).toBe('.promptscript/releases/staging.json');
    expect(arm?.message).toContain(
      `staging: ${EXP} at ${shortHash(hashes.soon)}, arm b, runs acme-soon (acme/acme-soon-api), which retires on 2026-11-20, within 30 days.`
    );
    expect(arm?.message).toContain('Point the prompt at a current model');
    const unknown = report.warnings.filter((warning) => warning.message.includes('acme-gone'));
    expect(unknown).toHaveLength(1);
    expect(unknown[0]?.code).toBeUndefined();
    expect(report.models?.map((item) => [item.environment, item.variant, item.status])).toEqual([
      ['staging', undefined, 'current'],
      ['staging', 'b', 'deprecated'],
      ['staging', 'c', 'deprecated'],
      ['staging', undefined, 'unknown'],
      ['prod', undefined, 'retired'],
    ]);
    expect(report.models?.map((item) => item.retiring)).toEqual([false, true, false, false, true]);
  });

  it('adds nothing without --check-models', async () => {
    const { root } = await proofProject();

    const report = await status(root);

    expect(report.success).toBe(true);
    expect(report).not.toHaveProperty('models');
    expect(report.errors).toEqual([]);
  });

  it('flags the arm that retires later with a wider window', async () => {
    const { root } = await proofProject();

    const report = await check(root, { retiringWithin: '90' });

    expect(report.errors).toHaveLength(3);
    expect(report.errors[1]?.message).toContain('within 90 days');
  });

  it('flags only the retired model and past dates with a window of 0', async () => {
    const root = await project();
    const retired = await bundle(root, ID, modelOf('acme-retired'), 'r');
    const past = await bundle(root, EXP, modelOf('acme-past'), 'p');
    const soon = await bundle(root, GONE, modelOf('acme-soon'), 's');
    await label(root, 'prod', [
      { id: ID, contentHash: retired },
      { id: EXP, contentHash: past },
      { id: GONE, contentHash: soon },
    ]);

    const report = await check(root, { retiringWithin: '0' });

    expect(report.errors.map((error) => error.message.split(' ')[1])).toEqual([ID, EXP]);
    expect(report.errors[1]?.message).toContain(
      'which the catalog lists as retiring on 2026-10-01'
    );
    expect(report.models?.map((item) => item.retiring)).toEqual([true, true, false]);
  });

  it('keeps PS5003 and PS5004 for a missing and a corrupt bundle and adds nothing', async () => {
    const root = await project();
    const missing = await bundle(root, ID, modelOf('acme-retired'), 'm');
    const corrupt = await bundle(root, EXP, modelOf('acme-retired'), 'k');
    await rm(join(root, '.promptscript', 'releases', 'bundles', `${missing}.json`));
    await writeFile(
      join(root, '.promptscript', 'releases', 'bundles', `${corrupt}.json`),
      '{"id":"x"}\n'
    );
    await label(root, 'prod', [
      { id: ID, contentHash: missing },
      { id: EXP, contentHash: corrupt },
    ]);

    const report = await check(root);

    expect(report.errors.map((error) => error.code).sort()).toEqual(['PS5003', 'PS5004']);
    expect(report.models).toEqual([]);
  });

  it('reports a bundle of the wrong shape once, even when two labels hold it', async () => {
    const root = await project();
    const body = { ...modelOf('acme-retired'), params: undefined, ref: 7 };
    const hash = await bundle(root, ID, body as unknown as BundleModel, 'w');
    await label(root, 'prod', [{ id: ID, contentHash: hash }]);
    await label(root, 'staging', [{ id: ID, contentHash: hash }]);

    const report = await check(root);

    expect(report.errors.map((error) => error.code)).toEqual(['PS5004']);
    expect(report.models).toEqual([]);
  });

  it('lists one item per environment for a hash that two labels hold', async () => {
    const root = await project();
    const hash = await bundle(root, ID, modelOf('acme-retired'), 'x');
    await label(root, 'staging', [{ id: ID, contentHash: hash }]);
    await label(root, 'prod', [{ id: ID, contentHash: hash }]);

    const report = await check(root);

    expect(report.models?.map((item) => item.environment)).toEqual(['staging', 'prod']);
    expect(report.errors).toHaveLength(2);
  });

  it('names the ref when the bundle has no profile, and leaves out a missing date', async () => {
    const root = await project();
    const hash = await bundle(
      root,
      ID,
      modelOf('acme-nodate', { profile: undefined, ref: 'my-ref' }),
      'q'
    );
    await label(root, 'prod', [{ id: ID, contentHash: hash }]);

    const report = await check(root);

    expect(report.errors[0]?.message).toContain(
      'runs my-ref (acme/acme-nodate-api), which is retired. Point'
    );
    expect(report.models?.[0]?.retirementDate).toBeUndefined();
  });

  it('lists nothing for a bundle without a model', async () => {
    const root = await project();
    const hash = await bundle(root, ID, undefined, 'n');
    await label(root, 'prod', [{ id: ID, contentHash: hash }]);

    const report = await check(root);

    expect(report.success).toBe(true);
    expect(report.models).toEqual([]);
  });

  it('checks an arm without traffic too', async () => {
    const root = await project();
    const current = await bundle(root, ID, modelOf('acme-current'), 'c');
    const retired = await bundle(root, ID, modelOf('acme-retired'), 'r');
    await label(root, 'prod', [
      { id: ID, contentHash: current, arms: arms(current, [['b', retired, 0]]) },
    ]);

    const report = await check(root);

    expect(report.errors.map((error) => error.code)).toEqual(['PS5011']);
    expect(report.errors[0]?.message).toContain('arm b');
  });

  it('keeps PS5011 next to the base check', async () => {
    const { root } = await proofProject();
    git(root, 'add', '-A');
    git(root, 'commit', '-q', '-m', 'release');
    git(root, 'tag', 'base');

    const report = await check(root, { base: 'base' });

    expect(report.base?.ref).toBe('base');
    expect(report.errors.map((error) => error.code)).toEqual(['PS5011', 'PS5011']);
  });

  it('strips control characters in text and keeps them raw in JSON', async () => {
    const root = await project();
    const hash = await bundle(root, ID, modelOf(EVIL), 'e');
    const odd = await bundle(root, EXP, modelOf('acme-odd', { provider: 'ac\u202eme' }), 'o');
    await label(root, 'prod', [
      { id: ID, contentHash: hash },
      { id: EXP, contentHash: odd },
    ]);

    const text = await capture(() => releaseStatusCommand({ cwd: root, checkModels: true }));
    const raw = await check(root);

    expect(text.exitCode).toBe(1);
    expect(text.text).toContain('Models (retiring within 30 days)');
    expect(text.text).toContain('acme-evil  retired 2026-06-15');
    expect(text.text).toContain('PS5011: prod: acme/reply');
    expect(text.text).not.toMatch(/[\u0080-\u009f\u202a-\u202e]/);
    expect(raw.models?.[0]?.profile).toBe(EVIL);
    expect(raw.errors[0]?.message).toContain(EVIL);
  });

  it('prints the models section and the empty case in text', async () => {
    const root = await project();

    const { text, exitCode } = await capture(() =>
      releaseStatusCommand({ cwd: root, checkModels: true, retiringWithin: '7' })
    );

    expect(exitCode).toBe(0);
    expect(text).toContain('Models (retiring within 7 days)');
    expect(text).toContain('no labelled prompt names a model');
  });

  it('refuses a bad window and a window without --check-models', async () => {
    const root = await project();

    const bad = await capture(() =>
      releaseStatusCommand({ cwd: root, format: 'json', checkModels: true, retiringWithin: '-1' })
    );
    const alone = await capture(() =>
      releaseStatusCommand({ cwd: root, format: 'json', retiringWithin: '7' })
    );

    for (const { report, exitCode } of [bad, alone]) {
      expect(exitCode).toBe(1);
      expect((report as ReleaseReport).errors).toHaveLength(1);
    }
    expect((bad.report as ReleaseReport).errors[0]?.message).toContain('0 to 3650');
    expect((alone.report as ReleaseReport).errors[0]?.message).toBe(
      '--retiring-within needs --check-models.'
    );
  });
});
