import type { EvalAssertion, EvalDatasetRowV1, PromptBundleV1 } from '@promptscript/core';
import { describe, expect, it } from 'vitest';
import { checkDatasetRow, type DatasetCheckContext } from './check.js';

const bundle: Pick<PromptBundleV1, 'inputs' | 'output'> = {
  inputs: { message: { type: 'string', description: 'Message', required: true } },
  output: {
    type: 'object',
    properties: {
      decision: { type: 'string', enum: ['refund', 'reject'] },
      amount: { type: 'number' },
      reasons: { type: 'array', items: { type: 'string', enum: ['late', 'damaged'] } },
      counts: { type: 'array', items: { type: 'number' } },
    },
    required: ['amount', 'counts', 'decision', 'reasons'],
    additionalProperties: false,
  },
};

const context = (patch: Partial<DatasetCheckContext> = {}): DatasetCheckContext => ({
  file: 'data/rows.jsonl',
  bundle,
  assertions: [],
  ...patch,
});

const record = (row: Partial<EvalDatasetRowV1>): Parameters<typeof checkDatasetRow>[0] => ({
  row: { id: 'late', inputs: { message: 'Hi' }, ...row },
  line: 4,
});

describe('checkDatasetRow', () => {
  it('accepts a row that fits the contract, partial expected included', () => {
    const findings = checkDatasetRow(
      record({ expected: { decision: 'refund', reasons: ['late'] } }),
      context()
    );

    expect(findings).toEqual([]);
  });

  it('names undeclared inputs with the row id and line', () => {
    const findings = checkDatasetRow(
      record({ inputs: { message: 'Hi', mesage: 'typo' } }),
      context()
    );

    expect(findings).toEqual([
      {
        code: 'PS6104',
        severity: 'error',
        message: 'Row "late": the prompt declares no input mesage; fix the input name.',
        file: 'data/rows.jsonl',
        line: 4,
      },
    ]);
  });

  it.each([
    ['an undeclared property', { tone: 'calm' }, 'expected.tone is not an output property'],
    ['a value outside the enum', { decision: 'maybe' }, 'expected.decision does not match'],
    ['a string for a number', { amount: '12' }, 'expected.amount does not match'],
    ['a list item outside the enum', { reasons: ['lost'] }, 'expected.reasons does not match'],
    ['a string for a list', { reasons: 'late' }, 'expected.reasons does not match'],
    ['a string list for a number list', { counts: ['1'] }, 'expected.counts does not match'],
  ])('refuses %s in expected', (_name, expected, message) => {
    const findings = checkDatasetRow(record({ expected }), context());

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ code: 'PS6104' });
    expect(findings[0]?.message).toContain(message);
  });

  it('accepts a string expected value with or without a contract', () => {
    expect(checkDatasetRow(record({ expected: 'Hello' }), context())).toEqual([]);
    expect(
      checkDatasetRow(record({ expected: 'Hello' }), context({ bundle: { inputs: bundle.inputs } }))
    ).toEqual([]);
  });

  it('refuses an object expected value without a contract', () => {
    const findings = checkDatasetRow(
      record({ expected: { decision: 'refund' } }),
      context({ bundle: { inputs: bundle.inputs } })
    );

    expect(findings[0]?.message).toContain('has no output contract');
  });

  describe('equals without a value', () => {
    const equals = (field?: string): EvalAssertion => ({
      id: 'same',
      kind: 'equals',
      ...(field ? { field } : {}),
    });

    it.each([
      [
        'a field the row does not have',
        equals('decision'),
        { amount: 3 },
        'needs expected.decision',
      ],
      [
        'the whole text and an object expected',
        equals(),
        { decision: 'refund' },
        'needs expected in',
      ],
      ['the whole text and no expected', equals(), undefined, 'needs expected in'],
    ])('needs an expected value for %s', (_name, assertion, expected, message) => {
      const findings = checkDatasetRow(record({ expected }), context({ assertions: [assertion] }));

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ code: 'PS6105', line: 4 });
      expect(findings[0]?.message).toContain(message);
    });

    it('is fine when the row has the value or the assertion brings one', () => {
      const assertions: EvalAssertion[] = [
        equals('decision'),
        { id: 'fixed', kind: 'equals', value: 'x' },
        { id: 'word', kind: 'contains', values: ['x'] },
      ];

      expect(
        checkDatasetRow(record({ expected: { decision: 'refund' } }), context({ assertions }))
      ).toEqual([]);
    });
  });
});
