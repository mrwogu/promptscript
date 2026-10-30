import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import {
  approvalRecordPath,
  hashPromptBundle,
  parseApprovalRecord,
  PROMPT_BUNDLE_SCHEMA_URL,
  serializeApprovalRecord,
  type ApprovalRecordV1,
} from '@promptscript/core';
import { validateApprovalReport } from '../../__tests__/prompt-bundle-validators.js';
import { acquireProjectLock } from '../../utils/project-lock.js';
import { approveCommand, type ApprovalReport, type ApproveOptions } from './approve.js';
import { registerApproveCommand } from './index.js';

// Tests that compile a project are slow on a loaded machine.
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const ID = 'acme-support/refund-reply';
const OTHER = 'acme-support/greeting';

function source(system: string): string {
  return `@meta {
  id: "acme-support"
  syntax: "1.6.0"
  risk: "high"
  dataClasses: ["pii"]
}

@prompts {
  refund-reply: {
    description: "Answer a refund request"
    system: "${system}"
    user: "Customer wrote: {{input.message}}"
    inputs: { message: { type: "string", description: "Customer message" } }
  }
}
`;
}

const GOVERNANCE = `governance:
  roles:
    legal: ['@acme/legal']
    security: ['@acme/appsec', '@acme/security']
`;

const CONFIG = `version: '1'
project:
  id: acme-support
targets:
  - claude
includePromptScriptSkill: false
releases:
  environments: [staging, prod]
${GOVERNANCE}`;

const directories: string[] = [];

async function project(config = CONFIG): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-approve-'));
  directories.push(root);
  await mkdir(join(root, '.promptscript'), { recursive: true });
  await writeFile(join(root, 'promptscript.yaml'), config);
  await writeFile(join(root, '.promptscript', 'project.prs'), source('You answer refunds.'));
  git(root, 'init', '-q');
  return root;
}

/** A release bundle file that verifies, without a compile. */
/** A release bundle file that verifies, without a compile; `fields` replace or drop fields. */
async function storedBundle(
  root: string,
  id: string,
  system: string,
  fields: Record<string, unknown> = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    $schema: PROMPT_BUNDLE_SCHEMA_URL,
    id,
    description: 'Stored version',
    messages: [{ role: 'system', content: system }],
    inputs: {},
    governance: { risk: 'high', dataClasses: ['pii'] },
    provenance: { entry: '.promptscript/project.prs', segments: [] },
    ...fields,
  };
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) delete body[key];
  }
  const contentHash = hashPromptBundle(body);
  const directory = join(root, '.promptscript', 'releases', 'bundles');
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, `${contentHash}.json`),
    `${JSON.stringify({ ...body, contentHash }, null, 2)}\n`
  );
  return contentHash;
}

interface Run {
  report: ApprovalReport;
  stdout: string;
  stderr: string;
}

async function run(reference: string | undefined, options: ApproveOptions): Promise<Run> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  process.exitCode = undefined;
  await approveCommand(reference, { format: 'json', ...options });
  const stdout = log.mock.calls.map((call) => String(call[0])).join('\n');
  const stderr = error.mock.calls.map((call) => String(call[0])).join('\n');
  log.mockRestore();
  error.mockRestore();
  const parsed: unknown = JSON.parse(stdout);
  expect(validateApprovalReport(parsed), JSON.stringify(validateApprovalReport.errors)).toBe(true);
  return { report: parsed as ApprovalReport, stdout, stderr };
}

async function runText(reference: string | undefined, options: ApproveOptions): Promise<Run> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  process.exitCode = undefined;
  await approveCommand(reference, { format: 'text', ...options });
  const stdout = log.mock.calls.map((call) => String(call[0])).join('\n');
  const stderr = error.mock.calls.map((call) => String(call[0])).join('\n');
  log.mockRestore();
  error.mockRestore();
  return { report: undefined as unknown as ApprovalReport, stdout, stderr };
}

const approval = (cwd: string, extra: ApproveOptions = {}): ApproveOptions => ({
  cwd,
  role: 'legal',
  approver: '@jane',
  env: 'prod',
  ...extra,
});

function codes(report: ApprovalReport): (string | undefined)[] {
  return report.errors.map((entry) => entry.code);
}

function git(root: string, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** The hash the source builds, as --list reports it. */
async function builtHash(root: string): Promise<string> {
  const { report } = await run(undefined, { cwd: root, list: true });
  const hash = report.prompts?.find((prompt) => prompt.id === ID)?.contentHash;
  expect(hash).toBeDefined();
  return hash ?? '';
}

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

describe('prs approve', () => {
  it('writes the exact record for the hash the checkout builds and shows what it is', async () => {
    const root = await project();
    const hash = await builtHash(root);

    const { report, stderr } = await run(`${ID}@${hash}`, approval(root, { comment: 'Checked' }));

    const path = `.promptscript/approvals/legal/${ID}/${hash}.jane.json`;
    const bytes = await readFile(join(root, path));
    const record = parseApprovalRecord(bytes);
    expect(report.success).toBe(true);
    expect(process.exitCode).toBe(0);
    expect(report.path).toBe(path);
    expect(record).toEqual({
      $schema: 'https://getpromptscript.dev/schema/approval-record/v1.json',
      prompt: ID,
      contentHash: hash,
      role: 'legal',
      approver: { source: 'asserted', value: '@jane' },
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      environment: 'prod',
      comment: 'Checked',
    });
    expect(report.record).toEqual(record);
    expect(bytes.toString('utf-8')).toBe(serializeApprovalRecord(record as ApprovalRecordV1));
    expect(stderr).toContain(`Approving ${ID}@${hash} as legal for prod`);
    expect(stderr).toContain('Governance: {"risk":"high","dataClasses":["pii"]}');
    expect(stderr).toContain('Model: none, the application picks it');
    expect(stderr).toContain('system message:\n    You answer refunds.');
    expect(stderr).toContain('Customer wrote: {{input.message}}');
    expect(stderr).toContain('Its pull request needs a review from @acme/legal.');
  });

  it('writes a ceiling in basis points and says what it counts for', async () => {
    const root = await project();
    const hash = await builtHash(root);

    const { report, stderr } = await run(`${ID}@${hash}`, approval(root, { maxWeight: '25' }));

    const path = `.promptscript/approvals/legal/${ID}/${hash}.jane.json`;
    const bytes = await readFile(join(root, path));
    expect(report.success).toBe(true);
    expect(report.record?.maxWeight).toBe(2500);
    expect(parseApprovalRecord(bytes)).toEqual(report.record);
    expect(bytes.toString('utf-8')).toBe(
      serializeApprovalRecord(report.record as ApprovalRecordV1)
    );
    expect(stderr).toContain(`Approving ${ID}@${hash} as legal for prod up to 25 %\n`);
  });

  it('prints what a capped approval counts for', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const { stdout } = await runText(`${ID}@${hash}`, approval(root, { maxWeight: '2.5' }));

    expect(stdout).toContain(
      'It counts only for experiment arms at up to 2.5 % in prod, never for the entry hash or a promote.'
    );
  });

  it.each([
    ['0.01', 1],
    ['100', 10000],
    ['0.5', 50],
  ])('writes --max-weight %s as %i basis points', async (percent, points) => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const { report } = await run(`${ID}@${hash}`, approval(root, { maxWeight: percent }));

    expect(report.record?.maxWeight).toBe(points);
  });

  it.each([
    ['without --env', { env: undefined }],
    ['with --all-environments', { env: undefined, allEnvironments: true }],
    ['with --env and --all-environments', { allEnvironments: true }],
  ])('refuses --max-weight %s with PS5110 and writes nothing', async (_name, extra) => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const { report, stderr } = await run(
      `${ID}@${hash}`,
      approval(root, { maxWeight: '5', ...extra })
    );

    expect(codes(report)).toEqual(['PS5110']);
    expect(report.errors[0]?.message).toContain('--max-weight needs --env');
    expect(process.exitCode).toBe(1);
    expect(stderr).not.toContain('Compiling');
    expect(existsSync(join(root, '.promptscript/approvals'))).toBe(false);
  });

  it.each(['0', '0.00', '100.01', '101', '2.555', '5%', '1e1', ' 5', '-1', 'abc', ''])(
    'refuses --max-weight "%s" with PS5110',
    async (value) => {
      const root = await project();
      const hash = await storedBundle(root, ID, 'Stored');

      const { report } = await run(`${ID}@${hash}`, approval(root, { maxWeight: value }));

      expect(codes(report)).toEqual(['PS5110']);
      expect(report.errors[0]?.message).toContain('a percent from 0.01 to 100');
      expect(existsSync(join(root, '.promptscript/approvals'))).toBe(false);
    }
  );

  it('approves a stored release bundle without compiling, for every environment', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Old wording');

    const { report, stderr } = await run(
      `${ID}@${hash}`,
      approval(root, { env: undefined, allEnvironments: true, role: 'security' })
    );

    expect(report.success).toBe(true);
    expect(report.record?.environment).toBeUndefined();
    expect(report.path).toBe(`.promptscript/approvals/security/${ID}/${hash}.jane.json`);
    expect(stderr).not.toContain('Compiling');
    expect(stderr).toContain('for every environment');
    expect(stderr).toContain('    Old wording');
    expect(stderr).toContain('needs a review from @acme/appsec or @acme/security');
  });

  it('writes a .gitattributes rule that keeps records out of line ending conversion', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const { report } = await run(`${ID}@${hash}`, approval(root));

    expect(report.warnings).toEqual([]);
    expect(await readFile(join(root, '.promptscript/approvals/.gitattributes'), 'utf-8')).toContain(
      '\n* -text\n'
    );
    expect(git(root, 'check-attr', 'text', '--', report.path ?? '')).toContain('text: unset');
  });

  it('keeps an existing .gitattributes and warns when it lacks the rule', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');
    await mkdir(join(root, '.promptscript/approvals'), { recursive: true });
    await writeFile(join(root, '.promptscript/approvals/.gitattributes'), '*.json text\n');

    const { report } = await run(`${ID}@${hash}`, approval(root));

    expect(report.success).toBe(true);
    expect(report.warnings).toEqual([
      {
        message: expect.stringContaining('has no "* -text" line'),
        location: { file: '.promptscript/approvals/.gitattributes' },
      },
    ]);
    expect(await readFile(join(root, '.promptscript/approvals/.gitattributes'), 'utf-8')).toBe(
      '*.json text\n'
    );
  });

  it('exits 2 and keeps the file when the same approver approved the hash in that role', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');
    const first = await run(`${ID}@${hash}`, approval(root, { comment: 'first' }));
    const before = await readFile(join(root, first.report.path ?? ''), 'utf-8');

    const second = await run(`${ID}@${hash}`, approval(root, { env: 'staging' }));

    expect(codes(second.report)).toEqual(['PS5105']);
    expect(second.report.errors[0]?.location?.file).toBe(first.report.path);
    expect(second.report.errors[0]?.message).toContain('To withdraw it, delete it in a commit');
    expect(process.exitCode).toBe(2);
    expect(await readFile(join(root, first.report.path ?? ''), 'utf-8')).toBe(before);
  });

  it('tells to delete a lower capped record in the same change before a higher one', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');
    await run(`${ID}@${hash}`, approval(root, { maxWeight: '5' }));

    const raised = await run(`${ID}@${hash}`, approval(root, { maxWeight: '25' }));

    expect(codes(raised.report)).toEqual(['PS5105']);
    expect(raised.report.errors[0]?.message).toContain(
      'delete the file in the same change and approve again'
    );
    expect(raised.report.errors[0]?.message).toContain('ceiling');
  });

  it('cuts a long --max-weight value in the message', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const { report } = await run(`${ID}@${hash}`, approval(root, { maxWeight: 'x'.repeat(200) }));

    expect(codes(report)).toEqual(['PS5110']);
    expect(report.errors[0]?.message).toContain(`"${'x'.repeat(80)}..."`);
  });

  it('counts one file per approver, so a second approver writes a second record', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');
    await run(`${ID}@${hash}`, approval(root));

    const { report } = await run(`${ID}@${hash}`, approval(root, { approver: '@Bob-1' }));

    expect(report.path).toBe(`.promptscript/approvals/legal/${ID}/${hash}.bob-1.json`);
    expect((await readdir(join(root, '.promptscript/approvals/legal', ID))).sort()).toEqual([
      `${hash}.bob-1.json`,
      `${hash}.jane.json`,
    ]);
  });

  it.each([
    ['a GitLab handle with a dot', '@Jane.Doe', 'jane.doe'],
    ['a GitHub managed user handle', '@name_shortcode', 'name_shortcode'],
    ['a handle of 100 characters', `@${'a'.repeat(100)}`, 'a'.repeat(100)],
    ['a handle with hyphens', '@a-b-c', 'a-b-c'],
  ])('accepts %s and keeps the record in one file name', async (_name, approver, slug) => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const { report } = await run(`${ID}@${hash}`, approval(root, { approver }));

    expect(report.success).toBe(true);
    expect(report.path).toBe(`.promptscript/approvals/legal/${ID}/${hash}.${slug}.json`);
    expect(await readdir(join(root, '.promptscript/approvals/legal', ID))).toEqual([
      `${hash}.${slug}.json`,
    ]);
    const listed = await run(undefined, { cwd: root, list: true });
    expect(listed.report.prompts?.[0]?.records[0]?.record.approver.value).toBe(approver);
  });

  it.each([
    ['no governance section', `${CONFIG.replace(GOVERNANCE, '')}`, 'legal', 'No approval roles'],
    ['an unknown role', CONFIG, 'finance', 'is not a role in governance.roles'],
    ['an uppercase role', CONFIG, 'Legal', 'is not a role in governance.roles'],
    ['a device name role', CONFIG.replace('legal:', 'nul:'), 'nul', 'is a Windows device name'],
    [
      'a role without owners',
      CONFIG.replace("legal: ['@acme/legal']", 'legal: []'),
      'legal',
      'must list the teams or people',
    ],
    ['a missing role', CONFIG, undefined, 'Configured: legal, security'],
    [
      'an owner that is no Git host identity',
      CONFIG.replace("legal: ['@acme/legal']", "legal: ['Legal Team']"),
      'legal',
      'governance.roles.legal has "Legal Team", which is not a Git host identity',
    ],
    [
      'an unknown governance key',
      CONFIG.replace('governance:', "governance:\n  admin: ['@acme/platform']"),
      'legal',
      'governance has an unknown key "admin". Did you mean "admins"?',
    ],
  ])('refuses %s with PS5101', async (_name, config, role, message) => {
    const root = await project(config);
    const hash = await storedBundle(root, ID, 'Stored');

    const { report } = await run(`${ID}@${hash}`, approval(root, { role }));

    expect(codes(report)).toEqual(['PS5101']);
    expect(report.errors[0]?.message).toContain(message);
    expect(process.exitCode).toBe(1);
    expect(existsSync(join(root, '.promptscript/approvals'))).toBe(false);
  });

  it.each([
    ['no reference', undefined, 'Name the prompt version'],
    ['no hash', ID, 'does not end in a full content hash'],
    ['a short hash', `${ID}@sha256-3f9a1c2b`, 'does not end in a full content hash'],
    ['a hash without prefix', `${ID}@${'a'.repeat(64)}`, 'does not end in a full content hash'],
    [
      'a segment ending in a dot',
      `acme.support./refund-reply@sha256-${'a'.repeat(64)}`,
      'none ending in a dot',
    ],
    ['a single segment', `refund-reply@sha256-${'a'.repeat(64)}`, 'is not a prompt id'],
    ['eight segments', `a/b/c/d/e/f/g/h@sha256-${'a'.repeat(64)}`, 'is not a prompt id'],
    ['a control character', `acme/\u001b[2Jx@sha256-${'a'.repeat(64)}`, '"acme/[2Jx" is not'],
  ])('refuses %s with PS5102', async (_name, reference, message) => {
    const root = await project();

    const { report } = await run(reference, approval(root));

    expect(codes(report)).toEqual(['PS5102']);
    expect(report.errors[0]?.message).toContain(message);
  });

  it('refuses a hash the checkout does not build and no bundle has with PS5103', async () => {
    const root = await project();
    const hash = await builtHash(root);
    const unknown = `sha256-${'b'.repeat(64)}`;

    const { report } = await run(`${ID}@${unknown}`, approval(root));

    expect(codes(report)).toEqual(['PS5103']);
    expect(report.errors[0]?.message).toContain(
      `${ID} builds to ${hash.slice(0, 19)} here and no release bundle has sha256-bbbbbbbbbbbb`
    );
    expect(existsSync(join(root, '.promptscript/approvals'))).toBe(false);
  });

  it('refuses a prompt the source does not define with PS5103', async () => {
    const root = await project();

    const { report } = await run(`acme-support/gone@sha256-${'c'.repeat(64)}`, approval(root));

    expect(codes(report)).toEqual(['PS5103']);
    expect(report.errors[0]?.message).toContain('acme-support/gone is not a prompt of');
  });

  it('refuses the hash of another prompt with PS5103', async () => {
    const root = await project();
    const hash = await storedBundle(root, OTHER, 'Hello');

    const { report } = await run(`${ID}@${hash}`, approval(root));

    expect(codes(report)).toEqual(['PS5103']);
    expect(report.errors[0]?.message).toContain(`is a version of ${OTHER}, not of ${ID}`);
  });

  it('refuses a release bundle that does not verify with PS5004', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');
    const file = join(root, '.promptscript/releases/bundles', `${hash}.json`);
    await writeFile(file, (await readFile(file, 'utf-8')).replace('Stored', 'Changed'));

    const { report } = await run(`${ID}@${hash}`, approval(root));

    expect(codes(report)).toEqual(['PS5004']);
  });

  it('refuses an environment that is not configured with PS5002', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const { report } = await run(`${ID}@${hash}`, approval(root, { env: 'qa' }));

    expect(codes(report)).toEqual(['PS5002']);
  });

  it.each([
    ['neither --env nor --all-environments', { env: undefined }, 'Give --env <environment>'],
    ['both --env and --all-environments', { allEnvironments: true }, 'not both'],
  ])('refuses %s', async (_name, extra, message) => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const { report } = await run(`${ID}@${hash}`, approval(root, extra));

    expect(report.success).toBe(false);
    expect(report.errors[0]?.message).toContain(message);
  });

  it.each([
    ['an email address', 'jane@acme.io', 'not an email address'],
    ['a team', '@acme/legal', 'a person approves, not a team'],
    ['a handle of 101 characters', `@${'a'.repeat(101)}`, 'up to 100 characters'],
    ['a handle starting with a dot', '@.jane', 'is not a Git host user handle'],
    ['a handle of two dots', '@..', 'is not a Git host user handle'],
    ['a handle with two dots in a row', '@a..b', 'is not a Git host user handle'],
    ['a handle with a trailing dot', '@jane.', 'is not a Git host user handle'],
    ['a handle with a slash', '@jane/../x', 'a person approves, not a team'],
    ['a handle with a backslash', '@jane\\x', 'is not a Git host user handle'],
    ['a handle with a non-ASCII letter', '@j\u0430ne', 'is not a Git host user handle'],
    ['no approver', undefined, 'Give your Git host user handle'],
  ])('refuses %s with PS5104', async (_name, approver, message) => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const { report } = await run(`${ID}@${hash}`, approval(root, { approver }));

    expect(codes(report)).toEqual(['PS5104']);
    expect(report.errors[0]?.message).toContain(message);
    expect(existsSync(join(root, '.promptscript/approvals'))).toBe(false);
  });

  it('keeps newlines in a comment and refuses other control characters', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');

    const refused = await run(`${ID}@${hash}`, approval(root, { comment: 'a\u0007b' }));
    const bidi = await run(`${ID}@${hash}`, approval(root, { comment: 'paid \u202eresu' }));
    const long = await run(`${ID}@${hash}`, approval(root, { comment: 'x'.repeat(2001) }));
    const kept = await run(`${ID}@${hash}`, approval(root, { comment: 'line 1\nline 2' }));

    expect(refused.report.errors[0]?.message).toContain('--comment takes at most 2000');
    expect(bidi.report.errors[0]?.message).toContain('no invisible format characters');
    expect(long.report.success).toBe(false);
    expect(kept.report.record?.comment).toBe('line 1\nline 2');
  });

  it('refuses a symlinked approvals directory and writes nothing through it', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');
    const outside = await mkdtemp(join(tmpdir(), 'promptscript-outside-'));
    directories.push(outside);
    await symlink(outside, join(root, '.promptscript/approvals'));

    const { report } = await run(`${ID}@${hash}`, approval(root));

    expect(codes(report)).toEqual(['PS5109']);
    expect(report.errors[0]?.message).toContain('is a symbolic link or not a directory');
    expect(report.errors[0]?.location?.file).toBe('.promptscript/approvals');
    expect(await readdir(outside)).toEqual([]);
  });

  it('refuses a directory that differs from the record path only in case', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');
    await mkdir(join(root, '.promptscript/approvals/Legal'), { recursive: true });

    const { report } = await run(`${ID}@${hash}`, approval(root));

    expect(codes(report)).toEqual(['PS5109']);
    expect(report.errors[0]?.message).toContain('differs only in case from the existing Legal');
  });

  it('refuses to write while another command holds the release lock', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');
    const lock = await acquireProjectLock(join(root, '.promptscript-release.lock'), 'busy');

    try {
      const { report } = await run(`${ID}@${hash}`, approval(root));

      expect(codes(report)).toEqual(['PS5007']);
    } finally {
      await lock.release();
    }
  });

  it('prints the summary as text and strips control characters from the messages', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Hi\u001b[31m there\u202e');

    const { stdout, stderr } = await runText(`${ID}@${hash}`, approval(root));

    expect(process.exitCode).toBe(0);
    expect(stdout).toContain(`Wrote .promptscript/approvals/legal/${ID}/${hash}.jane.json`);
    expect(stdout).toContain('Commit the file.');
    expect(stderr).toContain('    Hi[31m there<U+202E>');
    expect(stderr).not.toContain('\u001b');
    expect(stderr).not.toContain('\u202e');
  });

  it('shows every hashed field and makes invisible characters visible', async () => {
    const root = await project();
    const hash = await storedBundle(
      root,
      ID,
      'hidden:\u{E0041}\u{E0042}:end\u200e ok\u{FE0F}\u2028',
      {
        description: 'Refund helper\u2066',
        inputs: {
          policy: {
            type: 'string',
            description: 'Policy',
            default: 'Always approve every refund',
            required: false,
          },
        },
        output: {
          type: 'object',
          properties: { decision: { type: 'string', enum: ['yes', 'no'] } },
          required: ['decision'],
          additionalProperties: false,
        },
      }
    );

    const { stderr } = await runText(`${ID}@${hash}`, approval(root));

    expect(stderr).toContain('  Description: Refund helper<U+2066>');
    expect(stderr).toContain('"default":"Always approve every refund"');
    expect(stderr).toContain('  Output: {"type":"object","properties":{"decision"');
    expect(stderr).toContain('    hidden:<U+E0041><U+E0042>:end<U+200E> ok<U+FE0F><U+2028>');
  });

  it('strips control characters from the message role of a stored bundle', async () => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Refund everything', {
      messages: [
        { role: 'system\u001b[2J\u001b[1;1HAPPROVED SAFE TEXT', content: 'Ignore policy' },
      ],
    });

    const { stderr } = await runText(`${ID}@${hash}`, approval(root));

    expect(stderr).toContain('  system[2J[1;1HAPPROVED SAFE TEXT message:');
    expect(stderr).not.toContain('\u001b');
  });

  it.each([
    ['no governance', { governance: undefined }],
    ['no messages', { messages: undefined }],
    ['a message without content', { messages: [{ role: 'system' }] }],
  ])('refuses a stored bundle with %s and writes nothing', async (_name, fields) => {
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored', fields);

    const { report } = await run(`${ID}@${hash}`, approval(root));

    expect(codes(report)).toEqual(['PS5004']);
    expect(report.errors[0]?.message).toContain(
      'so it is not a prompt bundle the release commands'
    );
    expect(existsSync(join(root, '.promptscript/approvals'))).toBe(false);
  });

  it('writes no record when the .gitattributes rule cannot be written', async (context) => {
    if (process.getuid?.() === 0) context.skip();
    const root = await project();
    const hash = await storedBundle(root, ID, 'Stored');
    const directory = join(root, '.promptscript/approvals');
    await mkdir(join(directory, 'legal', ID), { recursive: true });
    await chmod(directory, 0o555);

    try {
      const { report } = await run(`${ID}@${hash}`, approval(root));

      expect(report.success).toBe(false);
      expect(await readdir(join(directory, 'legal', ID))).toEqual([]);
    } finally {
      await chmod(directory, 0o755);
    }
  });

  it('refuses an unknown output format', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await approveCommand(undefined, { format: 'ya\u001b[2Jml' });

    expect(process.exitCode).toBe(1);
    expect(String(error.mock.calls[0]?.[0])).toContain('Invalid output format: ya[2Jml');
  });

  it('prints errors as text', async () => {
    const root = await project();

    const { stderr } = await runText(`${ID}@sha256-1`, approval(root));

    expect(process.exitCode).toBe(1);
    expect(stderr).toContain('PS5102:');
  });
});

describe('prs approve --list', () => {
  const as = (value: string): ApprovalRecordV1['approver'] => ({ source: 'asserted', value });
  const SIGNED = {
    signatureType: 'ssh' as const,
    signature: '-----BEGIN SSH SIGNATURE-----\nAAAA\n-----END SSH SIGNATURE-----\n',
  };

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
    await mkdir(join(root, target, '..'), { recursive: true });
    await writeFile(join(root, target), serializeApprovalRecord(value));
    return target;
  }

  it('shows every record with its scope and state', async () => {
    const root = await project();
    const hash = await builtHash(root);
    const labelled = await storedBundle(root, ID, 'Staged');
    await writeFile(
      join(root, '.promptscript/releases/staging.json'),
      `${JSON.stringify({
        $schema: 'https://getpromptscript.dev/schema/prompt-release-label/v1.json',
        environment: 'staging',
        prompts: [{ id: ID, contentHash: labelled }],
      })}\n`
    );
    await record(root, { contentHash: hash, environment: 'prod' });
    await record(root, { contentHash: labelled, role: 'security' });
    await record(root, { approver: { source: 'asserted', value: '@old' } });
    await record(root, { contentHash: hash, role: 'finance', approver: as('@eve') });
    await record(root, { contentHash: hash, approver: as('@sig'), ...SIGNED });
    const wrong = await record(
      root,
      { contentHash: hash, approver: as('@mallory') },
      `.promptscript/approvals/security/${ID}/${hash}.mallory.json`
    );
    await record(root, { prompt: OTHER });
    const crlf = `.promptscript/approvals/legal/${ID}/crlf.json`;
    await writeFile(
      join(root, crlf),
      serializeApprovalRecord({
        $schema: 'https://getpromptscript.dev/schema/approval-record/v1.json',
        prompt: ID,
        contentHash: hash,
        role: 'legal',
        approver: as('@ann'),
        createdAt: '2026-10-22T09:14:03.120Z',
      }).replaceAll('\n', '\r\n')
    );
    await symlink(join(root, crlf), join(root, `.promptscript/approvals/legal/${ID}/link.json`));
    await writeFile(join(root, `.promptscript/approvals/legal/${ID}/notes.txt`), 'ignored');
    git(root, 'add', '-A');
    await record(root, { contentHash: hash, approver: as('@new') });

    const { report } = await run(undefined, { cwd: root, list: true });

    const states = report.prompts?.map((prompt) => ({
      id: prompt.id,
      contentHash: prompt.contentHash,
      records: prompt.records
        .map((entry) => [
          entry.record.role,
          entry.record.approver.value,
          entry.state,
          entry.record.environment ?? 'all',
          entry.labels,
        ])
        .sort((a, b) => `${a[0]} ${a[1]}`.localeCompare(`${b[0]} ${b[1]}`)),
    }));
    expect(states).toEqual([
      { id: OTHER, contentHash: undefined, records: [['legal', '@jane', 'stale', 'all', []]] },
      {
        id: ID,
        contentHash: hash,
        records: [
          ['finance', '@eve', 'unknown-role', 'all', []],
          ['legal', '@jane', 'current', 'prod', []],
          ['legal', '@mallory', 'misplaced', 'all', []],
          ['legal', '@new', 'untracked', 'all', []],
          ['legal', '@old', 'stale', 'all', []],
          ['legal', '@sig', 'current', 'all', []],
          ['security', '@jane', 'labelled', 'all', ['staging']],
        ],
      },
    ]);
    const misplaced = report.prompts?.[1]?.records.find((entry) => entry.state === 'misplaced');
    expect(misplaced?.path).toBe(wrong);
    expect(misplaced?.expectedPath).toBe(
      `.promptscript/approvals/legal/${ID}/${hash}.mallory.json`
    );
    expect(misplaced?.trackedPath).toBeUndefined();
    expect(report.warnings.map((warning) => [warning.code, warning.message])).toEqual([
      ['PS5109', expect.stringContaining('approves as finance, which is not in governance.roles')],
      ['PS5109', expect.stringContaining('crlf.json has CRLF line endings')],
      ['PS5109', expect.stringContaining('link.json is a symbolic link')],
      [undefined, expect.stringContaining('carries a signature, which this version of prs')],
      ['PS5109', expect.stringContaining('that belongs at .promptscript/approvals/legal/')],
    ]);
  });

  it('never counts a record that Git tracks under another spelling of its path', async () => {
    const root = await project();
    const hash = await builtHash(root);
    const path = await record(root, { contentHash: hash, approver: as('@bob') });
    const blob = git(root, 'hash-object', '-w', path).trim();
    const folded = path.replace('/legal/', '/Legal/');
    git(root, 'update-index', '--add', '--cacheinfo', `100644,${blob},${folded}`);
    const diskFolds = existsSync(join(root, folded));

    const { report } = await run(undefined, { cwd: root, list: true });

    const [entry] = report.prompts?.find((prompt) => prompt.id === ID)?.records ?? [];
    expect(entry?.path).toBe(path);
    expect(entry?.state).toBe(diskFolds ? 'misplaced' : 'untracked');
    expect(entry?.trackedPath).toBe(diskFolds ? folded : undefined);
  });

  it('needs Git to list records, but not to list a project without records', async () => {
    const root = await project();
    vi.stubEnv('GIT_DIR', join(root, 'no-repository'));

    try {
      const empty = await run(undefined, { cwd: root, list: true });
      await record(root, {});
      const { report } = await run(undefined, { cwd: root, list: true });

      expect(empty.report.success).toBe(true);
      expect(empty.report.prompts?.map((prompt) => prompt.id)).toEqual([ID]);
      expect(codes(report)).toEqual(['PS5108']);
      expect(report.errors[0]?.message).toContain('Records count only as files Git tracks');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('never counts a record whose bytes on disk are not the ones Git has', async () => {
    const root = await project();
    const hash = await builtHash(root);
    const path = await record(root, {
      contentHash: hash,
      role: 'security',
      environment: 'staging',
    });
    git(root, 'add', '-A');
    await record(root, { contentHash: hash, role: 'security' });
    const blob = git(root, 'hash-object', '-w', path).trim();
    const other = path.replace('/security/', '/Security/');
    git(root, 'update-index', '--add', '--cacheinfo', `100644,${blob},${other}`);

    const { report } = await run(undefined, { cwd: root, list: true });

    const entries = report.prompts?.find((prompt) => prompt.id === ID)?.records ?? [];
    expect(entries.map((entry) => [entry.path, entry.state])).toEqual([[path, 'modified']]);
    expect(report.warnings).toContainEqual({
      code: 'PS5109',
      message: expect.stringContaining('does not hold the bytes Git has for'),
      location: { file: path },
    });
  });

  it('lists more record paths than fit in 1 MiB of Git output, and more than 10000', async () => {
    const root = await project();
    const hash = await builtHash(root);
    const path = await record(root, { contentHash: hash, environment: 'prod' });
    git(root, 'add', '-A');
    const blob = git(root, 'hash-object', path).trim();
    // Index-only paths that sort before the record, so a cap on Git paths would cut it off.
    const lines = Array.from(
      { length: 10_001 },
      (_, i) => `100644 ${blob}\t.promptscript/approvals/legal/${'a'.repeat(100)}-${i}.json\n`
    );
    execFileSync('git', ['update-index', '--index-info'], { cwd: root, input: lines.join('') });

    const { report } = await run(undefined, { cwd: root, list: true });

    expect(report.success).toBe(true);
    const entries = report.prompts?.find((prompt) => prompt.id === ID)?.records ?? [];
    expect(entries.map((entry) => entry.state)).toEqual(['current']);
    expect(report.warnings).toEqual([]);
  });

  it('lists one prompt and prints the states as text', async () => {
    const root = await project();
    const hash = await builtHash(root);
    await record(root, { contentHash: hash, environment: 'prod' });
    await record(root, { prompt: OTHER });
    git(root, 'add', '-A');

    const filtered = await run(ID, { cwd: root, list: true });
    const { stdout } = await runText(ID, { cwd: root, list: true });

    expect(filtered.report.prompts?.map((prompt) => prompt.id)).toEqual([ID]);
    expect(stdout).toContain(`${ID}  builds ${hash}`);
    expect(stdout).toContain(`current  legal  @jane  prod  ${hash.slice(0, 19)}`);
  });

  it('prints a misplaced record with its path', async () => {
    const root = await project();
    const path = await record(root, {}, `.promptscript/approvals/security/${ID}/moved.json`);
    git(root, 'add', '-A');

    const { stdout } = await runText(undefined, { cwd: root, list: true });

    expect(stdout).toContain(
      `misplaced  legal  @jane  all environments  sha256-000000000000  ${path}`
    );
  });

  it('reports compile errors and prints a source without prompts', async () => {
    const root = await project();
    await writeFile(
      join(root, '.promptscript', 'project.prs'),
      '@meta {\n  id: "x"\n  syntax: "1.6.0"\n}\n'
    );
    const empty = await runText(undefined, { cwd: root, list: true });
    await writeFile(join(root, '.promptscript', 'project.prs'), '@meta {\n  id: \n');

    const broken = await run(undefined, { cwd: root, list: true });

    expect(empty.stdout).toContain('No prompts and no approval records.');
    expect(broken.report.success).toBe(false);
    expect(broken.report.errors.length).toBeGreaterThan(0);
  });

  it('lists a project without records', async () => {
    const root = await project();

    const { stdout } = await runText(undefined, { cwd: root, list: true });

    expect(stdout).toContain('no approvals');
  });

  it('shows the ceiling of a capped record in the scope', async () => {
    const root = await project();
    const hash = await builtHash(root);
    await record(root, { contentHash: hash, environment: 'prod', maxWeight: 2500 });
    await record(root, {
      contentHash: hash,
      approver: as('@bob'),
      environment: 'staging',
      maxWeight: 100,
    });
    git(root, 'add', '-A');

    const { report } = await run(ID, { cwd: root, list: true });
    const { stdout } = await runText(ID, { cwd: root, list: true });

    const entries = report.prompts?.find((prompt) => prompt.id === ID)?.records ?? [];
    expect(
      entries.map((entry) => entry.record.maxWeight).sort((a, b) => (a ?? 0) - (b ?? 0))
    ).toEqual([100, 2500]);
    expect(stdout).toContain(`current  legal  @jane  prod up to 25 %  ${hash.slice(0, 19)}`);
    expect(stdout).toContain(`current  legal  @bob  staging up to 1 %  ${hash.slice(0, 19)}`);
  });

  it('refuses --max-weight with --list', async () => {
    const root = await project();

    const { report } = await run(undefined, { cwd: root, list: true, maxWeight: '5' });

    expect(report.errors[0]?.message).toContain('--max-weight');
  });

  it('refuses approve options and a bad prompt id', async () => {
    const root = await project();

    const options = await run(undefined, { cwd: root, list: true, role: 'legal' });
    const id = await run('nope', { cwd: root, list: true });

    expect(options.report.errors[0]?.message).toContain('--list takes only an optional prompt id');
    expect(codes(id.report)).toEqual(['PS5102']);
  });
});

describe('prs approve definition', () => {
  it('defines the scope options and no option that skips a check', () => {
    const program = new Command();

    registerApproveCommand(program);

    const approve = program.commands.find((command) => command.name() === 'approve');
    expect(approve?.options.map((option) => option.long)).toEqual([
      '--role',
      '--approver',
      '--env',
      '--all-environments',
      '--max-weight',
      '--comment',
      '--list',
      '--format',
      '--config',
      '--cwd',
    ]);
  });

  it('passes the reference and options to the command', async () => {
    const program = new Command();
    registerApproveCommand(program);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await program.parseAsync(['node', 'prs', 'approve', `${ID}@x`, '--format', 'yaml']);

    expect(process.exitCode).toBe(1);
    expect(String(error.mock.calls[0]?.[0])).toContain('Invalid output format: yaml');
  });
});
