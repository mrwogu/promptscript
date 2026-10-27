import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import { describe, expect, it } from 'vitest';
import { formatPath, validateSuite } from './validate.js';

type Doc = Record<string, unknown>;

const schema = JSON.parse(
  readFileSync(new URL('../../../../schema/eval-suite-v1.json', import.meta.url), 'utf8')
) as object;
const schemaAccepts = new Ajv({ strict: true, allowUnionTypes: true }).compile(schema);

const assertions = (): Doc[] => [
  { id: 'decision-matches', kind: 'equals', field: 'decision', ignoreCase: true, trim: false },
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
  { id: 'inline', kind: 'json-schema', schema: { type: 'object' } },
  {
    id: 'reply-tone',
    kind: 'llm-judge',
    rubric: 'acme-support/judge',
    criteria: 'Polite.',
    model: 'm',
    runs: 5,
  },
];
const suite = (): Doc => ({
  $schema: 'https://getpromptscript.dev/schema/eval-suite/v1.json',
  prompt: 'acme-support/refund-reply',
  dataset: {
    path: 'datasets/refund-reply.jsonl',
    allow: [{ rule: 'PS005', reason: 'Red-team samples.' }],
    allowPii: { reason: 'Synthetic customers.' },
  },
  labels: 'labels/refund-reply.jsonl',
  models: [
    'claude-sonnet-5-5',
    { ref: 'gpt-5.1', params: { maxTokens: 600, temperature: 0, stop: ['END'], seed: 7 } },
  ],
  judge: { model: 'claude-haiku-5-5', runs: 3 },
  assertions: assertions(),
  thresholds: {
    passRate: 0.95,
    maxCostUsd: 0.5,
    maxCostPerCaseUsd: 0.01,
    latencyMs: { p50: 2000, p95: 8000 },
  },
});
const minimal = (): Doc => ({
  prompt: 'p',
  dataset: 'd.jsonl',
  assertions: [{ id: 'x', kind: 'equals' }],
});
const withAssertion = (assertion: Doc): Doc => ({ ...minimal(), assertions: [assertion] });

describe('validateSuite', () => {
  it.each([
    ['the full example', suite()],
    ['a minimal suite', minimal()],
  ])('accepts %s, as the schema does', (_name, value) => {
    expect(validateSuite(value)).toEqual([]);
    expect(schemaAccepts(value)).toBe(true);
  });

  it.each([
    ['a list', []],
    ['an extra property', { ...suite(), name: 'refund' }],
    ['another $schema', { ...suite(), $schema: 'https://example.com/suite.json' }],
    ['no prompt', { ...minimal(), prompt: undefined }],
    ['no dataset', { ...minimal(), dataset: undefined }],
    ['a dataset number', { ...minimal(), dataset: 1 }],
    ['a dataset without a path', { ...minimal(), dataset: { allow: [] } }],
    [
      'an allow entry without a reason',
      { ...minimal(), dataset: { path: 'd.jsonl', allow: [{ rule: 'PS005' }] } },
    ],
    ['allowPii as a boolean', { ...minimal(), dataset: { path: 'd.jsonl', allowPii: true } }],
    [
      'an empty allow reason',
      { ...minimal(), dataset: { path: 'd.jsonl', allow: [{ rule: 'PS005', reason: '' }] } },
    ],
    [
      'an allowPii reason over 500 characters',
      { ...minimal(), dataset: { path: 'd.jsonl', allowPii: { reason: 'x'.repeat(501) } } },
    ],
    ['labels as a list', { ...minimal(), labels: ['a'] }],
    ['no assertions', { ...minimal(), assertions: [] }],
    [
      '21 assertions',
      {
        ...minimal(),
        assertions: Array.from({ length: 21 }, (_, i) => ({ id: `a${i}`, kind: 'equals' })),
      },
    ],
    ['9 models', { ...minimal(), models: Array.from({ length: 9 }, (_, i) => `model-${i}`) }],
    ['no models in the list', { ...minimal(), models: [] }],
    ['a model entry without a ref', { ...minimal(), models: [{ params: {} }] }],
    ['an unknown model param', { ...minimal(), models: [{ ref: 'm', params: { top_p: 1 } }] }],
    [
      'a fractional maxTokens',
      { ...minimal(), models: [{ ref: 'm', params: { maxTokens: 1.5 } }] },
    ],
    ['a negative seed', { ...minimal(), models: [{ ref: 'm', params: { seed: -1 } }] }],
    ['a judge with 2 runs', { ...minimal(), judge: { runs: 2 } }],
    ['a pass rate above 1', { ...minimal(), thresholds: { passRate: 1.5 } }],
    ['a negative cost limit', { ...minimal(), thresholds: { maxCostUsd: -1 } }],
    ['a zero p95', { ...minimal(), thresholds: { latencyMs: { p95: 0 } } }],
    ['an unknown assertion kind', withAssertion({ id: 'x', kind: 'length', max: 10 })],
    ['an assertion without a kind', withAssertion({ id: 'x' })],
    ['an assertion without an id', withAssertion({ kind: 'equals' })],
    ['an assertion id with a space', withAssertion({ id: 'no good', kind: 'equals' })],
    ['an assertion that is a string', withAssertion('equals' as unknown as Doc)],
    ['negate on json-schema', withAssertion({ id: 'x', kind: 'json-schema', negate: true })],
    [
      'negate on llm-judge',
      withAssertion({ id: 'x', kind: 'llm-judge', rubric: 'r', negate: true }),
    ],
    ['a schema that is a list', withAssertion({ id: 'x', kind: 'json-schema', schema: [] })],
    ['a regex without a pattern', withAssertion({ id: 'x', kind: 'regex' })],
    ['a regex with a g flag', withAssertion({ id: 'x', kind: 'regex', pattern: 'a', flags: 'g' })],
    [
      'a regex with a repeated flag',
      withAssertion({ id: 'x', kind: 'regex', pattern: 'a', flags: 'ii' }),
    ],
    ['contains without values', withAssertion({ id: 'x', kind: 'contains' })],
    [
      'contains with 21 values',
      withAssertion({ id: 'x', kind: 'contains', values: Array.from({ length: 21 }, () => 'a') }),
    ],
    [
      'contains with a bad mode',
      withAssertion({ id: 'x', kind: 'contains', values: ['a'], mode: 'some' }),
    ],
    ['equals with a numeric value', withAssertion({ id: 'x', kind: 'equals', value: 1 })],
    ['an llm-judge without a rubric', withAssertion({ id: 'x', kind: 'llm-judge' })],
  ])('refuses %s, as the schema does', (_name, value) => {
    expect(validateSuite(value).length).toBeGreaterThan(0);
    expect(schemaAccepts(value)).toBe(false);
  });

  it.each([
    [
      'a repeated assertion id',
      {
        ...minimal(),
        assertions: [
          { id: 'x', kind: 'equals' },
          { id: 'x', kind: 'contains', values: ['a'] },
        ],
      },
      'assertions[1].id repeats an earlier assertion id',
    ],
    [
      'a regex that does not compile',
      withAssertion({ id: 'x', kind: 'regex', pattern: '(' }),
      'assertions[0].pattern is not a valid regular expression',
    ],
    [
      'an allow rule the scan never runs',
      { ...minimal(), dataset: { path: 'd.jsonl', allow: [{ rule: 'PS001', reason: 'r' }] } },
      'dataset.allow[0].rule must be one of PS005, PS010, PS011, PS012, PS014',
    ],
    [
      'a blank allowPii reason',
      { ...minimal(), dataset: { path: 'd.jsonl', allowPii: { reason: '   ' } } },
      'dataset.allowPii.reason must be a reason of 1 to 500 characters with at least one letter or digit',
    ],
    [
      'an allow reason of zero-width spaces',
      {
        ...minimal(),
        dataset: { path: 'd.jsonl', allow: [{ rule: 'PS005', reason: '\u200B\u200B' }] },
      },
      'dataset.allow[0].reason must be a reason of 1 to 500 characters with at least one letter or digit',
    ],
  ])('is stricter than the schema for %s', (_name, value, message) => {
    expect(schemaAccepts(value)).toBe(true);
    expect(validateSuite(value).map((issue) => issue.message)).toEqual([message]);
  });

  it('points every issue at its path', () => {
    const issues = validateSuite({ ...minimal(), extra: 1, thresholds: { passRate: 'high' } });

    expect(issues).toEqual([
      { path: ['extra'], message: 'extra is not a known key' },
      {
        path: ['thresholds', 'passRate'],
        message: 'thresholds.passRate must be a number from 0 to 1',
      },
    ]);
  });

  it('names missing keys and the root', () => {
    expect(validateSuite('text')).toEqual([{ path: [], message: 'the suite must be a mapping' }]);
    expect(
      validateSuite({ dataset: 'd.jsonl', assertions: [{ id: 'x', kind: 'equals' }] })
    ).toEqual([{ path: [], message: 'prompt is required' }]);
  });

  it('formats document paths', () => {
    expect(formatPath(['assertions', 2, 'pattern'])).toBe('assertions[2].pattern');
    expect(formatPath([])).toBe('');
  });
});
