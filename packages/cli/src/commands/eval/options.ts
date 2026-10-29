import type { EvalCacheMode } from '@promptscript/core';
import type { EvalComparisonFormat, EvalReportFormat } from '@promptscript/eval';
import type { ProjectPathOptions } from '../../utils/project-config.js';

/** Options of `prs eval run`, as commander hands them over. */
export interface EvalRunOptions extends ProjectPathOptions {
  format?: string;
  out?: string;
  reportDir?: string;
  baseline?: string;
  failOnRegression?: boolean;
  maxCost?: string;
  maxCases?: string;
  concurrency?: string;
  cache?: string;
  model?: string;
  dryRun?: boolean;
  strict?: boolean;
  allowHost?: string[];
  allowLocal?: boolean;
}

/** Options of `prs eval compare`. */
export interface EvalCompareOptions {
  format?: string;
  failOnRegression?: boolean;
  tolerance?: string;
  cwd?: string;
}

/** The run options once checked. */
export interface ParsedRunOptions {
  format: EvalReportFormat;
  cache: EvalCacheMode;
  maxCostUsd?: number;
  maxCases?: number;
  concurrency?: number;
  allowedHosts: string[];
}

const RUN_FORMATS: readonly EvalReportFormat[] = ['text', 'json', 'markdown', 'junit'];
const COMPARE_FORMATS: readonly EvalComparisonFormat[] = ['text', 'json', 'markdown'];
const WHOLE_HINT = 'must be a whole number above 0.';
const DECIMAL_HINT = 'must be a number of USD, 0 or more, such as 0.5.';
const CACHE_MODES: readonly EvalCacheMode[] = ['replay', 'record', 'refresh', 'off'];

// Digits only, no regex: a long run of zeros costs one pass
function isDigits(text: string): boolean {
  return text !== '' && [...text].every((char) => char >= '0' && char <= '9');
}

/** The value as one of `allowed`, or undefined; the default applies to an absent value. */
function oneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T
): T | undefined {
  if (value === undefined) return fallback;
  return allowed.find((entry) => entry === value);
}

/** The output format of `eval run`, or undefined for a name that is not one. */
export function parseRunFormat(value: string | undefined): EvalReportFormat | undefined {
  return oneOf(value, RUN_FORMATS, 'text');
}

/** The output format of `eval compare`, or undefined for a name that is not one. */
export function parseCompareFormat(value: string | undefined): EvalComparisonFormat | undefined {
  return oneOf(value, COMPARE_FORMATS, 'text');
}

/** A plain decimal number, not `1e3`, `NaN`, `Infinity` or a sign. */
export function parseDecimal(value: string): number | undefined {
  const [whole = '', fraction, ...rest] = value.split('.');
  const wholeOk = whole === '' || isDigits(whole);
  const fractionOk = fraction === undefined || fraction === '' || isDigits(fraction);
  const hasDigits = whole !== '' || (fraction ?? '') !== '';
  if (rest.length > 0 || !wholeOk || !fractionOk || !hasDigits) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

/** A whole number above 0 written with digits only. */
export function parseWhole(value: string): number | undefined {
  return isDigits(value) && !value.startsWith('0') ? Number(value) : undefined;
}

/** `--tolerance`: a decimal from 0 to 1, default 0; undefined when it is not one. */
export function parseTolerance(value: string | undefined): number | undefined {
  if (value === undefined) return 0;
  const number = parseDecimal(value);
  return number !== undefined && number <= 1 ? number : undefined;
}

/** Host names of the `PROMPTSCRIPT_EVAL_ALLOWED_HOSTS` variable, comma separated. */
export function hostsFromEnv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter((host) => host !== '');
}

/**
 * Check the flags of `eval run`. A flag that is not a plain number or a known name is
 * a problem, never a default, so a typo cannot switch a limit off.
 *
 * @param options - Flags as commander gave them
 * @param env - Environment, for the allowed hosts
 * @returns The parsed options and the problems found, all of them
 */
export function parseRunOptions(
  options: EvalRunOptions,
  env: Readonly<Record<string, string | undefined>>
): { parsed?: ParsedRunOptions; problems: string[] } {
  const problems: string[] = [];
  const format = parseRunFormat(options.format);
  if (format === undefined) problems.push(`--format must be text, json, markdown or junit.`);
  const cache = oneOf(options.cache, CACHE_MODES, 'replay');
  if (cache === undefined) problems.push('--cache must be replay, record, refresh or off.');
  const number = (flag: string, value: string | undefined, whole: boolean): number | undefined => {
    if (value === undefined) return undefined;
    const parsed = whole ? parseWhole(value) : parseDecimal(value);
    if (parsed === undefined) problems.push(`${flag} ${whole ? WHOLE_HINT : DECIMAL_HINT}`);
    return parsed;
  };
  const maxCostUsd = number('--max-cost', options.maxCost, false);
  const maxCases = number('--max-cases', options.maxCases, true);
  const concurrency = number('--concurrency', options.concurrency, true);
  if (options.failOnRegression === true && options.baseline === undefined) {
    problems.push('--fail-on-regression needs --baseline <report.json>.');
  }
  if (options.dryRun === true && format !== undefined && format !== 'text') {
    problems.push('--dry-run prints a text plan; leave out --format or use --format text.');
  }
  if (problems.length > 0 || format === undefined || cache === undefined) return { problems };
  return {
    problems,
    parsed: {
      format,
      cache,
      ...(maxCostUsd === undefined ? {} : { maxCostUsd }),
      ...(maxCases === undefined ? {} : { maxCases }),
      ...(concurrency === undefined ? {} : { concurrency }),
      allowedHosts: [
        ...(options.allowHost ?? []),
        ...hostsFromEnv(env['PROMPTSCRIPT_EVAL_ALLOWED_HOSTS']),
      ],
    },
  };
}
