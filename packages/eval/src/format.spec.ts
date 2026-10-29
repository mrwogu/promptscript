import { describe, expect, it } from 'vitest';
import type { EvalReportV1 } from '@promptscript/core';
import { compareReports } from './compare.js';
import { formatComparison, formatPlan, formatReport, reportFileName } from './format.js';
import type { EvalPlan } from './run.js';
import { caseResult, modelResult, report, suiteResult } from './report-fixture.js';

const MODEL = 'claude-sonnet-5-5';
const ESC = String.fromCharCode(27);
const OVERRIDE = String.fromCodePoint(0x202e);

function failing(): EvalReportV1 {
  const failed = caseResult('c2', 'failed', {
    assertions: [
      { id: 'has-refund', kind: 'contains', passed: false, reason: 'missing "refund"' },
      { id: 'short', kind: 'regex', passed: true },
    ],
  });
  const broken = caseResult('c3', 'error', {
    error: { code: 'PS6402', message: 'No cache entry for row "c3"' },
  });
  const suite = suiteResult(
    'refund',
    [modelResult(MODEL, [caseResult('c1'), failed, broken], { costUsd: 0.0123 })],
    {
      passed: false,
      thresholds: [{ name: 'passRate', model: MODEL, limit: 1, actual: 0.33, passed: false }],
    }
  );
  return report([suite], {
    outcome: 'failed',
    passed: false,
    cache: { mode: 'replay', replayed: 2, live: 0, digest: `sha256-${'a'.repeat(64)}` },
    costUsd: 0.0123,
  });
}

describe('formatReport json', () => {
  it('prints the report as indented JSON with a final newline', () => {
    const text = formatReport(failing(), 'json');

    expect(text.endsWith('\n')).toBe(true);
    expect(JSON.parse(text)).toEqual(failing());
  });

  it('is byte-identical for equal reports', () => {
    expect(formatReport(failing(), 'json')).toBe(formatReport(failing(), 'json'));
  });

  it('strips control and bidi characters from strings', () => {
    const dirty = report([], {
      outcome: 'error',
      passed: false,
      errors: [{ code: 'PS6300', message: `bad${ESC}[31m${OVERRIDE} line\nbreak` }],
    });

    const text = formatReport(dirty, 'json');

    expect(text).not.toContain(ESC);
    expect(text).not.toContain(OVERRIDE);
    expect(JSON.parse(text).errors[0].message).toBe('bad[31m line break');
  });
});

describe('formatReport text', () => {
  it('shows the outcome, the table row and the failing cases', () => {
    const text = formatReport(failing(), 'text');

    expect(text).toContain('refund');
    expect(text).toContain(MODEL);
    expect(text).toContain('33.3%');
    expect(text).toContain('c2');
    expect(text).toContain('has-refund: missing "refund"');
    expect(text).toContain('PS6402');
    expect(text).toContain('outcome: failed');
    expect(text).not.toContain('short:');
  });

  it('has no color codes unless asked', () => {
    expect(formatReport(failing(), 'text')).not.toContain(ESC);
    expect(formatReport(failing(), 'text', { color: true })).toContain(ESC);
  });

  it('strips escape sequences from model text on and off a TTY', () => {
    const dirty = failing();
    dirty.suites[0]!.models[0]!.cases[1]!.assertions[0]!.reason = `x${ESC}[2Jy${OVERRIDE}z`;

    for (const color of [false, true]) {
      const text = formatReport(dirty, 'text', { color });
      expect(text).toContain('x[2Jyz');
      expect(text).not.toContain(OVERRIDE);
      // the only ESC bytes are the ones the reporter paints itself
      expect(text.match(new RegExp(`${ESC}(?!\\[\\d+m)`, 'g'))).toBeNull();
    }
  });

  it('lists report errors', () => {
    const text = formatReport(
      report([], {
        outcome: 'error',
        passed: false,
        errors: [{ code: 'PS6200', message: 'Suite broken', file: 'a.eval.yaml', line: 3 }],
      }),
      'text'
    );

    expect(text).toContain('PS6200: Suite broken (a.eval.yaml:3)');
    expect(text).toContain('outcome: error');
  });

  it('shows the comparison against the baseline', () => {
    const base = report([suiteResult('refund', [modelResult(MODEL, [caseResult('c2')])])]);
    const current = failing();
    current.comparison = compareReports(base, current, { tolerance: 0 });

    const text = formatReport(current, 'text');

    expect(text).toContain('regressed: c2');
  });

  it('caps the failing cases of a model at 20', () => {
    const cases = Array.from({ length: 25 }, (_, index) => caseResult(`c${index}`, 'failed'));
    const many = report([suiteResult('refund', [modelResult(MODEL, cases)])], {
      outcome: 'failed',
      passed: false,
    });

    expect(formatReport(many, 'text')).toContain('and 5 more');
  });
});

describe('formatReport markdown', () => {
  it('prints a status line, a table per suite and the failed cases', () => {
    const text = formatReport(failing(), 'markdown');

    expect(text).toContain('Eval outcome: **failed**');
    expect(text).toContain('| Model | Pass rate | Threshold | Cost | p95 | Delta |');
    expect(text).toContain('| `claude-sonnet-5-5` | 33.3% (1/3) | 100.0% | $0.0123 | 100 ms | - |');
    expect(text).toContain('`c2`');
    expect(text).toContain('`has-refund`');
    expect(text).toContain('Cache mode `replay`: 2 replayed, 0 live');
  });

  it('puts model text only inside code spans with a longer fence', () => {
    const dirty = failing();
    dirty.suites[0]!.models[0]!.cases[1]!.assertions[0]!.reason = 'see ``` [x](http://e.com) | <b>';

    const text = formatReport(dirty, 'markdown');

    expect(text).toContain('```` see ``` [x](http://e.com) | <b> ````');
  });

  it('lists at most 20 failed cases', () => {
    const cases = Array.from({ length: 25 }, (_, index) => caseResult(`c${index}`, 'failed'));
    const many = report([suiteResult('refund', [modelResult(MODEL, cases)])], {
      outcome: 'failed',
      passed: false,
    });

    const text = formatReport(many, 'markdown');

    expect(text.match(/^- `refund/gm)).toHaveLength(20);
    expect(text).toContain('5 more');
  });

  it('shows the delta of the comparison', () => {
    const base = report([
      suiteResult('refund', [
        modelResult(MODEL, [caseResult('c1'), caseResult('c2'), caseResult('c3')]),
      ]),
    ]);
    const current = failing();
    current.comparison = compareReports(base, current, { tolerance: 0 });

    expect(formatReport(current, 'markdown')).toContain('-66.7 pp');
  });
});

describe('formatReport junit', () => {
  it('prints a testsuite per suite and model and a testcase per case', () => {
    const text = formatReport(failing(), 'junit');

    expect(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(text).toContain(
      '<testsuite name="refund/claude-sonnet-5-5" tests="4" failures="2" errors="1"'
    );
    expect(text).toContain('<testcase classname="refund.claude-sonnet-5-5" name="c1" time="0.1"');
    expect(text).toContain('<failure message="has-refund: missing &quot;refund&quot;"/>');
    expect(text).toContain('<error message="PS6402: No cache entry for row &quot;c3&quot;"/>');
  });

  it('reports a failed threshold as a failing testcase', () => {
    const text = formatReport(failing(), 'junit');

    expect(text).toContain('name="threshold passRate"');
    expect(text).toContain('<failure message="passRate: 0.33 is below the limit 1"/>');
  });

  it('reports setup errors, so an empty run is never green', () => {
    const text = formatReport(
      report([], {
        outcome: 'error',
        passed: false,
        errors: [{ code: 'PS6200', message: 'Broken' }],
      }),
      'junit'
    );

    expect(text).toContain('<testsuite name="eval"');
    expect(text).toContain('<error message="PS6200: Broken"/>');
  });

  it('escapes XML and removes characters XML 1.0 cannot hold', () => {
    const dirty = failing();
    dirty.suites[0]!.models[0]!.cases[1]!.assertions[0]!.reason = `<x>${ESC}&\ud800`;

    const text = formatReport(dirty, 'junit');

    expect(text).toContain('&lt;x&gt;&amp;');
    expect(text).not.toContain(ESC);
    expect(text).not.toContain('\ud800');
  });
});

describe('formatComparison', () => {
  const base = report([
    suiteResult('refund', [modelResult(MODEL, [caseResult('c1'), caseResult('c2')])]),
  ]);
  const next = report([
    suiteResult('refund', [modelResult(MODEL, [caseResult('c1', 'failed'), caseResult('c2')])]),
  ]);
  const comparison = compareReports(base, next, { tolerance: 0 });

  it('prints JSON with the schema URL first', () => {
    const parsed = JSON.parse(formatComparison(comparison, 'json'));

    expect(Object.keys(parsed)[0]).toBe('$schema');
    expect(parsed.$schema).toBe('https://getpromptscript.dev/schema/eval-comparison/v1.json');
    expect(parsed.regression).toBe(true);
  });

  it('prints text with the regressed cases', () => {
    const text = formatComparison(comparison, 'text');

    expect(text).toContain('refund / claude-sonnet-5-5');
    expect(text).toContain('regressed: c1');
    expect(text).toContain('result: regression');
  });

  it('prints a Markdown table', () => {
    const text = formatComparison(comparison, 'markdown');

    expect(text).toContain('| Suite | Model | Pass rate | Cost | p95 | Regressed | Fixed |');
    expect(text).toContain('`c1`');
  });

  it('warns when a dataset changed', () => {
    const changed = {
      ...comparison,
      entries: comparison.entries.map((entry) => ({ ...entry, datasetChanged: true })),
    };

    expect(formatComparison(changed, 'text')).toContain('dataset changed');
  });
});

describe('reportFileName', () => {
  it('joins the suite name and 12 hex characters of the content hash', () => {
    const suite = suiteResult('refund', []);
    suite.prompt.contentHash = `sha256-${'0123456789abcdef'.repeat(4)}`;

    expect(reportFileName(suite)).toBe('refund.0123456789ab.json');
  });
});

describe('formatPlan', () => {
  const plan: EvalPlan = {
    mode: 'record',
    hits: 1,
    misses: 1,
    calls: 1,
    worstCaseUsd: 0.0021,
    budgetUsd: 1,
    errors: [],
    suites: [
      {
        name: 'refund',
        prompt: 'acme/refund',
        rows: 2,
        models: [
          {
            ref: MODEL,
            provider: 'anthropic',
            apiId: MODEL,
            cases: 2,
            hits: 1,
            misses: 1,
            calls: 1,
            priceSource: 'built-in',
            worstCaseUsd: 0.0021,
          },
        ],
      },
    ],
  };

  it('shows hits, misses, calls, price source and worst case per model, then totals', () => {
    const text = formatPlan(plan);

    expect(text).toContain('refund  acme/refund  2 rows');
    expect(text).toContain(
      `${MODEL} (anthropic)   2 cases   hits 1   misses 1   calls 1   price built-in   worst case $0.0021`
    );
    expect(text).toContain('total: hits 1, misses 1, calls 1, worst case $0.0021, budget $1');
    expect(text).toContain('no provider was called');
  });

  it('lists setup errors and cleans their text', () => {
    const text = formatPlan({
      ...plan,
      suites: [],
      errors: [{ code: 'PS6503', severity: 'error', message: `too dear${ESC}[0m` }],
    });

    expect(text).toContain('error PS6503: too dear[0m');
    expect(text).not.toContain(ESC);
  });
});

describe('missing baseline entries', () => {
  const missing = ['gone', 'kept/m2'];

  it('shows them as a warning in text and a section in Markdown, run and comparison', () => {
    const current = failing();
    const comparison = compareReports(current, current, { tolerance: 0 });

    for (const text of [
      formatReport(current, 'text', { missing }),
      formatComparison(comparison, 'text', { missing }),
    ]) {
      expect(text).toContain('warning: only in the baseline, not run: gone, kept/m2');
    }
    for (const text of [
      formatReport(current, 'markdown', { missing }),
      formatComparison(comparison, 'markdown', { missing }),
    ]) {
      expect(text).toContain('Only in the baseline, not run:');
      expect(text).toContain('- `gone`');
      expect(text).toContain('- `kept/m2`');
    }
  });

  it('shows nothing without missing entries and never touches JSON', () => {
    const current = failing();

    expect(formatReport(current, 'text')).not.toContain('only in the baseline');
    expect(formatReport(current, 'markdown')).not.toContain('Only in the baseline');
    expect(formatReport(current, 'json', { missing })).toBe(formatReport(current, 'json'));
  });
});

describe('formatReport less common parts', () => {
  const NOTE = 'costly';

  function withLimits(): EvalReportV1 {
    const current = failing();
    current.suites[0]!.thresholds.push(
      { name: 'maxCostUsd', limit: 0.01, actual: 0.02, passed: false },
      { name: 'latencyMs.p95', model: MODEL, limit: 100, actual: 200, passed: false }
    );
    current.suites[0]!.findings.push(
      { code: 'PS6111', severity: 'warning', rowId: 'c1', path: 'inputs.x', allowedBecause: NOTE },
      { code: 'PS6112', severity: 'warning' }
    );
    return current;
  }

  it('reports a failed limit of a whole suite as its own JUnit testsuite', () => {
    const text = formatReport(withLimits(), 'junit');

    expect(text).toContain('<testsuite name="refund" tests="1" failures="1" errors="0" time="0">');
    expect(text).toContain('maxCostUsd: 0.02 is above the limit 0.01');
    expect(text).toContain('latencyMs.p95: 200 is above the limit 100');
  });

  it('reports a regression outcome as a JUnit failure', () => {
    const text = formatReport(report([], { outcome: 'regression', passed: false }), 'junit');

    expect(text).toContain('<failure message="regression against the baseline"/>');
    expect(text).toContain('name="baseline comparison"');
  });

  it('shows findings with their reason in text', () => {
    const text = formatReport(withLimits(), 'text');

    expect(text).toContain(`warning PS6111 row c1 at inputs.x (allowed: ${NOTE})`);
    expect(text).toContain('warning PS6112 row - at -');
  });

  it('lists report errors in Markdown with their file and line', () => {
    const text = formatReport(
      report([], {
        outcome: 'error',
        passed: false,
        errors: [{ code: 'PS6200', message: 'Broken', file: 'a.eval.yaml', line: 2 }],
      }),
      'markdown'
    );

    expect(text).toContain('- `PS6200` `Broken (a.eval.yaml:2)`');
  });

  it('shows budget and cost in the text totals, and a threshold per model', () => {
    const current = failing();
    current.budget = { maxUsd: 1, spentUsd: 0.5 };

    const text = formatReport(current, 'text');

    expect(text).toContain('cost $0.0123, budget $1 spent $0.5');
    expect(text).toContain('limit 100.0%');
  });

  it('shows signed cost deltas in a comparison', () => {
    const cheaper = report([suiteResult('refund', [modelResult(MODEL, [], { costUsd: 0.5 })])]);
    const dearer = report([suiteResult('refund', [modelResult(MODEL, [], { costUsd: 0.75 })])]);

    const up = formatComparison(compareReports(cheaper, dearer, { tolerance: 0 }), 'text');
    const down = formatComparison(compareReports(dearer, cheaper, { tolerance: 0 }), 'markdown');

    expect(up).toContain('cost +$0.25');
    expect(down).toContain('-$0.25');
  });

  it('shows cases only one report has in a text comparison', () => {
    const a = report([suiteResult('refund', [modelResult(MODEL, [caseResult('old')])])]);
    const b = report([suiteResult('refund', [modelResult(MODEL, [caseResult('new')])])]);

    const text = formatComparison(compareReports(a, b, { tolerance: 0 }), 'text');

    expect(text).toContain('only in baseline: old');
    expect(text).toContain('only in candidate: new');
  });

  it('marks a case that failed without a failed assertion in text and JUnit', () => {
    const odd = report([suiteResult('refund', [modelResult(MODEL, [caseResult('c1', 'failed')])])]);

    expect(formatReport(odd, 'text')).toContain('case: failed');
    expect(formatReport(odd, 'junit')).toContain('<failure message="case: failed"/>');
  });
});
