import { PSError } from '@promptscript/core';
import { ConsoleOutput } from '../../output/console.js';
import type { ProjectPathOptions } from '../../utils/project-config.js';
import { acquireProjectLock, ProjectLockBusyError } from '../../utils/project-lock.js';
import {
  createReleaseReport,
  type ReleaseCommandName,
  toReleaseLocation,
  type ReleaseDiagnostic,
  type ReleaseReport,
} from '../../utils/release-report.js';
import { PS5007_RELEASE_LOCKED, ReleaseError } from './errors.js';
import { stripControlCharacters } from './git.js';
import type { ReleasePaths } from './layout.js';
import { ReleaseCompileError } from './project.js';

/** Options every release command accepts. */
export interface ReleaseCommandOptions extends ProjectPathOptions {
  /** Show what the command would write without writing */
  dryRun?: boolean;
  /** `text` (default) or `json` */
  format?: string;
}

/** Human output of a release command: stdout as text, stderr when stdout carries JSON. */
export interface ReleaseOutput {
  readonly json: boolean;
  info(message: string): void;
  success(message: string): void;
}

export function createOutput(json: boolean): ReleaseOutput {
  return {
    json,
    info: (message) => (json ? console.error(message) : ConsoleOutput.info(message)),
    success: (message) => (json ? console.error(message) : ConsoleOutput.success(message)),
  };
}

/** A diagnostic of a thrown error, with the code and location when it has them. */
export function toDiagnostic(error: unknown): ReleaseDiagnostic {
  if (error instanceof PSError) {
    return { code: error.code, message: error.message, ...toReleaseLocation(error.location) };
  }
  return { message: error instanceof Error ? error.message : String(error) };
}

/**
 * One diagnostic as text: code, message and file. Messages can echo values from source or
 * file names, so control characters are stripped here, line by line.
 */
export function formatDiagnostic(diagnostic: ReleaseDiagnostic): string {
  const code = diagnostic.code === undefined ? '' : `${diagnostic.code}: `;
  const message = diagnostic.message.split('\n').map(stripControlCharacters).join('\n');
  const file = diagnostic.location?.file;
  return file === undefined
    ? `${code}${message}`
    : `${code}${message} (${stripControlCharacters(file)})`;
}

/**
 * Run a release command: check `--format`, turn thrown errors into report errors, print
 * one JSON document on stdout or the diagnostics as text, and set the exit code.
 */
export async function runReleaseCommand(
  command: ReleaseCommandName,
  options: ReleaseCommandOptions,
  body: (output: ReleaseOutput) => Promise<Partial<ReleaseReport>>
): Promise<void> {
  if (options.format !== undefined && options.format !== 'text' && options.format !== 'json') {
    ConsoleOutput.error(
      `Invalid output format: ${stripControlCharacters(options.format)}. Expected text or json.`
    );
    process.exitCode = 1;
    return;
  }
  const output = createOutput(options.format === 'json');
  const dryRun = options.dryRun === true;
  let report: ReleaseReport;
  try {
    report = createReleaseReport(command, { dryRun, ...(await body(output)) });
  } catch (error) {
    const errors = error instanceof ReleaseCompileError ? error.diagnostics : [toDiagnostic(error)];
    report = createReleaseReport(command, { dryRun, success: false, errors });
  }
  if (output.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const warning of report.warnings) ConsoleOutput.warn(formatDiagnostic(warning));
    for (const error of report.errors) ConsoleOutput.error(formatDiagnostic(error));
  }
  process.exitCode = report.success ? 0 : 1;
}

/** Run `body` under the release lock. A dry run reads only, so it takes no lock. */
export async function withReleaseLock<T>(
  paths: ReleasePaths,
  dryRun: boolean,
  body: () => Promise<T>
): Promise<T> {
  if (dryRun) return body();
  let lock;
  try {
    lock = await acquireProjectLock(
      paths.lock,
      `Another prs release command is running in ${paths.root}. Wait for it to finish, then run the command again.`
    );
  } catch (error) {
    if (error instanceof ProjectLockBusyError) {
      throw new ReleaseError(PS5007_RELEASE_LOCKED, error.message, paths.lock, error);
    }
    throw error;
  }
  try {
    return await body();
  } finally {
    await lock.release();
  }
}
