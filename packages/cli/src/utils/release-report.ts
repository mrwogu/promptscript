/**
 * Machine-readable report of `prs release <command> --format json`.
 *
 * The shape is pinned by `schema/release-report-v1.json`.
 */
import type { PolicyKind, PolicySeverity, RiskLevel } from '@promptscript/core';

export const RELEASE_REPORT_SCHEMA_URL =
  'https://getpromptscript.dev/schema/release-report/v1.json';
export const RELEASE_REPORT_VERSION = 1 as const;

export type ReleaseCommandName = 'build' | 'promote' | 'rollback' | 'split' | 'status';

/** What a command did, or would do under `--dry-run`, to one file entry. */
export type ReleaseChangeAction = 'created' | 'updated' | 'unchanged' | 'removed';

/** The experiment arm a label change describes. */
export interface ReleaseChangeExperiment {
  /** Experiment name */
  name: string;
  /** Arm name, `control` for the first arm */
  variant: string;
  /** Share in basis points after the command; absent for a removed arm */
  weight?: number;
  /** Share in basis points before the command; absent for a new arm */
  previousWeight?: number;
}

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
  /** Set on an arm item of an experiment; the entry item has none */
  experiment?: ReleaseChangeExperiment;
}

/** One arm of a label entry in status. */
export interface ReleaseArmStatus {
  variant: string;
  contentHash: string;
  /** Share in basis points */
  weight: number;
  /** Project-relative path of the bundle file */
  file: string;
  exists: boolean;
  verified: boolean;
}

export interface ReleaseExperimentStatus {
  name: string;
  /** The control arm first, in label order */
  arms: ReleaseArmStatus[];
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
  /** Present while the entry runs an experiment */
  experiment?: ReleaseExperimentStatus;
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

/** Approvals of one role that a required-approvals check counted. */
export interface ReleaseGateApprovals {
  role: string;
  /** Distinct approvers needed */
  required: number;
  /** Approvers whose committed record counts for this hash and environment */
  found: string[];
  /** Records of this prompt and role for another hash, as `<approver> for <short hash>` */
  stale: string[];
}

/** One policy as a release gate judged it for one prompt. */
export interface ReleaseGateCheck {
  policy: string;
  kind: PolicyKind;
  severity: PolicySeverity;
  /** `unavailable` never passes at error severity */
  status: 'passed' | 'failed' | 'unavailable';
  message?: string;
  suggestion?: string;
  approvals?: ReleaseGateApprovals[];
}

/** The gates of one prompt version on its way into one environment. */
export interface ReleaseGateResult {
  prompt: string;
  contentHash: string;
  environment: string;
  /** The highest of the bundle's and the source's risk and risk floors */
  policyRisk: RiskLevel;
  /** False when a check of severity error failed or is unavailable */
  passed: boolean;
  checks: ReleaseGateCheck[];
}

/** The commit `prs release status --base` compared the labels with. */
export interface ReleaseBaseRef {
  /** The ref as given */
  ref: string;
  /** The commit it named */
  commit: string;
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
  /** Present when status runs with --base */
  base?: ReleaseBaseRef;
  /** The gates of every prompt version a policy applies to; absent without prompt policies */
  gates?: ReleaseGateResult[];
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
    ...(partial.base === undefined ? {} : { base: partial.base }),
    ...(partial.gates === undefined ? {} : { gates: partial.gates }),
    warnings: partial.warnings ?? [],
    errors,
  };
}
