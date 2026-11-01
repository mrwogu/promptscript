import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import {
  approvalRecordPath,
  hashPromptBundle,
  PROMPT_BUNDLE_SCHEMA_URL,
  serializeApprovalRecord,
  type ApprovalRecordV1,
  type PromptBundleV1,
} from '@promptscript/core';
import { checkPromotionGates, gateLines, type PromotionGateContext } from './gates.js';
import type { ReleaseGateCheck, ReleaseGateResult } from '../../utils/release-report.js';
import { loadReleaseProject, ReleaseCompileError, type CompiledRelease } from './project.js';

const ID = 'acme-support/refund-reply';
const OTHER = 'acme-support/other-reply';

const GOVERNANCE = `governance:
  roles:
    legal: ['@acme/legal']
    security: ['@acme/appsec']
`;

const SIGNOFF = `  - name: high-risk-signoff
    kind: required-approvals
    severity: error
    match: { minRisk: high }
    environments: [prod]
    approvals: [{ role: legal }]
`;

function config(policies: string, extra = ''): string {
  return `version: '1'
project:
  id: acme-support
targets:
  - claude
includePromptScriptSkill: false
releases:
  environments: [staging, prod]
${GOVERNANCE}${extra}policies:
${policies}`;
}

const directories: string[] = [];

function git(root: string, ...args: string[]): string {
  return execFileSync(
    'git',
    ['-c', 'user.email=t@example.com', '-c', 'user.name=T', '-c', 'commit.gpgsign=false', ...args],
    { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

async function project(yaml: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-gates-'));
  directories.push(root);
  await mkdir(join(root, '.promptscript'), { recursive: true });
  await writeFile(join(root, 'promptscript.yaml'), yaml);
  await writeFile(join(root, '.promptscript', 'project.prs'), '@meta { id: "acme-support" }\n');
  git(root, 'init', '-q');
  git(root, 'commit', '-q', '--allow-empty', '-m', 'init');
  return root;
}

/** A bundle file that verifies, with the governance and messages given. */
async function bundle(
  root: string,
  governance: PromptBundleV1['governance'],
  fields: Record<string, unknown> = {}
): Promise<PromptBundleV1> {
  const body: Record<string, unknown> = {
    $schema: PROMPT_BUNDLE_SCHEMA_URL,
    id: ID,
    description: 'Answer a refund request',
    messages: [{ role: 'system', content: 'You answer refund requests.' }],
    inputs: {},
    governance,
    provenance: { entry: '.promptscript/project.prs', segments: [] },
    ...fields,
  };
  const contentHash = hashPromptBundle(body);
  const value = { ...body, contentHash } as unknown as PromptBundleV1;
  const directory = join(root, '.promptscript', 'releases', 'bundles');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, `${contentHash}.json`), `${JSON.stringify(value, null, 2)}\n`);
  return value;
}

/** A fresh build that holds these bundles, without a compile. */
function built(...bundles: PromptBundleV1[]): () => Promise<CompiledRelease> {
  return () =>
    Promise.resolve({
      source: '.promptscript/project.prs',
      bundles: bundles.map((value) => ({
        id: value.id,
        contentHash: value.contentHash,
        description: value.description,
        text: JSON.stringify(value),
        bundle: value,
      })),
      warnings: [],
    });
}

async function record(
  root: string,
  fields: Partial<ApprovalRecordV1>,
  path?: string
): Promise<string> {
  const value: ApprovalRecordV1 = {
    $schema: 'https://getpromptscript.dev/schema/approval-record/v1.json',
    prompt: ID,
    contentHash: `sha256-${'0'.repeat(64)}`,
    role: 'legal',
    approver: { source: 'asserted', value: '@jane' },
    createdAt: '2026-10-22T09:14:03.120Z',
    ...fields,
  };
  const target = path ?? approvalRecordPath(value);
  await mkdir(dirname(join(root, target)), { recursive: true });
  await writeFile(join(root, target), serializeApprovalRecord(value));
  return target;
}

function commitAll(root: string): void {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'records');
}

async function gates(
  root: string,
  shipped: PromptBundleV1,
  source: () => Promise<CompiledRelease>,
  environment = 'prod'
): Promise<Awaited<ReturnType<typeof checkPromotionGates>>> {
  const loaded = await loadReleaseProject({ cwd: root });
  const context: PromotionGateContext = {
    project: loaded,
    config: loaded.config,
    configFile: loaded.paths.relative(loaded.configPath),
    environment,
    prompts: [{ id: shipped.id, contentHash: shipped.contentHash }],
    source,
  };
  return checkPromotionGates(context);
}

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('checkPromotionGates', () => {
  it('passes without building the source when no prompt policy exists', async () => {
    const root = await project(
      config(
        '  - name: layers\n    kind: layer-boundary\n    severity: error\n    layers: [a, b]\n'
      )
    );
    const shipped = await bundle(root, { risk: 'high' });
    const source = (): Promise<CompiledRelease> => Promise.reject(new Error('not built'));

    const result = await gates(root, shipped, source);

    expect(result).toEqual({ passed: true, findings: [], warnings: [], gates: [] });
  });

  it('does not suggest an approve command for an id an approval cannot name', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' }, { id: 'acme-support/refund\u200b-reply' });

    const result = await gates(root, shipped, built(shipped));

    expect(result.passed).toBe(false);
    const suggestion = result.gates[0]?.checks[0]?.suggestion ?? '';
    expect(suggestion).toContain(String.raw`acme-support/refund\u200B-reply cannot be approved`);
    expect(suggestion).toContain('warning about label ids');
    expect(suggestion).not.toContain('prs approve');
    expect(gateLines(result.gates[0] as ReleaseGateResult)[0]).toContain(
      String.raw`Gates for acme-support/refund\u200B-reply@`
    );
  });

  it('refuses a version that misses an approval and names the command that gives it', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });

    const result = await gates(root, shipped, built(shipped));

    expect(result.passed).toBe(false);
    expect(result.gates).toEqual([
      {
        prompt: ID,
        contentHash: shipped.contentHash,
        environment: 'prod',
        policyRisk: 'high',
        passed: false,
        checks: [
          {
            policy: 'high-risk-signoff',
            kind: 'required-approvals',
            severity: 'error',
            status: 'failed',
            message: `${ID}@${shipped.contentHash.slice(0, 19)} needs 1 legal approval for prod, found 0`,
            suggestion: `Run: prs approve ${ID}@${shipped.contentHash} --role legal --approver @<you> --env prod`,
            approvals: [{ role: 'legal', required: 1, found: [], stale: [] }],
          },
        ],
      },
    ]);
    expect(result.findings).toEqual([
      {
        code: 'PS030',
        message: expect.stringMatching(/^\[high-risk-signoff\] .* found 0\. Run: prs approve /),
        location: { file: '.promptscript/releases/prod.json' },
      },
    ]);
  });

  it('counts a committed record and lists one for another hash as stale', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    await record(root, { contentHash: shipped.contentHash, environment: 'prod' });
    await record(root, { approver: { source: 'asserted', value: '@Bob' } });
    commitAll(root);

    const result = await gates(root, shipped, built(shipped));

    expect(result.passed).toBe(true);
    expect(result.gates[0]?.checks[0]?.approvals).toEqual([
      { role: 'legal', required: 1, found: ['@jane'], stale: ['@Bob for sha256-000000000000'] },
    ]);
  });

  it.each([
    ['only staged', 'staged'],
    ['for another environment', 'staging'],
    ['at another path than its fields give', 'misplaced'],
    ['not a valid record', 'invalid'],
  ])('never counts a record that is %s', async (_name, kind) => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    const fields = { contentHash: shipped.contentHash };
    if (kind === 'staging') await record(root, { ...fields, environment: 'staging' });
    if (kind === 'misplaced') {
      await record(root, fields, approvalRecordPath({ ...fieldsOf(fields), role: 'security' }));
    }
    if (kind === 'invalid') {
      const path = await record(root, fields);
      await writeFile(join(root, path), '{}\n');
    }
    if (kind === 'staged') {
      await record(root, fields);
      git(root, 'add', '-A');
    } else {
      commitAll(root);
    }

    const result = await gates(root, shipped, built(shipped));

    expect(result.passed).toBe(false);
    expect(result.gates[0]?.checks[0]?.approvals?.[0]?.found).toEqual([]);
  });

  it.each([
    ['a symbolic link', '120000'],
    ['a submodule', '160000'],
    ['a tree', 'tree'],
  ])('never counts %s at the record path', async (_name, mode) => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    const path = approvalRecordPath(fieldsOf({ contentHash: shipped.contentHash }));
    if (mode === 'tree') {
      await record(root, { contentHash: shipped.contentHash }, `${path}/inner.json`);
      commitAll(root);
    } else {
      const object =
        mode === '160000'
          ? git(root, 'rev-parse', 'HEAD').trim()
          : git(root, 'hash-object', '-w', '--stdin').trim();
      git(root, 'update-index', '--add', '--cacheinfo', `${mode},${object},${path}`);
      git(root, 'commit', '-q', '-m', mode);
    }

    const result = await gates(root, shipped, built(shipped));

    expect(result.passed).toBe(false);
    expect(result.gates[0]?.checks[0]?.approvals?.[0]?.found).toEqual([]);
  });

  it('names every missing role in the approve hint', async () => {
    const both = SIGNOFF.replace(
      'approvals: [{ role: legal }]',
      'approvals: [{ role: legal }, { role: security }]'
    );
    const root = await project(config(both));
    const shipped = await bundle(root, { risk: 'high' });

    const result = await gates(root, shipped, built(shipped));

    const suggestion = result.gates[0]?.checks[0]?.suggestion ?? '';
    expect(suggestion).toContain('--role legal');
    expect(suggestion).toContain('--role security');
  });

  it('refuses a model the bundle ships under a name the catalog gives another model', async () => {
    const models = `  - name: allowed-models
    kind: model-allowlist
    severity: error
    models: [claude-sonnet-5-5]
`;
    const root = await project(config(models));
    const model = (profile: string, provider: string, apiId: string): Record<string, unknown> => ({
      model: { ref: profile, profile, provider, apiId, params: {} },
    });
    const swapped = await bundle(root, {}, model('claude-sonnet-5-5', 'openai', 'gpt-4o-mini'));
    const unknown = await bundle(root, {}, model('acme-private', 'acme', 'private-1'));

    const swap = await gates(root, swapped, built(swapped));
    const missing = await gates(root, unknown, built(unknown));

    expect(swap.gates[0]?.checks[0]?.message).toContain(
      'ships openai/gpt-4o-mini as "claude-sonnet-5-5", but "claude-sonnet-5-5" is anthropic/'
    );
    expect(missing.gates[0]?.checks[0]?.message).toContain(
      'ships the profile "acme-private", which the models of this config do not know'
    );
  });

  it.each([
    ['data classes that are no list', { dataClasses: 'pii' }],
    ['an owner that is no string', { owner: {} }],
    ['reviewers that are no list of strings', { reviewers: [1] }],
  ])('refuses a bundle with %s with PS5004', async (_name, governance) => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, governance as unknown as PromptBundleV1['governance']);

    const result = await gates(root, shipped, built(shipped));

    expect(result.findings.map((finding) => finding.code)).toEqual(['PS5004']);
  });

  it('refuses committed record paths that differ only in case', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    const path = await record(root, { contentHash: shipped.contentHash });
    commitAll(root);
    const blob = git(root, 'hash-object', '-w', path).trim();
    git(
      root,
      'update-index',
      '--add',
      '--cacheinfo',
      `100644,${blob},${path.replace('/legal/', '/Legal/')}`
    );
    git(root, 'commit', '-q', '-m', 'case');

    await expect(gates(root, shipped, built(shipped))).rejects.toMatchObject({
      code: 'PS5109',
      message: expect.stringContaining('differ only in case'),
    });
  });

  it('reads the records of every entry of a run and judges each entry by its own', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    const other = await bundle(root, { risk: 'high' }, { id: OTHER });
    await record(root, { contentHash: shipped.contentHash, environment: 'prod' });
    for (let index = 0; index < 60; index++) {
      const contentHash = `sha256-${index.toString(16).padStart(64, '0')}`;
      const approver = { source: 'asserted' as const, value: `@user${index}` };
      await record(root, { prompt: OTHER, contentHash, approver });
    }
    commitAll(root);
    const loaded = await loadReleaseProject({ cwd: root });

    const result = await checkPromotionGates({
      project: loaded,
      config: loaded.config,
      configFile: loaded.paths.relative(loaded.configPath),
      environment: 'prod',
      prompts: [shipped, other].map(({ id, contentHash }) => ({ id, contentHash })),
      source: built(shipped, other),
    });

    expect(result.gates.map((gate) => [gate.prompt, gate.passed])).toEqual([
      [ID, true],
      [OTHER, false],
    ]);
    expect(result.gates[0]?.checks[0]?.approvals?.[0]).toMatchObject({ found: ['@jane'] });
    expect(result.gates[1]?.checks[0]?.approvals?.[0]?.found).toEqual([]);
    expect(result.gates[1]?.checks[0]?.approvals?.[0]?.stale).toHaveLength(60);
  });

  it('fails closed with PS5108 for a record Git does not have, only in a run that needs it', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    const other = await bundle(root, { risk: 'high' }, { id: OTHER });
    await record(root, { contentHash: shipped.contentHash, environment: 'prod' });
    const path = await record(root, { prompt: OTHER, contentHash: other.contentHash });
    commitAll(root);
    const blob = git(root, 'rev-parse', `HEAD:${path}`).trim();
    // As in a partial clone: HEAD names the blob, the object store does not have it.
    await rm(join(root, '.git', 'objects', blob.slice(0, 2), blob.slice(2)));
    const loaded = await loadReleaseProject({ cwd: root });
    const run = (bundles: PromptBundleV1[]): ReturnType<typeof checkPromotionGates> =>
      checkPromotionGates({
        project: loaded,
        config: loaded.config,
        configFile: loaded.paths.relative(loaded.configPath),
        environment: 'prod',
        prompts: bundles.map(({ id, contentHash }) => ({ id, contentHash })),
        source: built(...bundles),
      });

    const alone = await run([shipped]);

    expect(alone.passed).toBe(true);
    await expect(run([shipped, other])).rejects.toMatchObject({
      code: 'PS5108',
      message: expect.stringMatching(
        new RegExp(
          `^Git cannot read the approval records in .*Git has no blob ${blob}\\. A partial clone`
        )
      ),
    });
  });

  it('fails closed with PS5108 when a loose object holds other bytes than its id', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    const fields = { contentHash: shipped.contentHash, environment: 'staging' };
    const path = await record(root, fields);
    commitAll(root);
    const blob = git(root, 'rev-parse', `HEAD:${path}`).trim();
    const object = join(root, '.git', 'objects', blob.slice(0, 2), blob.slice(2));
    const forged = Buffer.from(
      serializeApprovalRecord({ ...fieldsOf(fields), environment: 'prod' })
    );
    await chmod(object, 0o644);
    await writeFile(
      object,
      deflateSync(Buffer.concat([Buffer.from(`blob ${forged.length}\0`), forged]))
    );

    await expect(gates(root, shipped, built(shipped))).rejects.toMatchObject({
      code: 'PS5108',
      message: expect.stringContaining(`holds other bytes for blob ${blob}`),
    });
  });

  it('takes the higher risk of bundle and source, so a lowered bundle still needs approval', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'low' });
    const fromSource = await bundle(root, { risk: 'high' });

    const lowered = await gates(root, shipped, built({ ...fromSource, id: ID }));
    const alone = await gates(root, shipped, built());

    expect(lowered.gates[0]?.policyRisk).toBe('high');
    expect(lowered.passed).toBe(false);
    expect(alone.gates[0]?.checks).toEqual([]);
    expect(alone.passed).toBe(true);
  });

  it('matches data classes on the union of bundle and source', async () => {
    const root = await project(
      config(SIGNOFF.replace('match: { minRisk: high }', 'match: { dataClasses: [pii] }'))
    );
    const shipped = await bundle(root, {});
    const fromSource = await bundle(root, { dataClasses: ['pii'] });

    const result = await gates(root, shipped, built(fromSource));

    expect(result.gates[0]?.checks.map((check) => check.status)).toEqual(['failed']);
  });

  it('raises the policy risk with a risk floor of either side and judges the floor on the bundle', async () => {
    const floor = `  - name: data-floor
    kind: risk-floor
    severity: warning
    floors: [{ dataClasses: [pii], minimum: high }]
`;
    const root = await project(config(`${floor}${SIGNOFF}`));
    const shipped = await bundle(root, { risk: 'low', dataClasses: ['pii'] });

    const result = await gates(root, shipped, built(shipped));

    expect(result.gates[0]?.policyRisk).toBe('high');
    expect(result.gates[0]?.checks.map((check) => [check.policy, check.status])).toEqual([
      ['data-floor', 'failed'],
      ['high-risk-signoff', 'failed'],
    ]);
    expect(result.warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining('[data-floor] Prompt "acme-support/refund-reply" has risk "low"'),
    ]);
  });

  describe('capped approvals under required-approvals', () => {
    const arm = (weight: number): GateEntryOverride => ({
      exposure: { experiment: 'tone', variant: 'warm', weight },
    });
    type GateEntryOverride = Partial<PromotionGateContext['prompts'][number]>;

    async function judge(
      root: string,
      shipped: PromptBundleV1,
      entry: GateEntryOverride
    ): Promise<Awaited<ReturnType<typeof checkPromotionGates>>> {
      const loaded = await loadReleaseProject({ cwd: root });
      return checkPromotionGates({
        project: loaded,
        config: loaded.config,
        configFile: loaded.paths.relative(loaded.configPath),
        environment: 'prod',
        prompts: [{ id: shipped.id, contentHash: shipped.contentHash, ...entry }],
        source: built(shipped),
      });
    }

    async function capped(maxWeight: number): Promise<[string, PromptBundleV1]> {
      const root = await project(config(SIGNOFF));
      const shipped = await bundle(root, { risk: 'high' });
      await record(root, {
        contentHash: shipped.contentHash,
        approver: { source: 'asserted', value: '@bob' },
        environment: 'prod',
        maxWeight,
      });
      commitAll(root);
      return [root, shipped];
    }

    it('never lets a capped record approve the entry hash, even at 10000', async () => {
      const [root, shipped] = await capped(10000);

      const result = await judge(root, shipped, {});

      expect(result.passed).toBe(false);
      expect(result.gates[0]?.checks[0]?.approvals).toEqual([
        { role: 'legal', required: 1, found: [], stale: [], capped: ['@bob up to 100 %'] },
      ]);
      expect(result.gates[0]?.checks[0]?.message).toBe(
        `${ID}@${shipped.contentHash.slice(0, 19)} needs 1 legal approval for prod, found 0 (capped: @bob up to 100 %)`
      );
      expect(result.gates[0]?.checks[0]?.suggestion).toBe(
        `Run: prs approve ${ID}@${shipped.contentHash} --role legal --approver @<you> --env prod`
      );
    });

    it('counts a capped record for an arm at or under its ceiling', async () => {
      const [root, shipped] = await capped(2500);

      const under = await judge(root, shipped, arm(1000));
      const equal = await judge(root, shipped, arm(2500));

      expect(under.passed).toBe(true);
      expect(equal.passed).toBe(true);
      expect(equal.gates[0]?.checks[0]?.approvals?.[0]).toEqual({
        role: 'legal',
        required: 1,
        found: ['@bob'],
        stale: [],
      });
    });

    it('never counts a capped record for an arm above its ceiling', async () => {
      const [root, shipped] = await capped(2500);

      const result = await judge(root, shipped, arm(3000));

      expect(result.passed).toBe(false);
      expect(result.gates[0]?.checks[0]).toMatchObject({
        message: `warm of ${ID}@${shipped.contentHash.slice(0, 19)} at 30 % needs 1 legal approval for prod, found 0 (capped: @bob up to 25 %)`,
        suggestion: `Run: prs approve ${ID}@${shipped.contentHash} --role legal --approver @<you> --env prod --max-weight 30`,
        approvals: [
          { role: 'legal', required: 1, found: [], stale: [], capped: ['@bob up to 25 %'] },
        ],
      });
      expect(gateLines(result.gates[0] as NonNullable<(typeof result.gates)[number]>)).toContain(
        '  failed       high-risk-signoff  legal 0 of 1 (capped: @bob up to 25 %)'
      );
    });

    it('still counts a record without a ceiling for an arm and for the entry hash', async () => {
      const root = await project(config(SIGNOFF));
      const shipped = await bundle(root, { risk: 'high' });
      await record(root, { contentHash: shipped.contentHash, environment: 'prod' });
      commitAll(root);

      const entry = await judge(root, shipped, {});
      const warm = await judge(root, shipped, arm(10000));

      expect(entry.passed).toBe(true);
      expect(warm.passed).toBe(true);
      expect(entry.gates[0]?.checks[0]?.approvals?.[0]).not.toHaveProperty('capped');
    });

    it('never counts a hand-written capped record without environment', async () => {
      const root = await project(config(SIGNOFF));
      const shipped = await bundle(root, { risk: 'high' });
      const fields = { contentHash: shipped.contentHash };
      await record(root, { ...fields, maxWeight: 500 }, approvalRecordPath(fieldsOf(fields)));
      commitAll(root);

      const entry = await judge(root, shipped, {});
      const warm = await judge(root, shipped, arm(500));

      expect(entry.passed).toBe(false);
      expect(warm.passed).toBe(false);
      expect(warm.gates[0]?.checks[0]?.approvals?.[0]).toEqual({
        role: 'legal',
        required: 1,
        found: [],
        stale: [],
      });
    });
  });

  it('reports required-evals as unavailable, which only a warning severity lets pass', async () => {
    const evals = (severity: string): string =>
      `  - name: prod-evals\n    kind: required-evals\n    severity: ${severity}\n    environments: [prod]\n`;
    const strict = await project(config(evals('error')));
    const lenient = await project(config(evals('warning')));
    const strictBundle = await bundle(strict, {});
    const lenientBundle = await bundle(lenient, {});

    const failed = await gates(strict, strictBundle, built(strictBundle));
    const warned = await gates(lenient, lenientBundle, built(lenientBundle));
    const staging = await gates(strict, strictBundle, built(strictBundle), 'staging');

    expect(failed.passed).toBe(false);
    expect(failed.gates[0]?.checks[0]).toMatchObject({
      status: 'unavailable',
      message: `${ID} needs passing evals for prod, but release gates do not read eval results in this version of prs`,
    });
    expect(warned.passed).toBe(true);
    expect(warned.warnings).toHaveLength(1);
    expect(staging.gates[0]?.checks).toEqual([]);
  });

  describe('max-experiment-weight', () => {
    const POLICY = (extra = ''): string =>
      `  - name: high-risk-exposure\n    kind: max-experiment-weight\n    severity: error\n    match: { minRisk: high }\n    environments: [prod]\n    maxWeight: 5\n    approvals: [{ role: legal }]\n    ceiling: 25\n${extra}`;
    const bob = { source: 'asserted' as const, value: '@bob' };

    async function setup(
      policies = POLICY(),
      governance: PromptBundleV1['governance'] = { risk: 'high' }
    ): Promise<[string, PromptBundleV1]> {
      const root = await project(config(policies));
      return [root, await bundle(root, governance)];
    }

    async function judge(
      root: string,
      shipped: PromptBundleV1,
      weight: number | undefined,
      environment = 'prod'
    ): Promise<Awaited<ReturnType<typeof checkPromotionGates>>> {
      const loaded = await loadReleaseProject({ cwd: root });
      return checkPromotionGates({
        project: loaded,
        config: loaded.config,
        configFile: loaded.paths.relative(loaded.configPath),
        environment,
        prompts: [
          {
            id: shipped.id,
            contentHash: shipped.contentHash,
            ...(weight === undefined
              ? {}
              : { exposure: { experiment: 'tone', variant: 'warm', weight } }),
          },
        ],
        source: built(shipped),
      });
    }

    const checkOf = (
      result: Awaited<ReturnType<typeof checkPromotionGates>>
    ): ReleaseGateCheck | undefined => result.gates[0]?.checks[0];

    it('passes an arm at the cap without a record', async () => {
      const [root, shipped] = await setup();

      const result = await judge(root, shipped, 500);

      expect(result.passed).toBe(true);
      expect(checkOf(result)).toEqual({
        policy: 'high-risk-exposure',
        kind: 'max-experiment-weight',
        severity: 'error',
        status: 'passed',
      });
    });

    it('fails an arm above the cap without a record and names the approve command', async () => {
      const [root, shipped] = await setup();

      const result = await judge(root, shipped, 501);

      expect(result.passed).toBe(false);
      expect(checkOf(result)).toEqual({
        policy: 'high-risk-exposure',
        kind: 'max-experiment-weight',
        severity: 'error',
        status: 'failed',
        message: `warm of ${ID}@${shipped.contentHash.slice(0, 19)} runs 5.01 % in prod; high-risk-exposure needs a legal approval up to at least 5.01 %, found 0`,
        suggestion: `Run: prs approve ${ID}@${shipped.contentHash} --role legal --approver @<you> --env prod --max-weight 5.01`,
        approvals: [{ role: 'legal', required: 1, found: [], stale: [] }],
      });
      expect(result.findings[0]?.code).toBe('PS030');
    });

    it('fails above the ceiling even with a record of 10000 and one without a ceiling', async () => {
      const [root, shipped] = await setup();
      await record(root, {
        contentHash: shipped.contentHash,
        environment: 'prod',
        maxWeight: 10000,
      });
      await record(root, { contentHash: shipped.contentHash, approver: bob });
      commitAll(root);

      const result = await judge(root, shipped, 2600);

      expect(result.passed).toBe(false);
      expect(checkOf(result)).toMatchObject({
        status: 'failed',
        message: `warm of ${ID}@${shipped.contentHash.slice(0, 19)} runs 26 % in prod; high-risk-exposure allows at most 25 %`,
        suggestion:
          'Lower warm to at most 25 % with prs release split, or change the policy in a reviewed pull request.',
      });
      expect(checkOf(result)?.approvals).toBeUndefined();
    });

    it('has no upper limit without a ceiling, only the records', async () => {
      const [root, shipped] = await setup(POLICY().replace('    ceiling: 25\n', ''));
      await record(root, {
        contentHash: shipped.contentHash,
        environment: 'prod',
        maxWeight: 9000,
      });
      commitAll(root);

      const covered = await judge(root, shipped, 9000);
      const above = await judge(root, shipped, 9001);

      expect(covered.passed).toBe(true);
      expect(above.passed).toBe(false);
    });

    it('fails an arm above a hard cap that has no approvals', async () => {
      const [root, shipped] = await setup(
        '  - name: hard\n    kind: max-experiment-weight\n    severity: error\n    maxWeight: 5\n'
      );

      const result = await judge(root, shipped, 600);

      expect(checkOf(result)).toMatchObject({
        status: 'failed',
        message: `warm of ${ID}@${shipped.contentHash.slice(0, 19)} runs 6 % in prod; hard allows at most 5 %`,
        suggestion:
          'Lower warm to at most 5 % with prs release split, or change the policy in a reviewed pull request.',
      });
    });

    it('counts a capped record for an arm at its ceiling', async () => {
      const [root, shipped] = await setup();
      await record(root, {
        contentHash: shipped.contentHash,
        environment: 'prod',
        maxWeight: 1000,
      });
      commitAll(root);

      const result = await judge(root, shipped, 1000);

      expect(result.passed).toBe(true);
      expect(checkOf(result)).toMatchObject({
        status: 'passed',
        approvals: [{ role: 'legal', required: 1, found: ['@jane'], stale: [] }],
      });
    });

    it('does not count a record whose ceiling is one basis point below the arm', async () => {
      const [root, shipped] = await setup();
      await record(root, {
        contentHash: shipped.contentHash,
        approver: bob,
        environment: 'prod',
        maxWeight: 999,
      });
      commitAll(root);

      const result = await judge(root, shipped, 1000);

      expect(result.passed).toBe(false);
      expect(checkOf(result)).toMatchObject({
        status: 'failed',
        message: `warm of ${ID}@${shipped.contentHash.slice(0, 19)} runs 10 % in prod; high-risk-exposure needs a legal approval up to at least 10 %, found 0 (capped: @bob up to 9.99 %)`,
        approvals: [
          { role: 'legal', required: 1, found: [], stale: [], capped: ['@bob up to 9.99 %'] },
        ],
      });
    });

    it('counts a record without a ceiling for an arm up to the ceiling of the policy', async () => {
      const [root, shipped] = await setup();
      await record(root, { contentHash: shipped.contentHash });
      commitAll(root);

      const result = await judge(root, shipped, 2000);

      expect(result.passed).toBe(true);
    });

    it('does not count a record of another environment or of another hash', async () => {
      const [root, shipped] = await setup();
      await record(root, { contentHash: shipped.contentHash, environment: 'staging' });
      await record(root, { approver: bob });
      commitAll(root);

      const result = await judge(root, shipped, 1000);

      expect(result.passed).toBe(false);
      expect(checkOf(result)?.approvals).toEqual([
        { role: 'legal', required: 1, found: [], stale: ['@bob for sha256-000000000000'] },
      ]);
    });

    it('judges no check for an arm at weight 0, the entry hash or the control', async () => {
      const [root, shipped] = await setup();

      const paused = await judge(root, shipped, 0);
      const entry = await judge(root, shipped, undefined);

      expect(paused.passed).toBe(true);
      expect(paused.gates[0]?.checks).toEqual([]);
      expect(entry.passed).toBe(true);
      expect(entry.gates[0]?.checks).toEqual([]);
    });

    it('does not apply when the match does not select or the environment differs', async () => {
      const [root, shipped] = await setup(POLICY(), { risk: 'low' });
      const [other, risky] = await setup();

      const low = await judge(root, shipped, 3000);
      const staging = await judge(other, risky, 3000, 'staging');

      expect(low.gates[0]?.checks).toEqual([]);
      expect(staging.gates[0]?.checks).toEqual([]);
    });

    it('only warns at severity warning', async () => {
      const [root, shipped] = await setup(POLICY().replace('severity: error', 'severity: warning'));

      const result = await judge(root, shipped, 3000);

      expect(result.passed).toBe(true);
      expect(result.findings).toEqual([]);
      expect(result.warnings.map((warning) => warning.code)).toEqual(['PS030']);
    });

    it('lets every stacked policy judge the arm', async () => {
      const hard =
        '  - name: hard\n    kind: max-experiment-weight\n    severity: error\n    maxWeight: 5\n';
      const [root, shipped] = await setup(
        `${hard}${POLICY().replace('maxWeight: 5', 'maxWeight: 20').replace('ceiling: 25', 'ceiling: 50')}`
      );
      await record(root, { contentHash: shipped.contentHash });
      commitAll(root);

      const result = await judge(root, shipped, 1000);

      expect(result.passed).toBe(false);
      expect(result.gates[0]?.checks.map((check) => [check.policy, check.status])).toEqual([
        ['hard', 'failed'],
        ['high-risk-exposure', 'passed'],
      ]);
    });

    it('reads the records of a role only this policy asks for', async () => {
      const [root, shipped] = await setup(POLICY().replace('role: legal', 'role: security'), {
        risk: 'high',
      });
      await record(root, { contentHash: shipped.contentHash, role: 'security' });
      commitAll(root);

      const result = await judge(root, shipped, 1000);

      expect(result.passed).toBe(true);
      expect(checkOf(result)?.approvals?.[0]?.found).toEqual(['@jane']);
    });

    it('names every missing role', async () => {
      const [root, shipped] = await setup(
        POLICY().replace('[{ role: legal }]', '[{ role: legal }, { role: security }]')
      );
      await record(root, { contentHash: shipped.contentHash });
      commitAll(root);

      const result = await judge(root, shipped, 1000);

      expect(checkOf(result)).toMatchObject({
        message: expect.stringContaining('needs a security approval up to at least 10 %, found 0'),
        suggestion: `Run: prs approve ${ID}@${shipped.contentHash} --role security --approver @<you> --env prod --max-weight 10`,
      });
      expect(
        gateLines(result.gates[0] as NonNullable<(typeof result.gates)[number]>).at(-1)
      ).toContain('security 0 of 1');
    });
  });

  it('skips max-experiment-weight for an arm its match does not select', async () => {
    const root = await project(
      config(
        '  - name: exposure\n    kind: max-experiment-weight\n    severity: error\n    match: { minRisk: high }\n    maxWeight: 5\n'
      )
    );
    const shipped = await bundle(root, { risk: 'low' });
    const loaded = await loadReleaseProject({ cwd: root });

    const result = await checkPromotionGates({
      project: loaded,
      config: loaded.config,
      configFile: 'promptscript.yaml',
      environment: 'prod',
      prompts: [
        {
          id: ID,
          contentHash: shipped.contentHash,
          exposure: { experiment: 'tone', variant: 'warm', weight: 3000 },
        },
      ],
      source: built(shipped),
    });

    expect(result.passed).toBe(true);
    expect(result.gates[0]?.checks).toEqual([]);
  });

  it('fails every gate when a max-experiment-weight policy does not parse', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    const loaded = await loadReleaseProject({ cwd: root });
    // A base config of status --base is parsed by the gates only.
    const hardCapWithCeiling = {
      ...loaded.config,
      policies: [
        {
          name: 'exposure',
          kind: 'max-experiment-weight',
          severity: 'warning',
          maxWeight: 5,
          ceiling: 25,
        },
      ],
    } as typeof loaded.config;

    const result = await checkPromotionGates({
      project: loaded,
      config: hardCapWithCeiling,
      configFile: 'promptscript.yaml',
      environment: 'prod',
      prompts: [{ id: ID, contentHash: shipped.contentHash }],
      source: built(shipped),
    });

    expect(result.passed).toBe(false);
    expect(result.findings.map((finding) => finding.message)).toEqual([
      'The policies cannot be evaluated, so no gate passes: Policy "exposure": "ceiling" needs "approvals": without them the cap is maxWeight. Add approvals or remove ceiling. Fix the policy definitions.',
    ]);
  });

  it('runs content rules with the project patterns, whatever validation turns off', async () => {
    const content = `  - name: payments-content
    kind: content-rules
    severity: error
    checks: [blocked-patterns]
    deny: ['guaranteed refund']
`;
    const off = `validation:
  disableRules: [PS030, PS005]
  rules: { policy-compliance: off, blocked-patterns: off }
  blockedPatterns: ['secret-[0-9]+', 'leak-[a-z]+']
  allowedPatterns: ['secret-[0-9]+']
`;
    const root = await project(config(content, off));
    const allowed = await bundle(
      root,
      {},
      {
        messages: [{ role: 'system', content: 'Quote secret-42 back.' }],
      }
    );
    const blocked = await bundle(
      root,
      {},
      {
        messages: [{ role: 'system', content: 'Quote leak-key. A guaranteed refund.' }],
      }
    );

    const passing = await gates(root, allowed, built(allowed));
    const failing = await gates(root, blocked, built(blocked));

    expect(passing.passed).toBe(true);
    expect(failing.passed).toBe(false);
    expect(failing.gates[0]?.checks[0]?.message).toContain('blocked-patterns');
    expect(failing.gates[0]?.checks[0]?.message).toContain('guaranteed refund');
  });

  it('allows a bundle whose model profile is in the allowlist, and reads enum options', async () => {
    const models = `  - name: high-risk-models
    kind: model-allowlist
    severity: error
    models: [claude-3-7-sonnet]
`;
    const root = await project(config(models));
    const pinned = await bundle(
      root,
      {},
      {
        model: {
          ref: 'sonnet',
          profile: 'claude-3-7-sonnet',
          provider: 'anthropic',
          apiId: 'claude-3-7-sonnet-20250219',
          params: {},
        },
        inputs: {
          status: {
            type: 'enum',
            description: 'Status',
            options: ['open', 'closed'],
            required: true,
          },
        },
      }
    );

    const result = await gates(root, pinned, built(pinned));

    expect(result.passed).toBe(true);
    expect(result.gates[0]?.checks[0]?.status).toBe('passed');
  });

  it('checks the model of the bundle, profile first', async () => {
    const models = `  - name: high-risk-models
    kind: model-allowlist
    severity: error
    models: [claude-3-7-sonnet]
`;
    const root = await project(config(models));
    const none = await bundle(root, {});

    const result = await gates(root, none, built(none));

    expect(result.gates[0]?.checks[0]).toMatchObject({
      status: 'failed',
      message: expect.stringContaining('has no model'),
    });
  });

  it('fails every gate when the policies do not parse or the source does not build', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    const loaded = await loadReleaseProject({ cwd: root });
    // A base config of status --base is parsed by the gates only.
    const unknownRole = {
      ...loaded.config,
      policies: [
        {
          name: 'signoff',
          kind: 'required-approvals',
          severity: 'error',
          approvals: [{ role: 'finance' }],
        },
      ],
    } as typeof loaded.config;
    const broken = (): Promise<CompiledRelease> =>
      Promise.reject(new ReleaseCompileError([{ code: 'PS2000', message: 'broken source' }]));

    const parse = await checkPromotionGates({
      project: loaded,
      config: unknownRole,
      configFile: 'promptscript.yaml',
      environment: 'prod',
      prompts: [{ id: ID, contentHash: shipped.contentHash }],
      source: built(shipped),
    });
    const compile = await gates(root, shipped, broken);

    expect(parse.passed).toBe(false);
    expect(parse.findings[0]?.message).toContain('The policies cannot be evaluated');
    expect(parse.findings[0]?.location).toEqual({ file: 'promptscript.yaml' });
    expect(compile.passed).toBe(false);
    expect(compile.findings[0]?.location).toEqual({ file: 'promptscript.yaml' });
    expect(compile.findings.map((finding) => finding.message)).toEqual([
      expect.stringContaining('The source does not build'),
      'broken source',
    ]);
  });

  it('fails the gate of an entry whose bundle is missing', async () => {
    const root = await project(config(SIGNOFF));
    const shipped = await bundle(root, { risk: 'high' });
    await rm(join(root, '.promptscript', 'releases', 'bundles', `${shipped.contentHash}.json`));

    const result = await gates(root, shipped, built(shipped));

    expect(result.passed).toBe(false);
    expect(result.findings.map((finding) => finding.code)).toEqual(['PS5003']);
  });
});

describe('gateLines', () => {
  it('prints nothing for a version no policy applies to', () => {
    const lines = gateLines({
      prompt: ID,
      contentHash: `sha256-${'0'.repeat(64)}`,
      environment: 'staging',
      policyRisk: 'low',
      passed: true,
      checks: [],
    });

    expect(lines).toEqual([]);
  });

  it('prints each check with its status, approvals as found of required', () => {
    const lines = gateLines({
      prompt: ID,
      contentHash: `sha256-${'3f9a1c2b'.repeat(8)}`,
      environment: 'prod',
      policyRisk: 'high',
      passed: false,
      checks: [
        {
          policy: 'high-risk-models',
          kind: 'model-allowlist',
          severity: 'error',
          status: 'passed',
        },
        {
          policy: 'high-risk-signoff',
          kind: 'required-approvals',
          severity: 'error',
          status: 'failed',
          approvals: [
            { role: 'security', required: 1, found: [], stale: ['@bob for sha256-91bc0d2e1234'] },
          ],
        },
        {
          policy: 'prod-evals',
          kind: 'required-evals',
          severity: 'error',
          status: 'unavailable',
          message: 'evals are not read',
        },
      ],
    });

    expect(lines).toEqual([
      `Gates for ${ID}@sha256-3f9a1c2b3f9a to prod (policy risk: high)`,
      '  passed       high-risk-models  model-allowlist',
      '  failed       high-risk-signoff  security 0 of 1 (stale: @bob for sha256-91bc0d2e1234)',
      '  unavailable  prod-evals  evals are not read',
    ]);
  });
});

function fieldsOf(fields: Partial<ApprovalRecordV1>): ApprovalRecordV1 {
  return {
    $schema: 'https://getpromptscript.dev/schema/approval-record/v1.json',
    prompt: ID,
    contentHash: `sha256-${'0'.repeat(64)}`,
    role: 'legal',
    approver: { source: 'asserted', value: '@jane' },
    createdAt: '2026-10-22T09:14:03.120Z',
    ...fields,
  };
}
