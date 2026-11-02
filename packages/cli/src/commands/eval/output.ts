import { lstatSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  sha256Hex,
  type EvalCacheMode,
  type EvalReportErrorV1,
  type EvalReportV1,
} from '@promptscript/core';
import {
  EVAL_CODES,
  EvalError,
  cleanText,
  formatReport,
  reportFileName,
  resolveProjectPath,
  type EvalCode,
} from '@promptscript/eval';
import { ReleaseError } from '../release/errors.js';
import { writeFileAtomic } from '../../utils/write-file-atomic.js';

/** Exit code of a run that was interrupted. */
export const EXIT_INTERRUPTED = 130;

/** One error of a run, as it goes into a report. */
export function reportError(code: EvalCode, message: string): EvalReportErrorV1 {
  return { code, message };
}

/** The error of a thrown value: its eval or release code when it has one, else `fallback`. */
export function errorOf(error: unknown, fallback: EvalCode): EvalReportErrorV1 {
  if (error instanceof EvalError) return reportError(error.code as EvalCode, error.message);
  // A release file problem keeps its PS50xx code, so the fix in the releases guide applies
  if (error instanceof ReleaseError) return { code: error.code, message: error.message };
  return reportError(fallback, error instanceof Error ? error.message : String(error));
}

/** A report for a run that stopped before it could build one: outcome `error`, no suites. */
export function errorReport(mode: EvalCacheMode, errors: EvalReportErrorV1[]): EvalReportV1 {
  return {
    $schema: 'https://getpromptscript.dev/schema/eval-report/v1.json',
    version: 1,
    outcome: 'error',
    passed: false,
    cache: { mode, replayed: 0, live: 0, digest: `sha256-${sha256Hex('')}` },
    usage: { calls: 0, inputTokens: 0, outputTokens: 0 },
    suites: [],
    errors,
  };
}

/** Warnings in a report: findings of its suites that were not turned into errors. */
export function countFindingWarnings(report: EvalReportV1): number {
  return report.suites.reduce(
    (sum, suite) => sum + suite.findings.filter((finding) => finding.severity === 'warning').length,
    0
  );
}

/**
 * Exit code of a finished run: 130 when interrupted, 1 unless every suite passed, 2 when
 * it passed with warnings under `--strict`, else 0.
 */
export function exitCodeOf(
  report: EvalReportV1,
  options: { interrupted: boolean; strict: boolean; warnings: number }
): number {
  if (options.interrupted) return EXIT_INTERRUPTED;
  if (!report.passed) return 1;
  return options.strict && options.warnings > 0 ? 2 : 0;
}

/** Write a document to stdout as it is, so the bytes match `--out`. */
export function printDocument(document: string): void {
  process.stdout.write(document);
}

/** A line for the user on stderr, cleaned of control and bidi characters. */
export function say(message: string): void {
  console.error(cleanText(message));
}

/**
 * Write the formatted report to `--out`, atomically. Returns a report error when
 * the file cannot be written, so the run fails instead of leaving a stale file.
 */
export function writeOut(file: string, document: string): EvalReportErrorV1 | undefined {
  try {
    writeFileAtomic(file, document, 0o644);
    return undefined;
  } catch (error) {
    const reason = (error as NodeJS.ErrnoException).code ?? 'an unknown error';
    return reportError(
      EVAL_CODES.REPORT_WRITE_FAILED,
      `The report could not be written to ${cleanText(file)}: ${reason}.`
    );
  }
}

/**
 * Check a report directory before any call is paid for: relative, inside the project,
 * no link out. Returns its real path, which is also where the files go.
 */
export function checkReportDir(root: string, dir: string): string | EvalReportErrorV1 {
  const real = resolveProjectPath(root, root, dir);
  if (real === undefined) {
    return reportError(
      EVAL_CODES.PATH_REFUSED,
      `The report directory "${cleanText(dir).slice(0, 200)}" must be a relative path that stays inside the project.`
    );
  }
  return real;
}

/**
 * Write one report per suite as `<suite>.<hash12>.json` under a checked directory. A file
 * that is a link is never followed or replaced. Stops at the first failure.
 */
export function writeSuiteReports(
  dir: string,
  reports: readonly EvalReportV1[]
): EvalReportErrorV1 | undefined {
  try {
    mkdirSync(dir, { recursive: true });
    for (const report of reports) {
      const [suite] = report.suites;
      if (suite === undefined) continue;
      const file = join(dir, reportFileName(suite));
      if (lstatSync(file, { throwIfNoEntry: false })?.isFile() === false) {
        throw Object.assign(new Error('not a regular file'), { code: 'EEXIST' });
      }
      writeFileAtomic(file, formatReport(report, 'json'), 0o644);
    }
    return undefined;
  } catch (error) {
    const reason = (error as NodeJS.ErrnoException).code ?? 'an unknown error';
    return reportError(
      EVAL_CODES.REPORT_WRITE_FAILED,
      `The report directory could not be written: ${reason}. Check that it is a directory you can write to and that no suite report name is a link.`
    );
  }
}
