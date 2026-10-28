import { describe, expect, it } from 'vitest';
import { compareReports, missingFromCandidate, readReport } from './compare.js';
import { caseResult, modelResult, report, suiteResult } from './report-fixture.js';
import { EvalError } from './errors.js';

const MODEL = 'claude-sonnet-5-5';

function reportOf(cases: Array<[string, 'passed' | 'failed' | 'error']>, extra = {}) {
  return report(
    [
      suiteResult('refund', [
        modelResult(
          MODEL,
          cases.map(([id, status]) => caseResult(id, status))
        ),
      ]),
    ],
    extra
  );
}

describe('compareReports', () => {
  it('reports no change for equal reports', () => {
    const a = reportOf([
      ['c1', 'passed'],
      ['c2', 'failed'],
    ]);

    const result = compareReports(a, a, { tolerance: 0 });

    expect(result.regression).toBe(false);
    expect(result.entries).toEqual([
      {
        suite: 'refund',
        model: MODEL,
        passRateDelta: 0,
        latencyP95MsDelta: 0,
        regressions: [],
        fixes: [],
        onlyInBaseline: [],
        onlyInCandidate: [],
        datasetChanged: false,
      },
    ]);
  });

  it('lists regressions and fixes by case id and flags the regression', () => {
    const a = reportOf([
      ['c1', 'passed'],
      ['c2', 'failed'],
      ['c3', 'passed'],
    ]);
    const b = reportOf([
      ['c1', 'failed'],
      ['c2', 'passed'],
      ['c3', 'passed'],
    ]);

    const result = compareReports(a, b, { tolerance: 0 });

    expect(result.entries[0]?.regressions).toEqual(['c1']);
    expect(result.entries[0]?.fixes).toEqual(['c2']);
    expect(result.regression).toBe(true);
  });

  it('counts an error case as not passed', () => {
    const a = reportOf([['c1', 'passed']]);
    const b = reportOf([['c1', 'error']]);

    expect(compareReports(a, b, { tolerance: 1 }).entries[0]?.regressions).toEqual(['c1']);
  });

  it('flags a pass-rate drop above the tolerance without a regressed case', () => {
    const a = report([suiteResult('refund', [modelResult(MODEL, [], { passRate: 0.9 })])]);
    const b = report([suiteResult('refund', [modelResult(MODEL, [], { passRate: 0.8 })])]);

    expect(compareReports(a, b, { tolerance: 0.05 }).regression).toBe(true);
    expect(compareReports(a, b, { tolerance: 0.1 }).regression).toBe(false);
  });

  it('does not flag a pass-rate gain', () => {
    const a = report([suiteResult('refund', [modelResult(MODEL, [], { passRate: 0.5 })])]);
    const b = report([suiteResult('refund', [modelResult(MODEL, [], { passRate: 0.75 })])]);

    const result = compareReports(a, b, { tolerance: 0 });

    expect(result.entries[0]?.passRateDelta).toBe(0.25);
    expect(result.regression).toBe(false);
  });

  it('counts only common ids and lists the others', () => {
    const a = reportOf([
      ['c1', 'passed'],
      ['old', 'passed'],
    ]);
    const b = reportOf([
      ['c1', 'passed'],
      ['new', 'failed'],
    ]);

    const entry = compareReports(a, b, { tolerance: 0 }).entries[0];

    expect(entry?.onlyInBaseline).toEqual(['old']);
    expect(entry?.onlyInCandidate).toEqual(['new']);
    expect(entry?.regressions).toEqual([]);
  });

  it('marks a changed dataset hash', () => {
    const a = reportOf([['c1', 'passed']]);
    const b = reportOf([['c1', 'passed']]);
    const changed = report([
      { ...b.suites[0]!, dataset: { ...b.suites[0]!.dataset, hash: `sha256-${'b'.repeat(64)}` } },
    ]);

    expect(compareReports(a, changed, { tolerance: 0 }).entries[0]?.datasetChanged).toBe(true);
  });

  it('gives cost and p95 deltas, the cost only when both reports have one', () => {
    const a = report([
      suiteResult('refund', [
        modelResult(MODEL, [], { costUsd: 0.01, latencyMs: { p50: 1, p95: 100 } }),
      ]),
    ]);
    const b = report([
      suiteResult('refund', [
        modelResult(MODEL, [], { costUsd: 0.0125, latencyMs: { p50: 1, p95: 160 } }),
      ]),
    ]);
    const unpriced = report([suiteResult('refund', [modelResult(MODEL, [])])]);

    const priced = compareReports(a, b, { tolerance: 0 }).entries[0];
    const missing = compareReports(a, unpriced, { tolerance: 0 }).entries[0];

    expect(priced?.costUsdDelta).toBe(0.0025);
    expect(priced?.latencyP95MsDelta).toBe(60);
    expect(missing).not.toHaveProperty('costUsdDelta');
  });

  it('sorts entries by suite name, then candidate model order', () => {
    const a = report([
      suiteResult('b-suite', [modelResult('m2', []), modelResult('m1', [])]),
      suiteResult('a-suite', [modelResult('m1', [])]),
    ]);

    const entries = compareReports(a, a, { tolerance: 0 }).entries;

    expect(entries.map((entry) => `${entry.suite}/${entry.model}`)).toEqual([
      'a-suite/m1',
      'b-suite/m2',
      'b-suite/m1',
    ]);
  });

  it('lists a suite or model only one side has as an entry without a regression', () => {
    const a = report([suiteResult('refund', [modelResult(MODEL, [caseResult('c1')])])]);
    const b = report([suiteResult('other', [modelResult(MODEL, [caseResult('c9')])])]);

    const result = compareReports(a, b, { tolerance: 0 });

    expect(result.regression).toBe(false);
    expect(result.entries.map((entry) => entry.suite)).toEqual(['other', 'refund']);
    expect(result.entries[0]?.onlyInCandidate).toEqual(['c9']);
    expect(result.entries[1]?.onlyInBaseline).toEqual(['c1']);
  });

  it('carries the tolerance', () => {
    const a = reportOf([['c1', 'passed']]);

    expect(compareReports(a, a, { tolerance: 0.2 }).tolerance).toBe(0.2);
  });
});

describe('readReport', () => {
  const GOOD = JSON.stringify(reportOf([['c1', 'passed']]));

  it('returns a valid report', () => {
    expect(readReport(GOOD, 'base.json').suites[0]?.name).toBe('refund');
  });

  it.each([
    ['not JSON', '{nope'],
    ['not an object', '[]'],
    ['a wrong schema url', JSON.stringify({ ...JSON.parse(GOOD), $schema: 'https://x/y.json' })],
    ['no suites', JSON.stringify({ ...JSON.parse(GOOD), suites: undefined })],
    [
      'a pass rate out of range',
      JSON.stringify(report([suiteResult('s', [modelResult('m', [], { passRate: 2 })])])),
    ],
    [
      'a case with an unknown status',
      JSON.stringify(
        report([
          suiteResult('s', [modelResult('m', [{ ...caseResult('c1'), status: 'maybe' as never }])]),
        ])
      ),
    ],
    [
      'a repeated suite name',
      JSON.stringify(
        report([suiteResult('s', [modelResult('m', [])]), suiteResult('s', [modelResult('m', [])])])
      ),
    ],
    [
      'a repeated case id',
      JSON.stringify(
        report([suiteResult('s', [modelResult('m', [caseResult('c1'), caseResult('c1')])])])
      ),
    ],
  ])('refuses %s with PS6701 and the file name', (_name, text) => {
    let thrown: unknown;

    try {
      readReport(text, 'base.json');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(EvalError);
    expect((thrown as EvalError).code).toBe('PS6701');
    expect((thrown as EvalError).message).toContain('base.json');
  });

  it('never copies the parser message or file content into the error', () => {
    let message = '';

    try {
      readReport('{"secret-value-12345": ', 'base.json');
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).not.toContain('secret-value-12345');
  });
});

describe('missingFromCandidate', () => {
  it('names suites and model entries only the baseline has', () => {
    const a = report([
      suiteResult('gone', [modelResult('m1', [])]),
      suiteResult('kept', [modelResult('m1', []), modelResult('m2', [])]),
    ]);
    const b = report([suiteResult('kept', [modelResult('m1', [])]), suiteResult('new', [])]);

    expect(missingFromCandidate(a, b)).toEqual(['gone', 'kept/m2']);
    expect(missingFromCandidate(b, a)).toEqual(['new']);
    expect(missingFromCandidate(a, a)).toEqual([]);
  });
});

describe('readReport structure checks', () => {
  type Mutable = { suites: Array<Record<string, unknown>> };
  const base = (): Mutable => JSON.parse(JSON.stringify(reportOf([['c1', 'passed']])));
  const model = (doc: Mutable): Record<string, unknown> =>
    (doc.suites[0]?.['models'] as Array<Record<string, unknown>>)[0] as Record<string, unknown>;

  it.each([
    ['a suite without a name', (doc: Mutable) => delete doc.suites[0]?.['name']],
    ['a suite without a dataset hash', (doc: Mutable) => (doc.suites[0]!['dataset'] = {})],
    ['a suite without models', (doc: Mutable) => (doc.suites[0]!['models'] = 'none')],
    ['a model without a ref', (doc: Mutable) => delete model(doc)['ref']],
    ['a model without a p95 latency', (doc: Mutable) => (model(doc)['latencyMs'] = {})],
    ['a model with a negative cost', (doc: Mutable) => (model(doc)['costUsd'] = -1)],
    ['a model without a case list', (doc: Mutable) => (model(doc)['cases'] = null)],
    [
      'a case without an id',
      (doc: Mutable) => ((model(doc)['cases'] as unknown[])[0] = { status: 'passed' }),
    ],
    [
      'a repeated model',
      (doc: Mutable) => (doc.suites[0]!['models'] as unknown[]).push(model(doc)),
    ],
    ['suites that are not a list', (doc: Mutable) => ((doc as { suites: unknown }).suites = {})],
  ])('refuses %s with PS6701', (_name, change) => {
    const doc = base();
    change(doc);

    expect(() => readReport(JSON.stringify(doc), 'base.json')).toThrow(
      expect.objectContaining({ code: 'PS6701' })
    );
  });

  it('refuses a document that is not an object', () => {
    expect(() => readReport('42', 'base.json')).toThrow(
      expect.objectContaining({ code: 'PS6701' })
    );
  });
});
