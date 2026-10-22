import { describe, expect, it } from 'vitest';
import { compileSchema } from './prompt-bundle-validators.js';

type Doc = Record<string, unknown>;

const HEX = '0123456789abcdef'.repeat(4);
const HASH = `sha256-${HEX}`;

describe('eval dataset row schema', () => {
  const validate = compileSchema('eval-dataset-row-v1.json');
  const row = (): Doc => ({
    id: 'late-delivery',
    inputs: { message: 'Where is my order?', days: 3, vip: false },
    expected: { decision: 'refund', reasons: ['late'] },
    tags: ['refund'],
  });

  it('accepts the example row', () => {
    expect(validate(row()), JSON.stringify(validate.errors)).toBe(true);
  });

  it('accepts a row with only inputs and a string expected value', () => {
    expect(validate({ inputs: { message: 'Hi' }, expected: 'Hello' })).toBe(true);
  });

  it.each([
    ['an extra property', { ...row(), extra: 1 }],
    ['no inputs', { id: 'a' }],
    ['an id that starts with a dash', { ...row(), id: '-late' }],
    ['an id of 65 characters', { ...row(), id: 'a'.repeat(65) }],
    ['a null input', { ...row(), inputs: { message: null } }],
    ['an object input', { ...row(), inputs: { message: { text: 'Hi' } } }],
    ['a numeric expected value', { ...row(), expected: 1 }],
    ['a non-string tag', { ...row(), tags: [1] }],
  ])('rejects %s', (_name, value) => {
    expect(validate(value)).toBe(false);
  });
});

describe('eval suite schema', () => {
  const validate = compileSchema('eval-suite-v1.json');
  const assertions = (): Doc[] => [
    { id: 'decision-matches', kind: 'equals', field: 'decision' },
    {
      id: 'no-promises',
      kind: 'regex',
      field: 'reply',
      pattern: String.raw`\bguarantee(d)?\b`,
      flags: 'i',
      negate: true,
    },
    { id: 'greets', kind: 'contains', values: ['Hello', 'Hi'], mode: 'any', ignoreCase: true },
    { id: 'output-valid', kind: 'json-schema' },
    { id: 'reply-tone', kind: 'llm-judge', rubric: 'acme-support/judge-polite-reply', runs: 5 },
  ];
  const suite = (): Doc => ({
    $schema: 'https://getpromptscript.dev/schema/eval-suite/v1.json',
    prompt: 'acme-support/refund-reply',
    dataset: {
      path: 'datasets/refund-reply.jsonl',
      allow: [{ rule: 'PS005', reason: 'Red-team samples; the prompt must refuse them.' }],
      allowPii: { reason: 'Synthetic customer names.' },
    },
    labels: 'labels/refund-reply.jsonl',
    models: ['claude-sonnet-5-5', { ref: 'gpt-5.1', params: { maxTokens: 600 } }],
    judge: { model: 'claude-haiku-5-5', runs: 3 },
    assertions: assertions(),
    thresholds: { passRate: 0.95, maxCostUsd: 0.5, latencyMs: { p95: 8000 } },
  });
  const withAssertion = (assertion: Doc): Doc => ({ ...suite(), assertions: [assertion] });

  it('accepts the example suite', () => {
    expect(validate(suite()), JSON.stringify(validate.errors)).toBe(true);
  });

  it('accepts a minimal suite with a dataset path', () => {
    const minimal = {
      prompt: 'acme-support/refund-reply',
      dataset: 'datasets/refund-reply.jsonl',
      assertions: [{ id: 'exact', kind: 'equals' }],
    };

    expect(validate(minimal), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ['an extra property', { ...suite(), name: 'refund' }],
    ['another $schema', { ...suite(), $schema: 'https://example.com/suite.json' }],
    ['no prompt', { ...suite(), prompt: undefined }],
    ['no assertions', { ...suite(), assertions: [] }],
    [
      '21 assertions',
      { ...suite(), assertions: Array.from({ length: 21 }, () => assertions()[0]) },
    ],
    ['9 models', { ...suite(), models: Array.from({ length: 9 }, (_, i) => `model-${i}`) }],
    ['a dataset number', { ...suite(), dataset: 1 }],
    [
      'an allow entry without a reason',
      { ...suite(), dataset: { path: 'd.jsonl', allow: [{ rule: 'PS005' }] } },
    ],
    ['allowPii as a boolean', { ...suite(), dataset: { path: 'd.jsonl', allowPii: true } }],
    ['a judge with 2 runs', { ...suite(), judge: { runs: 2 } }],
    ['a pass rate above 1', { ...suite(), thresholds: { passRate: 1.5 } }],
    ['a negative cost limit', { ...suite(), thresholds: { maxCostUsd: -1 } }],
    ['an unknown assertion kind', withAssertion({ id: 'x', kind: 'length', max: 10 })],
    ['an assertion without an id', withAssertion({ kind: 'equals' })],
    ['an assertion id with a space', withAssertion({ id: 'no good', kind: 'equals' })],
    ['negate on json-schema', withAssertion({ id: 'x', kind: 'json-schema', negate: true })],
    [
      'negate on llm-judge',
      withAssertion({ id: 'x', kind: 'llm-judge', rubric: 'r', negate: true }),
    ],
    ['a regex without a pattern', withAssertion({ id: 'x', kind: 'regex' })],
    ['a regex with a g flag', withAssertion({ id: 'x', kind: 'regex', pattern: 'a', flags: 'g' })],
    ['contains without values', withAssertion({ id: 'x', kind: 'contains' })],
    [
      'contains with a bad mode',
      withAssertion({ id: 'x', kind: 'contains', values: ['a'], mode: 'some' }),
    ],
    ['an llm-judge without a rubric', withAssertion({ id: 'x', kind: 'llm-judge' })],
  ])('rejects %s', (_name, value) => {
    expect(validate(value)).toBe(false);
  });
});

describe('eval label row schema', () => {
  const validate = compileSchema('eval-label-row-v1.json');
  const label = (): Doc => ({
    id: 'late-delivery',
    assertion: 'reply-tone',
    verdict: 'pass',
    note: 'Polite and clear.',
  });

  it('accepts the example label', () => {
    expect(validate(label()), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ['an extra property', { ...label(), score: 1 }],
    ['no assertion', { ...label(), assertion: undefined }],
    ['an unknown verdict', { ...label(), verdict: 'maybe' }],
    ['an id with a slash', { ...label(), id: 'a/b' }],
  ])('rejects %s', (_name, value) => {
    expect(validate(value)).toBe(false);
  });
});

describe('eval cache entry schema', () => {
  const validate = compileSchema('eval-cache-entry-v1.json');
  const entry = (): Doc => ({
    $schema: 'https://getpromptscript.dev/schema/eval-cache-entry/v1.json',
    key: HEX,
    request: {
      contentHash: HASH,
      inputsHash: HASH,
      modelRef: 'claude-sonnet-5-5',
      provider: 'anthropic',
      apiId: 'claude-sonnet-5-5',
      params: { maxTokens: 600 },
      sample: 0,
    },
    response: {
      text: 'Dear customer, your refund is on its way.',
      usage: { inputTokens: 412, outputTokens: 93 },
      latencyMs: 1480,
      status: 200,
      stopReason: 'end_turn',
    },
  });
  const request = (patch: Doc): Doc => ({
    ...entry(),
    request: { ...(entry()['request'] as Doc), ...patch },
  });
  const response = (patch: Doc): Doc => ({
    ...entry(),
    response: { ...(entry()['response'] as Doc), ...patch },
  });

  it('accepts the example entry', () => {
    expect(validate(entry()), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ['an extra property', { ...entry(), recordedAt: '2026-10-22' }],
    ['another $schema', { ...entry(), $schema: 'https://example.com/entry.json' }],
    ['an uppercase key', { ...entry(), key: HEX.toUpperCase() }],
    ['a short key', { ...entry(), key: 'abc' }],
    ['no response', { ...entry(), response: undefined }],
    ['a content hash without the prefix', request({ contentHash: HEX })],
    ['no inputs hash', request({ inputsHash: undefined })],
    ['a negative sample', request({ sample: -1 })],
    ['a fractional sample', request({ sample: 0.5 })],
    ['a request header field', request({ headers: {} })],
    ['a status of 600', response({ status: 600 })],
    ['a negative token count', response({ usage: { inputTokens: -1, outputTokens: 0 } })],
    ['a response url field', response({ url: 'https://api.example' })],
  ])('rejects %s', (_name, value) => {
    expect(validate(value)).toBe(false);
  });
});

describe('eval report schema', () => {
  const validate = compileSchema('eval-report-v1.json');
  const usage = (): Doc => ({ calls: 1, inputTokens: 412, outputTokens: 93 });
  const caseResult = (): Doc => ({
    id: 'late-delivery',
    tags: ['refund'],
    status: 'passed',
    assertions: [
      { id: 'decision-matches', kind: 'equals', passed: true },
      {
        id: 'reply-tone',
        kind: 'llm-judge',
        passed: true,
        judge: { verdicts: ['pass', 'pass', 'fail'], runs: 3, costUsd: 0.0012 },
      },
    ],
    usage: usage(),
    costUsd: 0.0017,
    latencyMs: 1480,
    cache: { replayed: 4, live: 0 },
    cacheKeys: [HEX],
  });
  const model = (): Doc => ({
    ref: 'claude-sonnet-5-5',
    provider: 'anthropic',
    apiId: 'claude-sonnet-5-5',
    passRate: 1,
    usage: usage(),
    costUsd: 0.0017,
    latencyMs: { p50: 1480, p95: 1480 },
    judgeAgreement: [{ assertion: 'reply-tone', labelled: 1, agreed: 1 }],
    cases: [caseResult()],
  });
  const suiteResult = (): Doc => ({
    name: 'refund-reply',
    suiteHash: HASH,
    prompt: { id: 'acme-support/refund-reply', contentHash: HASH },
    dataset: { path: '.promptscript/evals/datasets/refund-reply.jsonl', rows: 1, hash: HASH },
    judges: [{ rubric: 'acme-support/judge-polite-reply', contentHash: HASH }],
    passed: true,
    thresholds: [
      { name: 'passRate', model: 'claude-sonnet-5-5', limit: 0.95, actual: 1, passed: true },
    ],
    findings: [
      {
        code: 'PS6110',
        rule: 'PS005',
        severity: 'warning',
        rowId: 'late-delivery',
        path: 'inputs.message',
        line: 1,
        allowedBecause: 'Red-team samples; the prompt must refuse them.',
      },
    ],
    models: [model()],
  });
  const report = (): Doc => ({
    $schema: 'https://getpromptscript.dev/schema/eval-report/v1.json',
    outcome: 'passed',
    passed: true,
    cache: { mode: 'replay', replayed: 4, live: 0, digest: HASH },
    usage: usage(),
    costUsd: 0.0017,
    budget: { maxUsd: 1, spentUsd: 0 },
    suites: [suiteResult()],
    comparison: {
      tolerance: 0,
      regression: false,
      entries: [
        {
          suite: 'refund-reply',
          model: 'claude-sonnet-5-5',
          passRateDelta: 0,
          costUsdDelta: 0,
          latencyP95MsDelta: 0,
          regressions: [],
          fixes: [],
          onlyInBaseline: [],
          onlyInCandidate: [],
          datasetChanged: false,
        },
      ],
    },
    errors: [{ code: 'PS6202', message: 'Dataset path escapes the project.', file: 'x', line: 1 }],
  });
  const withSuite = (patch: Doc): Doc => ({
    ...report(),
    suites: [{ ...suiteResult(), ...patch }],
  });
  const withCase = (patch: Doc): Doc =>
    withSuite({ models: [{ ...model(), cases: [{ ...caseResult(), ...patch }] }] });

  it('accepts the example report', () => {
    expect(validate(report()), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each(['replay', 'record', 'refresh', 'off'])('accepts the %s cache mode', (mode) => {
    const value = { ...report(), cache: { mode, replayed: 0, live: 0, digest: HASH } };

    expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ['an extra property', { ...report(), startedAt: '2026-10-22T10:00:00Z' }],
    ['another $schema', { ...report(), $schema: 'https://example.com/report.json' }],
    ['an unknown outcome', { ...report(), outcome: 'ok' }],
    [
      'an unknown cache mode',
      { ...report(), cache: { mode: 'cached', replayed: 0, live: 0, digest: HASH } },
    ],
    ['a cache without a digest', { ...report(), cache: { mode: 'replay', replayed: 0, live: 0 } }],
    ['no errors list', { ...report(), errors: undefined }],
    ['a negative cost', { ...report(), costUsd: -1 }],
    ['a suite without a hash', withSuite({ suiteHash: undefined })],
    ['a short suite hash', withSuite({ suiteHash: 'sha256-abc' })],
    ['a judge without a content hash', withSuite({ judges: [{ rubric: 'r' }] })],
    [
      'an unknown threshold name',
      withSuite({ thresholds: [{ name: 'p99', limit: 1, actual: 1, passed: true }] }),
    ],
    [
      'a finding with a message',
      withSuite({ findings: [{ code: 'PS6110', severity: 'error', message: 'x' }] }),
    ],
    ['a pass rate above 1', withSuite({ models: [{ ...model(), passRate: 2 }] })],
    ['an unknown case status', withCase({ status: 'skipped' })],
    ['a case without cache keys', withCase({ cacheKeys: undefined })],
    [
      'a reason over 160 characters',
      withCase({
        assertions: [{ id: 'x', kind: 'equals', passed: false, reason: 'x'.repeat(161) }],
      }),
    ],
    [
      'a judge verdict outside pass and fail',
      withCase({
        assertions: [
          { id: 'x', kind: 'llm-judge', passed: false, judge: { verdicts: ['unsure'], runs: 1 } },
        ],
      }),
    ],
    ['a response text on a case', withCase({ response: 'Dear customer' })],
  ])('rejects %s', (_name, value) => {
    expect(validate(value)).toBe(false);
  });
});
