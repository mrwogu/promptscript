import type { EvalCacheMode } from '@promptscript/core';
import {
  FEEDBACK_LABEL_PATTERN,
  type EvalComparisonFormat,
  type EvalReportFormat,
} from '@promptscript/eval';
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
  label?: string;
  variant?: string;
}

/** Options of `prs eval compare`. */
export interface EvalCompareOptions {
  format?: string;
  failOnRegression?: boolean;
  tolerance?: string;
  cwd?: string;
}

/** Options of `prs eval import`. */
export interface EvalImportOptions extends ProjectPathOptions {
  suite?: string;
  out?: string;
  maxRows?: string;
  seed?: string;
  maxScore?: string;
  label?: string[];
  redactInput?: string[];
  expectedFromOutput?: boolean;
  format?: string;
  dryRun?: boolean;
}

/** The import options once checked. */
export interface ParsedImportOptions {
  suite: string;
  out: string;
  format: EvalImportFormat;
  maxRows: number;
  seed: number;
  maxScore?: number;
  labels: string[];
  redactInputs: string[];
  expectedFromOutput: boolean;
  dryRun: boolean;
}

/** Output formats of `eval import`. */
export type EvalImportFormat = 'text' | 'json';

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

const IMPORT_FORMATS: readonly EvalImportFormat[] = ['text', 'json'];
const MAX_IMPORT_ROWS = 1000;
const DEFAULT_IMPORT_ROWS = 200;
const MAX_SEED = 4_294_967_295;
const INPUT_NAME = /^[A-Za-z_]\w*$/;

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

// Environment and variant names share one rule, so a flag value is safe in a path or a message
const RELEASE_NAME_RE = /^[a-z][a-z0-9-]{0,31}$/;

/** Problems of `--label` and `--variant`: their shape, and `--variant` without `--label`. */
export function labelProblems(options: Pick<EvalRunOptions, 'label' | 'variant'>): string[] {
  const problems: string[] = [];
  const { label, variant } = options;
  if (label !== undefined && !RELEASE_NAME_RE.test(label)) {
    problems.push(
      '--label must be an environment name: lowercase letters, digits and hyphens, starting with a letter.'
    );
  }
  if (variant !== undefined && !RELEASE_NAME_RE.test(variant)) {
    problems.push(
      '--variant must be a variant name: lowercase letters, digits and hyphens, starting with a letter.'
    );
  }
  if (variant !== undefined && label === undefined) {
    problems.push('--variant needs --label <env>.');
  }
  return problems;
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
  problems.push(...labelProblems(options));
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

/** A whole number from 0 to 4294967295, written with digits only. */
export function parseSeed(value: string): number | undefined {
  if (!isDigits(value)) return undefined;
  const number = Number(value);
  return number <= MAX_SEED ? number : undefined;
}

/** A decimal with an optional minus sign. */
export function parseSignedDecimal(value: string): number | undefined {
  return value.startsWith('-') ? negate(parseDecimal(value.slice(1))) : parseDecimal(value);
}

function negate(value: number | undefined): number | undefined {
  return value === undefined ? undefined : -value;
}

// One flag of `eval import`: the parsed value, or a problem and the default
function flag<T>(
  value: string | undefined,
  parse: (text: string) => T | undefined,
  problem: string,
  problems: string[],
  fallback: T
): T {
  if (value === undefined) return fallback;
  const parsed = parse(value);
  if (parsed === undefined) problems.push(problem);
  return parsed ?? fallback;
}

function parseRowLimit(text: string): number | undefined {
  const parsed = parseWhole(text);
  return parsed !== undefined && parsed <= MAX_IMPORT_ROWS ? parsed : undefined;
}

/**
 * Check the flags of `eval import`. A flag that is not a plain number or a known name is
 * a problem, never a default. Names given to `--redact-input` and `--label` are checked
 * here against their patterns; the command checks the input names against the prompt.
 *
 * @param options - Flags as commander gave them
 * @returns The parsed options and the problems found, all of them
 */
export function parseImportOptions(options: EvalImportOptions): {
  parsed?: ParsedImportOptions;
  problems: string[];
} {
  const problems: string[] = [];
  const format = oneOf(options.format, IMPORT_FORMATS, 'text');
  if (format === undefined) problems.push('--format must be text or json.');
  const { suite, out } = options;
  if (suite === undefined || suite === '') problems.push('--suite is required.');
  if (out === undefined || out === '') problems.push('--out is required.');
  const maxRows = flag(
    options.maxRows,
    parseRowLimit,
    `--max-rows must be a whole number from 1 to ${MAX_IMPORT_ROWS}.`,
    problems,
    DEFAULT_IMPORT_ROWS
  );
  const seed = flag(
    options.seed,
    parseSeed,
    `--seed must be a whole number from 0 to ${MAX_SEED}.`,
    problems,
    1
  );
  const maxScore = flag(
    options.maxScore,
    parseSignedDecimal,
    '--max-score must be a plain number, such as 0.',
    problems,
    undefined
  );
  const labels = options.label ?? [];
  if (labels.some((label) => !FEEDBACK_LABEL_PATTERN.test(label))) {
    problems.push('--label must be a feedback label: lowercase letters, digits, - and _.');
  }
  const redactInputs = options.redactInput ?? [];
  if (redactInputs.some((name) => !INPUT_NAME.test(name))) {
    problems.push('--redact-input must be an input name of the prompt.');
  }
  if (problems.length > 0 || format === undefined || !suite || !out) return { problems };
  return {
    problems,
    parsed: {
      suite,
      out,
      format,
      maxRows,
      seed,
      ...(maxScore === undefined ? {} : { maxScore }),
      labels,
      redactInputs,
      expectedFromOutput: options.expectedFromOutput === true,
      dryRun: options.dryRun === true,
    },
  };
}
