import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateReleaseReport } from '../../__tests__/prompt-bundle-validators.js';
import type { ReleaseReport } from '../../utils/release-report.js';
import { approveCommand } from '../approve/approve.js';
import { releaseBuildCommand } from './build.js';
import { releasePromoteCommand } from './promote.js';
import { releaseRollbackCommand } from './rollback.js';
import { releaseStatusCommand } from './status.js';

const ID = 'acme-support/refund-reply';

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

function config(extra = '', environments = ''): string {
  return `version: '1'
project:
  id: acme-support
targets:
  - claude
includePromptScriptSkill: false
releases:
  environments: [staging, prod]
governance:
  roles:
    legal: ['@acme/legal']
${extra}policies:
  - name: high-risk-signoff
    kind: required-approvals
    severity: error
    match: { minRisk: high }
${environments}    approvals: [{ role: legal }]
`;
}

const PROD_ONLY = '    environments: [prod]\n';

const directories: string[] = [];

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

async function project(yaml: string, system = 'You answer refund requests.'): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-promote-gates-'));
  directories.push(root);
  await mkdir(join(root, '.promptscript'), { recursive: true });
  await writeFile(join(root, 'promptscript.yaml'), yaml);
  await writeFile(join(root, '.promptscript', 'project.prs'), source(system));
  await writeFile(join(root, '.gitignore'), '.promptscript-release.lock\n');
  git(root, 'init', '-q');
  commit(root, 'init');
  return root;
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

async function approve(cwd: string, hash: string, env?: string): Promise<void> {
  await capture(() =>
    approveCommand(`${ID}@${hash}`, {
      cwd,
      role: 'legal',
      approver: '@jane',
      format: 'json',
      ...(env === undefined ? { allEnvironments: true } : { env }),
    })
  );
  expect(process.exitCode).toBe(0);
}

async function builtHash(root: string): Promise<string> {
  const manifest = JSON.parse(
    await readFile(join(root, '.promptscript', 'releases', 'manifest.json'), 'utf8')
  ) as { prompts: Array<{ contentHash: string }> };
  return manifest.prompts[0]?.contentHash ?? '';
}

const label = (root: string, env: string): string =>
  join(root, '.promptscript', 'releases', `${env}.json`);

beforeEach(() => {
  process.exitCode = undefined;
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('prs release promote gates', () => {
  it('refuses prod until a committed record approves the hash for prod', async () => {
    const root = await project(config('', PROD_ONLY));
    await build(root);
    await promote(root, 'staging');
    commit(root, 'staging');
    const hash = await builtHash(root);

    const missing = await promote(root, 'prod');
    await approve(root, hash, 'prod');
    const uncommitted = await promote(root, 'prod');
    commit(root, 'approve');
    const approved = await promote(root, 'prod');

    expect(missing.success).toBe(false);
    expect(missing.errors.map((error) => [error.code, error.message])).toEqual([
      ['PS030', expect.stringContaining(`[high-risk-signoff] ${ID}@`)],
    ]);
    expect(missing.gates?.[0]?.passed).toBe(false);
    expect(uncommitted.success).toBe(false);
    expect(approved.success).toBe(true);
    expect(approved.gates?.[0]).toMatchObject({ passed: true, policyRisk: 'high' });
    expect(existsSync(label(root, 'prod'))).toBe(true);
  });

  it('does not count a staging record for prod', async () => {
    const root = await project(config('', PROD_ONLY));
    await build(root);
    await promote(root, 'staging');
    await approve(root, await builtHash(root), 'staging');
    commit(root, 'staging');

    const result = await promote(root, 'prod');

    expect(result.success).toBe(false);
    expect(existsSync(label(root, 'prod'))).toBe(false);
  });

  it('still blocks when the config switches policy-compliance off', async () => {
    const off = 'validation:\n  disableRules: [PS030]\n  rules: { policy-compliance: off }\n';
    const root = await project(config(off));
    await build(root);

    const result = await promote(root, 'staging');

    expect(result.success).toBe(false);
    expect(result.errors[0]?.code).toBe('PS030');
    expect(existsSync(label(root, 'staging'))).toBe(false);
  });

  it('prints the gates and the refusal as text', async () => {
    const root = await project(config());
    await build(root);

    const { text } = await capture(() =>
      releasePromoteCommand(ID, { cwd: root, format: 'text', to: 'staging' })
    );

    expect(process.exitCode).toBe(1);
    expect(text).toContain(`Gates for ${ID}@sha256-`);
    expect(text).toContain('failed       high-risk-signoff  legal 0 of 1');
    expect(text).toContain('Promotion refused. Label staging is unchanged.');
  });
});

describe('prs release rollback gates', () => {
  it('judges the hash a rollback brings back with the records committed now', async () => {
    const root = await project(config());
    await build(root);
    const first = await builtHash(root);
    await approve(root, first);
    commit(root, 'approve first');
    await promote(root, 'staging');
    commit(root, 'staging first');
    await writeFile(join(root, '.promptscript', 'project.prs'), source('You answer refunds.'));
    await build(root);
    await approve(root, await builtHash(root));
    commit(root, 'approve second');
    await promote(root, 'staging');
    commit(root, 'staging second');
    const record = join(root, '.promptscript', 'approvals', 'legal', ID, `${first}.jane.json`);
    const kept = await readFile(record);
    await rm(record);
    commit(root, 'withdraw first');
    const before = await readFile(label(root, 'staging'), 'utf8');

    const refused = await rollback(root, 'staging');
    const unchanged = await readFile(label(root, 'staging'), 'utf8');
    await writeFile(record, kept);
    commit(root, 'approve first again');
    const restored = await rollback(root, 'staging');

    expect(refused.success).toBe(false);
    expect(refused.gates?.map((gate) => gate.contentHash)).toEqual([first]);
    expect(unchanged).toBe(before);
    expect(restored.success).toBe(true);
  });
});

describe('prs release status gates', () => {
  it('shows the approvals of every entry and only warns', async () => {
    const root = await project(config('', PROD_ONLY));
    await build(root);
    await promote(root, 'staging');
    commit(root, 'staging');
    await writeFile(
      label(root, 'prod'),
      await readFile(label(root, 'staging'), 'utf8').then((text) =>
        text.replace('"staging"', '"prod"')
      )
    );

    const report = await json(() => releaseStatusCommand({ cwd: root, format: 'json' }));
    const { text } = await capture(() => releaseStatusCommand({ cwd: root, format: 'text' }));

    expect(report.success).toBe(true);
    expect(report.warnings.map((warning) => warning.code)).toContain('PS030');
    expect(report.gates?.map((gate) => [gate.environment, gate.passed])).toEqual([
      ['staging', true],
      ['prod', false],
    ]);
    expect(text).toContain('approvals: -');
    expect(text).toContain('approvals: missing: legal');
  });

  it('keeps plain status working when Git cannot read the records', async () => {
    const root = await project(config('', PROD_ONLY));
    await build(root);
    await promote(root, 'staging');
    commit(root, 'staging');
    await writeFile(
      label(root, 'prod'),
      await readFile(label(root, 'staging'), 'utf8').then((text) =>
        text.replace('"staging"', '"prod"')
      )
    );
    vi.stubEnv('GIT_DIR', join(root, 'no-repository'));

    try {
      const report = await json(() => releaseStatusCommand({ cwd: root, format: 'json' }));

      expect(report.success).toBe(true);
      expect(report.warnings.map((warning) => warning.code)).toContain('PS5108');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('judges the shipped model with the models of the base under --base', async () => {
    const allowlist = `version: '1'
project:
  id: acme-support
targets:
  - claude
includePromptScriptSkill: false
releases:
  environments: [staging, prod]
policies:
  - name: allowed-models
    kind: model-allowlist
    severity: error
    models: [claude-sonnet-5-5]
`;
    const modelSource = source('You answer refund requests.').replace(
      'description: "Answer a refund request"',
      'description: "Answer a refund request"\n    model: { ref: "claude-sonnet-5-5" }'
    );
    const root = await project(allowlist);
    await writeFile(join(root, '.promptscript', 'project.prs'), modelSource);
    commit(root, 'model');
    git(root, 'tag', 'base');
    // The pull request points the allowed name at another provider and model.
    await writeFile(
      join(root, 'promptscript.yaml'),
      `${allowlist}models:\n  profiles:\n    claude-sonnet-5-5: { provider: openai, apiId: gpt-4o-mini }\n`
    );
    await build(root);
    const local = await promote(root, 'staging');

    const checked = await json(() =>
      releaseStatusCommand({ cwd: root, format: 'json', base: 'base' })
    );

    expect(local.success).toBe(true);
    expect(checked.success).toBe(false);
    expect(checked.errors.map((error) => error.message)).toEqual([
      expect.stringContaining('ships openai/gpt-4o-mini as "claude-sonnet-5-5"'),
    ]);
  });

  it('reports a missing bundle of a changed entry once under --base', async () => {
    const root = await project(config('', PROD_ONLY));
    await build(root);
    await promote(root, 'staging');
    commit(root, 'staging');
    git(root, 'tag', 'base');
    await writeFile(
      label(root, 'staging'),
      (await readFile(label(root, 'staging'), 'utf8')).replace(
        /sha256-[0-9a-f]{64}/,
        `sha256-${'e'.repeat(64)}`
      )
    );

    const result = await json(() =>
      releaseStatusCommand({ cwd: root, format: 'json', base: 'base' })
    );

    expect(result.errors.filter((error) => error.code === 'PS5003')).toHaveLength(1);
  });

  it('fails status --base on a changed entry that misses its approval', async () => {
    const root = await project(config('', PROD_ONLY));
    await build(root);
    await promote(root, 'staging');
    commit(root, 'staging');
    git(root, 'tag', 'base');
    await writeFile(
      label(root, 'prod'),
      await readFile(label(root, 'staging'), 'utf8').then((text) =>
        text.replace('"staging"', '"prod"')
      )
    );

    const missing = await json(() =>
      releaseStatusCommand({ cwd: root, format: 'json', base: 'base' })
    );
    await approve(root, await builtHash(root), 'prod');
    commit(root, 'approve and promote');
    const approved = await json(() =>
      releaseStatusCommand({ cwd: root, format: 'json', base: 'base' })
    );

    expect(missing.success).toBe(false);
    expect(missing.errors.map((error) => error.code)).toEqual(['PS030']);
    expect(approved.success).toBe(true);
    expect(approved.gates?.map((gate) => gate.passed)).toEqual([true]);
  });
});
