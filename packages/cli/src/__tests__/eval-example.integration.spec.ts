import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultFileSystem, defaultPrompts } from '../services.js';
import { parse as parseYaml } from 'yaml';
import type { PromptBundleOutput } from '@promptscript/core';
import { evaluateAssertions, type DeterministicAssertion } from '@promptscript/eval';
import { evalRunCommand, type EvalCommandServices } from '../commands/eval/run.js';

const FIXTURE = join(
  fileURLToPath(new URL('./__fixtures__/application-prompts/', import.meta.url)),
  'support-refund-reply'
);
const GUIDE = join(fileURLToPath(new URL('../../../../docs/guides/', import.meta.url)), 'evals.md');
const CACHE = join('.promptscript', 'eval-cache');
const REPORTS = join(FIXTURE, 'reports');
const BASELINE = join(REPORTS, 'baseline.json');
const REGRESSED = join(REPORTS, 'regressed.json');
const RECORD_COMMAND = 'pnpm eval:example:record';
const REFRESH_COMMAND =
  'UPDATE_EVAL_EXAMPLE=true pnpm exec vitest run --config packages/cli/vitest.config.mts eval-example';
const FIX_HINT = `If only prices or report bytes changed, refresh the reports offline with: ${REFRESH_COMMAND}. Only a changed prompt, rubric, dataset, model or params needs ${RECORD_COMMAND} with a key.`;
const UPDATE = process.env['UPDATE_EVAL_EXAMPLE'] === 'true';
const NO_CACHE = `${CACHE} is missing in the refund example. Record it with: ${RECORD_COMMAND}`;

interface ReportFile {
  suites: { models: { cases: { id: string; status?: string; cacheKeys: string[] }[] }[] }[];
}

interface EntryFile {
  response: { text: string };
}

const roots: string[] = [];

const noNetwork = vi.fn(() => {
  throw new Error('no network in the eval example check');
});

function services(): EvalCommandServices {
  return { fs: defaultFileSystem, prompts: defaultPrompts, cwd: process.cwd(), env: {} };
}

/** The first fenced block of a language in the guide. */
function guideBlock(language: string): string {
  const guide = readFileSync(GUIDE, 'utf8');
  const open = guide.indexOf(`\`\`\`${language}\n`) + language.length + 4;
  return guide.slice(open, guide.indexOf('\n```\n', open) + 1);
}

async function freshCopy(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-eval-example-'));
  roots.push(root);
  cpSync(FIXTURE, root, { recursive: true, filter: (source) => source !== REPORTS });
  return root;
}

/** Replay a copy with no network and return the JSON report as the CLI wrote it. */
async function replay(root: string): Promise<{ code: number; text: string }> {
  process.exitCode = undefined;
  await evalRunCommand(
    [],
    { cwd: root, cache: 'replay', format: 'json', out: 'report.json', strict: true },
    services()
  );
  const code = process.exitCode ?? 0;
  process.exitCode = undefined;
  return { code, text: readFileSync(join(root, 'report.json'), 'utf8') };
}

/** Turn the deny answer of late-return into an approve, so only decision-matches fails. */
function plantRegression(root: string, baseline: string): void {
  const report = JSON.parse(baseline) as ReportFile;
  const row = report.suites[0]?.models[0]?.cases.find((item) => item.id === 'late-return');
  const key = row?.cacheKeys[0];
  if (key === undefined) throw new Error('the baseline has no late-return case');
  const file = join(root, CACHE, key.slice(0, 2), `${key}.json`);
  const entry = JSON.parse(readFileSync(file, 'utf8')) as EntryFile;
  const text = entry.response.text.replace(/"decision"\s*:\s*"deny"/, '"decision":"approve"');
  expect(text, 'the late-return answer has no deny decision to flip').not.toBe(entry.response.text);
  entry.response.text = text;
  writeFileSync(file, `${JSON.stringify(entry, null, 2)}\n`);
}

function expectSame(path: string, actual: string): void {
  if (UPDATE) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, actual);
  }
  expect(existsSync(path), `${path} is missing. ${FIX_HINT}`).toBe(true);
  expect(actual, `${path} differs from what the replay writes. ${FIX_HINT}`).toBe(
    readFileSync(path, 'utf8')
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', noNetwork);
  noNetwork.mockClear();
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  process.exitCode = undefined;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('the evals guide', () => {
  const read = (path: string): string => readFileSync(join(FIXTURE, '.promptscript', path), 'utf8');

  it('shows the suite of the refund example byte for byte', () => {
    expect(guideBlock('yaml')).toBe(read(join('evals', 'refund-reply.eval.yaml')));
  });

  it('shows the dataset of the refund example byte for byte', () => {
    expect(guideBlock('jsonl')).toBe(read(join('evals', 'datasets', 'refund-reply.jsonl')));
  });

  it('shows the rubric as it is in the project file', () => {
    expect(read('project.prs')).toContain(guideBlock('promptscript'));
  });
});

describe('the no-guarantee assertion', () => {
  const suite = parseYaml(
    readFileSync(join(FIXTURE, '.promptscript', 'evals', 'refund-reply.eval.yaml'), 'utf8')
  ) as { assertions: DeterministicAssertion[] };
  const assertion = suite.assertions.find((item) => item.id === 'no-guarantee');

  function passes(reply: string): boolean | undefined {
    if (assertion === undefined) throw new Error('the suite has no no-guarantee assertion');
    const output: PromptBundleOutput = {
      type: 'object',
      properties: { reply: { type: 'string' } },
      required: ['reply'],
      additionalProperties: false,
    };
    return evaluateAssertions([assertion], JSON.stringify({ reply }), { output })[0]?.passed;
  }

  it('fails a reply that promises', () => {
    expect(passes('We guarantee a refund.')).toBe(false);
  });

  it('passes a reply that refuses to promise', () => {
    expect(passes("I can't guarantee the outcome.")).toBe(true);
  });
});

describe('the refund example cache and reports', () => {
  it('replays with no network and writes the baseline report', async (ctx) => {
    if (!existsSync(join(FIXTURE, CACHE))) ctx.skip(NO_CACHE);
    const root = await freshCopy();

    const result = await replay(root);

    expect(result.code, result.text).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.parse(result.text)).toMatchObject({
      outcome: 'passed',
      cache: { mode: 'replay', live: 0 },
    });
    expectSame(BASELINE, result.text);
  });

  it('fails the late-return case when its recorded answer is changed', async (ctx) => {
    if (!existsSync(join(FIXTURE, CACHE))) ctx.skip(NO_CACHE);
    const root = await freshCopy();
    plantRegression(root, readFileSync(BASELINE, 'utf8'));

    const result = await replay(root);

    expect(result.code, result.text).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
    const report = JSON.parse(result.text) as ReportFile;
    const failed = report.suites[0]?.models[0]?.cases.filter((item) => item.status === 'failed');
    expect(failed?.map((item) => item.id)).toEqual(['late-return']);
    expectSame(REGRESSED, result.text);
  });
});
