import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { Ajv } from 'ajv';
import { hashPromptBundle, type PromptBundleV1 } from '@promptscript/core';
import {
  EVAL_CODES,
  createMockProvider,
  type EvalProviderLookup,
  type MockAnswer,
} from '@promptscript/eval';
import { defaultFileSystem, defaultPrompts } from '../../services.js';
import { registerEvalCommands } from './register.js';
import { evalRunCommand, type EvalCommandServices } from './run.js';
import { compileBundles, loadEvalProject } from './project.js';

// Every test compiles a project or reads bundles, which is slow on a loaded machine.
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

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
releases:
  environments: [staging, prod]
`;

const CONFIG_WITHOUT_RELEASES = CONFIG.replace('releases:\n  environments: [staging, prod]\n', '');

const REFUND = `prompt: acme-support/refund-reply
dataset: datasets/rows.jsonl
assertions:
  - { id: decision, kind: equals, field: decision }
`;
const OTHER = REFUND.replace('refund-reply', 'triage');

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

const V2 = 'https://getpromptscript.dev/schema/prompt-release-label/v2.json';
const ID = 'acme-support/refund-reply';

const reportSchema = new Ajv({ strict: true, allowUnionTypes: true }).compile(
  JSON.parse(
    readFileSync(new URL('../../../../../schema/eval-report-v1.json', import.meta.url), 'utf8')
  ) as object
);

const roots: string[] = [];
let control: PromptBundleV1;
let warm: PromptBundleV1;

interface Run {
  stdout: string;
  stderr: string;
  code: number | string | undefined;
}

let out: string[];
let err: string[];

const noNetwork = vi.fn(() => {
  throw new Error('this spec has no network');
});

function services(patch: Partial<EvalCommandServices> = {}): EvalCommandServices {
  return {
    fs: defaultFileSystem,
    prompts: defaultPrompts,
    cwd: process.cwd(),
    env: {},
    ...patch,
  };
}

const lookupOf =
  (provider: ReturnType<typeof createMockProvider>): EvalProviderLookup =>
  () =>
    provider;

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

const record = (root: string, options = {}): Promise<Run> =>
  run(
    root,
    [],
    { cache: 'record', maxCost: '1', format: 'json', ...options },
    { createProvider: () => lookupOf(createMockProvider(ANSWERS)) }
  );

const noProvider: Partial<EvalCommandServices> = {
  createProvider: () => () => {
    throw new Error('this run must not create a provider');
  },
};

const text = (bundle: PromptBundleV1): string => `${JSON.stringify(bundle, null, 2)}\n`;

async function project(
  options: { config?: string; suites?: Record<string, string>; bundles?: boolean } = {}
): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-eval-label-'));
  roots.push(root);
  const evals = join(root, '.promptscript', 'evals');
  await mkdir(join(evals, 'datasets'), { recursive: true });
  await writeFile(join(root, 'promptscript.yaml'), options.config ?? CONFIG);
  await writeFile(join(root, '.promptscript', 'project.prs'), SOURCE);
  await writeFile(join(evals, 'datasets', 'rows.jsonl'), ROWS);
  const suites = options.suites ?? { refund: REFUND, other: OTHER };
  for (const [name, body] of Object.entries(suites)) {
    await writeFile(join(evals, `${name}.eval.yaml`), body);
  }
  if (options.bundles !== false) await release(root);
  return root;
}

async function release(root: string): Promise<void> {
  const directory = join(root, '.promptscript', 'releases');
  await mkdir(join(directory, 'bundles'), { recursive: true });
  for (const bundle of [control, warm]) {
    await writeFile(join(directory, 'bundles', `${bundle.contentHash}.json`), text(bundle));
  }
  const label = {
    $schema: V2,
    environment: 'prod',
    prompts: [
      {
        id: ID,
        contentHash: control.contentHash,
        experiment: {
          name: 'warm-tone',
          arms: [
            { variant: 'control', contentHash: control.contentHash, weight: 9000 },
            { variant: 'warm', contentHash: warm.contentHash, weight: 1000 },
          ],
        },
      },
    ],
  };
  await writeFile(join(directory, 'prod.json'), `${JSON.stringify(label, null, 2)}\n`);
}

const bundleFile = (root: string, bundle: PromptBundleV1): string =>
  join(root, '.promptscript', 'releases', 'bundles', `${bundle.contentHash}.json`);

const errorCodes = (result: Run): string[] =>
  (JSON.parse(result.stdout).errors as { code: string }[]).map((error) => error.code);

beforeAll(async () => {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-eval-label-source-'));
  roots.push(root);
  await writeFile(join(root, 'promptscript.yaml'), CONFIG);
  await mkdir(join(root, '.promptscript'), { recursive: true });
  await writeFile(join(root, '.promptscript', 'project.prs'), SOURCE);
  const [compiled] = await compileBundles(await loadEvalProject({ cwd: root }));
  if (compiled === undefined) throw new Error('the fixture project compiles no bundle');
  control = compiled;
  const [system, ...rest] = compiled.messages;
  const messages = [
    { ...system, content: 'You answer refund requests for Acme customers, warmly.' },
    ...rest,
  ] as PromptBundleV1['messages'];
  const unhashed = { ...compiled, messages };
  warm = { ...unhashed, contentHash: hashPromptBundle(unhashed) };
});

beforeEach(() => {
  vi.stubGlobal('fetch', noNetwork);
  noNetwork.mockClear();
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
  vi.unstubAllGlobals();
  process.exitCode = undefined;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('prs eval run --label', () => {
  it('runs the entry hash, records then replays, and skips a suite that is not in the label', async () => {
    const root = await project();

    const recorded = await record(root, { label: 'prod' });
    const replayed = await run(root, [], { label: 'prod', format: 'json' }, noProvider);

    expect(recorded.code).toBe(0);
    expect(replayed.code).toBe(0);
    const document = JSON.parse(replayed.stdout);
    expect(reportSchema(document), JSON.stringify(reportSchema.errors)).toBe(true);
    expect(document.suites).toHaveLength(1);
    expect(document.suites[0]).toMatchObject({
      name: 'refund',
      prompt: { contentHash: control.contentHash },
    });
    expect(document.cache).toMatchObject({ mode: 'replay', live: 0, replayed: 2 });
    expect(replayed.stderr).toContain(
      `label prod: suite refund runs ${ID} at ${control.contentHash.slice(0, 19)}`
    );
    expect(replayed.stderr).toContain(
      'warning PS6311: suite other: prompt acme-support/triage is not in label prod'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('runs the arm hash with --variant', async () => {
    const root = await project();
    await record(root, { label: 'prod', variant: 'warm' });

    const replayed = await run(
      root,
      [],
      { label: 'prod', variant: 'warm', format: 'json' },
      noProvider
    );

    expect(replayed.code).toBe(0);
    expect(JSON.parse(replayed.stdout).suites[0].prompt.contentHash).toBe(warm.contentHash);
    expect(replayed.stderr).toMatch(/at sha256-[0-9a-f]{12}, variant warm/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps cache entries of each arm apart', async () => {
    const root = await project();
    await record(root, { label: 'prod' });

    const replayed = await run(
      root,
      [],
      { label: 'prod', variant: 'warm', format: 'json' },
      noProvider
    );

    expect(replayed.code).toBe(1);
    const document = JSON.parse(replayed.stdout);
    expect(document.cache.live).toBe(0);
    expect(JSON.stringify(document)).toContain(EVAL_CODES.CACHE_MISS);
  });

  it('does not compile the source', async () => {
    const root = await project();
    await record(root, { label: 'prod' });
    await writeFile(join(root, '.promptscript', 'project.prs'), '@@@ not a prompt file');

    const replayed = await run(root, [], { label: 'prod', format: 'json' }, noProvider);

    expect(replayed.code).toBe(0);
  });

  it('refuses a bundle that does not verify, before any provider', async () => {
    const root = await project();
    const file = bundleFile(root, control);
    await writeFile(file, readFileSync(file, 'utf8').replace('Acme customers', 'Acme customerz'));

    const result = await run(root, [], { label: 'prod', format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).outcome).toBe('error');
    expect(errorCodes(result)[0]).toBe('PS5004');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports a missing bundle as PS5003', async () => {
    const root = await project();
    await rm(bundleFile(root, warm));

    const result = await run(
      root,
      [],
      { label: 'prod', variant: 'warm', format: 'json' },
      noProvider
    );

    expect(result.code).toBe(1);
    expect(errorCodes(result)).toEqual(['PS5003']);
  });

  it('reports an unknown environment and an environment with no label yet', async () => {
    const root = await project();

    const unknown = await run(root, [], { label: 'qa', format: 'json' }, noProvider);
    const empty = await run(root, [], { label: 'staging', format: 'json' }, noProvider);

    expect(errorCodes(unknown)).toEqual(['PS5002']);
    expect(errorCodes(empty)).toEqual(['PS5003']);
    expect(JSON.parse(empty.stdout).errors[0].message).toContain(
      '.promptscript/releases/staging.json'
    );
  });

  it('needs the releases config', async () => {
    const root = await project({ config: CONFIG_WITHOUT_RELEASES });

    const result = await run(root, [], { label: 'prod', format: 'json' }, noProvider);

    expect(errorCodes(result)).toEqual(['PS5001']);
  });

  it('makes a named suite that the label cannot serve an error', async () => {
    const root = await project();

    const result = await run(root, ['other'], { label: 'prod', format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(errorCodes(result)).toEqual([EVAL_CODES.LABEL_PROMPT_MISSING]);
    expect(JSON.parse(result.stdout).suites).toEqual([]);
  });

  it('counts a skipped suite as a warning under --strict', async () => {
    const root = await project();
    await record(root, { label: 'prod' });

    const strict = await run(root, [], { label: 'prod', strict: true, format: 'json' }, noProvider);

    expect(strict.code).toBe(2);
  });

  it('fails when no suite can run', async () => {
    const root = await project();

    const result = await run(
      root,
      [],
      { label: 'prod', variant: 'cold', format: 'json' },
      noProvider
    );

    expect(result.code).toBe(1);
    expect(errorCodes(result)).toEqual([EVAL_CODES.LABEL_PROMPT_MISSING]);
    expect(JSON.parse(result.stdout).errors[0].message).toContain('variant cold');
  });

  it('fails when every suite is skipped and no variant was given', async () => {
    const root = await project({ suites: { other: OTHER } });

    const result = await run(root, [], { label: 'prod', format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(errorCodes(result)).toEqual([EVAL_CODES.LABEL_PROMPT_MISSING]);
    expect(JSON.parse(result.stdout).errors[0].message).not.toContain('with variant');
  });

  it('reports a suite file that does not parse as itself', async () => {
    const root = await project({ suites: { refund: REFUND, broken: 'prompt: [' } });

    const result = await run(root, [], { label: 'prod', format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(errorCodes(result)).toContain('PS6200');
  });

  it('reports a suite that does not parse together with a label error', async () => {
    const root = await project({ suites: { refund: REFUND, broken: 'prompt: [' } });

    const result = await run(root, [], { label: 'staging', format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(errorCodes(result)).toEqual(expect.arrayContaining(['PS6200', 'PS5003']));
  });

  it('behaves like a plain run when the project has no suites', async () => {
    const root = await project({ suites: {} });

    const result = await run(root, [], { label: 'prod', format: 'json' }, noProvider);

    expect(result.code).toBe(1);
    expect(errorCodes(result)).toEqual([EVAL_CODES.RUN_OPTION_INVALID]);
  });

  it('prints the runs lines only when the run goes on', async () => {
    const root = await project();

    const stopped = await run(
      root,
      [],
      { label: 'prod', variant: 'cold', format: 'json' },
      noProvider
    );

    expect(stopped.stderr).not.toContain('runs');
  });

  it('checks the flags before it reads any file', async () => {
    const root = await project({ config: CONFIG_WITHOUT_RELEASES });

    const noLabel = await run(root, [], { variant: 'warm', format: 'json' }, noProvider);
    const badLabel = await run(root, [], { label: '../prod', format: 'json' }, noProvider);

    expect(errorCodes(noLabel)).toEqual([EVAL_CODES.RUN_OPTION_INVALID]);
    expect(errorCodes(badLabel)).toEqual([EVAL_CODES.RUN_OPTION_INVALID]);
  });

  it('prints a plan with --dry-run and creates no provider', async () => {
    const root = await project();

    const result = await run(root, [], { label: 'prod', dryRun: true }, noProvider);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('refund');
  });

  it('names report files after the hash of the arm', async () => {
    const root = await project();
    await record(root, { label: 'prod', variant: 'warm' });

    const result = await run(
      root,
      [],
      { label: 'prod', variant: 'warm', reportDir: 'reports', format: 'json' },
      noProvider
    );

    expect(result.code).toBe(0);
    const files = readdirSync(join(root, 'reports'));
    expect(files).toEqual([`refund.${warm.contentHash.slice(7, 19)}.json`]);
    expect(
      existsSync(join(root, 'reports', `refund.${control.contentHash.slice(7, 19)}.json`))
    ).toBe(false);
  });

  it('reads the bundle once for two suites of one prompt', async () => {
    const root = await project({ suites: { refund: REFUND, 'refund-copy': REFUND } });
    await record(root, { label: 'prod' });

    const result = await run(root, [], { label: 'prod', format: 'json' }, noProvider);

    expect(result.code).toBe(0);
    const suites = JSON.parse(result.stdout).suites as {
      prompt: { contentHash: string };
    }[];
    expect(suites).toHaveLength(2);
    expect(new Set(suites.map((suite) => suite.prompt.contentHash)).size).toBe(1);
  });
});

describe('registration', () => {
  it('has --label and --variant on run', () => {
    const program = new Command();

    registerEvalCommands(program.command('eval'));

    const flags =
      program.commands
        .find((command) => command.name() === 'eval')
        ?.commands.find((command) => command.name() === 'run')
        ?.options.map((option) => option.long) ?? [];
    expect(flags).toEqual(expect.arrayContaining(['--label', '--variant']));
  });
});
