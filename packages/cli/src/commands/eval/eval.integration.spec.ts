import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, symlink, truncate, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { Ajv } from 'ajv';
import {
  EVAL_CODES,
  EvalError,
  createMockProvider,
  createProviderFactory,
  type EvalProviderLookup,
  type MockAnswer,
} from '@promptscript/eval';
import { defaultFileSystem, defaultPrompts } from '../../services.js';
import { evalCompareCommand } from './compare.js';
import { registerEvalCommands } from './register.js';
import { evalRunCommand, type EvalCommandServices } from './run.js';

const spinner = vi.hoisted(() => ({ text: '', stop: vi.fn() }));

vi.mock('../../output/console.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../output/console.js')>()),
  createSpinner: () => spinner,
}));

// Every test compiles a project, which is slow on a loaded machine.
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const KEY = 'sk-ant-planted-key-0123456789';
const MESSAGE_INPUT = 'message: { type: "string", description: "Customer message" }';

const SOURCE = `@meta {
  id: "acme-support"
  syntax: "1.6.0"
}

@prompts {
  refund-reply: {
    description: "Answer a customer refund request"
    model: { ref: "claude-sonnet-5-5", maxTokens: 800 }
    inputs: { ${MESSAGE_INPUT} }
    output: {
      decision: { type: "enum", options: ["approve", "escalate"], description: "What to do next" }
    }
    system: "You answer refund requests for Acme customers."
    user: "Customer wrote: {{input.message}}"
  }
}
`;

const CONFIG = `version: '1'
project:
  id: acme-support
targets:
  - claude
includePromptScriptSkill: false
`;

const SUITE = `prompt: acme-support/refund-reply
dataset: datasets/rows.jsonl
assertions:
  - { id: decision, kind: equals, field: decision }
`;

const ROWS = [
  '{"id":"late","inputs":{"message":"Late parcel"},"expected":{"decision":"approve"}}',
  '{"id":"rude","inputs":{"message":"You are slow"},"expected":{"decision":"escalate"}}',
  '',
].join('\n');

const ANSWERS: Record<string, MockAnswer> = {
  late: {
    text: '{"decision":"approve"}',
    usage: { inputTokens: 40, outputTokens: 5 },
    latencyMs: 300,
  },
  rude: {
    text: '{"decision":"escalate"}',
    usage: { inputTokens: 42, outputTokens: 5 },
    latencyMs: 500,
  },
};

const reportSchema = new Ajv({ strict: true, allowUnionTypes: true }).compile(
  JSON.parse(
    readFileSync(new URL('../../../../../schema/eval-report-v1.json', import.meta.url), 'utf8')
  ) as object
);
const comparisonSchema = new Ajv({ strict: true, allowUnionTypes: true }).compile(
  JSON.parse(
    readFileSync(new URL('../../../../../schema/eval-comparison-v1.json', import.meta.url), 'utf8')
  ) as object
);

const roots: string[] = [];

async function project(rows = ROWS, suite = SUITE): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-eval-cli-'));
  roots.push(root);
  await mkdir(join(root, '.promptscript', 'evals', 'datasets'), { recursive: true });
  await writeFile(join(root, 'promptscript.yaml'), CONFIG);
  await writeFile(join(root, '.promptscript', 'project.prs'), SOURCE);
  await writeFile(join(root, '.promptscript', 'evals', 'refund.eval.yaml'), suite);
  await writeFile(join(root, '.promptscript', 'evals', 'datasets', 'rows.jsonl'), rows);
  return root;
}

interface Run {
  stdout: string;
  stderr: string;
  code: number | string | undefined;
}

let out: string[];
let err: string[];

function services(patch: Partial<EvalCommandServices> = {}): EvalCommandServices {
  return {
    fs: defaultFileSystem,
    prompts: defaultPrompts,
    cwd: process.cwd(),
    env: { ANTHROPIC_API_KEY: KEY },
    ...patch,
  };
}

function lookupOf(provider: ReturnType<typeof createMockProvider>): EvalProviderLookup {
  return () => provider;
}

async function run(
  root: string,
  names: string[],
  options: Parameters<typeof evalRunCommand>[1] = {},
  patch: Partial<EvalCommandServices> = {}
): Promise<Run> {
  out = [];
  err = [];
  process.exitCode = undefined;
  await evalRunCommand(names, { cwd: root, ...options }, services(patch));
  const code = process.exitCode;
  process.exitCode = undefined;
  return { stdout: out.join(''), stderr: err.join('\n'), code };
}

const record = (
  root: string,
  patch: Partial<EvalCommandServices> = {},
  options = {}
): Promise<Run> =>
  run(
    root,
    [],
    { cache: 'record', maxCost: '1', format: 'json', ...options },
    { createProvider: () => lookupOf(createMockProvider(ANSWERS)), ...patch }
  );

const noProvider: Partial<EvalCommandServices> = {
  createProvider: () => () => {
    throw new Error('this run must not create a provider');
  },
};

beforeEach(() => {
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
    out.push(String(chunk));
    return true;
  });
  vi.spyOn(console, 'error').mockImplementation((...parts: unknown[]) => {
    err.push(parts.join(' '));
  });
  out = [];
  err = [];
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('prs eval run', () => {
  it('records with a mock provider, then replays the same bytes with no provider', async () => {
    const root = await project();

    const recorded = await record(root);
    const replayed = await run(root, [], { format: 'json' }, noProvider);
    const again = await run(root, [], { format: 'json' }, noProvider);

    expect(recorded.code).toBe(0);
    expect(replayed.code).toBe(0);
    const document = JSON.parse(replayed.stdout);
    expect(reportSchema(document), JSON.stringify(reportSchema.errors)).toBe(true);
    expect(document).toMatchObject({
      outcome: 'passed',
      cache: { mode: 'replay', live: 0, replayed: 2 },
    });
    expect(again.stdout).toBe(replayed.stdout);
    expect(JSON.parse(recorded.stdout).cache).toMatchObject({ mode: 'record', live: 2 });
    expect(JSON.parse(recorded.stdout).cache.digest).toBe(document.cache.digest);
    expect(existsSync(join(root, '.promptscript', 'eval-cache'))).toBe(true);
  });

  it('prints one JSON document on stdout and keeps progress on stderr', async () => {
    const root = await project();

    const result = await record(root);

    expect(result.stdout.trimEnd().split('\n').length).toBeGreaterThan(1);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    expect(result.stdout.endsWith('\n')).toBe(true);
  });

  it('announces the key variable and host before the first live call, and leaks no key', async () => {
    const root = await project();
    const sent: string[] = [];
    const fakeFetch = (async (
      _url: unknown,
      init?: { headers?: Record<string, string>; body?: string }
    ) => {
      sent.push(String(init?.headers?.['x-api-key']));
      const caseText = String(init?.body).includes('Late parcel')
        ? '{"decision":"approve"}'
        : '{"decision":"escalate"}';
      return new Response(
        JSON.stringify({
          content: [{ type: 'text', text: caseText }],
          usage: { input_tokens: 40, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as unknown as typeof fetch;

    const result = await record(root, {
      createProvider: (options) => createProviderFactory({ ...options, fetch: fakeFetch }),
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain('sending ANTHROPIC_API_KEY to api.anthropic.com');
    expect(sent).toEqual([KEY, KEY]);
    const everything = [result.stdout, result.stderr];
    const cache = join(root, '.promptscript', 'eval-cache');
    for (const entry of readdirSync(cache, { recursive: true, withFileTypes: true })) {
      if (entry.isFile()) everything.push(readFileSync(join(entry.parentPath, entry.name), 'utf8'));
    }
    expect(everything.join('\n')).not.toContain(KEY);
  });

  it('makes a replay miss exit 1 with outcome error and a hint to record', async () => {
    const root = await project();

    const result = await run(root, [], { format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    const document = JSON.parse(result.stdout);
    expect(document.outcome).toBe('error');
    expect(JSON.stringify(document)).toContain('prs eval run --cache record');
  });

  it('refuses a live mode without --max-cost before any call', async () => {
    const root = await project();

    const result = await run(root, [], { cache: 'record', format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).errors).toEqual([
      expect.objectContaining({ code: EVAL_CODES.BUDGET_REQUIRED }),
    ]);
  });

  it('reports bad flags as an error document and exits 1', async () => {
    const root = await project();

    const result = await run(
      root,
      [],
      { format: 'json', maxCost: 'NaN', concurrency: '0' },
      noProvider
    );

    expect(result.code).toBe(1);
    const codes = JSON.parse(result.stdout).errors.map((error: { code: string }) => error.code);
    expect(codes).toEqual([EVAL_CODES.RUN_OPTION_INVALID, EVAL_CODES.RUN_OPTION_INVALID]);
  });

  it('refuses an unknown --format on stderr and exits 1', async () => {
    const root = await project();

    const result = await run(root, [], { format: 'xml' }, noProvider);

    expect(result.code).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Invalid output format');
  });

  it('exits 1 with outcome failed when an assertion fails', async () => {
    const root = await project();
    await record(root);
    await writeFile(
      join(root, '.promptscript', 'evals', 'datasets', 'rows.jsonl'),
      ROWS.replace('"decision":"approve"', '"decision":"escalate"')
    );

    const result = await run(root, [], { format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ outcome: 'failed', passed: false });
  });

  it('prints a plan with --dry-run, creates no provider and writes nothing', async () => {
    const root = await project();

    const result = await run(root, [], { dryRun: true, cache: 'record', maxCost: '1' }, noProvider);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Plan, cache record');
    expect(result.stdout).toContain('claude-sonnet-5-5');
    expect(result.stdout).toContain('misses 2');
    expect(result.stdout).toContain('price built-in');
    expect(existsSync(join(root, '.promptscript', 'eval-cache'))).toBe(false);
  });

  it('refuses --dry-run with a document format', async () => {
    const root = await project();

    const result = await run(root, [], { dryRun: true, format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).errors[0].message).toContain('--dry-run prints a text plan');
  });

  it('writes the same bytes to --out and stdout', async () => {
    const root = await project();
    await record(root);
    const file = join(root, 'report.json');

    const result = await run(root, [], { format: 'json', out: 'report.json' }, noProvider);

    expect(readFileSync(file, 'utf8')).toBe(result.stdout);
  });

  it('writes one report per suite to --report-dir and refuses a directory outside the project', async () => {
    const root = await project();
    await record(root);

    const refused = await run(root, [], { format: 'json', reportDir: '../elsewhere' }, noProvider);
    const written = await run(
      root,
      [],
      { format: 'json', reportDir: '.promptscript/eval-reports' },
      noProvider
    );

    expect(refused.code).toBe(1);
    expect(JSON.parse(refused.stdout).errors[0].code).toBe(EVAL_CODES.PATH_REFUSED);
    expect(written.code).toBe(0);
    const files = readdirSync(join(root, '.promptscript', 'eval-reports'));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^refund\.[0-9a-f]{12}\.json$/);
    const file = JSON.parse(
      readFileSync(join(root, '.promptscript', 'eval-reports', files[0] ?? ''), 'utf8')
    );
    expect(reportSchema(file)).toBe(true);
    expect(file.suites.map((suite: { name: string }) => suite.name)).toEqual(['refund']);
    expect(file).not.toHaveProperty('comparison');
  });

  it('never follows a link out of the report directory', async () => {
    const root = await project();
    await record(root);
    const outside = await mkdtemp(join(tmpdir(), 'promptscript-eval-outside-'));
    roots.push(outside);
    await mkdir(join(root, '.promptscript', 'eval-reports'), { recursive: true });
    await symlink(outside, join(root, 'linked'));

    const result = await run(root, [], { format: 'json', reportDir: 'linked/reports' }, noProvider);

    expect(result.code).toBe(1);
    expect(readdirSync(outside)).toEqual([]);
  });

  it('compares with a baseline and fails on a regression only when asked', async () => {
    const suite = `${SUITE}thresholds:\n  passRate: 0.5\n`;
    const root = await project(ROWS, suite);
    await record(root);
    const baseline = await run(root, [], { format: 'json', out: 'baseline.json' }, noProvider);
    expect(baseline.code).toBe(0);
    await writeFile(
      join(root, '.promptscript', 'evals', 'datasets', 'rows.jsonl'),
      ROWS.replace('"decision":"approve"', '"decision":"escalate"')
    );

    const quiet = await run(root, [], { format: 'json', baseline: 'baseline.json' }, noProvider);
    const strict = await run(
      root,
      [],
      { format: 'json', baseline: 'baseline.json', failOnRegression: true },
      noProvider
    );

    const document = JSON.parse(strict.stdout);
    expect(reportSchema(document), JSON.stringify(reportSchema.errors)).toBe(true);
    expect(JSON.parse(quiet.stdout)).toMatchObject({ outcome: 'passed', passed: true });
    expect(JSON.parse(quiet.stdout).comparison.entries[0].regressions).toEqual(['late']);
    expect(quiet.code).toBe(0);
    expect(document).toMatchObject({ outcome: 'regression', passed: false });
    expect(strict.code).toBe(1);
  });

  it('keeps the outcome failed when the run failed and the baseline regressed too', async () => {
    const root = await project();
    await record(root);
    await run(root, [], { format: 'json', out: 'baseline.json' }, noProvider);
    await writeFile(
      join(root, '.promptscript', 'evals', 'datasets', 'rows.jsonl'),
      ROWS.replace('"decision":"approve"', '"decision":"escalate"')
    );

    const result = await run(
      root,
      [],
      { format: 'json', baseline: 'baseline.json', failOnRegression: true },
      noProvider
    );

    expect(JSON.parse(result.stdout).outcome).toBe('failed');
    expect(result.code).toBe(1);
  });

  it('refuses a baseline or report that is not a regular file', async () => {
    const root = await project();
    await mkdir(join(root, 'dir.json'));
    execFileSync('mkfifo', [join(root, 'pipe.json')]);

    for (const name of ['dir.json', 'pipe.json']) {
      const baseline = await run(root, [], { format: 'json', baseline: name }, noProvider);

      expect(baseline.code).toBe(1);
      expect(JSON.parse(baseline.stdout).errors[0]).toMatchObject({
        code: EVAL_CODES.REPORT_INVALID,
        message: expect.stringContaining('not a regular file'),
      });
    }
  });

  it('refuses an unreadable or foreign baseline before any call', async () => {
    const root = await project();
    await writeFile(join(root, 'foreign.json'), '{"not":"a report"}');

    const foreign = await run(root, [], { format: 'json', baseline: 'foreign.json' }, noProvider);
    const missing = await run(root, [], { format: 'json', baseline: 'nope.json' }, noProvider);

    expect(foreign.code).toBe(1);
    expect(JSON.parse(foreign.stdout).errors[0].code).toBe(EVAL_CODES.REPORT_INVALID);
    expect(missing.code).toBe(1);
    expect(JSON.parse(missing.stdout).errors[0].code).toBe(EVAL_CODES.REPORT_INVALID);
  });

  it('exits 2 for a pass with warnings under --strict, 0 without it', async () => {
    const rows = ROWS.replace('Late parcel', 'Late parcel, write to jane.doe@example.com');
    const root = await project(rows);
    await record(root);

    const lenient = await run(root, [], { format: 'json' }, noProvider);
    const strict = await run(root, [], { format: 'json', strict: true }, noProvider);

    expect(JSON.parse(lenient.stdout).suites[0].findings).toEqual([
      expect.objectContaining({ code: EVAL_CODES.PII_EMAIL, severity: 'warning' }),
    ]);
    expect(lenient.code).toBe(0);
    expect(strict.code).toBe(2);
  });

  it('reports an unknown suite name as an error', async () => {
    const root = await project();

    const result = await run(root, ['nope'], { format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).outcome).toBe('error');
  });

  it('reports a source that does not compile as an error document', async () => {
    const root = await project();
    await writeFile(join(root, '.promptscript', 'project.prs'), '@meta { id: ');

    const result = await run(root, [], { format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).errors[0].code).toBe(EVAL_CODES.PROJECT_INVALID);
  });

  it('prints Markdown, JUnit and text as one document each', async () => {
    const root = await project();
    await record(root);

    const markdown = await run(root, [], { format: 'markdown' }, noProvider);
    const junit = await run(root, [], { format: 'junit' }, noProvider);
    const text = await run(root, [], {}, noProvider);

    expect(markdown.stdout).toContain('Eval outcome: **passed**');
    expect(junit.stdout.startsWith('<?xml')).toBe(true);
    expect(junit.stdout).toContain('<testsuite name="refund/claude-sonnet-5-5"');
    expect(text.stdout).toContain('outcome: passed');
    for (const result of [markdown, junit, text]) expect(result.code).toBe(0);
  });

  it('exits 130 when Ctrl+C arrives during a dry run', async () => {
    const root = await project();
    out = [];
    vi.mocked(process.stdout.write).mockImplementation((chunk: string | Uint8Array) => {
      out.push(String(chunk));
      process.emit('SIGINT');
      return true;
    });
    process.exitCode = undefined;

    await evalRunCommand([], { cwd: root, dryRun: true }, services(noProvider));

    expect(process.exitCode).toBe(130);
  });

  it('plans a live mode with --dry-run and no --max-cost', async () => {
    const root = await project();

    const result = await run(root, [], { dryRun: true, cache: 'record' }, noProvider);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('worst case $');
    expect(result.stdout).not.toContain('budget');
  });

  it('refuses --report-dir with --model or --max-cases, also from the config', async () => {
    const root = await project();

    const model = await run(
      root,
      [],
      { format: 'json', reportDir: 'reports', model: 'claude-sonnet-5-5' },
      noProvider
    );
    const cases = await run(
      root,
      [],
      { format: 'json', reportDir: 'reports', maxCases: '5' },
      noProvider
    );
    await writeFile(join(root, 'promptscript.yaml'), `${CONFIG}eval:\n  reportDir: reports\n`);
    const fromConfig = await run(root, [], { format: 'json', maxCases: '5' }, noProvider);

    for (const result of [model, cases, fromConfig]) {
      expect(result.code).toBe(1);
      const [error] = JSON.parse(result.stdout).errors;
      expect(error.code).toBe(EVAL_CODES.RUN_OPTION_INVALID);
      expect(error.message).toContain('--report-dir cannot be used with --model or --max-cases');
    }
    expect(existsSync(join(root, 'reports'))).toBe(false);
  });

  it('refuses a link at the report file name and leaves its target alone', async () => {
    const root = await project();
    await record(root);
    const first = await run(root, [], { format: 'json', reportDir: 'reports' }, noProvider);
    const [name] = readdirSync(join(root, 'reports'));
    const file = join(root, 'reports', name ?? '');
    await rm(file);
    const target = join(root, 'precious.txt');
    await writeFile(target, 'keep me');
    await symlink(target, file);

    const result = await run(root, [], { format: 'json', reportDir: 'reports' }, noProvider);

    expect(first.code).toBe(0);
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      outcome: 'error',
      errors: [expect.objectContaining({ code: EVAL_CODES.REPORT_WRITE_FAILED })],
    });
    expect(readFileSync(target, 'utf8')).toBe('keep me');
  });

  it('makes an --out file in a missing directory an error outcome', async () => {
    const root = await project();
    await record(root);

    const result = await run(
      root,
      [],
      { format: 'json', out: 'no/such/dir/report.json' },
      noProvider
    );

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      outcome: 'error',
      passed: false,
      errors: [expect.objectContaining({ code: EVAL_CODES.REPORT_WRITE_FAILED })],
    });
  });

  it('warns about suites only the baseline has, in every format, and counts it for --strict', async () => {
    const root = await project();
    await record(root);
    const base = await run(root, [], { format: 'json' }, noProvider);
    const doctored = JSON.parse(base.stdout);
    doctored.suites.push({ ...doctored.suites[0], name: 'gone' });
    await writeFile(join(root, 'baseline.json'), JSON.stringify(doctored));

    const json = await run(root, [], { format: 'json', baseline: 'baseline.json' }, noProvider);
    const markdown = await run(
      root,
      [],
      { format: 'markdown', baseline: 'baseline.json' },
      noProvider
    );
    const strict = await run(
      root,
      [],
      { format: 'json', baseline: 'baseline.json', strict: true },
      noProvider
    );

    expect(json.stderr).toContain('warning: only in the baseline, not run: gone');
    expect(json.code).toBe(0);
    expect(markdown.stdout).toContain('Only in the baseline, not run:');
    expect(strict.code).toBe(2);
  });

  it('shows progress in a spinner in text mode on a terminal', async () => {
    const root = await project();
    const tty = Object.getOwnPropertyDescriptor(process.stderr, 'isTTY');
    Object.defineProperty(process.stderr, 'isTTY', { value: true, configurable: true });
    spinner.text = '';
    try {
      await record(root, {}, { format: 'text' });
    } finally {
      if (tty === undefined) Reflect.deleteProperty(process.stderr, 'isTTY');
      else Object.defineProperty(process.stderr, 'isTTY', tty);
    }

    expect(spinner.text).toBe('Running eval, 2 cases done');
    expect(spinner.stop).toHaveBeenCalled();
  });

  it('prints a warning for a cache entry that does not match its key and counts it as a miss', async () => {
    const root = await project();
    await record(root);
    const cache = join(root, '.promptscript', 'eval-cache');
    const entry = readdirSync(cache, { recursive: true, withFileTypes: true }).find((e) =>
      e.isFile()
    );
    await writeFile(join(entry?.parentPath ?? '', entry?.name ?? ''), '{"broken":true}');

    const result = await run(root, [], { format: 'json' }, noProvider);

    expect(result.stderr).toContain(`warning ${EVAL_CODES.CACHE_ENTRY_INVALID}`);
    expect(result.code).toBe(1);
  });

  it('reports a project without a config and an entry file that is missing', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'promptscript-eval-empty-'));
    roots.push(empty);
    const missing = await project();
    await writeFile(
      join(missing, 'promptscript.yaml'),
      `${CONFIG}input:\n  entry: ./.promptscript/nope.prs\n`
    );

    const none = await run(empty, [], { format: 'json' }, noProvider);
    const entry = await run(missing, [], { format: 'json' }, noProvider);

    expect(none.code).toBe(1);
    expect(JSON.parse(none.stdout).errors[0].code).toBe(EVAL_CODES.PROJECT_INVALID);
    expect(JSON.parse(entry.stdout).errors[0]).toMatchObject({
      code: EVAL_CODES.PROJECT_INVALID,
      message: expect.stringContaining('Entry file not found'),
    });
  });

  it('refuses a baseline over 32 MiB without reading it', async () => {
    const root = await project();
    await writeFile(join(root, 'big.json'), '');
    await truncate(join(root, 'big.json'), 33 * 1024 * 1024);

    const result = await run(root, [], { format: 'json', baseline: 'big.json' }, noProvider);

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).errors[0].message).toContain('over 32 MiB');
  });

  it('reports a provider that cannot be set up', async () => {
    const root = await project();

    const result = await run(
      root,
      [],
      { format: 'json' },
      {
        createProvider: () => {
          throw new EvalError(
            'The value of KEY appears in the eval config.',
            EVAL_CODES.KEY_IN_CONFIG
          );
        },
      }
    );

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).errors[0].code).toBe(EVAL_CODES.KEY_IN_CONFIG);
  });

  it('reports every suite problem together when a suite does not load', async () => {
    const root = await project();
    await writeFile(join(root, '.promptscript', 'evals', 'broken.eval.yaml'), 'prompt: [');

    const result = await run(root, [], { format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).errors.map((e: { code: string }) => e.code)).toContain(
      EVAL_CODES.SUITE_INVALID
    );
  });

  it('stops new calls on Ctrl+C, keeps the report and exits 130', async () => {
    const root = await project();
    const provider = createMockProvider((_request, context) => {
      process.emit('SIGINT');
      return ANSWERS[context.caseId] ?? '';
    });

    const result = await run(
      root,
      [],
      {
        cache: 'record',
        maxCost: '1',
        format: 'json',
        concurrency: '1',
        reportDir: '.promptscript/eval-reports',
      },
      { createProvider: () => lookupOf(provider) }
    );

    expect(result.code).toBe(130);
    // A partial report is printed but never written as a claim
    expect(existsSync(join(root, '.promptscript', 'eval-reports'))).toBe(false);
    const document = JSON.parse(result.stdout);
    expect(
      document.suites[0].models[0].cases.map((entry: { status: string }) => entry.status)
    ).toEqual(['passed', 'error']);
  });
});

describe('prs eval compare', () => {
  async function reports(): Promise<{ a: string; b: string }> {
    const root = await project();
    await record(root);
    const base = await run(root, [], { format: 'json', out: 'a.json' }, noProvider);
    expect(base.code).toBe(0);
    await writeFile(
      join(root, '.promptscript', 'evals', 'datasets', 'rows.jsonl'),
      ROWS.replace('"decision":"approve"', '"decision":"escalate"')
    );
    await run(root, [], { format: 'json', out: 'b.json' }, noProvider);
    return { a: join(root, 'a.json'), b: join(root, 'b.json') };
  }

  async function compare(
    a: string,
    b: string,
    options: Parameters<typeof evalCompareCommand>[2] = {}
  ): Promise<Run> {
    out = [];
    err = [];
    process.exitCode = undefined;
    await evalCompareCommand(a, b, options);
    const code = process.exitCode;
    process.exitCode = undefined;
    return { stdout: out.join(''), stderr: err.join('\n'), code };
  }

  it('prints the comparison as JSON that matches the schema', async () => {
    const { a, b } = await reports();

    const result = await compare(a, b, { format: 'json' });

    const document = JSON.parse(result.stdout);
    expect(comparisonSchema(document), JSON.stringify(comparisonSchema.errors)).toBe(true);
    expect(document.regression).toBe(true);
    expect(result.code).toBe(0);
  });

  it('exits 1 on a regression only with --fail-on-regression', async () => {
    const { a, b } = await reports();

    expect((await compare(a, b, { failOnRegression: true })).code).toBe(1);
    expect((await compare(a, a, { failOnRegression: true })).code).toBe(0);
    expect((await compare(a, b, { tolerance: '1' })).stdout).toContain('regressed: late');
  });

  it('resolves the report paths against --cwd', async () => {
    const { a, b } = await reports();
    const dir = join(a, '..');

    const result = await compare('a.json', 'b.json', { format: 'json', cwd: dir });
    const elsewhere = await compare('a.json', 'b.json', { format: 'json' });

    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).regression).toBe(true);
    expect(elsewhere.code).toBe(1);
    expect(b).toContain('b.json');
  });

  it('lists suites only the baseline has: a warning on stderr for JSON, a section in Markdown', async () => {
    const { a, b } = await reports();
    const doctored = JSON.parse(readFileSync(a, 'utf8'));
    doctored.suites.push({ ...doctored.suites[0], name: 'gone' });
    await writeFile(a, JSON.stringify(doctored));

    const json = await compare(a, b, { format: 'json' });
    const markdown = await compare(a, b, { format: 'markdown' });
    const text = await compare(a, b);

    expect(json.stderr).toContain('warning: only in the baseline, not run: gone');
    expect(JSON.parse(json.stdout).$schema).toContain('eval-comparison');
    expect(markdown.stdout).toContain('Only in the baseline, not run:');
    expect(text.stdout).toContain('warning: only in the baseline, not run: gone');
    expect(json.code).toBe(0);
  });

  it('refuses a report over 32 MiB without reading it', async () => {
    const { a } = await reports();
    const big = join(a, '..', 'big.json');
    await writeFile(big, '');
    await truncate(big, 33 * 1024 * 1024);

    const result = await compare(a, big);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain('over 32 MiB');
  });

  it('prints text and Markdown', async () => {
    const { a, b } = await reports();

    expect((await compare(a, b)).stdout).toContain('result: regression');
    expect((await compare(a, b, { format: 'markdown' })).stdout).toContain('| Suite | Model |');
  });

  it('refuses a directory as a report', async () => {
    const { a } = await reports();

    execFileSync('mkfifo', [join(a, '..', 'pipe.json')]);

    for (const other of [join(a, '..'), join(a, '..', 'pipe.json')]) {
      const result = await compare(a, other);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('not a regular file');
    }
  });

  it('puts every error on stderr, never in a document, and exits 1', async () => {
    const { a } = await reports();

    const missing = await compare(a, join(a, 'nope.json'));
    const badFormat = await compare(a, a, { format: 'junit' });
    const badTolerance = await compare(a, a, { tolerance: '2' });

    for (const result of [missing, badFormat, badTolerance]) {
      expect(result.code).toBe(1);
      expect(result.stdout).toBe('');
    }
    expect(missing.stderr).toContain(EVAL_CODES.REPORT_INVALID);
  });
});

describe('registerEvalCommands', () => {
  it('registers run and compare with the flags of the spec', () => {
    const program = new Command();

    registerEvalCommands(program.command('eval'));

    const evalCommand = program.commands.find((command) => command.name() === 'eval');
    const names = evalCommand?.commands.map((command) => command.name());
    expect(names).toEqual(['run', 'compare']);
    const flags = (name: string): string[] =>
      evalCommand?.commands
        .find((command) => command.name() === name)
        ?.options.map((option) => option.long ?? '') ?? [];
    expect(flags('run')).toEqual(
      expect.arrayContaining([
        '--format',
        '--out',
        '--report-dir',
        '--baseline',
        '--fail-on-regression',
        '--max-cost',
        '--max-cases',
        '--concurrency',
        '--cache',
        '--model',
        '--allow-host',
        '--allow-local',
        '--dry-run',
        '--strict',
        '--config',
        '--cwd',
      ])
    );
    expect(flags('compare')).toEqual(
      expect.arrayContaining(['--format', '--fail-on-regression', '--tolerance'])
    );
  });
});

describe('registered actions', () => {
  it('runs the command of the subcommand that was typed', async () => {
    const program = new Command();
    registerEvalCommands(program.command('eval'));
    out = [];
    err = [];
    process.exitCode = undefined;

    await program.parseAsync(['node', 'prs', 'eval', 'run', '--format', 'xml']);
    const run = process.exitCode;
    process.exitCode = undefined;
    await program.parseAsync(['node', 'prs', 'eval', 'compare', 'nope-a.json', 'nope-b.json']);
    const compare = process.exitCode;
    process.exitCode = undefined;

    expect(run).toBe(1);
    expect(compare).toBe(1);
    expect(err.join('\n')).toContain('Invalid output format: xml');
    expect(err.join('\n')).toContain(EVAL_CODES.REPORT_INVALID);
  });
});
