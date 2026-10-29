import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { EvalComparisonV1, EvalReportV1 } from '@promptscript/core';
import {
  EVAL_CODES,
  EvalError,
  compareReports,
  missingFromCandidate,
  formatComparison,
  readReport,
} from '@promptscript/eval';
import { parseCompareFormat, parseTolerance, type EvalCompareOptions } from './options.js';
import { printDocument, say } from './output.js';

const MAX_REPORT_BYTES = 32 * 1024 * 1024;

async function load(file: string, base: string): Promise<EvalReportV1> {
  const path = resolve(base, file);
  try {
    const info = await stat(path);
    if (!info.isFile()) {
      throw new EvalError(
        `Report ${file} is not a regular file. Pass a report made with prs eval run --format json.`,
        EVAL_CODES.REPORT_INVALID
      );
    }
    if (info.size > MAX_REPORT_BYTES) {
      throw new EvalError(
        `Report ${file} is over 32 MiB, which is not an eval report this version reads.`,
        EVAL_CODES.REPORT_INVALID
      );
    }
    return readReport(await readFile(path, 'utf8'), file);
  } catch (error) {
    if (error instanceof EvalError) throw error;
    const reason = (error as NodeJS.ErrnoException).code ?? 'an unknown error';
    throw new EvalError(
      `Report ${file} cannot be read: ${reason}. Pass a report made with prs eval run --format json.`,
      EVAL_CODES.REPORT_INVALID
    );
  }
}

/**
 * `prs eval compare <a.json> <b.json>`: compare two reports offline, `a` the baseline and
 * `b` the candidate. Exit 0, or 1 on a regression with `--fail-on-regression` and on any
 * error. A comparison has no place for errors, so they go to stderr in every format.
 */
export async function evalCompareCommand(
  baselineFile: string,
  candidateFile: string,
  options: EvalCompareOptions
): Promise<void> {
  const format = parseCompareFormat(options.format);
  const tolerance = parseTolerance(options.tolerance);
  if (format === undefined || tolerance === undefined) {
    say(
      format === undefined
        ? `Invalid output format: ${options.format}. Expected text, json or markdown.`
        : '--tolerance must be a number from 0 to 1, such as 0.05.'
    );
    process.exitCode = 1;
    return;
  }
  let comparison: EvalComparisonV1;
  let missing: string[];
  try {
    const base = options.cwd === undefined ? process.cwd() : resolve(options.cwd);
    const baseline = await load(baselineFile, base);
    const candidate = await load(candidateFile, base);
    comparison = compareReports(baseline, candidate, { tolerance });
    missing = missingFromCandidate(baseline, candidate);
  } catch (error) {
    const code = error instanceof EvalError ? `${error.code}: ` : '';
    say(`${code}${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }
  const color =
    format === 'text' && process.stdout.isTTY === true && process.env['NO_COLOR'] === undefined;
  if (format === 'json' && missing.length > 0) {
    say(`warning: only in the baseline, not run: ${missing.join(', ')}`);
  }
  printDocument(formatComparison(comparison, format, { color, missing }));
  process.exitCode = comparison.regression && options.failOnRegression === true ? 1 : 0;
}
