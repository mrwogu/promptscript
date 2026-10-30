import { describe, expect, it } from 'vitest';
import {
  hostsFromEnv,
  parseCompareFormat,
  parseDecimal,
  parseImportOptions,
  parseRunFormat,
  parseRunOptions,
  parseSeed,
  parseSignedDecimal,
  parseTolerance,
  parseWhole,
} from './options.js';

describe('parseDecimal', () => {
  it.each(['0', '1', '0.5', '.5', '12.25', '3.'])('accepts %s', (value) => {
    expect(parseDecimal(value)).toBe(Number(value));
  });

  it.each(['', '-1', '+1', '1e3', 'NaN', 'Infinity', '0x10', '1,5', ' 1', 'abc'])(
    'refuses %j',
    (value) => {
      expect(parseDecimal(value)).toBeUndefined();
    }
  );
});

describe('parseWhole', () => {
  it('accepts digits without a leading zero and refuses the rest', () => {
    expect(parseWhole('16')).toBe(16);
    expect(['0', '01', '-1', '1.5', '', 'x'].map(parseWhole)).toEqual(Array(6).fill(undefined));
  });

  it('answers a very long run of zeros at once', () => {
    const started = Date.now();

    expect(parseDecimal(`${'0'.repeat(200_000)}x`)).toBeUndefined();
    expect(parseDecimal('.')).toBeUndefined();
    expect(parseDecimal('1.2.3')).toBeUndefined();
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe('parseTolerance', () => {
  it('defaults to 0 and accepts 0 to 1', () => {
    expect(parseTolerance(undefined)).toBe(0);
    expect(parseTolerance('0.05')).toBe(0.05);
    expect(parseTolerance('1')).toBe(1);
  });

  it('refuses a value above 1 or not a number', () => {
    expect(parseTolerance('1.5')).toBeUndefined();
    expect(parseTolerance('five')).toBeUndefined();
  });
});

describe('formats', () => {
  it('defaults to text and knows the names', () => {
    expect(parseRunFormat(undefined)).toBe('text');
    expect(parseRunFormat('junit')).toBe('junit');
    expect(parseRunFormat('xml')).toBeUndefined();
    expect(parseCompareFormat('markdown')).toBe('markdown');
    expect(parseCompareFormat('junit')).toBeUndefined();
  });
});

describe('hostsFromEnv', () => {
  it('splits on commas, trims and drops empty entries', () => {
    expect(hostsFromEnv(' a.example.com, b.example.com ,,')).toEqual([
      'a.example.com',
      'b.example.com',
    ]);
    expect(hostsFromEnv(undefined)).toEqual([]);
  });
});

describe('parseRunOptions', () => {
  it('uses text and replay by default', () => {
    const { parsed, problems } = parseRunOptions({}, {});

    expect(problems).toEqual([]);
    expect(parsed).toEqual({ format: 'text', cache: 'replay', allowedHosts: [] });
  });

  it('parses limits and joins the host flag with the environment', () => {
    const { parsed } = parseRunOptions(
      {
        format: 'json',
        cache: 'record',
        maxCost: '0.5',
        maxCases: '10',
        concurrency: '2',
        allowHost: ['gw.example.com'],
      },
      { PROMPTSCRIPT_EVAL_ALLOWED_HOSTS: 'other.example.com' }
    );

    expect(parsed).toEqual({
      format: 'json',
      cache: 'record',
      maxCostUsd: 0.5,
      maxCases: 10,
      concurrency: 2,
      allowedHosts: ['gw.example.com', 'other.example.com'],
    });
  });

  it('reports every problem together and never falls back to a default', () => {
    const { parsed, problems } = parseRunOptions(
      {
        format: 'xml',
        cache: 'live',
        maxCost: 'NaN',
        maxCases: '0',
        concurrency: '1.5',
        failOnRegression: true,
      },
      {}
    );

    expect(parsed).toBeUndefined();
    expect(problems).toHaveLength(6);
    expect(problems.join(' ')).toContain('--max-cost');
    expect(problems.join(' ')).toContain('--fail-on-regression needs --baseline');
  });

  it('refuses a dry run in a document format', () => {
    const { problems } = parseRunOptions({ dryRun: true, format: 'json' }, {});

    expect(problems).toEqual([expect.stringContaining('--dry-run prints a text plan')]);
  });
});

describe('parseSeed and parseSignedDecimal', () => {
  it('accepts digits from 0 and refuses the rest', () => {
    expect(parseSeed('0')).toBe(0);
    expect(parseSeed('42')).toBe(42);
    expect(parseSeed('4294967295')).toBe(4_294_967_295);
    expect(['', '-1', '1.5', 'x', '4294967296'].map(parseSeed)).toEqual(Array(5).fill(undefined));
  });

  it('accepts a minus sign and refuses forms a typo could take', () => {
    expect(parseSignedDecimal('-0.5')).toBe(-0.5);
    expect(parseSignedDecimal('2')).toBe(2);
    expect(['', '-', '--1', '1e3', 'NaN'].map(parseSignedDecimal)).toEqual(
      Array(5).fill(undefined)
    );
  });
});

describe('parseImportOptions', () => {
  const base = { suite: 'refund', out: 'rows.jsonl' };

  it('applies the defaults', () => {
    expect(parseImportOptions(base).parsed).toEqual({
      suite: 'refund',
      out: 'rows.jsonl',
      format: 'text',
      maxRows: 200,
      seed: 1,
      labels: [],
      redactInputs: [],
      expectedFromOutput: false,
      dryRun: false,
    });
  });

  it('reads every flag', () => {
    const { parsed } = parseImportOptions({
      ...base,
      maxRows: '1000',
      seed: '0',
      maxScore: '-1',
      label: ['negative'],
      redactInput: ['message'],
      expectedFromOutput: true,
      format: 'json',
      dryRun: true,
    });

    expect(parsed).toMatchObject({
      maxRows: 1000,
      seed: 0,
      maxScore: -1,
      labels: ['negative'],
      redactInputs: ['message'],
      expectedFromOutput: true,
      format: 'json',
      dryRun: true,
    });
  });

  it.each([
    [{ ...base, maxRows: '1001' }, '--max-rows'],
    [{ ...base, maxRows: '0' }, '--max-rows'],
    [{ ...base, seed: '1.5' }, '--seed'],
    [{ ...base, maxScore: 'low' }, '--max-score'],
    [{ ...base, label: ['Negative'] }, '--label'],
    [{ ...base, redactInput: ['a.b'] }, '--redact-input'],
    [{ ...base, format: 'markdown' }, '--format'],
    [{ out: 'rows.jsonl' }, '--suite'],
    [{ suite: 'refund' }, '--out'],
  ])('refuses %j with a message that names the flag', (options, flag) => {
    const { parsed, problems } = parseImportOptions(options);

    expect(parsed).toBeUndefined();
    expect(problems.join(' ')).toContain(flag);
  });
});
