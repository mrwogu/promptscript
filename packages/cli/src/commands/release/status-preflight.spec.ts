import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashPromptBundle, PROMPT_BUNDLE_SCHEMA_URL } from '@promptscript/core';
import type { ReleaseGateResult, ReleaseReport } from '../../utils/release-report.js';
import { governanceCodeownersCommand } from '../governance/codeowners.js';
import { releaseStatusCommand } from './status.js';

// Every test resolves a project in a fresh Git repository, which is slow on a loaded machine.
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

// The gates have their own specs; here they only say which roles an approval gate needs.
const gate = vi.hoisted(() => ({ gates: [] as unknown[] }));
vi.mock('./gates.js', () => ({
  checkPromotionGates: () =>
    Promise.resolve({ passed: true, findings: [], warnings: [], gates: gate.gates }),
  gateLines: () => [],
}));

const ID = 'acme-support/refund-reply';

const PRS = `@meta {
  id: "acme-support"
  syntax: "1.6.0"
}

@prompts {
  refund-reply: {
    description: "Answer a refund request"
    system: "You answer refund requests."
    user: "Hello"
  }
}
`;

const POLICY = (roles: string[]): string => `policies:
  - name: signoff
    kind: required-approvals
    severity: error
    environments: [prod]
    approvals: [${roles.map((role) => `{ role: ${role} }`).join(', ')}]
`;

function config(governance: string, policies = POLICY(['legal'])): string {
  return `version: '1'
project:
  id: acme-support
targets:
  - claude
includePromptScript: false
releases:
  environments: [staging, prod]
${governance}${policies}`;
}

const GOVERNANCE = `governance:
  admins: ['@acme/prompt-platform']
  roles:
    legal: ['@acme/legal']
    security: ['@acme/appsec']
`;

function approvalGate(roles: string[], found: Record<string, string[]> = {}): ReleaseGateResult {
  return {
    prompt: ID,
    contentHash: `sha256-${'1'.repeat(64)}`,
    environment: 'prod',
    policyRisk: 'high',
    passed: true,
    checks: [
      {
        policy: 'signoff',
        kind: 'required-approvals',
        severity: 'error',
        status: 'passed',
        approvals: roles.map((role) => ({
          role,
          required: 1,
          found: found[role] ?? [],
          stale: [],
        })),
      },
    ],
  };
}

const directories: string[] = [];

function git(root: string, ...args: string[]): string {
  return execFileSync(
    'git',
    ['-c', 'user.email=t@example.com', '-c', 'user.name=T', '-c', 'commit.gpgsign=false', ...args],
    { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

const LABEL_URL = 'https://getpromptscript.dev/schema/prompt-release-label/v1.json';

/** A repository with a source and a label entry in prod, not committed yet. */
async function project(governance = GOVERNANCE, policies = POLICY(['legal'])): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-preflight-'));
  directories.push(root);
  await mkdir(join(root, '.promptscript', 'releases'), { recursive: true });
  await writeFile(join(root, 'promptscript.yaml'), config(governance, policies));
  await writeFile(join(root, '.promptscript', 'project.prs'), PRS);
  const body = {
    $schema: PROMPT_BUNDLE_SCHEMA_URL,
    id: ID,
    description: 'Answer a refund request',
    messages: [{ role: 'system', content: 'You answer refund requests.' }],
    inputs: {},
    governance: { risk: 'high' },
    provenance: { entry: '.promptscript/project.prs', segments: [] },
  };
  const contentHash = hashPromptBundle(body);
  await mkdir(join(root, '.promptscript', 'releases', 'bundles'), { recursive: true });
  await writeFile(
    join(root, '.promptscript', 'releases', 'bundles', `${contentHash}.json`),
    `${JSON.stringify({ ...body, contentHash }, null, 2)}\n`
  );
  await writeFile(
    join(root, '.promptscript', 'releases', 'prod.json'),
    `${JSON.stringify({
      $schema: LABEL_URL,
      environment: 'prod',
      prompts: [{ id: ID, contentHash }],
    })}\n`
  );
  git(root, 'init', '-q');
  git(root, 'add', '-A');
  return root;
}

function commitAll(root: string): void {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '--allow-empty', '-m', 'commit');
}

/** Write the CODEOWNERS file and commit everything. */
async function generate(root: string): Promise<void> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  await governanceCodeownersCommand({ cwd: root, format: 'json' });
  log.mockRestore();
  commitAll(root);
}

async function status(cwd: string, strict = false, base?: string): Promise<ReleaseReport> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  process.exitCode = undefined;
  await releaseStatusCommand({
    cwd,
    format: 'json',
    ...(strict ? { strict } : {}),
    ...(base === undefined ? {} : { base }),
  });
  const printed = log.mock.calls.map((call) => String(call[0])).join('\n');
  log.mockRestore();
  return JSON.parse(printed) as ReleaseReport;
}

function ownerWarnings(report: ReleaseReport): ReleaseReport['warnings'] {
  return report.warnings.filter((warning) => warning.message.includes('committer'));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  gate.gates = [];
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

const TAIL =
  "so the approval directories of legal are not bound to their owners. Without it any committer can add a record in another person's name. Run prs governance codeowners and commit the result.";

describe('prs release status CODEOWNERS preflight', () => {
  it('warns when the CODEOWNERS file is not committed', async () => {
    const root = await project();

    const report = await status(root);

    expect(ownerWarnings(report)).toEqual([
      {
        message: `.github/CODEOWNERS is missing at HEAD, ${TAIL}`,
        location: { file: '.github/CODEOWNERS' },
      },
    ]);
    expect(report.success).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  it('does not count a file that is only on disk', async () => {
    const root = await project();
    await generate(root);
    git(root, 'rm', '-q', '--cached', '.github/CODEOWNERS');
    git(root, 'commit', '-q', '-m', 'untrack');

    const report = await status(root);

    expect(ownerWarnings(report)[0]?.message).toContain('is missing at HEAD');
  });

  it('warns in a repository without a commit', async () => {
    const root = await project();
    await generate(root);
    await rm(join(root, '.git'), { recursive: true });
    git(root, 'init', '-q');

    const report = await status(root);

    expect(ownerWarnings(report)[0]?.message).toContain('is missing at HEAD');
  });

  it('lists every role the policies need, once', async () => {
    const root = await project(GOVERNANCE, POLICY(['security', 'legal']));

    const report = await status(root);

    expect(ownerWarnings(report)).toHaveLength(1);
    expect(ownerWarnings(report)[0]?.message).toContain('approval directories of legal, security');
  });

  it('does not warn when the committed file is up to date', async () => {
    const root = await project();
    await generate(root);

    const report = await status(root);

    expect(ownerWarnings(report)).toEqual([]);
  });

  it('warns when the committed section is out of date', async () => {
    const root = await project(GOVERNANCE, POLICY(['legal', 'security']));
    await generate(root);
    const path = join(root, '.github', 'CODEOWNERS');
    const text = await readFile(path, 'utf8');
    await writeFile(path, text.replace('@acme/legal', '@someone/else'));
    commitAll(root);

    const report = await status(root);

    const [warning] = ownerWarnings(report);
    expect(warning?.message).toContain('.github/CODEOWNERS is out of date at HEAD');
    expect(warning?.message).toContain('approval directories of legal are');
  });

  it('names every needed role when the file is out of date elsewhere', async () => {
    const root = await project(GOVERNANCE, POLICY(['legal', 'security']));
    await generate(root);
    const path = join(root, '.github', 'CODEOWNERS');
    await writeFile(path, `${await readFile(path, 'utf8')}/extra @someone\n`);
    commitAll(root);

    const report = await status(root);

    expect(ownerWarnings(report)[0]?.message).toContain('is out of date at HEAD');
    expect(ownerWarnings(report)[0]?.message).toContain(
      'approval directories of legal, security are'
    );
  });

  it('warns when an earlier committed location shadows the configured one', async () => {
    const root = await project(`${GOVERNANCE}  codeowners:\n    output: CODEOWNERS\n`);
    await generate(root);
    await mkdir(join(root, '.github'), { recursive: true });
    await writeFile(join(root, '.github', 'CODEOWNERS'), '* @someone\n');
    commitAll(root);

    const report = await status(root);

    expect(ownerWarnings(report)[0]?.message).toContain(
      'CODEOWNERS is shadowed at HEAD by .github/CODEOWNERS, which a host reads first'
    );
  });

  it('does not count an earlier location that is only on disk', async () => {
    const root = await project(`${GOVERNANCE}  codeowners:\n    output: CODEOWNERS\n`);
    await generate(root);
    await mkdir(join(root, '.github'), { recursive: true });
    await writeFile(join(root, '.github', 'CODEOWNERS'), '* @someone\n');

    const report = await status(root);

    expect(ownerWarnings(report)).toEqual([]);
  });

  it('reports a file prs cannot manage in the same warning', async () => {
    const root = await project();
    await mkdir(join(root, '.github'), { recursive: true });
    await writeFile(join(root, '.github', 'CODEOWNERS'), '* @someone\n');
    commitAll(root);

    const report = await status(root);

    expect(ownerWarnings(report)[0]?.message).toContain('cannot be managed at HEAD: ');
  });

  it('reports a governance section that cannot produce the lines in the same warning', async () => {
    const root = await project("governance:\n  roles:\n    legal: ['@acme/legal']\n");

    const report = await status(root);

    const [warning] = ownerWarnings(report);
    expect(ownerWarnings(report)).toHaveLength(1);
    expect(warning?.message).toContain('cannot be generated: ');
    expect(warning?.message).toContain('governance.admins is missing');
    expect(warning?.location).toBeUndefined();
  });

  it('does not warn without an approval policy for a labelled environment', async () => {
    const none = await project(GOVERNANCE, 'policies: []\n');
    const other = await project(GOVERNANCE, POLICY(['legal']).replace('[prod]', '[staging]'));
    const broken = await project(GOVERNANCE, 'policies:\n  - name: x\n    kind: nope\n');

    expect(ownerWarnings(await status(none))).toEqual([]);
    expect(ownerWarnings(await status(other))).toEqual([]);
    expect(ownerWarnings(await status(broken))).toEqual([]);
  });

  it('counts a max-experiment-weight policy with approvals and one for every environment', async () => {
    const policies = `policies:
  - name: cap
    kind: max-experiment-weight
    severity: error
    maxWeight: 10
    approvals: [{ role: legal }]
`;
    const root = await project(GOVERNANCE, policies);

    const report = await status(root);

    expect(ownerWarnings(report)).toHaveLength(1);
  });

  it('fails with --strict for this warning only', async () => {
    const root = await project();
    const open = await status(root, true);
    const failed = process.exitCode;
    await generate(root);
    await writeFile(join(root, '.promptscript', 'releases', 'other.json'), '{}');

    const covered = await status(root, true);

    expect(failed).toBe(1);
    expect(open.success).toBe(false);
    expect(open.errors).toEqual([]);
    expect(ownerWarnings(open)).toHaveLength(1);
    expect(covered.warnings.length).toBeGreaterThan(0);
    expect(ownerWarnings(covered)).toEqual([]);
    expect(covered.success).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  describe('with --base', () => {
    it('warns when the base commit lacks the file, even with no changed entry', async () => {
      const root = await project();
      commitAll(root);
      const base = git(root, 'rev-parse', 'HEAD').trim();
      await generate(root);

      const report = await status(root, true, base);

      expect(report.changes).toEqual([]);
      expect(ownerWarnings(report)[0]?.message).toContain(`is missing at ${base}`);
      expect(ownerWarnings(report)[0]?.message).not.toContain('at HEAD');
      expect(report.success).toBe(false);
      expect(process.exitCode).toBe(1);
    });

    it('joins the reasons of HEAD and the base in one warning', async () => {
      const root = await project();
      commitAll(root);

      const report = await status(root, false, 'HEAD');

      expect(ownerWarnings(report)).toHaveLength(1);
      expect(ownerWarnings(report)[0]?.message).toContain(
        'is missing at HEAD and is missing at HEAD'
      );
    });

    it('does not warn when HEAD and the base both have the current file', async () => {
      const root = await project();
      await generate(root);

      const report = await status(root, true, 'HEAD');

      expect(ownerWarnings(report)).toEqual([]);
      expect(report.success).toBe(true);
    });
  });
});

describe('prs release status approvers outside the roster', () => {
  const PEOPLE = `governance:
  admins: ['@acme/prompt-platform']
  roles:
    legal: ['@jane', '@bob']
    security: ['@jane', '@acme/appsec']
`;

  async function rosterWarnings(governance: string, found: string[], role = 'legal') {
    const root = await project(governance);
    await generate(root);
    gate.gates = [approvalGate([role], { [role]: found })];
    const report = await status(root);
    return {
      report,
      warnings: report.warnings.filter((entry) => entry.message.includes('governance.roles.')),
    };
  }

  it('warns about an approver outside a roster of user handles', async () => {
    const { report, warnings } = await rosterWarnings(PEOPLE, ['@eve', '@Jane']);

    expect(warnings.map((warning) => warning.message)).toEqual([
      `${ID}@sha256-111111111111 in prod: @eve approved as legal, but is not in governance.roles.legal (@jane, @bob). It still counts, since the approver is only asserted; check that CODEOWNERS made one of those owners review it.`,
    ]);
    expect(report.success).toBe(true);
  });

  it('does not warn about a listed approver in another case', async () => {
    const { warnings } = await rosterWarnings(PEOPLE, ['@JANE', '@Bob']);

    expect(warnings).toEqual([]);
  });

  it('does not check a role that lists a team', async () => {
    const { warnings } = await rosterWarnings(PEOPLE, ['@eve'], 'security');

    expect(warnings).toEqual([]);
  });
});
