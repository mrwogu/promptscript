import { execFileSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  APPROVAL_RECORD_SCHEMA_URL,
  approvalRecordPath,
  serializeApprovalRecord,
  type ApprovalRecordV1,
} from '@promptscript/core';
import { validateAuditLog } from '../../__tests__/prompt-bundle-validators.js';
import { codeownersMarker } from '../governance/codeowners-file.js';
import { labelText, PROMPT_RELEASE_LABEL_SCHEMA_URL } from '../release/layout.js';
import type { AuditEvent } from './events.js';
import { auditLogCommand, jsonText, type AuditLogOptions, type AuditLogReport } from './log.js';

// Every test builds a Git history and some resolve the project, which is slow on a loaded machine.
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const PROMPT = 'acme-support/refund-reply';
const H1 = `sha256-${'1'.repeat(64)}`;
const H2 = `sha256-${'2'.repeat(64)}`;
const H3 = `sha256-${'3'.repeat(64)}`;
const H4 = `sha256-${'4'.repeat(64)}`;

const CONFIG = `id: support
syntax: 1.6.0
targets: []
releases:
  environments: [staging, prod]
governance:
  admins: ['@acme/prompt-platform']
  roles:
    legal: ['@acme/legal']
`;

const PROJECT = `@meta {
  id: "acme-support"
  syntax: "1.6.0"
  owner: "@acme/support"
}

@prompts {
  refund-reply: {
    description: "Answer a refund request"
    system: "You answer refund requests."
    user: "Hello"
  }
}
`;

const directories: string[] = [];
let clock = 0;

function git(root: string, ...args: string[]): string {
  return execFileSync(
    'git',
    ['-c', 'user.email=t@example.com', '-c', 'user.name=T', '-c', 'commit.gpgsign=false', ...args],
    { cwd: root, encoding: 'utf-8' }
  );
}

/** Commit everything with a fixed author and a committer date one hour after the last one. */
function commit(root: string, message: string, author = 'Jane <jane@example.com>'): string {
  clock += 1;
  const date = `2026-10-${String(clock).padStart(2, '0')}T10:00:00Z`;
  execFileSync(
    'git',
    [
      '-c',
      'user.email=ci@example.com',
      '-c',
      'user.name=CI',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '-q',
      '--allow-empty',
      `--author=${author}`,
      '-m',
      message,
    ],
    {
      cwd: root,
      env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
    }
  );
  return git(root, 'rev-parse', 'HEAD').trim();
}

async function put(root: string, files: Record<string, string>): Promise<void> {
  for (const [name, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), content);
  }
  git(root, 'add', '-A');
}

async function directory(): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'prs-audit-')));
  directories.push(root);
  return root;
}

async function project(): Promise<string> {
  const root = await directory();
  git(root, 'init', '-q');
  clock = 0;
  await put(root, { 'promptscript.yaml': CONFIG, '.promptscript/project.prs': PROJECT });
  commit(root, 'init');
  return root;
}

function record(fields: Partial<ApprovalRecordV1> = {}): ApprovalRecordV1 {
  return {
    $schema: APPROVAL_RECORD_SCHEMA_URL,
    prompt: PROMPT,
    contentHash: H1,
    role: 'legal',
    approver: { source: 'asserted', value: '@jane' },
    createdAt: '2026-10-22T09:14:03.120Z',
    environment: 'prod',
    ...fields,
  };
}

function label(environment: string, contentHash: string): string {
  return labelText({
    $schema: PROMPT_RELEASE_LABEL_SCHEMA_URL,
    environment,
    prompts: [{ id: PROMPT, contentHash }],
  });
}

const STAGING = '.promptscript/releases/staging.json';
const PROD = '.promptscript/releases/prod.json';

/** A history with one event of every type. */
async function fullHistory(): Promise<{ root: string; commits: Record<string, string> }> {
  const root = await project();
  const approval = record({ comment: 'Checked against\nthe refund policy' });
  await put(root, { [approvalRecordPath(approval)]: serializeApprovalRecord(approval) });
  const approve = commit(root, 'approve');
  await put(root, { [STAGING]: label('staging', H1), [PROD]: label('prod', H1) });
  const promote = commit(root, 'promote', 'Rel <rel@example.com>');
  await put(root, { [PROD]: label('prod', H2) });
  const promote2 = commit(root, 'promote again', 'Rel <rel@example.com>');
  await put(root, { [PROD]: label('prod', H1) });
  const rollback = commit(root, 'roll back', 'Rel <rel@example.com>');
  await rm(join(root, approvalRecordPath(approval)));
  git(root, 'add', '-A');
  const withdraw = commit(root, 'withdraw');
  const misplaced = record({ approver: { source: 'asserted', value: '@max' } });
  await put(root, {
    [approvalRecordPath(misplaced).replace('/legal/', '/security/')]:
      serializeApprovalRecord(misplaced),
    [`.promptscript/approvals/legal/${PROMPT}/broken.json`]: '{"not":"a record"}\n',
  });
  const bad = commit(root, 'bad records');
  await put(root, { '.github/CODEOWNERS': `* @acme/all\n${codeownersMarker('.')}\n/x @a\n` });
  const generate = commit(root, 'codeowners');
  await put(root, { '.github/CODEOWNERS': `* @acme/other\n${codeownersMarker('.')}\n/x @a\n` });
  commit(root, 'hand-written line above the marker');
  await put(root, {
    'promptscript.yaml': `${CONFIG}# note\n`,
    '.promptscript/project.prs': `${PROJECT}\n`,
  });
  const edit = commit(root, 'edit');
  return {
    root,
    commits: { approve, promote, promote2, rollback, withdraw, bad, generate, edit },
  };
}

async function run(
  cwd: string,
  options: Omit<AuditLogOptions, 'cwd'> = {}
): Promise<{ report: AuditLogReport; exitCode: number | string | undefined }> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  process.exitCode = undefined;
  await auditLogCommand({ cwd, format: 'json', ...options });
  const printed = log.mock.calls.map((call) => String(call[0]));
  log.mockRestore();
  expect(printed).toHaveLength(1);
  return { report: JSON.parse(printed[0] ?? '') as AuditLogReport, exitCode: process.exitCode };
}

async function printed(cwd: string, options: Omit<AuditLogOptions, 'cwd'>): Promise<string[]> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  await auditLogCommand({ cwd, ...options });
  const lines = log.mock.calls.map((call) => String(call[0]));
  log.mockRestore();
  return lines;
}

const brief = (events: AuditEvent[]): string[] =>
  events.map((event) =>
    [event.type, event.environment, event.contentHash?.slice(7, 8), event.state]
      .filter((part) => part !== undefined)
      .join(' ')
  );

/** The branch `git init` created. */
const branch = (root: string): string => git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim();

/** Run Git with the next committer date of the clock; a failing merge is not an error. */
function dated(root: string, ...args: string[]): void {
  clock += 1;
  const date = `2026-10-${String(clock).padStart(2, '0')}T10:00:00Z`;
  try {
    execFileSync(
      'git',
      [
        '-c',
        'user.email=t@example.com',
        '-c',
        'user.name=T',
        '-c',
        'commit.gpgsign=false',
        ...args,
      ],
      {
        cwd: root,
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
      }
    );
  } catch {
    // A merge with a conflict stops here; the test resolves it and commits.
  }
}

function labelOf(environment: string, prompts: Record<string, string>): string {
  return labelText({
    $schema: PROMPT_RELEASE_LABEL_SCHEMA_URL,
    environment,
    prompts: Object.entries(prompts).map(([id, contentHash]) => ({ id, contentHash })),
  });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  process.exitCode = undefined;
  for (const path of directories.splice(0)) {
    await rm(path, { recursive: true, force: true });
  }
});

describe('prs audit log', () => {
  it('reports every event type newest first, and the JSON matches the schema', async () => {
    // Arrange
    const { root, commits } = await fullHistory();
    const head = git(root, 'rev-parse', 'HEAD').trim();

    // Act
    const { report, exitCode } = await run(root);

    // Assert
    expect(exitCode).toBe(0);
    expect(validateAuditLog(report)).toBe(true);
    expect(report).toMatchObject({ success: true, head, filters: {}, errors: [] });
    expect(brief(report.events)).toEqual([
      'changed',
      'config-changed',
      'generated',
      'approved invalid',
      'approved prod 1 misplaced',
      'approval-removed prod 1 well-formed',
      'rolled-back prod 1',
      'promoted prod 2',
      'promoted prod 1',
      'promoted staging 1',
      'approved prod 1 well-formed',
      'changed',
      'config-changed',
    ]);
    expect(report.events[0]).toEqual({
      type: 'changed',
      commit: commits['edit'],
      at: '2026-10-10T10:00:00Z',
      author: { name: 'Jane', email: 'jane@example.com' },
      committer: { name: 'CI', email: 'ci@example.com' },
      path: '.promptscript/project.prs',
      mainline: true,
      change: 'M',
    });
    const approved = report.events.find((event) => event.commit === commits['approve']);
    expect(approved).toMatchObject({
      type: 'approved',
      prompt: PROMPT,
      contentHash: H1,
      role: 'legal',
      environment: 'prod',
      approver: '@jane',
      approverSource: 'asserted',
      recordCreatedAt: '2026-10-22T09:14:03.120Z',
      comment: 'Checked against\nthe refund policy',
      state: 'well-formed',
    });
    expect(report.events.find((event) => event.type === 'rolled-back')).toMatchObject({
      commit: commits['rollback'],
      contentHash: H1,
      previousContentHash: H2,
      author: { name: 'Rel', email: 'rel@example.com' },
    });
  });

  it('answers who approved a hash for prod with --prompt, --env and --hash', async () => {
    // Arrange
    const { root, commits } = await fullHistory();

    // Act
    const { report } = await run(root, {
      prompt: PROMPT,
      env: 'prod',
      hash: '1111111111',
    });

    // Assert
    expect(report.filters).toEqual({
      prompt: PROMPT,
      environment: 'prod',
      hash: `sha256-1111111111`,
    });
    // The misplaced record names the hash too; its state says it never counts.
    expect(brief(report.events)).toEqual([
      'approved prod 1 misplaced',
      'approval-removed prod 1 well-formed',
      'rolled-back prod 1',
      'promoted prod 1',
      'approved prod 1 well-formed',
    ]);
    expect(report.events.at(-1)).toMatchObject({ commit: commits['approve'], approver: '@jane' });
  });

  it('keeps changed events of the prompt files with --prompt, and records without an environment for any --env', async () => {
    // Arrange
    const root = await project();
    const everywhere = record({ approver: { source: 'asserted', value: '@sam' } });
    delete everywhere.environment;
    await put(root, {
      [approvalRecordPath(everywhere)]: serializeApprovalRecord(everywhere),
      'other.prs': '# not a prompt of the project\n',
    });
    commit(root, 'approve for all');

    // Act
    const byPrompt = await run(root, { prompt: PROMPT });
    const byEnvironment = await run(root, { env: 'staging' });

    // Assert
    expect(byPrompt.report.events.map((event) => [event.type, event.path])).toEqual([
      ['approved', approvalRecordPath(everywhere)],
      ['changed', '.promptscript/project.prs'],
    ]);
    expect(brief(byEnvironment.report.events)).toEqual(['approved 1 well-formed']);
  });

  it('reads a replaced record as removed and added, an extends file as config, and warns on a broken label', async () => {
    // Arrange
    const root = await project();
    const approval = record();
    const path = approvalRecordPath(approval);
    await put(root, {
      [path]: serializeApprovalRecord(approval),
      'base.yaml': 'targets: []\n',
      'promptscript.yaml': `extends: ./base.yaml\n${CONFIG}`,
    });
    commit(root, 'approve');
    await put(root, {
      [path]: serializeApprovalRecord({ ...approval, comment: 'now with a note' }),
      'base.yaml': 'targets: []\n# changed\n',
      [PROD]: '{ not json',
    });
    commit(root, 'replace');

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.errors).toEqual([]);
    expect(report.events.slice(0, 3).map((event) => [event.type, event.path])).toEqual([
      ['approval-removed', path],
      ['approved', path],
      ['config-changed', 'base.yaml'],
    ]);
    expect(report.events[1]?.comment).toBe('now with a note');
    expect(report.events[0]?.comment).toBeUndefined();
    expect(report.warnings.map((warning) => warning.message)).toEqual([
      expect.stringMatching(
        /^\.promptscript\/releases\/prod\.json at [0-9a-f]{12} is not a release label/
      ),
    ]);
  });

  it('does not read pricing.json as a release label', async () => {
    // Arrange
    const root = await project();
    await put(root, {
      '.promptscript/releases/pricing.json': '{"$schema":"x","models":[]}\n',
    });
    commit(root, 'price');

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.events.map((event) => event.path)).not.toContain(
      '.promptscript/releases/pricing.json'
    );
  });

  it('fails with PS5108 in a repository without a commit', async () => {
    // Arrange
    const root = await directory();
    git(root, 'init', '-q');
    await writeFile(join(root, 'promptscript.yaml'), CONFIG);

    // Act
    const { report, exitCode } = await run(root);

    // Assert
    expect(exitCode).toBe(1);
    expect(report.errors[0]).toMatchObject({ code: 'PS5108' });
    expect(report.errors[0]?.message).toContain('no commit yet');
  });

  it('reads a record that is not UTF-8 as invalid and a label over 1 MiB as unreadable', async () => {
    // Arrange
    const root = await project();
    const directory = `.promptscript/approvals/legal/${PROMPT}`;
    await mkdir(join(root, directory), { recursive: true });
    await writeFile(join(root, directory, 'latin.json'), Buffer.from([0x7b, 0xff, 0x7d, 0x0a]));
    await put(root, { [PROD]: `${' '.repeat(1024 * 1024 + 1)}\n` });
    commit(root, 'odd files');

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.errors).toEqual([]);
    expect(report.events[0]).toMatchObject({ path: `${directory}/latin.json`, state: 'invalid' });
    expect(report.warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining('prod.json at'),
    ]);
  });

  it('warns once about a broken label that two commits read', async () => {
    // Arrange
    const root = await project();
    await put(root, { [PROD]: '{ not json' });
    commit(root, 'break');
    await put(root, { [PROD]: label('prod', H1) });
    commit(root, 'fix');

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining('is not a release label'),
    ]);
  });

  it('warns when --prompt names no prompt of the checkout, and still shows its approvals', async () => {
    // Arrange
    const root = await project();
    const approval = record({ prompt: 'acme-support/gone' });
    await put(root, { [approvalRecordPath(approval)]: serializeApprovalRecord(approval) });
    commit(root, 'approve');

    // Act
    const { report } = await run(root, { prompt: 'acme-support/gone' });

    // Assert
    expect(brief(report.events)).toEqual(['approved prod 1 well-formed']);
    expect(report.warnings[0]?.message).toContain('is not a prompt of the checkout');
  });

  it('applies --since, --until and --limit after reading the whole history', async () => {
    // Arrange
    const { root } = await fullHistory();

    // Act
    const window = await run(root, { since: '2026-10-03', until: '2026-10-04' });
    const limited = await run(root, { limit: '2' });
    const exact = await run(root, { since: '2026-10-05T10:00:00Z', until: '2026-10-05T10:00:00Z' });

    // Assert
    expect(brief(window.report.events)).toEqual([
      'promoted prod 2',
      'promoted prod 1',
      'promoted staging 1',
    ]);
    expect(brief(limited.report.events)).toEqual(['changed', 'config-changed']);
    expect(brief(exact.report.events)).toEqual(['rolled-back prod 1']);
  });

  it('shows a removed prompt file and reads the history of a project in a subdirectory', async () => {
    // Arrange
    const root = await directory();
    git(root, 'init', '-q');
    clock = 0;
    const base = 'services/support';
    await put(root, {
      [`${base}/promptscript.yaml`]: CONFIG,
      [`${base}/.promptscript/project.prs`]: PROJECT,
      [`${base}/.promptscript/old.prs`]: '# old\n',
      'elsewhere/x.prs': '# another project\n',
    });
    commit(root, 'init');
    const approval = record();
    await put(root, {
      [`${base}/${approvalRecordPath(approval)}`]: serializeApprovalRecord(approval),
      [approvalRecordPath(approval)]: serializeApprovalRecord(approval),
    });
    await rm(join(root, base, '.promptscript/old.prs'));
    git(root, 'add', '-A');
    commit(root, 'approve and remove');

    // Act
    const { report } = await run(join(root, base));

    // Assert
    expect(report.events.map((event) => [event.type, event.path, event.state])).toEqual([
      ['approved', `${base}/${approvalRecordPath(approval)}`, 'well-formed'],
      ['changed', `${base}/.promptscript/old.prs`, undefined],
      ['changed', `${base}/.promptscript/old.prs`, undefined],
      ['changed', `${base}/.promptscript/project.prs`, undefined],
      ['config-changed', `${base}/promptscript.yaml`, undefined],
    ]);
  });

  it('prints CEF lines with the head and text lines starting with the hash', async () => {
    // Arrange
    const { root } = await fullHistory();
    const head = git(root, 'rev-parse', 'HEAD').trim();

    // Act
    const cef = await printed(root, { format: 'cef', env: 'prod', hash: '1111' });
    const text = await printed(root, { format: 'text', env: 'prod', hash: '1111', limit: '1' });

    // Assert
    expect(cef).toHaveLength(5);
    expect(cef[1]).toMatch(
      /^CEF:0\|PromptScript\|prs\|[^|]+\|prs-approval-removed\|Approval removed\|6\|rt=\d+ /
    );
    expect(cef.every((line) => line.includes(` flexString1=${head} flexString1Label=head`))).toBe(
      true
    );
    expect(text[0]).toBe(`head ${head}`);
    expect(text[1]?.startsWith(`${H1}  `)).toBe(true);
  });

  it('refuses a shallow clone with PS5108', async () => {
    // Arrange
    const { root } = await fullHistory();
    const clone = join(await directory(), 'clone');
    execFileSync('git', ['clone', '-q', '--depth', '1', `file://${root}`, clone]);

    // Act
    const { report, exitCode } = await run(clone);

    // Assert
    expect(exitCode).toBe(1);
    expect(report.success).toBe(false);
    expect(report.events).toEqual([]);
    expect(report.errors[0]?.code).toBe('PS5108');
    expect(report.errors[0]?.message).toContain('fetch-depth: 0');
    expect(validateAuditLog(report)).toBe(true);
  });

  it('refuses a directory outside a Git repository with PS5108', async () => {
    // Arrange
    const root = await directory();
    await writeFile(join(root, 'promptscript.yaml'), CONFIG);

    // Act
    const { report, exitCode } = await run(root);

    // Assert
    expect(exitCode).toBe(1);
    expect(report.errors[0]?.code).toBe('PS5108');
  });

  it.skipIf(process.platform === 'win32')('fails with PS5108 when Git times out', async () => {
    // Arrange
    const root = await project();
    const bin = await directory();
    await writeFile(join(bin, 'git'), '#!/bin/sh\nsleep 5\n');
    await chmod(join(bin, 'git'), 0o755);
    vi.stubEnv('PATH', `${bin}:${process.env['PATH'] ?? ''}`);
    vi.stubEnv('PROMPTSCRIPT_GIT_TIMEOUT', '200');

    // Act
    const { report, exitCode } = await run(root);

    // Assert
    expect(exitCode).toBe(1);
    expect(report.errors[0]?.code).toBe('PS5108');
  });

  it.each([
    [{ hash: 'xyz' }, 'PS5102'],
    [{ prompt: 'bad id' }, 'PS5102'],
    [{ since: '22.10.2026' }, undefined],
    [{ limit: '0' }, undefined],
    [{ limit: '100001' }, undefined],
    [{ env: 'Prod' }, undefined],
    [{ since: '2026-10-05', until: '2026-10-01' }, undefined],
  ])('refuses the filter %j', async (options, code) => {
    // Arrange
    const root = await directory();

    // Act
    const { report, exitCode } = await run(root, options);

    // Assert
    expect(exitCode).toBe(1);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]?.code).toBe(code);
  });

  it('refuses an unknown format', async () => {
    // Arrange
    const root = await directory();

    // Act
    await auditLogCommand({ cwd: root, format: 'xml' });

    // Assert
    expect(process.exitCode).toBe(1);
  });

  describe('merges', () => {
    it('shows a record that only a merge adds', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      git(root, 'checkout', '-q', '-b', 'side');
      await put(root, { 'side.txt': 'side\n' });
      commit(root, 'side');
      git(root, 'checkout', '-q', main);
      await put(root, { 'main.txt': 'main\n' });
      commit(root, 'main');
      dated(root, 'merge', '--no-commit', '--no-ff', 'side');
      const approval = record();
      await put(root, { [approvalRecordPath(approval)]: serializeApprovalRecord(approval) });
      const merge = commit(root, 'merge with a record');

      // Act
      const { report } = await run(root);

      // Assert
      expect(report.events[0]).toMatchObject({
        type: 'approved',
        commit: merge,
        state: 'well-formed',
        approver: '@jane',
        viaMerge: true,
      });
    });

    it('shows a label conflict resolved to a third hash against the first parent', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      await put(root, { [PROD]: label('prod', H1) });
      commit(root, 'prod 1');
      git(root, 'checkout', '-q', '-b', 'side');
      await put(root, { [PROD]: label('prod', H2) });
      commit(root, 'prod 2');
      git(root, 'checkout', '-q', main);
      await put(root, { [PROD]: label('prod', H3) });
      commit(root, 'prod 3');
      dated(root, 'merge', '--no-ff', 'side');
      await put(root, { [PROD]: label('prod', H4) });
      const merge = commit(root, 'resolve to 4');

      // Act
      const { report } = await run(root, { env: 'prod' });

      // Assert
      expect(report.events[0]).toMatchObject({
        type: 'promoted',
        commit: merge,
        contentHash: H4,
        previousContentHash: H3,
        viaMerge: true,
      });
    });

    it('shows a record a side branch added and removed again', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      const approval = record();
      const path = approvalRecordPath(approval);
      git(root, 'checkout', '-q', '-b', 'side');
      await put(root, { [path]: serializeApprovalRecord(approval) });
      const added = commit(root, 'add');
      await rm(join(root, path));
      git(root, 'add', '-A');
      const removed = commit(root, 'remove');
      git(root, 'checkout', '-q', main);
      dated(root, 'merge', '--no-ff', '-m', 'merge side', 'side');

      // Act
      const { report } = await run(root);

      // Assert
      expect(report.events.slice(0, 2).map((event) => [event.type, event.commit])).toEqual([
        ['approval-removed', removed],
        ['approved', added],
      ]);
      expect(report.events.some((event) => event.viaMerge === true)).toBe(false);
    });

    it('shows a merge that restores the side version of a record and a label', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      const approval = record();
      const path = approvalRecordPath(approval);
      await put(root, { [path]: serializeApprovalRecord(approval), [PROD]: label('prod', H1) });
      commit(root, 'approve and promote 1');
      git(root, 'checkout', '-q', '-b', 'side');
      await put(root, { 'side.txt': 'side\n' });
      commit(root, 'side work');
      git(root, 'checkout', '-q', main);
      await rm(join(root, path));
      await put(root, { [PROD]: label('prod', H2) });
      commit(root, 'revoke and promote 2');
      dated(root, 'merge', '--no-commit', '--no-ff', 'side');
      git(root, 'checkout', 'side', '--', path, PROD);
      const merge = commit(root, 'merge that takes the side versions');

      // Act
      const { report } = await run(root);

      // Assert
      expect(report.events.slice(0, 2)).toMatchObject([
        { type: 'approved', commit: merge, state: 'well-formed', viaMerge: true },
        {
          type: 'rolled-back',
          commit: merge,
          contentHash: H1,
          previousContentHash: H2,
          viaMerge: true,
        },
      ]);
    });

    it('shows what an evil merge on a fast-forwarded side branch dropped', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      const approval = record();
      const path = approvalRecordPath(approval);
      await put(root, { [path]: serializeApprovalRecord(approval), [PROD]: label('prod', H1) });
      commit(root, 'approve and promote 1');
      git(root, 'checkout', '-q', '-b', 'side');
      await put(root, { 'side.txt': 'side\n' });
      commit(root, 'side work');
      git(root, 'checkout', '-q', main);
      await rm(join(root, path));
      await put(root, { [PROD]: label('prod', H2) });
      const revoke = commit(root, 'revoke and promote 2');
      git(root, 'checkout', '-q', 'side');
      dated(root, 'merge', '--no-commit', '--no-ff', main);
      git(root, 'checkout', 'HEAD', '--', path, PROD);
      const merge = commit(root, 'merge that keeps the old versions');
      git(root, 'checkout', '-q', main);
      git(root, 'merge', '-q', '--ff-only', 'side');

      // Act
      const { report } = await run(root);

      // Assert
      expect(report.errors).toEqual([]);
      expect(validateAuditLog(report)).toBe(true);
      expect(report.events.filter((event) => event.commit === merge)).toMatchObject([
        {
          type: 'merge-dropped',
          path,
          parent: revoke,
          change: 'D',
          state: 'well-formed',
          approver: '@jane',
          mainline: true,
          viaMerge: true,
        },
        {
          type: 'merge-dropped',
          path: PROD,
          parent: revoke,
          prompt: PROMPT,
          environment: 'prod',
          contentHash: H1,
          droppedContentHash: H2,
          mainline: true,
          viaMerge: true,
        },
      ]);
      expect(
        report.events
          .filter((event) => event.commit === revoke)
          .map((event) => [event.type, event.mainline])
      ).toEqual([
        ['approval-removed', false],
        ['promoted', false],
      ]);
    });

    it('shows a change an octopus merge dropped from a later parent', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      const max = record({ approver: { source: 'asserted', value: '@max' } });
      const sam = record({ approver: { source: 'asserted', value: '@sam' } });
      git(root, 'checkout', '-q', '-b', 'one');
      await put(root, { [approvalRecordPath(max)]: serializeApprovalRecord(max) });
      commit(root, 'approve max');
      git(root, 'checkout', '-q', main);
      git(root, 'checkout', '-q', '-b', 'two');
      await put(root, { [approvalRecordPath(sam)]: serializeApprovalRecord(sam) });
      const two = commit(root, 'approve sam');
      git(root, 'checkout', '-q', main);
      await put(root, { 'main.txt': 'main\n' });
      commit(root, 'main work');
      dated(root, 'merge', '--no-commit', 'one', 'two');
      git(root, 'rm', '-q', '-f', approvalRecordPath(sam));
      const merge = commit(root, 'octopus without sam');

      // Act
      const { report } = await run(root);

      // Assert
      expect(report.errors).toEqual([]);
      expect(git(root, 'rev-list', '--parents', '-n', '1', 'HEAD').trim().split(' ')).toHaveLength(
        4
      );
      expect(
        report.events
          .filter((event) => event.commit === merge)
          .map((event) => [event.type, event.approver, event.parent])
      ).toEqual([
        ['approved', '@max', undefined],
        ['merge-dropped', '@sam', two],
      ]);
    });

    it('finds a drop that shows against only one base of a criss-cross merge', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      const approval = record();
      const path = approvalRecordPath(approval);
      git(root, 'checkout', '-q', '-b', 'x');
      await put(root, { 'x.txt': 'x\n' });
      const x1 = commit(root, 'x1');
      git(root, 'checkout', '-q', main);
      git(root, 'checkout', '-q', '-b', 'y');
      await put(root, { [path]: serializeApprovalRecord(approval) });
      const y1 = commit(root, 'y1 approves');
      git(root, 'checkout', '-q', 'x');
      dated(root, 'merge', '--no-ff', '--no-edit', y1);
      git(root, 'checkout', '-q', 'y');
      dated(root, 'merge', '--no-ff', '--no-edit', x1);
      const y2 = git(root, 'rev-parse', 'HEAD').trim();
      git(root, 'checkout', '-q', 'x');
      dated(root, 'merge', '--no-commit', '--no-ff', 'y');
      git(root, 'rm', '-q', '-f', path);
      const merge = commit(root, 'criss-cross merge without the record');

      // Act
      const { report } = await run(root);

      // Assert
      expect(git(root, 'merge-base', '--all', 'HEAD^1', 'HEAD^2').trim().split('\n')).toHaveLength(
        2
      );
      expect(report.errors).toEqual([]);
      expect(
        report.events
          .filter((event) => event.commit === merge)
          .map((event) => [event.type, event.parent])
      ).toEqual([
        ['approval-removed', undefined],
        ['merge-dropped', y2],
      ]);
    });

    it('shows a dropped CODEOWNERS section and a dropped broken label', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      const owners = (line: string): string => `* @acme/all\n${codeownersMarker('.')}\n${line}\n`;
      await put(root, { '.github/CODEOWNERS': owners('/a @x'), [PROD]: label('prod', H1) });
      commit(root, 'base');
      git(root, 'checkout', '-q', '-b', 'side');
      await put(root, { '.github/CODEOWNERS': owners('/a @y'), [PROD]: '{ broken' });
      const side = commit(root, 'side changes owners and breaks the label');
      git(root, 'checkout', '-q', main);
      await put(root, { 'main.txt': 'main\n' });
      commit(root, 'main work');
      dated(root, 'merge', '--no-commit', '--no-ff', 'side');
      git(root, 'checkout', 'HEAD', '--', '.github/CODEOWNERS', PROD);
      const merge = commit(root, 'merge without the side changes');

      // Act
      const { report } = await run(root);

      // Assert
      expect(report.errors).toEqual([]);
      expect(
        report.events
          .filter((event) => event.commit === merge)
          .map((event) => [event.type, event.path, event.parent, event.prompt])
      ).toEqual([
        ['merge-dropped', '.github/CODEOWNERS', side, undefined],
        ['merge-dropped', PROD, side, undefined],
      ]);
    });

    it('warns about a merge of unrelated histories', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      git(root, 'checkout', '-q', '--orphan', 'other');
      git(root, 'rm', '-q', '-r', '-f', '.');
      await put(root, { 'other.txt': 'other\n' });
      commit(root, 'other root');
      git(root, 'checkout', '-q', main);
      dated(root, 'merge', '--no-ff', '--no-edit', '--allow-unrelated-histories', 'other');

      // Act
      const { report } = await run(root);

      // Assert
      expect(report.errors).toEqual([]);
      expect(report.warnings.map((warning) => warning.message)).toEqual([
        expect.stringContaining('joins unrelated histories'),
      ]);
    });

    it('reads a clean merge of two promotions as promoted, never rolled back', async () => {
      // Arrange
      const root = await project();
      const main = branch(root);
      const other = 'acme-support/other';
      await put(root, { [PROD]: labelOf('prod', { [other]: H1, [PROMPT]: H1 }) });
      const both = commit(root, 'promote both 1');
      git(root, 'checkout', '-q', '-b', 'side');
      await put(root, { [PROD]: labelOf('prod', { [other]: H1, [PROMPT]: H2 }) });
      const sideCommit = commit(root, 'promote refund-reply 2');
      git(root, 'checkout', '-q', main);
      await put(root, { [PROD]: labelOf('prod', { [other]: H3, [PROMPT]: H1 }) });
      const mainCommit = commit(root, 'promote other 3');
      dated(root, 'merge', '--no-ff', '--no-edit', 'side');
      const merge = git(root, 'rev-parse', 'HEAD').trim();

      // Act
      const { report } = await run(root, { env: 'prod' });

      // Assert
      expect(report.events.some((event) => event.type === 'merge-dropped')).toBe(false);
      expect(git(root, 'show', `HEAD:${PROD}`)).toBe(
        labelOf('prod', { [other]: H3, [PROMPT]: H2 })
      );
      expect(
        report.events.map((event) => [event.type, event.commit, event.prompt, event.viaMerge])
      ).toEqual([
        ['promoted', merge, PROMPT, true],
        ['promoted', mainCommit, other, undefined],
        ['promoted', sideCommit, PROMPT, undefined],
        ['promoted', both, other, undefined],
        ['promoted', both, PROMPT, undefined],
      ]);
    });
  });

  it('ignores a grafts file that would cut the history', async () => {
    // Arrange
    const root = await project();
    const init = git(root, 'rev-parse', 'HEAD').trim();
    const approval = record();
    await put(root, { [approvalRecordPath(approval)]: serializeApprovalRecord(approval) });
    const head = commit(root, 'approve');
    await mkdir(join(root, '.git/info'), { recursive: true });
    await writeFile(join(root, '.git/info/grafts'), `${head}\n`);

    // Act
    const { report } = await run(root);

    // Assert
    // With the graft, the approve commit would have no parent and add every file itself.
    expect(report.events.map((event) => [event.type, event.commit])).toEqual([
      ['approved', head],
      ['changed', init],
      ['config-changed', init],
    ]);
  });

  it('reads a record blob over 1 MiB, a link and a submodule as invalid records', async () => {
    // Arrange
    const root = await project();
    const directory = `.promptscript/approvals/legal/${PROMPT}`;
    await put(root, { [`${directory}/huge.json`]: `${' '.repeat(1024 * 1024 + 1)}\n` });
    if (process.platform !== 'win32') {
      await symlink('huge.json', join(root, directory, 'link.json'));
    }
    const head = git(root, 'rev-parse', 'HEAD').trim();
    git(root, 'add', '-A');
    git(root, 'update-index', '--add', '--cacheinfo', `160000,${head},${directory}/sub.json`);
    commit(root, 'odd records');

    // Act
    const { report } = await run(root, { prompt: PROMPT });

    // Assert
    const paths = report.events.map((event) => [
      event.path.slice(directory.length + 1),
      event.state,
    ]);
    expect(paths).toEqual(
      expect.arrayContaining([
        ['huge.json', 'invalid'],
        ['sub.json', 'invalid'],
        ...(process.platform === 'win32' ? [] : [['link.json', 'invalid']]),
      ])
    );
  });

  it('fails with PS5108 when a partial clone lacks a blob', async () => {
    // Arrange
    const root = await project();
    const approval = record();
    await put(root, { [approvalRecordPath(approval)]: serializeApprovalRecord(approval) });
    commit(root, 'approve');
    git(root, 'config', 'uploadpack.allowFilter', 'true');
    const clone = join(await directory(), 'clone');
    execFileSync('git', [
      'clone',
      '-q',
      '--filter=blob:none',
      '--no-checkout',
      `file://${root}`,
      clone,
    ]);
    await writeFile(join(clone, 'promptscript.yaml'), CONFIG);

    // Act
    const { report, exitCode } = await run(clone);

    // Assert
    expect(exitCode).toBe(1);
    expect(report.errors[0]?.code).toBe('PS5108');
    expect(report.errors[0]?.message).toContain('partial clone');
  });

  it('reads records as committed in a core.autocrlf=true checkout', async () => {
    // Arrange
    const root = await project();
    const approval = record();
    await put(root, { [approvalRecordPath(approval)]: serializeApprovalRecord(approval) });
    commit(root, 'approve');
    const clone = join(await directory(), 'clone');
    execFileSync('git', ['-c', 'core.autocrlf=true', 'clone', '-q', `file://${root}`, clone]);
    git(clone, 'config', 'core.autocrlf', 'true');

    // Act
    const { report } = await run(clone);

    // Assert
    expect(brief(report.events)[0]).toBe('approved prod 1 well-formed');
  });

  it('reports entries removed from a label, a deleted label and labels of unconfigured environments', async () => {
    // Arrange
    const root = await project();
    await put(root, {
      [PROD]: labelOf('prod', { [PROMPT]: H1, 'acme-support/other': H2 }),
      '.promptscript/releases/qa.json': labelOf('qa', { [PROMPT]: H3 }),
      '.promptscript/releases/manifest.json': '{}\n',
    });
    commit(root, 'labels');
    await put(root, { [PROD]: labelOf('prod', { [PROMPT]: H1 }) });
    const drop = commit(root, 'drop other');
    await rm(join(root, PROD));
    git(root, 'add', '-A');
    const remove = commit(root, 'delete label');

    // Act
    const { report } = await run(root);
    const byHash = await run(root, { hash: '2222' });

    // Assert
    expect(validateAuditLog(report)).toBe(true);
    expect(report.events.slice(0, 2)).toMatchObject([
      { type: 'label-removed', commit: remove, prompt: PROMPT, previousContentHash: H1 },
      {
        type: 'label-removed',
        commit: drop,
        prompt: 'acme-support/other',
        environment: 'prod',
        previousContentHash: H2,
      },
    ]);
    expect(report.events[1]).not.toHaveProperty('contentHash');
    expect(report.events[0]).not.toHaveProperty('configured');
    expect(report.events.find((event) => event.environment === 'qa')).toMatchObject({
      configured: false,
    });
    expect(brief(report.events).slice(2, 5)).toEqual([
      'promoted prod 2',
      'promoted prod 1',
      'promoted qa 3',
    ]);
    expect(report.warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining('qa is not in releases.environments'),
    ]);
    expect(brief(byHash.report.events)).toEqual(['label-removed prod', 'promoted prod 2']);
  });

  it('warns instead of comparing a CODEOWNERS file over 1 MiB', async () => {
    // Arrange
    const root = await project();
    const big = `${codeownersMarker('.')}\n${'# padding\n'.repeat(120_000)}`;
    await put(root, { '.github/CODEOWNERS': big });
    commit(root, 'big');
    await put(root, { '.github/CODEOWNERS': `${big}/x @a\n` });
    commit(root, 'bigger');

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.events.filter((event) => event.type === 'generated')).toEqual([]);
    expect(report.warnings).toHaveLength(2);
    expect(report.warnings[0]?.message).toContain('larger than 1 MiB');
  });

  it('writes hidden characters of the JSON as escapes', () => {
    // Arrange
    const report: AuditLogReport = {
      $schema: 'https://getpromptscript.dev/schema/audit-log/v1.json',
      version: 1,
      success: false,
      filters: { prompt: 'a\u202eb\u200bc\u0085d\u2028e' },
      events: [],
      warnings: [],
      errors: [],
    };

    // Act
    const text = jsonText(report);

    // Assert
    expect(text).toContain(String.raw`"a\u202eb\u200bc\u0085d\u2028e"`);
    expect(text).not.toMatch(/[\u0085\u200b\u2028\u202e]/);
    expect(JSON.parse(text)).toEqual(report);
  });

  it('requires head in a successful export by the schema', () => {
    // Arrange
    const report = {
      $schema: 'https://getpromptscript.dev/schema/audit-log/v1.json',
      version: 1,
      success: true,
      filters: {},
      events: [],
      warnings: [],
      errors: [],
    };

    // Act
    const valid = validateAuditLog(report);

    // Assert
    expect(valid).toBe(false);
    expect(validateAuditLog({ ...report, head: 'a'.repeat(40) })).toBe(true);
  });
});
