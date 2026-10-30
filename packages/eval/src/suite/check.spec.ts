import {
  createModelCatalog,
  type EvalAssertion,
  type EvalSuiteV1,
  type ModelProfileInput,
  type PromptBundleV1,
} from '@promptscript/core';
import { describe, expect, it } from 'vitest';
import { checkSuites, type CheckContext } from './check.js';
import type { LoadedSuite } from './load.js';

const profile = (patch: ModelProfileInput): ModelProfileInput => ({
  provider: 'anthropic',
  family: 'test-family',
  version: '1',
  ...patch,
});
const PRICE = { inputUsdPerMillion: 1, outputUsdPerMillion: 2, checkedOn: '2026-10-01' };
const catalog = createModelCatalog(
  {
    profiles: {
      'test-current': profile({ apiId: 'test-current', pricing: PRICE }),
      'test-unpriced': profile({ apiId: 'test-unpriced', version: '2' }),
      'test-retired': profile({
        apiId: 'test-retired',
        version: '0.1',
        status: 'retired',
        successor: 'test-current',
      }),
      'test-deprecated': profile({
        apiId: 'test-deprecated',
        version: '0.2',
        status: 'deprecated',
      }),
    },
  },
  []
);

const bundle = (id: string, patch: Partial<PromptBundleV1> = {}): PromptBundleV1 => ({
  $schema: 'https://getpromptscript.dev/schema/prompt-bundle/v1.json',
  id,
  description: 'Test prompt',
  contentHash: `sha256-${'0'.repeat(64)}`,
  messages: [{ role: 'user', content: 'Hi {{input.message}}' }],
  inputs: { message: { type: 'string', description: 'Message', required: true } },
  output: {
    type: 'object',
    properties: { decision: { type: 'string' }, reply: { type: 'string' } },
    required: ['decision', 'reply'],
    additionalProperties: false,
  },
  model: {
    ref: 'test-current',
    profile: 'test-current',
    provider: 'anthropic',
    apiId: 'test-current',
    params: {},
  },
  governance: {},
  provenance: { entry: '.promptscript/project.prs', segments: [] },
  ...patch,
});

const bundles = [
  bundle('acme-support/refund-reply'),
  bundle('acme-support/refund-replies'),
  bundle('acme-support/plain', { output: undefined }),
  bundle('acme-support/no-model', { model: undefined }),
  bundle('acme-support/custom-model', {
    model: { ref: 'corp-llm', provider: 'corp', apiId: 'corp-llm', params: {} },
  }),
];
const context: CheckContext = { bundles, catalog };

const loaded = (patch: Partial<EvalSuiteV1> = {}): LoadedSuite => ({
  name: 'refund',
  file: '.promptscript/evals/refund.eval.yaml',
  suite: {
    prompt: 'acme-support/refund-reply',
    dataset: 'datasets/rows.jsonl',
    assertions: [{ id: 'same', kind: 'equals', field: 'decision' }],
    ...patch,
  },
  datasetFile: '/project/.promptscript/evals/datasets/rows.jsonl',
  hash: `sha256-${'1'.repeat(64)}`,
});
const withAssertions = (...assertions: EvalAssertion[]): LoadedSuite => loaded({ assertions });
const messages = (suite: LoadedSuite): string[] =>
  checkSuites([suite], context).map((f) => `${f.code} ${f.severity}: ${f.message}`);

describe('checkSuites', () => {
  it('accepts a suite that fits the prompt and the catalog', () => {
    const suite = loaded({ models: ['test-current'], thresholds: { maxCostUsd: 1 } });

    expect(checkSuites([suite], context)).toEqual([]);
  });

  it('names the five nearest prompt ids for an unknown prompt', () => {
    const findings = checkSuites([loaded({ prompt: 'acme-support/refund-rely' })], context);

    expect(findings).toEqual([
      {
        code: 'PS6203',
        severity: 'error',
        message:
          'Suite .promptscript/evals/refund.eval.yaml: prompt "acme-support/refund-rely" is not compiled by this project; nearest ids: acme-support/refund-reply, acme-support/refund-replies, acme-support/no-model, acme-support/custom-model, acme-support/plain.',
        file: '.promptscript/evals/refund.eval.yaml',
      },
    ]);
  });

  it('compares only the first 200 characters of a huge unknown prompt id', () => {
    const started = Date.now();

    const findings = checkSuites(
      [loaded({ prompt: `acme-support/${'x'.repeat(1_000_000)}` })],
      context
    );

    expect(findings[0]?.code).toBe('PS6203');
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('says so when the project compiles no prompts', () => {
    const findings = checkSuites([loaded()], { bundles: [], catalog });

    expect(findings[0]?.message).toContain('the project compiles no prompts');
  });

  it.each([
    [
      'a field on a prompt without an output contract',
      loaded({ prompt: 'acme-support/plain' }),
      'PS6204 error: Suite .promptscript/evals/refund.eval.yaml: assertion "same" reads field "decision", but prompt "acme-support/plain" has no output contract.',
    ],
    [
      'a field the contract does not declare',
      withAssertions({ id: 'tone', kind: 'contains', field: 'tone', values: ['x'] }),
      'PS6204 error: Suite .promptscript/evals/refund.eval.yaml: assertion "tone" reads field "tone", which is not an output property of "acme-support/refund-reply" (decision, reply).',
    ],
    [
      'a prototype name as a field',
      withAssertions({ id: 'proto', kind: 'equals', field: 'constructor' }),
      'PS6204 error: Suite .promptscript/evals/refund.eval.yaml: assertion "proto" reads field "constructor", which is not an output property of "acme-support/refund-reply" (decision, reply).',
    ],
    [
      'json-schema without a schema or a contract',
      loaded({ prompt: 'acme-support/plain', assertions: [{ id: 'valid', kind: 'json-schema' }] }),
      'PS6205 error: Suite .promptscript/evals/refund.eval.yaml: assertion "valid" has no schema and prompt "acme-support/plain" has no output contract; add schema to the assertion.',
    ],
  ])('refuses %s', (_name, suite, message) => {
    expect(messages(suite)).toEqual([message]);
  });

  it('accepts json-schema with an inline schema on a prompt without a contract', () => {
    const suite = loaded({
      prompt: 'acme-support/plain',
      assertions: [
        {
          id: 'valid',
          kind: 'json-schema',
          schema: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
        },
      ],
    });

    expect(checkSuites([suite], context)).toEqual([]);
  });

  it('refuses an inline schema Ajv cannot compile, even for an unknown prompt', () => {
    const suite = loaded({
      prompt: 'missing/prompt',
      assertions: [
        {
          id: 'valid',
          kind: 'json-schema',
          schema: { type: 'object', $ref: 'https://evil.example/s.json' },
        },
      ],
    });

    const codes = checkSuites([suite], context).map((finding) => finding.code);

    expect(codes).toEqual(['PS6205', 'PS6203']);
  });

  it.each([
    ['(a+)+', true],
    [String.raw`(\w+\s?)*$`, true],
    ['((ab)*c)+', true],
    ['(?:x+){2,}', true],
    ['((a+)b)+', true],
    [String.raw`\bguarantee(d)?\b`, false],
    ['[(a+)]+', false],
    [String.raw`\(a+\)+`, false],
    ['(ab)+c*', false],
  ])('warns about nested quantifiers in %s: %s', (pattern, warns) => {
    const findings = checkSuites([withAssertions({ id: 'rx', kind: 'regex', pattern })], context);

    expect(
      findings.some((finding) => finding.code === 'PS6210' && finding.severity === 'warning')
    ).toBe(warns);
  });

  it('refuses a regex that does not compile, for suites built in code', () => {
    expect(messages(withAssertions({ id: 'rx', kind: 'regex', pattern: '(' }))).toEqual([
      'PS6200 error: Suite .promptscript/evals/refund.eval.yaml: regex of assertion "rx" is not a valid pattern.',
    ]);
  });

  describe('models', () => {
    it.each([
      [
        'an unknown model',
        ['gpt-nine'],
        'PS6206 error: Suite .promptscript/evals/refund.eval.yaml: model "gpt-nine" is not in the model catalog; use a profile id, alias or API id, or add it under models.profiles in promptscript.yaml.',
      ],
      [
        'inherit',
        ['inherit'],
        'PS6206 error: Suite .promptscript/evals/refund.eval.yaml: model "inherit" is not in the model catalog; use a profile id, alias or API id, or add it under models.profiles in promptscript.yaml.',
      ],
      [
        'a retired model',
        ['test-retired'],
        'PS6206 error: Suite .promptscript/evals/refund.eval.yaml: model "test-retired" is retired; use test-current.',
      ],
      [
        'a deprecated model',
        [{ ref: 'test-deprecated', params: { maxTokens: 100 } }],
        'PS6206 warning: Suite .promptscript/evals/refund.eval.yaml: model "test-deprecated" is deprecated.',
      ],
    ])('reports %s', (_name, models, message) => {
      expect(messages(loaded({ models }))).toEqual([message]);
    });

    it('needs a model when the prompt has none', () => {
      expect(messages(loaded({ prompt: 'acme-support/no-model' }))).toEqual([
        'PS6206 error: Suite .promptscript/evals/refund.eval.yaml: prompt "acme-support/no-model" has no model and the suite lists none; add models to the suite.',
      ]);
    });

    it('accepts a model list on a prompt without a model', () => {
      expect(
        checkSuites(
          [loaded({ prompt: 'acme-support/no-model', models: ['test-current'] })],
          context
        )
      ).toEqual([]);
    });
  });

  describe('prices', () => {
    it('needs a price for every listed model under a cost threshold', () => {
      const suite = loaded({
        models: ['test-current', 'test-unpriced'],
        thresholds: { maxCostPerCaseUsd: 0.01 },
      });

      expect(messages(suite)).toEqual([
        'PS6501 error: Suite .promptscript/evals/refund.eval.yaml: the suite has a cost threshold, but model "test-unpriced" has no price; add pricing under models.profiles.test-unpriced in promptscript.yaml.',
      ]);
    });

    it('needs a price for the prompt model when the suite lists none', () => {
      const suite = loaded({ prompt: 'acme-support/custom-model', thresholds: { maxCostUsd: 1 } });

      expect(messages(suite)).toEqual([
        'PS6501 error: Suite .promptscript/evals/refund.eval.yaml: the suite has a cost threshold, but model "corp-llm" has no price; add pricing under models.profiles.corp-llm in promptscript.yaml.',
      ]);
    });

    it('reports an unknown model once, not again for its price', () => {
      const codes = checkSuites(
        [loaded({ models: ['gpt-nine'], thresholds: { maxCostUsd: 1 } })],
        context
      ).map((finding) => finding.code);

      expect(codes).toEqual(['PS6206']);
    });

    it('needs no price without a cost threshold', () => {
      expect(checkSuites([loaded({ models: ['test-unpriced'] })], context)).toEqual([]);
    });
  });

  describe('dataset allow', () => {
    const allow = {
      path: 'datasets/rows.jsonl',
      allow: [{ rule: 'PS005', reason: 'Red-team samples.' }],
    };

    it('needs a deterministic assertion next to an allow entry', () => {
      const suite = loaded({
        dataset: allow,
        assertions: [{ id: 'tone', kind: 'llm-judge', rubric: 'acme-support/judge' }],
      });

      // The rubric is not compiled here, which the judge checks report on their own
      expect(messages(suite).filter((line) => line.startsWith('PS6213'))).toEqual([
        'PS6213 error: Suite .promptscript/evals/refund.eval.yaml: the dataset allows scan findings, so the suite needs at least one equals, contains, regex or json-schema assertion.',
      ]);
    });

    it('accepts an allow entry next to a deterministic assertion', () => {
      expect(checkSuites([loaded({ dataset: allow })], context)).toEqual([]);
    });
  });

  it('checks every suite', () => {
    const findings = checkSuites([loaded({ prompt: 'x/a' }), loaded({ prompt: 'x/b' })], context);

    expect(findings.map((finding) => finding.code)).toEqual(['PS6203', 'PS6203']);
  });
});
