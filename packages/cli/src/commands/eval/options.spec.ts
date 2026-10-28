import { describe, expect, it } from 'vitest';
import {
  hostsFromEnv,
  parseCompareFormat,
  parseDecimal,
  parseRunFormat,
  parseRunOptions,
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
