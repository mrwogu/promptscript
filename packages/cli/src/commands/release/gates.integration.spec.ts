import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  approvalRecordPath,
  hashPromptBundle,
  PROMPT_BUNDLE_SCHEMA_URL,
  serializeApprovalRecord,
  type ApprovalRecordV1,
  type PromptBundleV1,
} from '@promptscript/core';
import { checkPromotionGates, gateLines, type PromotionGateContext } from './gates.js';
import { loadReleaseProject, ReleaseCompileError, type CompiledRelease } from './project.js';

const ID = 'acme-support/refund-reply';

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
