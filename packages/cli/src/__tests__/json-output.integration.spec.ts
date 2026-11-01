import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ValidateFunction } from 'ajv';
import { run } from '../cli.js';
import { errorReport } from '../commands/eval/output.js';
import { ConsoleOutput, LogLevel, getContext, setContext } from '../output/console.js';
import {
  compileSchema,
  validateApprovalReport,
  validateAuditLog,
  validateReleaseReport,
} from './prompt-bundle-validators.js';

vi.mock('../telemetry/session.js', () => ({
  prepareCliTelemetry: () => Promise.resolve(),
  finishCliTelemetry: () => undefined,
  flushCliTelemetry: () => Promise.resolve(),
}));

const SCHEMA_URL = /^https:\/\/getpromptscript\.dev\/schema\//;
const UPDATE_LINE = 'Could not check for updates';

const CONFIG = `version: '1'
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
`;

const SOURCE = `@meta {
  id: "acme-support"
  syntax: "1.6.0"
}

@prompts {
  refund-reply: {
    description: "Answer a refund request"
    system: "You answer refund requests."
    user: "Customer wrote: {{input.message}}"
    inputs: { message: { type: "string", description: "Customer message" } }
  }
}
`;

const diffSchema = compileSchema('diff-v1.json');
const evalReportSchema = compileSchema('eval-report-v1.json');
const evalComparisonSchema = compileSchema('eval-comparison-v1.json');

interface JsonRun {
  document: Record<string, unknown>;
  stderr: string;
  exitCode: number;
}

let root = '';
let home = '';
const originalCwd = process.cwd();

function git(...args: string[]): void {
  execFileSync(
    'git',
    [
      '-c',
      'user.email=test@example.com',
      '-c',
      'user.name=Test',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { cwd: root, stdio: 'ignore' }
  );
}

/**
 * Run the real program in-process with the update check failing offline.
 * Everything written to stdout must parse as one JSON document.
 */
async function runJson(args: string[]): Promise<JsonRun> {
  const out: string[] = [];
  const err: string[] = [];
  const collect = (lines: string[]) => (chunk: unknown) => {
    lines.push(String(chunk));
    return true;
  };
  vi.spyOn(process.stdout, 'write').mockImplementation(collect(out));
  vi.spyOn(console, 'log').mockImplementation((...parts) => void out.push(`${parts.join(' ')}\n`));
  vi.spyOn(console, 'info').mockImplementation((...parts) => void out.push(`${parts.join(' ')}\n`));
  vi.spyOn(console, 'debug').mockImplementation(
    (...parts) => void out.push(`${parts.join(' ')}\n`)
  );
  vi.spyOn(console, 'error').mockImplementation((...parts) => void err.push(parts.join(' ')));
  vi.spyOn(console, 'warn').mockImplementation((...parts) => void err.push(parts.join(' ')));
  process.exitCode = undefined;
  process.chdir(root);
  try {
    await run(['node', 'prs', '--verbose', ...args]);
    // The update check is not awaited by the program, so wait for its line.
    await vi.waitFor(() => expect(err.join('\n')).toContain(UPDATE_LINE));
  } finally {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
  }
  const exitCode = Number(process.exitCode ?? 0);
  process.exitCode = undefined;
  const text = out.join('');
  try {
    return {
      document: JSON.parse(text) as Record<string, unknown>,
      stderr: err.join('\n'),
      exitCode,
    };
  } catch {
    throw new Error(`stdout is not one JSON document:\n${text}`);
  }
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'promptscript-json-'));
  // An empty home means no version cache, so the update check always fetches.
  home = await mkdtemp(join(tmpdir(), 'promptscript-json-home-'));
  vi.stubEnv('HOME', home);
  // Offline: the registry fetch fails, which is the path that used to print on stdout.
  vi.stubGlobal('fetch', () =>
    Promise.reject(Object.assign(new Error('fetch failed'), { code: 'ENOTFOUND' }))
  );
  vi.stubEnv('PROMPTSCRIPT_NO_UPDATE_CHECK', '');
  await mkdir(join(root, '.promptscript'), { recursive: true });
  await mkdir(join(root, 'reports'), { recursive: true });
  await writeFile(join(root, 'promptscript.yaml'), CONFIG);
  await writeFile(join(root, '.promptscript', 'project.prs'), SOURCE);
  const empty = JSON.stringify(errorReport('replay', []));
  await writeFile(join(root, 'reports', 'a.json'), empty);
  await writeFile(join(root, 'reports', 'b.json'), empty);
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'init');
});

afterEach(() => {
  vi.restoreAllMocks();
  setContext({ logLevel: LogLevel.Normal, outputStream: 'stdout' });
});

afterAll(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
  await rm(home, { recursive: true, force: true });
});

interface Row {
  name: string;
  args: string[];
  validate: ValidateFunction;
  exitCode: number;
}

const rows: Row[] = [
  { name: 'diff', args: ['diff', '--format', 'json'], validate: diffSchema, exitCode: 0 },
  {
    name: 'release build',
    args: ['release', 'build', '--format', 'json'],
    validate: validateReleaseReport,
    exitCode: 0,
  },
  {
    name: 'release promote',
    args: [
      'release',
      'promote',
      'acme-support/refund-reply',
      '--to',
      'staging',
      '--format',
      'json',
    ],
    validate: validateReleaseReport,
    exitCode: 0,
  },
  {
    name: 'release status',
    args: ['release', 'status', '--format', 'json'],
    validate: validateReleaseReport,
    exitCode: 0,
  },
  {
    name: 'release split',
    args: [
      'release',
      'split',
      'acme-support/refund-reply',
      '--env',
      'prod',
      '--end',
      '--format',
      'json',
    ],
    validate: validateReleaseReport,
    exitCode: 1,
  },
  {
    name: 'release rollback',
    args: ['release', 'rollback', 'staging', '--format', 'json'],
    validate: validateReleaseReport,
    exitCode: 1,
  },
  {
    name: 'approve --list',
    args: ['approve', '--list', '--format', 'json'],
    validate: validateApprovalReport,
    exitCode: 0,
  },
  {
    name: 'audit log',
    args: ['audit', 'log', '--format', 'json'],
    validate: validateAuditLog,
    exitCode: 0,
  },
  {
    name: 'eval run',
    args: ['eval', 'run', '--format', 'json'],
    validate: evalReportSchema,
    exitCode: 1,
  },
  {
    name: 'eval compare',
    args: ['eval', 'compare', 'reports/a.json', 'reports/b.json', '--format', 'json'],
    validate: evalComparisonSchema,
    exitCode: 0,
  },
];

function expectStable(result: JsonRun, validate: ValidateFunction, exitCode: number): void {
  expect(validate(result.document), JSON.stringify(validate.errors)).toBe(true);
  expect(result.document).toMatchObject({ $schema: expect.stringMatching(SCHEMA_URL), version: 1 });
  expect(result.exitCode).toBe(exitCode);
  expect(result.stderr).toContain(UPDATE_LINE);
}

describe('stable commands under --format json', () => {
  // The rows share one project and run in order: promote needs the build.
  it.each(rows)('$name prints one valid document on stdout', async (row) => {
    const result = await runJson(row.args);

    expectStable(result, row.validate, row.exitCode);
  });

  it('approve writes a record and prints one valid document on stdout', async () => {
    const listed = await runJson(['approve', '--list', '--format', 'json']);
    const prompts = listed.document['prompts'] as { id: string; contentHash: string }[];
    const reference = `${prompts[0]?.id}@${prompts[0]?.contentHash}`;

    const result = await runJson([
      ...['approve', reference, '--role', 'legal', '--approver', '@jane'],
      ...['--env', 'prod', '--format', 'json'],
    ]);

    expectStable(result, validateApprovalReport, 0);
    expect(result.document).toMatchObject({ command: 'approve', success: true });
  });
});

describe('the update check failure line', () => {
  it('goes to stderr without --format json', async () => {
    const err: string[] = [];
    const out: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...parts) => void err.push(parts.join(' ')));
    vi.spyOn(console, 'log').mockImplementation((...parts) => void out.push(parts.join(' ')));
    process.chdir(root);
    try {
      await run(['node', 'prs', '--verbose', 'audit', 'log']);
      await vi.waitFor(() => expect(err.join('\n')).toContain(UPDATE_LINE));
    } finally {
      process.chdir(originalCwd);
    }

    expect(out.join('\n')).not.toContain(UPDATE_LINE);
  });
});

describe('the --format json guard', () => {
  it('sends ConsoleOutput lines to stderr', async () => {
    await runJson(['audit', 'log', '--format', 'json']);
    const out: string[] = [];
    const err: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...parts) => void out.push(parts.join(' ')));
    vi.spyOn(console, 'error').mockImplementation((...parts) => void err.push(parts.join(' ')));
    setContext({ logLevel: LogLevel.Verbose });

    ConsoleOutput.verbose('probe');

    expect(getContext().outputStream).toBe('stderr');
    expect(out).toEqual([]);
    expect(err.join('\n')).toContain('probe');
  });
});
