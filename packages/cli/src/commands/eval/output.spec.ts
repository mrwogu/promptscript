import { afterEach, describe, expect, it } from 'vitest';
import type { EvalReportV1 } from '@promptscript/core';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  checkReportDir,
  countFindingWarnings,
  errorOf,
  errorReport,
  exitCodeOf,
  writeOut,
  writeSuiteReports,
} from './output.js';
import { EVAL_CODES, EvalError } from '@promptscript/eval';

function reportOf(passed: boolean, extra: Partial<EvalReportV1> = {}): EvalReportV1 {
  return { ...errorReport('replay', []), passed, outcome: passed ? 'passed' : 'failed', ...extra };
}

describe('exitCodeOf', () => {
  it('is 0 for a pass and 1 for anything else', () => {
    const none = { interrupted: false, strict: false, warnings: 0 };

    expect(exitCodeOf(reportOf(true), none)).toBe(0);
    expect(exitCodeOf(reportOf(false), none)).toBe(1);
  });

  it('is 2 for a pass with warnings under --strict only', () => {
    expect(exitCodeOf(reportOf(true), { interrupted: false, strict: true, warnings: 1 })).toBe(2);
    expect(exitCodeOf(reportOf(true), { interrupted: false, strict: false, warnings: 1 })).toBe(0);
    expect(exitCodeOf(reportOf(false), { interrupted: false, strict: true, warnings: 1 })).toBe(1);
  });

  it('is 130 when interrupted, whatever the report says', () => {
    expect(exitCodeOf(reportOf(true), { interrupted: true, strict: true, warnings: 3 })).toBe(130);
  });
});

describe('errorReport', () => {
  it('has outcome error, no suites and the digest of an empty set', () => {
    const report = errorReport('record', [{ code: 'PS6309', message: 'bad flag' }]);

    expect(report).toMatchObject({
      outcome: 'error',
      passed: false,
      suites: [],
      cache: { mode: 'record', replayed: 0, live: 0 },
      errors: [{ code: 'PS6309', message: 'bad flag' }],
    });
    expect(report.cache.digest).toBe(
      'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });
});

describe('errorOf', () => {
  it('keeps the code of an eval error and uses the fallback for other errors', () => {
    expect(
      errorOf(new EvalError('no', EVAL_CODES.REPORT_INVALID), EVAL_CODES.PROJECT_INVALID)
    ).toEqual({ code: 'PS6701', message: 'no' });
    expect(errorOf(new Error('boom'), EVAL_CODES.PROJECT_INVALID)).toEqual({
      code: 'PS6310',
      message: 'boom',
    });
    expect(errorOf('text', EVAL_CODES.PROJECT_INVALID).message).toBe('text');
  });
});

describe('countFindingWarnings', () => {
  it('counts the warning findings of every suite', () => {
    const report = reportOf(true, {
      suites: [
        {
          findings: [
            { code: 'PS6112', severity: 'warning' },
            { code: 'PS6110', severity: 'error' },
          ],
        },
        { findings: [{ code: 'PS6113', severity: 'warning' }] },
      ] as unknown as EvalReportV1['suites'],
    });

    expect(countFindingWarnings(report)).toBe(2);
  });
});

describe('files', () => {
  const dirs: string[] = [];
  const tmp = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'eval-output-'));
    dirs.push(dir);
    return dir;
  };

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('writes --out atomically and names the reason when it cannot', () => {
    const dir = tmp();

    expect(writeOut(join(dir, 'report.json'), 'text')).toBeUndefined();
    expect(readFileSync(join(dir, 'report.json'), 'utf8')).toBe('text');
    expect(writeOut(join(dir, 'missing', 'report.json'), 'text')).toMatchObject({
      code: 'PS6702',
      message: expect.stringContaining('ENOENT'),
    });
  });

  it('accepts a report directory inside the project and refuses one outside', () => {
    const dir = tmp();

    expect(typeof checkReportDir(dir, 'reports')).toBe('string');
    expect(checkReportDir(dir, '../reports')).toMatchObject({ code: 'PS6202' });
    expect(checkReportDir(dir, '/abs/reports')).toMatchObject({ code: 'PS6202' });
  });

  it('skips a report without a suite and fails when the directory is a file', () => {
    const dir = tmp();
    const target = join(dir, 'reports');

    expect(writeSuiteReports(target, [errorReport('replay', [])])).toBeUndefined();
    writeFileSync(join(dir, 'file'), 'x');
    expect(writeSuiteReports(join(dir, 'file'), [errorReport('replay', [])])).toMatchObject({
      code: 'PS6702',
    });
  });
});
