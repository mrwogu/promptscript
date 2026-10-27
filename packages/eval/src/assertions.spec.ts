import type { EvalDatasetRowV1, PromptBundleOutput } from '@promptscript/core';
import { describe, expect, it } from 'vitest';
import {
  compileJsonSchema,
  evaluateAssertions,
  type DeterministicAssertion,
} from './assertions.js';

const output: PromptBundleOutput = {
  type: 'object',
  properties: {
    decision: { type: 'string', enum: ['refund', 'reject'] },
    reply: { type: 'string' },
    amount: { type: 'number' },
    reasons: { type: 'array', items: { type: 'string' } },
  },
  required: ['amount', 'decision', 'reasons', 'reply'],
  additionalProperties: false,
};
type Expected = EvalDatasetRowV1['expected'];

const RESPONSE = JSON.stringify({
  decision: 'refund',
  reply: 'Hello Ann, your refund is on its way.',
  amount: 12,
  reasons: ['late'],
});

const run = (
  assertion: DeterministicAssertion,
  response = RESPONSE,
  expected?: Parameters<typeof evaluateAssertions>[2]['expected']
): ReturnType<typeof evaluateAssertions>[number] | undefined =>
  evaluateAssertions([assertion], response, {
    output,
    ...(expected === undefined ? {} : { expected }),
  })[0];

describe('evaluateAssertions', () => {
  describe('equals', () => {
    it.each<[string, DeterministicAssertion, Expected, boolean]>([
      [
        'the row expected field',
        { id: 'a', kind: 'equals', field: 'decision' },
        { decision: 'refund' },
        true,
      ],
      [
        'a different expected field',
        { id: 'a', kind: 'equals', field: 'decision' },
        { decision: 'reject' },
        false,
      ],
      [
        'the assertion value over the row',
        { id: 'a', kind: 'equals', field: 'decision', value: 'refund' },
        { decision: 'reject' },
        true,
      ],
      ['a number field', { id: 'a', kind: 'equals', field: 'amount' }, { amount: 12 }, true],
      ['a list field', { id: 'a', kind: 'equals', field: 'reasons' }, { reasons: ['late'] }, true],
      [
        'a list of another length',
        { id: 'a', kind: 'equals', field: 'reasons' },
        { reasons: ['late', 'lost'] },
        false,
      ],
      [
        'a string value for a number',
        { id: 'a', kind: 'equals', field: 'amount', value: '12' },
        undefined,
        false,
      ],
      [
        'case when ignoreCase is set',
        { id: 'a', kind: 'equals', field: 'decision', ignoreCase: true },
        { decision: 'REFUND' },
        true,
      ],
      [
        'case by default',
        { id: 'a', kind: 'equals', field: 'decision' },
        { decision: 'REFUND' },
        false,
      ],
      [
        'a negated match',
        { id: 'a', kind: 'equals', field: 'decision', negate: true },
        { decision: 'refund' },
        false,
      ],
      [
        'a negated mismatch',
        { id: 'a', kind: 'equals', field: 'decision', negate: true },
        { decision: 'reject' },
        true,
      ],
    ])('compares %s', (_name, assertion, expected, passed) => {
      expect(run(assertion, RESPONSE, expected)?.passed).toBe(passed);
    });

    it('compares the whole text with a string expected value, trimmed and NFC-normalized', () => {
      const result = run({ id: 'a', kind: 'equals' }, '  Cafe\u0301 \n', 'Caf\u00E9');

      expect(result).toEqual({ id: 'a', kind: 'equals', passed: true });
    });

    it('keeps whitespace when trim is false', () => {
      expect(run({ id: 'a', kind: 'equals', trim: false }, ' Hi', 'Hi')?.passed).toBe(false);
    });

    it('explains a mismatch with a short quote of the actual value', () => {
      const result = run({ id: 'a', kind: 'equals', field: 'reply' }, RESPONSE, { reply: 'Bye' });

      expect(result).toEqual({
        id: 'a',
        kind: 'equals',
        passed: false,
        reason: 'Expected "Bye", got "Hello Ann, your refund is on its way."',
      });
    });

    it('explains a negated match', () => {
      expect(
        run({ id: 'a', kind: 'equals', field: 'decision', negate: true }, RESPONSE, {
          decision: 'refund',
        })?.reason
      ).toBe('Expected any value but "refund"');
    });

    it('fails when there is nothing to compare with', () => {
      expect(
        run({ id: 'a', kind: 'equals', field: 'decision' }, RESPONSE, 'refund')?.reason
      ).toContain('No expected value');
    });
  });

  describe('contains', () => {
    it.each<[string, DeterministicAssertion, boolean]>([
      ['all values', { id: 'c', kind: 'contains', values: ['Hello', 'refund'] }, true],
      [
        'a missing value in all mode',
        { id: 'c', kind: 'contains', values: ['Hello', 'sorry'] },
        false,
      ],
      ['any value', { id: 'c', kind: 'contains', values: ['sorry', 'refund'], mode: 'any' }, true],
      [
        'no value in any mode',
        { id: 'c', kind: 'contains', values: ['sorry', 'oops'], mode: 'any' },
        false,
      ],
      [
        'case when ignoreCase is set',
        { id: 'c', kind: 'contains', values: ['HELLO'], ignoreCase: true },
        true,
      ],
      ['a negated hit', { id: 'c', kind: 'contains', values: ['refund'], negate: true }, false],
      ['a negated miss', { id: 'c', kind: 'contains', values: ['sorry'], negate: true }, true],
    ])('checks %s', (_name, assertion, passed) => {
      expect(run({ ...assertion, field: 'reply' })?.passed).toBe(passed);
    });

    it('names the missing value and the found value', () => {
      expect(
        run({ id: 'c', kind: 'contains', field: 'reply', values: ['Hello', 'sorry'] })?.reason
      ).toBe('Missing "sorry" in "Hello Ann, your refund is on its way."');
      expect(
        run({ id: 'c', kind: 'contains', field: 'reply', values: ['refund'], negate: true })?.reason
      ).toBe('Found "refund" in "Hello Ann, your refund is on its way."');
    });

    it('fails on a field that is not a string', () => {
      expect(run({ id: 'c', kind: 'contains', field: 'amount', values: ['1'] })).toMatchObject({
        passed: false,
        reason: 'Not a string: "12"',
      });
    });
  });

  describe('regex', () => {
    it.each<[string, DeterministicAssertion, boolean]>([
      ['a match', { id: 'r', kind: 'regex', field: 'reply', pattern: String.raw`refund\b` }, true],
      ['flags', { id: 'r', kind: 'regex', field: 'reply', pattern: '^hello', flags: 'i' }, true],
      ['no match', { id: 'r', kind: 'regex', field: 'reply', pattern: 'guarantee' }, false],
      [
        'a negated match',
        { id: 'r', kind: 'regex', field: 'reply', pattern: 'refund', negate: true },
        false,
      ],
      [
        'a negated miss',
        { id: 'r', kind: 'regex', field: 'reply', pattern: 'guarantee', negate: true },
        true,
      ],
    ])('checks %s', (_name, assertion, passed) => {
      expect(run(assertion)?.passed).toBe(passed);
    });

    it('stops a pattern that backtracks and fails the case', () => {
      const started = Date.now();

      const result = run({ id: 'r', kind: 'regex', pattern: '^(a|a)*$' }, `${'a'.repeat(30)}!`);

      expect(result).toEqual({
        id: 'r',
        kind: 'regex',
        passed: false,
        reason: 'Regex ran longer than 1000 ms',
      });
      expect(Date.now() - started).toBeLessThan(10_000);
    }, 30_000);

    it('fails the case for a bad pattern instead of throwing', () => {
      expect(run({ id: 'r', kind: 'regex', pattern: '(' }, 'text')).toEqual({
        id: 'r',
        kind: 'regex',
        passed: false,
        reason: 'Regex pattern or flags are not valid',
      });
    });

    it('fails a target over 64 KiB instead of running the pattern', () => {
      const result = run(
        { id: 'r', kind: 'regex', pattern: 'a', negate: true },
        `${'a'.repeat(64 * 1024)}!`
      );

      expect(result).toEqual({
        id: 'r',
        kind: 'regex',
        passed: false,
        reason: 'Target is longer than 65536 bytes',
      });
    });

    it('explains a negated match and a miss', () => {
      expect(
        run({ id: 'r', kind: 'regex', pattern: 'way', negate: true }, 'on its way')?.reason
      ).toBe('Matches in "on its way"');
      expect(run({ id: 'r', kind: 'regex', pattern: 'x' }, 'on its way')?.reason).toBe(
        'No match in "on its way"'
      );
    });

    it('fails on a field that is not a string', () => {
      expect(run({ id: 'r', kind: 'regex', field: 'reasons', pattern: 'late' })?.reason).toBe(
        String.raw`Not a string: "[\"late\"]"`
      );
    });
  });

  describe('json-schema', () => {
    it('checks the parsed response against the output contract', () => {
      expect(run({ id: 's', kind: 'json-schema' })?.passed).toBe(true);
      expect(
        run({ id: 's', kind: 'json-schema' }, JSON.stringify({ decision: 'maybe' }))
      ).toMatchObject({
        passed: false,
        reason: 'Schema error at "/": must have required property \'amount\'',
      });
    });

    it('checks a field against its contract property', () => {
      expect(run({ id: 's', kind: 'json-schema', field: 'decision' })?.passed).toBe(true);
      const result = run(
        { id: 's', kind: 'json-schema', field: 'decision' },
        JSON.stringify({ decision: 'maybe' })
      );

      expect(result?.reason).toBe(
        'Schema error at "/": must be equal to one of the allowed values'
      );
    });

    it('checks against an inline schema', () => {
      const assertion: DeterministicAssertion = {
        id: 's',
        kind: 'json-schema',
        schema: { type: 'object', properties: { amount: { type: 'number', maximum: 10 } } },
      };

      expect(run(assertion)).toMatchObject({
        passed: false,
        reason: 'Schema error at "/amount": must be <= 10',
      });
    });

    it('fails without a schema or a contract', () => {
      const result = evaluateAssertions([{ id: 's', kind: 'json-schema' }], RESPONSE, {})[0];

      expect(result?.reason).toBe('No schema: add schema or an output contract');
    });

    it('compiles a schema object once', () => {
      const schema = { type: 'object' };

      expect(compileJsonSchema(schema)).toBe(compileJsonSchema(schema));
    });

    it('stops many slow schema patterns near one shared budget', () => {
      // Each item matches through the second branch after a slow first try
      const assertion: DeterministicAssertion = {
        id: 's',
        kind: 'json-schema',
        field: 'reasons',
        schema: { type: 'array', items: { type: 'string', pattern: '^(a|a)*$|!' } },
      };
      const reasons = Array.from({ length: 60 }, () => `${'a'.repeat(23)}!`);
      const started = Date.now();

      const result = run(assertion, JSON.stringify({ reasons }));

      expect(result).toMatchObject({
        passed: false,
        reason: 'Schema patterns ran longer than 1000 ms',
      });
      expect(Date.now() - started).toBeLessThan(3500);
    }, 30_000);

    it('fails the case when a recursive schema meets a very deep response', () => {
      const assertion: DeterministicAssertion = {
        id: 's',
        kind: 'json-schema',
        schema: {
          type: 'object',
          properties: { tree: { $ref: '#/definitions/node' } },
          definitions: { node: { type: 'array', items: { $ref: '#/definitions/node' } } },
        },
      };
      const deep = `{"tree":${'['.repeat(100_000)}${']'.repeat(100_000)}}`;

      const result = run(assertion, deep);

      expect(result).toMatchObject({
        passed: false,
        reason: 'Schema check could not finish on this response',
      });
    });

    it('still matches schema patterns that are fine', () => {
      const assertion: DeterministicAssertion = {
        id: 's',
        kind: 'json-schema',
        schema: {
          type: 'object',
          patternProperties: { '^dec': { type: 'string', pattern: '^ref' } },
        },
      };

      expect(run(assertion)?.passed).toBe(true);
      expect(run(assertion, '{"decision":"reject"}')?.passed).toBe(false);
    });

    it('fails the case for a schema that does not compile instead of throwing', () => {
      const assertion: DeterministicAssertion = {
        id: 's',
        kind: 'json-schema',
        schema: { type: 'object', unknownKeyword: true },
      };

      expect(run(assertion)).toEqual({
        id: 's',
        kind: 'json-schema',
        passed: false,
        reason: 'Schema does not compile; checkSuites reports why',
      });
    });

    it('still refuses a bad schema pattern when the schema compiles', () => {
      expect(() => compileJsonSchema({ type: 'string', pattern: '(' })).toThrow();
    });

    it('never loads a remote reference', () => {
      expect(() => compileJsonSchema({ $ref: 'https://evil.example/schema.json' })).toThrow();
    });
  });

  describe('parsing', () => {
    it('unwraps one fenced block', () => {
      const fenced = `\`\`\`json\n${RESPONSE}\n\`\`\``;

      expect(
        run({ id: 'a', kind: 'equals', field: 'decision', value: 'refund' }, fenced)?.passed
      ).toBe(true);
    });

    it.each([
      ['not JSON', 'Sure! Here you go.'],
      ['a JSON list', '[1, 2]'],
      ['a bare fence', '```'],
    ])(
      'fails object assertions on %s, while whole-text assertions still run',
      (_name, response) => {
        const results = evaluateAssertions(
          [
            { id: 'field', kind: 'equals', field: 'decision', value: 'refund' },
            { id: 'schema', kind: 'json-schema' },
            { id: 'text', kind: 'regex', pattern: '.' },
          ],
          response,
          { output }
        );

        expect(results).toEqual([
          { id: 'field', kind: 'equals', passed: false, reason: 'Response is not a JSON object' },
          {
            id: 'schema',
            kind: 'json-schema',
            passed: false,
            reason: 'Response is not a JSON object',
          },
          { id: 'text', kind: 'regex', passed: true },
        ]);
      }
    );

    it('reads own properties only', () => {
      const result = run(
        { id: 'a', kind: 'equals', field: 'toString', value: 'x' },
        '{"decision":"refund"}'
      );

      expect(result?.reason).toBe('Field "toString" is missing from the response');
    });

    it('reads a __proto__ key as plain data', () => {
      const result = run(
        { id: 'a', kind: 'equals', field: '__proto__', value: 'x' },
        '{"__proto__":"x"}'
      );

      expect(result?.passed).toBe(true);
    });
  });

  it('keeps reasons within 160 characters and quotes at most 60 characters', () => {
    const long = 'z'.repeat(500);
    const result = run(
      { id: 'a', kind: 'equals', field: 'reply', value: 'y'.repeat(500) },
      JSON.stringify({ reply: long })
    );

    expect(result?.reason?.length).toBeLessThanOrEqual(160);
    expect(result?.reason).not.toContain('z'.repeat(61));
  });

  it('returns results in assertion order', () => {
    const results = evaluateAssertions(
      [
        { id: 'one', kind: 'contains', values: ['Hello'] },
        { id: 'two', kind: 'regex', pattern: 'nope' },
      ],
      'Hello',
      {}
    );

    expect(results.map((result) => [result.id, result.passed])).toEqual([
      ['one', true],
      ['two', false],
    ]);
  });
});
