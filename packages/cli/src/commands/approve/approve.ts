import {
  APPROVAL_RECORD_SCHEMA_URL,
  approvalRecordPath,
  compareCodeUnits,
  isApproverHandle,
  isPlainObject,
  MAX_APPROVER_LENGTH,
  PSError,
  serializeApprovalRecord,
  type ApprovalRecordV1,
  type PromptBundleV1,
  type PromptReleaseLabelV1,
} from '@promptscript/core';
import { ConsoleOutput } from '../../output/console.js';
import {
  GovernanceError,
  PS5101_GOVERNANCE_CONFIG,
  PS5102_APPROVAL_REFERENCE,
  PS5103_UNKNOWN_HASH,
  PS5104_APPROVER_IDENTITY,
  PS5105_APPROVAL_EXISTS,
  PS5109_APPROVAL_INVALID,
} from '../../utils/governance-error.js';
import { checkGovernanceConfig } from '../../utils/governance-config.js';
import type { ProjectPathOptions } from '../../utils/project-config.js';
import type { ReleaseDiagnostic } from '../../utils/release-report.js';
import { stripControlCharacters } from '../release/git.js';
import {
  CONTENT_HASH_RE,
  checkBundleFields,
  readLabel,
  readReleaseText,
  shortHash,
  verifyBundleText,
} from '../release/layout.js';
import {
  compileRelease,
  environmentIndex,
  loadReleaseProject,
  ReleaseCompileError,
  WINDOWS_DEVICE_NAME_RE,
  type ReleaseProject,
} from '../release/project.js';
import {
  createOutput,
  formatDiagnostic,
  toDiagnostic,
  withReleaseLock,
  type ReleaseOutput,
} from '../release/run.js';
import {
  findApprovalRecords,
  gitBlobId,
  gitPathsOf,
  MAX_APPROVAL_DEPTH,
  trackedApprovals,
  writeApprovalRecord,
  type FoundApproval,
} from './records.js';

export const APPROVAL_REPORT_SCHEMA_URL =
  'https://getpromptscript.dev/schema/approval-report/v1.json';

// Same patterns as the approval record guard in core, checked here to name the failing field.
const PROMPT_ID_RE =
  /^(?!.*\.\.)(?:@?[A-Za-z0-9][A-Za-z0-9_.-]{0,63}(?<!\.)\/)+[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/u;
const ROLE_RE = /^[a-z][a-z0-9-]{0,31}$/;
// Stricter than the core guard: format characters (bidi, BOM, zero-width) are refused too.
const COMMENT_RE = /^(?:[^\p{Cc}\p{Cs}\p{Cf}]|\n){0,2000}$/u;

const ROLES_EXAMPLE = "governance:\n  roles:\n    legal: ['@acme/legal']";
const USAGE =
  'prs approve <id>@sha256-<64 hex> --role <role> --approver @<handle> --env <environment>';

export interface ApproveOptions extends ProjectPathOptions {
  role?: string;
  approver?: string;
  env?: string;
  allEnvironments?: boolean;
  comment?: string;
  list?: boolean;
  /** `text` (default) or `json` */
  format?: string;
}

/**
 * State of a record for the prompt it names: `current` approves the hash the checkout
 * builds, `labelled` a hash an environment label holds, `stale` neither. These never
 * count: `untracked` (not added to Git yet), `modified` (the bytes on disk are not the
 * ones Git has), `misplaced` (Git tracks it at another path than its fields give) and
 * `unknown-role` (the role is not in governance.roles).
 */
export type ApprovalState =
  'current' | 'labelled' | 'stale' | 'untracked' | 'modified' | 'misplaced' | 'unknown-role';

export interface ListedApproval {
  /** Project-relative path of the record on disk */
  path: string;
  state: ApprovalState;
  /** Environments whose label holds the record's hash for its prompt */
  labels: string[];
  /** Where a misplaced record belongs */
  expectedPath?: string;
  /** The path Git tracks for the file, when it differs from the path on disk */
  trackedPath?: string;
  record: ApprovalRecordV1;
}

export interface ApprovalPromptStatus {
  id: string;
  /** Hash the checkout builds; absent when the source has no such prompt */
  contentHash?: string;
  records: ListedApproval[];
}

/** Machine-readable report of `prs approve --format json`, pinned by `schema/approval-report-v1.json`. */
export interface ApprovalReport {
  $schema: typeof APPROVAL_REPORT_SCHEMA_URL;
  version: 1;
  command: 'approve' | 'list';
  success: boolean;
  /** The record written */
  record?: ApprovalRecordV1;
  /** Project-relative path of the record written */
  path?: string;
  /** Filled by `--list` */
  prompts?: ApprovalPromptStatus[];
  warnings: ReleaseDiagnostic[];
  errors: ReleaseDiagnostic[];
}

/** The role and the owners that review it, from `governance.roles`, or PS5101. */
function checkRole(
  project: ReleaseProject,
  role: string | undefined
): { role: string; owners: string[] } {
  const { configPath } = project;
  const governance: unknown = project.config.governance;
  const roles = isPlainObject(governance) ? governance['roles'] : undefined;
  if (!isPlainObject(roles) || Object.keys(roles).length === 0) {
    throw new GovernanceError(
      PS5101_GOVERNANCE_CONFIG,
      `No approval roles are configured. Add governance.roles to ${configPath}, for example:\n${ROLES_EXAMPLE}`,
      configPath
    );
  }
  const configured = Object.keys(roles).sort(compareCodeUnits).join(', ');
  if (role === undefined) {
    throw new GovernanceError(
      PS5101_GOVERNANCE_CONFIG,
      `Give the role you approve as with --role. Configured: ${stripControlCharacters(configured)}.`,
      configPath
    );
  }
  if (WINDOWS_DEVICE_NAME_RE.test(role)) {
    throw new GovernanceError(
      PS5101_GOVERNANCE_CONFIG,
      `Role "${role}" is a Windows device name, which no directory can have there. Rename the role in governance.roles of ${configPath}.`,
      configPath
    );
  }
  if (!ROLE_RE.test(role) || !Object.hasOwn(roles, role)) {
    throw new GovernanceError(
      PS5101_GOVERNANCE_CONFIG,
      `"${stripControlCharacters(role)}" is not a role in governance.roles of ${configPath}. Configured: ${stripControlCharacters(configured)}. Use one of them or add the role.`,
      configPath
    );
  }
  const owners: unknown = roles[role];
  if (
    !Array.isArray(owners) ||
    owners.length === 0 ||
    !owners.every((owner) => typeof owner === 'string')
  ) {
    throw new GovernanceError(
      PS5101_GOVERNANCE_CONFIG,
      `governance.roles.${role} in ${configPath} must list the teams or people that review it, for example ['@acme/${role}'].`,
      configPath
    );
  }
  // The rest of the section too: owner format, unknown keys, the role limit.
  const problems = checkGovernanceConfig(governance);
  if (problems.length > 0) {
    throw new GovernanceError(
      PS5101_GOVERNANCE_CONFIG,
      `${problems.map(stripControlCharacters).join('\n')}\nFix the governance section of ${configPath}.`,
      configPath
    );
  }
  return { role, owners: owners.map(stripControlCharacters) };
}

/** Split `<id>@<contentHash>`: a valid prompt id and a full hash, or PS5102. */
export function parseApprovalReference(reference: string | undefined): {
  id: string;
  contentHash: string;
} {
  if (reference === undefined) {
    throw new GovernanceError(
      PS5102_APPROVAL_REFERENCE,
      `Name the prompt version to approve: ${USAGE}`
    );
  }
  const at = reference.lastIndexOf('@');
  const id = at > 0 ? reference.slice(0, at) : reference;
  const contentHash = at > 0 ? reference.slice(at + 1) : '';
  if (!CONTENT_HASH_RE.test(contentHash)) {
    throw new GovernanceError(
      PS5102_APPROVAL_REFERENCE,
      `${stripControlCharacters(reference)} does not end in a full content hash. An approval names one exact version: ${stripControlCharacters(id)}@sha256-<64 hex>. prs approve --list prints the hash the checkout builds.`
    );
  }
  checkPromptId(id);
  return { id, contentHash };
}

/** A prompt id as an approval names it, or PS5102. */
export function checkPromptId(id: string): void {
  // The role takes one directory level, each id segment one more.
  if (!PROMPT_ID_RE.test(id) || id.split('/').length > MAX_APPROVAL_DEPTH - 1) {
    throw new GovernanceError(
      PS5102_APPROVAL_REFERENCE,
      `"${stripControlCharacters(id)}" is not a prompt id. Use <@meta.id>/<key> as the bundle names it: up to ${MAX_APPROVAL_DEPTH - 1} segments of letters, digits, "_", "-" and ".", none ending in a dot.`
    );
  }
}

/** The one environment the approval counts for, or undefined for every environment. */
function approvalScope(project: ReleaseProject, options: ApproveOptions): string | undefined {
  if (options.allEnvironments === true) {
    if (options.env !== undefined) {
      throw new Error('Give --env <environment> or --all-environments, not both.');
    }
    return undefined;
  }
  if (options.env === undefined) {
    throw new Error(
      `Give --env <environment> to approve for one environment, or --all-environments to approve for every one. Configured: ${project.environments.join(', ')}.`
    );
  }
  environmentIndex(project, options.env);
  return options.env;
}

function checkComment(comment: string | undefined): string | undefined {
  if (comment !== undefined && !COMMENT_RE.test(comment)) {
    throw new Error(
      '--comment takes at most 2000 characters, no control characters except newlines and no invisible format characters such as bidi marks. Shorten it, or link the details instead.'
    );
  }
  return comment;
}

/** The approver in the user form `@handle`, or PS5104. */
function checkApprover(approver: string | undefined): string {
  if (approver !== undefined && isApproverHandle(approver)) return approver;
  let problem: string;
  if (approver === undefined) {
    problem = 'Give your Git host user handle with --approver, for example --approver @jane.';
  } else if (!approver.startsWith('@') && approver.includes('@')) {
    problem =
      '--approver takes a Git host user handle like @jane, not an email address, so no address lands in a file name. Use your handle.';
  } else {
    problem = `"${stripControlCharacters(approver)}" is not a Git host user handle. Use @, a letter or digit, then letters, digits, "_", "." or "-" (never two in a row or at the end), up to ${MAX_APPROVER_LENGTH - 1} characters, for example @jane or @jane.doe; a person approves, not a team.`;
  }
  throw new GovernanceError(PS5104_APPROVER_IDENTITY, problem);
}

/**
 * The bundle of the approved hash: a verified release bundle file of the prompt, else the
 * fresh in-memory build of the source. Anything else is PS5103.
 */
async function approvedBundle(
  project: ReleaseProject,
  id: string,
  contentHash: string,
  output: ReleaseOutput
): Promise<{ bundle: PromptBundleV1; warnings: ReleaseDiagnostic[] }> {
  const { paths } = project;
  const file = paths.bundle(contentHash);
  const text = await readReleaseText(file);
  if (text !== undefined) {
    const bundle = verifyBundleText(text, contentHash, file);
    checkBundleFields(bundle, file);
    if (bundle.id !== id) {
      throw new GovernanceError(
        PS5103_UNKNOWN_HASH,
        `${shortHash(contentHash)} is a version of ${stripControlCharacters(bundle.id)}, not of ${id}. Check the prompt id.`,
        file
      );
    }
    return { bundle, warnings: [] };
  }
  output.info('Compiling prompts...');
  const compiled = await compileRelease(project, output.json);
  const built = compiled.bundles.find((candidate) => candidate.id === id);
  if (built?.contentHash === contentHash) {
    return { bundle: built.bundle, warnings: compiled.warnings };
  }
  const builds =
    built === undefined
      ? `${id} is not a prompt of ${compiled.source}`
      : `${id} builds to ${shortHash(built.contentHash)} here`;
  throw new GovernanceError(
    PS5103_UNKNOWN_HASH,
    `${builds} and no release bundle has ${shortHash(contentHash)}. Approve the hash the checkout builds, or one prs release build stored; prs approve --list shows both.`,
    file
  );
}

/**
 * Format, private-use, unassigned, lone surrogate, default-ignorable (variation selectors)
 * and line or paragraph separator code points, which a terminal hides or moves.
 */
const INVISIBLE_RE = /[\p{Cf}\p{Co}\p{Cn}\p{Cs}\p{Default_Ignorable_Code_Point}\p{Zl}\p{Zp}]/gu;

/**
 * Text as the approver must see it: invisible code points as `<U+XXXX>`, so hidden text
 * shows up, and control characters removed, so nothing rewrites the terminal.
 */
function visible(text: string): string {
  const marked = text.replace(
    INVISIBLE_RE,
    (character) =>
      `<U+${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}>`
  );
  return stripControlCharacters(marked);
}

function shownJson(value: unknown, none: string): string {
  const text = JSON.stringify(value);
  return text === undefined || text === '{}' ? none : visible(text);
}

function indented(text: string): string[] {
  return text.split('\n').map((line) => `    ${visible(line)}`);
}

/**
 * Print what the hash is, on stderr, before the record is written: every field the
 * application and the model get from the bundle.
 */
function showBundle(bundle: PromptBundleV1, record: ApprovalRecordV1): void {
  const lines = [
    `Approving ${record.prompt}@${record.contentHash} as ${record.role} for ${record.environment ?? 'every environment'}`,
    `  Description: ${visible(String(bundle.description))}`,
    `  Governance: ${shownJson(bundle.governance, 'none')}`,
    `  Model: ${shownJson(bundle.model, 'none, the application picks it')}`,
    `  Inputs: ${shownJson(bundle.inputs, 'none')}`,
    `  Output: ${shownJson(bundle.output, 'none')}`,
    ...bundle.messages.flatMap((message) => [
      `  ${visible(message.role)} message:`,
      ...indented(message.content),
    ]),
  ];
  console.error(lines.join('\n'));
}

async function approve(
  reference: string | undefined,
  options: ApproveOptions,
  output: ReleaseOutput
): Promise<Partial<ApprovalReport>> {
  const project = await loadReleaseProject(options);
  const { role, owners } = checkRole(project, options.role);
  const { id, contentHash } = parseApprovalReference(reference);
  const environment = approvalScope(project, options);
  const comment = checkComment(options.comment);
  const approver = checkApprover(options.approver);
  const { bundle, warnings } = await approvedBundle(project, id, contentHash, output);

  const record: ApprovalRecordV1 = {
    $schema: APPROVAL_RECORD_SCHEMA_URL,
    prompt: id,
    contentHash,
    role,
    approver: { source: 'asserted', value: approver },
    createdAt: new Date().toISOString(),
    ...(environment === undefined ? {} : { environment }),
    ...(comment === undefined ? {} : { comment }),
  };
  showBundle(bundle, record);

  return withReleaseLock(project.paths, false, () => {
    const { path, warning } = writeApprovalRecord(project.root, record);
    if (warning !== undefined) warnings.push(warning);
    output.success(`Wrote ${path}`);
    output.info(`Commit the file. Its pull request needs a review from ${owners.join(' or ')}.`);
    return Promise.resolve({ record, path, warnings });
  });
}

function invalidWarning(entry: FoundApproval): ReleaseDiagnostic {
  const path = stripControlCharacters(entry.path);
  return {
    code: PS5109_APPROVAL_INVALID,
    message: `${path} ${entry.problem ?? 'is not a valid approval record'}. It never counts; fix or delete it in a commit.`,
    location: { file: path },
  };
}

function misplacedWarning(listed: ListedApproval): ReleaseDiagnostic {
  const path = stripControlCharacters(listed.path);
  const { record } = listed;
  const where =
    listed.trackedPath === undefined
      ? path
      : `${path} (in Git: ${stripControlCharacters(listed.trackedPath)})`;
  return {
    code: PS5109_APPROVAL_INVALID,
    message: `${where} holds an approval of ${record.prompt} by ${record.approver.value} as ${record.role} that belongs at ${listed.expectedPath ?? ''}. It never counts where it is, since CODEOWNERS protects records by the path in Git; move it in a commit.`,
    location: { file: path },
  };
}

function modifiedWarning(listed: ListedApproval): ReleaseDiagnostic {
  const path = stripControlCharacters(listed.path);
  const tracked = stripControlCharacters(listed.trackedPath ?? listed.path);
  return {
    code: PS5109_APPROVAL_INVALID,
    message: `${path} does not hold the bytes Git has for ${tracked}, so it never counts. Restore it with git checkout, or commit the change in a reviewed pull request.`,
    location: { file: path },
  };
}

function unknownRoleWarning(listed: ListedApproval): ReleaseDiagnostic {
  const path = stripControlCharacters(listed.path);
  return {
    code: PS5109_APPROVAL_INVALID,
    message: `${path} approves as ${listed.record.role}, which is not in governance.roles, so it never counts. Add the role or delete the record in a commit.`,
    location: { file: path },
  };
}

function signatureWarning(listed: ListedApproval): ReleaseDiagnostic {
  const path = stripControlCharacters(listed.path);
  return {
    message: `${path} carries a signature, which this version of prs does not check; the record is still only a claim.`,
    location: { file: path },
  };
}

/** The warnings a listed record adds, besides its state. */
function listedWarnings(listed: ListedApproval): ReleaseDiagnostic[] {
  const warnings: ReleaseDiagnostic[] = [];
  if (listed.state === 'modified') warnings.push(modifiedWarning(listed));
  if (listed.state === 'misplaced') warnings.push(misplacedWarning(listed));
  if (listed.state === 'unknown-role') warnings.push(unknownRoleWarning(listed));
  const { record } = listed;
  if (record.signature !== undefined || record.signatureType !== undefined) {
    warnings.push(signatureWarning(listed));
  }
  return warnings;
}

function stateText(entry: ListedApproval): string {
  return entry.state === 'labelled' ? `labelled:${entry.labels.join(',')}` : entry.state;
}

function printList(prompts: ApprovalPromptStatus[]): void {
  if (prompts.length === 0) ConsoleOutput.info('No prompts and no approval records.');
  for (const prompt of prompts) {
    const builds =
      prompt.contentHash === undefined ? 'not in the source' : `builds ${prompt.contentHash}`;
    ConsoleOutput.header(`${prompt.id}  ${builds}`);
    if (prompt.records.length === 0) ConsoleOutput.muted('  no approvals');
    for (const entry of prompt.records) {
      const { record } = entry;
      const scope = record.environment ?? 'all environments';
      const where =
        entry.state === 'misplaced' || entry.state === 'untracked'
          ? `  ${stripControlCharacters(entry.path)}`
          : '';
      ConsoleOutput.info(
        `  ${stateText(entry)}  ${record.role}  ${record.approver.value}  ${scope}  ${shortHash(record.contentHash)}${where}`
      );
    }
  }
}

interface EnvironmentLabel {
  environment: string;
  label: PromptReleaseLabelV1 | undefined;
}

/** What decides the state of a record. */
interface ListContext {
  /** Hash the source builds, by prompt id */
  built: Map<string, string>;
  labels: EnvironmentLabel[];
  /** Role names in governance.roles */
  roles: Set<string>;
  /** The path Git tracks for each record file on disk */
  gitPaths: Map<string, string | undefined>;
  /** The blob id Git has, by tracked path */
  blobs: Map<string, string>;
}

/** A valid record with its state for the prompt it names. */
function listedApproval(
  path: string,
  record: ApprovalRecordV1,
  context: ListContext
): ListedApproval {
  const labels = context.labels
    .filter(({ label }) =>
      label?.prompts.some(
        (prompt) => prompt.id === record.prompt && prompt.contentHash === record.contentHash
      )
    )
    .map(({ environment }) => environment);
  const gitPath = context.gitPaths.get(path);
  if (gitPath === undefined) return { path, labels, record, state: 'untracked' };
  const base = { path, labels, record, ...(gitPath === path ? {} : { trackedPath: gitPath }) };
  // A valid record's file holds exactly these bytes, so they are what Git must have.
  const bytes = new TextEncoder().encode(serializeApprovalRecord(record));
  const blob = context.blobs.get(gitPath) ?? '';
  if (gitBlobId(bytes, blob.length) !== blob) return { ...base, state: 'modified' };
  const expectedPath = approvalRecordPath(record);
  if (gitPath !== expectedPath) return { ...base, state: 'misplaced', expectedPath };
  if (!context.roles.has(record.role)) return { ...base, state: 'unknown-role' };
  if (context.built.get(record.prompt) === record.contentHash) return { ...base, state: 'current' };
  return { ...base, state: labels.length > 0 ? 'labelled' : 'stale' };
}

/** Group the records by prompt, next to every prompt the source builds. */
function promptStatuses(
  id: string | undefined,
  bundles: { id: string; contentHash: string }[],
  found: FoundApproval[],
  context: ListContext
): { prompts: ApprovalPromptStatus[]; warnings: ReleaseDiagnostic[] } {
  const { built } = context;
  const prompts = new Map<string, ApprovalPromptStatus>();
  const status = (promptId: string): ApprovalPromptStatus => {
    const contentHash = built.get(promptId);
    const entry = prompts.get(promptId) ?? {
      id: promptId,
      ...(contentHash === undefined ? {} : { contentHash }),
      records: [],
    };
    prompts.set(promptId, entry);
    return entry;
  };
  for (const bundle of bundles) {
    if (id === undefined || bundle.id === id) status(bundle.id);
  }
  const warnings: ReleaseDiagnostic[] = [];
  for (const entry of found) {
    if (entry.record === undefined) {
      warnings.push(invalidWarning(entry));
    } else if (id === undefined || entry.record.prompt === id) {
      const listed = listedApproval(entry.path, entry.record, context);
      warnings.push(...listedWarnings(listed));
      status(entry.record.prompt).records.push(listed);
    }
  }
  return {
    prompts: [...prompts.values()].sort((a, b) => compareCodeUnits(a.id, b.id)),
    warnings,
  };
}

function configuredRoles(project: ReleaseProject): Set<string> {
  const governance: unknown = project.config.governance;
  const roles = isPlainObject(governance) ? governance['roles'] : undefined;
  return new Set(isPlainObject(roles) ? Object.keys(roles) : []);
}

function checkListOptions(options: ApproveOptions): void {
  const approveOnly = [
    options.role,
    options.approver,
    options.env,
    options.allEnvironments,
    options.comment,
  ];
  if (approveOnly.some((value) => value !== undefined)) {
    throw new Error(
      '--list takes only an optional prompt id. Drop --role, --approver, --env, --all-environments and --comment.'
    );
  }
}

async function list(
  id: string | undefined,
  options: ApproveOptions,
  output: ReleaseOutput
): Promise<Partial<ApprovalReport>> {
  checkListOptions(options);
  if (id !== undefined) checkPromptId(id);
  const project = await loadReleaseProject(options);
  output.info('Compiling prompts...');
  const compiled = await compileRelease(project, output.json);
  const labels = await Promise.all(
    project.environments.map(async (environment) => ({
      environment,
      label: await readLabel(project.paths, environment),
    }))
  );
  const read = findApprovalRecords(project.root);
  // Without a record there is nothing to look up, and a project need not be a repository yet.
  const blobs = read.found.some((entry) => entry.record !== undefined)
    ? await trackedApprovals(project.root)
    : new Map<string, string>();
  const context: ListContext = {
    built: new Map(compiled.bundles.map((bundle) => [bundle.id, bundle.contentHash])),
    labels,
    roles: configuredRoles(project),
    gitPaths: gitPathsOf(project.root, read.found, blobs),
    blobs,
  };
  const { prompts, warnings } = promptStatuses(id, compiled.bundles, read.found, context);
  if (!output.json) printList(prompts);
  return {
    prompts,
    warnings: [...compiled.warnings, ...read.warnings, ...warnings],
  };
}

async function runApproval(
  command: ApprovalReport['command'],
  reference: string | undefined,
  options: ApproveOptions,
  output: ReleaseOutput
): Promise<{ partial: Partial<ApprovalReport>; failureCode: number }> {
  try {
    const partial =
      command === 'list'
        ? await list(reference, options, output)
        : await approve(reference, options, output);
    return { partial, failureCode: 1 };
  } catch (error) {
    const errors = error instanceof ReleaseCompileError ? error.diagnostics : [toDiagnostic(error)];
    const exists = error instanceof PSError && error.code === PS5105_APPROVAL_EXISTS;
    return { partial: { errors }, failureCode: exists ? 2 : 1 };
  }
}

function createApprovalReport(
  command: ApprovalReport['command'],
  partial: Partial<ApprovalReport>
): ApprovalReport {
  const errors = partial.errors ?? [];
  return {
    $schema: APPROVAL_REPORT_SCHEMA_URL,
    version: 1,
    command,
    success: errors.length === 0,
    ...(partial.record === undefined ? {} : { record: partial.record }),
    ...(partial.path === undefined ? {} : { path: partial.path }),
    ...(partial.prompts === undefined ? {} : { prompts: partial.prompts }),
    warnings: partial.warnings ?? [],
    errors,
  };
}

/**
 * `prs approve`: write an approval record for one exact prompt version, or list the
 * records with `--list`. Exit code 0 when written or listed, 1 on an error, 2 when the
 * record exists.
 */
export async function approveCommand(
  reference: string | undefined,
  options: ApproveOptions
): Promise<void> {
  if (options.format !== undefined && options.format !== 'text' && options.format !== 'json') {
    ConsoleOutput.error(
      `Invalid output format: ${stripControlCharacters(options.format)}. Expected text or json.`
    );
    process.exitCode = 1;
    return;
  }
  const output = createOutput(options.format === 'json');
  const command = options.list === true ? 'list' : 'approve';
  const { partial, failureCode } = await runApproval(command, reference, options, output);
  const report = createApprovalReport(command, partial);
  if (output.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const warning of report.warnings) ConsoleOutput.warn(formatDiagnostic(warning));
    for (const error of report.errors) ConsoleOutput.error(formatDiagnostic(error));
  }
  process.exitCode = report.success ? 0 : failureCode;
}
