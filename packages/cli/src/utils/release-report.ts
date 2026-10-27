/**
 * Machine-readable report of `prs release <command> --format json`.
 *
 * The shape is pinned by `schema/release-report-v1.json`.
 */

export const RELEASE_REPORT_SCHEMA_URL =
  'https://getpromptscript.dev/schema/release-report/v1.json';
export const RELEASE_REPORT_VERSION = 1 as const;

export type ReleaseCommandName = 'build' | 'promote' | 'rollback' | 'status';

/** What a command did, or would do under `--dry-run`, to one file entry. */
export type ReleaseChangeAction = 'created' | 'updated' | 'unchanged';

export interface ReleaseChange {
  /** Project-relative path of the file */
  path: string;
  action: ReleaseChangeAction;
  /** Prompt id, for a bundle or label entry */
  id?: string;
  /** Content hash the entry holds after the command */
  contentHash?: string;
  /** Content hash the entry held before the command */
  previousContentHash?: string;
}

export interface ReleasePromptStatus {
  id: string;
  contentHash: string;
  /** Project-relative path of the bundle file */
  file: string;
  exists: boolean;
  verified: boolean;
  /** Whether the manifest of the latest build holds this hash for the id */
  inBuild: boolean;
}

export interface ReleaseEnvironmentStatus {
  name: string;
  /** Project-relative path of the label */
  path: string;
  /** Whether the label file exists; an environment without one is empty */
  exists: boolean;
  prompts: ReleasePromptStatus[];
}

export interface ReleaseHistoryCommit {
  commit: string;
  /** Author date, ISO 8601 */
  date: string;
  subject: string;
}

export interface ReleaseEnvironmentHistory {
  environment: string;
  commits: ReleaseHistoryCommit[];
}

export interface ReleaseLocation {
  file?: string;
  line?: number;
  column?: number;
}

export interface ReleaseDiagnostic {
  code?: string;
  message: string;
  location?: ReleaseLocation;
}

/**
 * The file, line and column of a source location, and nothing else the report omits.
 * A parse error at the end of a file has line and column -1; those are left out.
 */
export function toReleaseLocation(
  location: { file?: string; line?: number; column?: number } | undefined
): { location?: ReleaseLocation } {
  if (location === undefined) return {};
  const { file, line, column } = location;
  return {
    location: {
      ...(file === undefined ? {} : { file }),
      ...(line === undefined || line < 1 ? {} : { line }),
      ...(column === undefined || column < 1 ? {} : { column }),
    },
  };
}

export interface ReleaseReport {
  $schema: typeof RELEASE_REPORT_SCHEMA_URL;
  version: typeof RELEASE_REPORT_VERSION;
  command: ReleaseCommandName;
  success: boolean;
  dryRun: boolean;
  changes: ReleaseChange[];
  environments: ReleaseEnvironmentStatus[];
  history?: ReleaseEnvironmentHistory[];
  warnings: ReleaseDiagnostic[];
  errors: ReleaseDiagnostic[];
}

/** A report with every list present, so a partial result still validates. */
export function createReleaseReport(
  command: ReleaseCommandName,
  partial: Partial<Omit<ReleaseReport, '$schema' | 'version' | 'command'>> = {}
): ReleaseReport {
  const errors = partial.errors ?? [];
  return {
    $schema: RELEASE_REPORT_SCHEMA_URL,
    version: RELEASE_REPORT_VERSION,
    command,
    success: partial.success ?? errors.length === 0,
    dryRun: partial.dryRun ?? false,
    changes: partial.changes ?? [],
    environments: partial.environments ?? [],
    ...(partial.history === undefined ? {} : { history: partial.history }),
    warnings: partial.warnings ?? [],
    errors,
  };
}
