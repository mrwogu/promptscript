import { resolve } from 'node:path';
import { type PromptScriptConfig } from '@promptscript/core';
import { CLI_VERSION } from '../../cli-version.js';
import { CONFIG_FILES, loadEffectiveConfig } from '../../config/loader.js';
import { ConsoleOutput } from '../../output/console.js';
import { CODEOWNERS_LOCATIONS } from '../../utils/governance-config.js';
import { GovernanceError, PS5102_APPROVAL_REFERENCE } from '../../utils/governance-error.js';
import {
  resolveProjectConfigPath,
  resolveProjectRoot,
  type ProjectPathOptions,
} from '../../utils/project-config.js';
import type { ReleaseDiagnostic } from '../../utils/release-report.js';
import { checkPromptId } from '../approve/approve.js';
import { codeownersMarker } from '../governance/codeowners-file.js';
import {
  readRepository,
  repoPath,
  sortedUnique,
  type Repository,
} from '../governance/codeowners-paths.js';
import { promptSourceFiles } from '../governance/codeowners-sources.js';
import { runGit, stripControlCharacters } from '../release/git.js';
import { formatDiagnostic, toDiagnostic } from '../release/run.js';
import { approvalsDirectory, buildEvents, type AuditEvent, type AuditSources } from './events.js';
import { assertConsistent, headState, replayMainline, stateMismatches } from './consistency.js';
import { cefLine, textLines } from './format.js';
import { droppedChanges } from './merges.js';
import { blobReader, firstParentChain, gitError, headCommit, readHistory } from './history.js';

export const AUDIT_LOG_SCHEMA_URL = 'https://getpromptscript.dev/schema/audit-log/v1.json';
/** Most events one export keeps. */
export const MAX_AUDIT_LIMIT = 100_000;

const ENVIRONMENT_RE = /^[a-z][a-z0-9-]{0,31}$/;
const HASH_PREFIX_RE = /^(?:sha256-)?[0-9a-f]{4,64}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AuditLogOptions extends ProjectPathOptions {
  prompt?: string;
  env?: string;
  hash?: string;
  since?: string;
  until?: string;
  limit?: string;
  /** `text` (default), `json` or `cef` */
  format?: string;
}

/** The filters of an export, as the JSON document echoes them. */
export interface AuditFilters {
  prompt?: string;
  environment?: string;
  hash?: string;
  since?: string;
  until?: string;
  limit?: number;
}

/** Machine-readable export of `prs audit log --format json`, pinned by `schema/audit-log-v1.json`. */
export interface AuditLogReport {
  $schema: typeof AUDIT_LOG_SCHEMA_URL;
  version: 1;
  success: boolean;
  /** The commit the log was read from */
  head?: string;
  filters: AuditFilters;
  events: AuditEvent[];
  warnings: ReleaseDiagnostic[];
  errors: ReleaseDiagnostic[];
}

interface TimeFilter {
  since?: number;
  until?: number;
}

/** An ISO date or date and time; a date alone ends at the end of that UTC day for `--until`. */
function parseTime(value: string, flag: '--since' | '--until'): number {
  const dateOnly = DATE_RE.test(value);
  const time = dateOnly || DATE_TIME_RE.test(value) ? Date.parse(value) : Number.NaN;
  if (Number.isNaN(time)) {
    throw new TypeError(
      `${flag} takes an ISO date or date and time, for example 2026-10-22 or 2026-10-22T09:00:00Z, not "${stripControlCharacters(value)}".`
    );
  }
  return dateOnly && flag === '--until' ? time + DAY_MS - 1 : time;
}

function parseLimit(value: string): number {
  const limit = /^\d+$/.test(value) ? Number(value) : Number.NaN;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_AUDIT_LIMIT) {
    throw new Error(
      `--limit takes a whole number from 1 to ${MAX_AUDIT_LIMIT}, not "${stripControlCharacters(value)}".`
    );
  }
  return limit;
}

function checkFilters(options: AuditLogOptions): { filters: AuditFilters; time: TimeFilter } {
  const filters: AuditFilters = {};
  const time: TimeFilter = {};
  if (options.prompt !== undefined) {
    checkPromptId(options.prompt);
    filters.prompt = options.prompt;
  }
  if (options.env !== undefined) {
    if (!ENVIRONMENT_RE.test(options.env)) {
      throw new Error(
        `"${stripControlCharacters(options.env)}" is not an environment name. Use lowercase letters, digits and hyphens, starting with a letter.`
      );
    }
    filters.environment = options.env;
  }
  if (options.hash !== undefined) {
    if (!HASH_PREFIX_RE.test(options.hash)) {
      throw new GovernanceError(
        PS5102_APPROVAL_REFERENCE,
        `--hash takes at least 4 lowercase hex digits of a content hash, with or without sha256-, not "${stripControlCharacters(options.hash)}".`
      );
    }
    filters.hash = options.hash.startsWith('sha256-') ? options.hash : `sha256-${options.hash}`;
  }
  if (options.since !== undefined) {
    time.since = parseTime(options.since, '--since');
    filters.since = options.since;
  }
  if (options.until !== undefined) {
    time.until = parseTime(options.until, '--until');
    filters.until = options.until;
  }
  if (time.since !== undefined && time.until !== undefined && time.since > time.until) {
    throw new Error('--since is after --until, so no event can match. Swap the two dates.');
  }
  if (options.limit !== undefined) filters.limit = parseLimit(options.limit);
  return { filters, time };
}

/** Configured environments with a valid name; others have no label file to read. */
function environmentsOf(config: PromptScriptConfig): string[] {
  const environments: unknown = config.releases?.environments;
  return Array.isArray(environments)
    ? environments.filter(
        (name): name is string => typeof name === 'string' && ENVIRONMENT_RE.test(name)
      )
    : [];
}

interface Sources {
  sources: AuditSources;
  /** Files of the `--prompt` prompt in the checkout, when given */
  promptFiles?: ReadonlySet<string>;
}

async function auditSources(
  repo: Repository,
  config: PromptScriptConfig,
  configPath: string,
  configFiles: string[],
  prompt: string | undefined,
  warn: (message: string) => void
): Promise<Sources> {
  const prefix = repo.project === '' ? '' : `${repo.project}/`;
  let promptFiles: Set<string> | undefined;
  if (prompt !== undefined) {
    const files = (await promptSourceFiles(repo, config, configPath)).get(prompt);
    if (files === undefined) {
      warn(
        `${prompt} is not a prompt of the checkout, so no changed events are shown for it. Its approval and release events still are.`
      );
    }
    promptFiles = new Set(files ?? []);
  }
  const configPaths = sortedUnique([
    ...CONFIG_FILES.map((name) => `${prefix}${name}`),
    ...[configPath, ...configFiles].flatMap((file) => {
      const path = repoPath(file, repo);
      return path === undefined || path.endsWith('.prs') ? [] : [path];
    }),
  ]);
  return {
    sources: {
      projectPrefix: prefix,
      extraPrsFiles: new Set([...(promptFiles ?? [])].filter((path) => !path.startsWith(prefix))),
      environments: new Set(environmentsOf(config)),
      configFiles: new Set(configPaths),
      codeownersFiles: new Set(CODEOWNERS_LOCATIONS),
      marker: codeownersMarker(repo.project === '' ? '.' : repo.project),
    },
    ...(promptFiles === undefined ? {} : { promptFiles }),
  };
}

/**
 * Every path the log reads, relative to the top level: the project directory as one literal
 * pathspec, so the argument list stays short, and the files outside it.
 */
function logPaths(sources: AuditSources): string[] {
  const project = sources.projectPrefix === '' ? '.' : sources.projectPrefix.slice(0, -1);
  const outside = [
    ...sources.extraPrsFiles,
    ...sources.configFiles,
    ...sources.codeownersFiles,
  ].filter((path) => project === '.' || !path.startsWith(sources.projectPrefix));
  return [project, ...sortedUnique(outside)];
}

/** Whether an event without a record lies in the prompt's directory under some role. */
function underPrompt(event: AuditEvent, sources: AuditSources, prompt: string): boolean {
  const rest = event.path.slice(approvalsDirectory(sources).length);
  const slash = rest.indexOf('/');
  return slash > 0 && rest.slice(slash + 1).startsWith(`${prompt}/`);
}

function matchesPrompt(event: AuditEvent, sources: Sources, prompt: string | undefined): boolean {
  if (prompt === undefined) return true;
  if (event.type === 'changed') return sources.promptFiles?.has(event.path) === true;
  if (event.prompt !== undefined) return event.prompt === prompt;
  return (
    (event.type === 'approved' ||
      event.type === 'approval-removed' ||
      event.type === 'merge-dropped') &&
    underPrompt(event, sources.sources, prompt)
  );
}

function matchesEnvironment(event: AuditEvent, environment: string | undefined): boolean {
  if (environment === undefined) return true;
  // An approval without an environment counts for every environment.
  if (event.role !== undefined || event.type === 'approved' || event.type === 'approval-removed') {
    return event.prompt !== undefined && (event.environment ?? environment) === environment;
  }
  return event.environment === environment;
}

/**
 * A removed label entry has no new hash, so its previous one is the hash it is about; a
 * dropped label change is about the hash the merge kept and the one it dropped.
 */
function matchesHash(event: AuditEvent, hash: string | undefined): boolean {
  if (hash === undefined) return true;
  const hashes =
    event.type === 'label-removed'
      ? [event.previousContentHash]
      : [event.contentHash, event.droppedContentHash];
  return hashes.some((contentHash) => contentHash?.startsWith(hash) === true);
}

function matches(
  event: AuditEvent,
  sources: Sources,
  filters: AuditFilters,
  time: TimeFilter
): boolean {
  const at = Date.parse(event.at);
  return (
    matchesPrompt(event, sources, filters.prompt) &&
    matchesEnvironment(event, filters.environment) &&
    matchesHash(event, filters.hash) &&
    (time.since === undefined || at >= time.since) &&
    (time.until === undefined || at <= time.until)
  );
}

/** The Git top level of the project, or PS5108 when it is in no repository. */
async function checkRepository(root: string): Promise<void> {
  let result;
  try {
    result = await runGit(['rev-parse', '--show-toplevel'], root);
  } catch (error) {
    throw gitError(error instanceof Error ? error.message : String(error));
  }
  if (result.status !== 0 || result.stdout.trim() === '') {
    throw gitError(`${root} is not in a Git repository`);
  }
}

async function readAuditLog(
  options: AuditLogOptions,
  report: AuditLogReport,
  time: TimeFilter
): Promise<void> {
  const warn = (message: string): void => {
    // One broken file can be read as both sides of a change; say it once.
    if (!report.warnings.some((warning) => warning.message === message)) {
      report.warnings.push({ message });
    }
  };
  const root = resolveProjectRoot(options);
  const configPath =
    resolveProjectConfigPath(root, { ...options, cwd: options.cwd ?? root }) ??
    resolve(root, 'promptscript.yaml');
  const configFiles: string[] = [];
  const config = await loadEffectiveConfig(configPath, undefined, configFiles);
  await checkRepository(root);
  const repo = await readRepository(root);
  const head = await headCommit(repo.top);
  const sources = await auditSources(
    repo,
    config,
    configPath,
    configFiles,
    report.filters.prompt,
    warn
  );
  const commits = await readHistory(repo.top, head, logPaths(sources.sources));
  const mainline = await firstParentChain(repo.top, head);
  const read = blobReader(repo.top);
  const dropped = { top: repo.top, sources: sources.sources, read, warn };
  const { events, unreadableLabels } = await buildEvents(
    commits,
    { mainline, dropped: (commit) => droppedChanges(commit, dropped) },
    sources.sources,
    read,
    warn
  );
  // A shape of history the log does not model must fail, not show a wrong trail.
  const atHead = await headState(repo.top, head, sources.sources, read);
  assertConsistent(stateMismatches(replayMainline(events), atHead, unreadableLabels));
  const kept = events.filter((event) => matches(event, sources, report.filters, time));
  report.head = head;
  report.events = report.filters.limit === undefined ? kept : kept.slice(0, report.filters.limit);
}

/**
 * Characters JSON leaves as they are but a terminal or log viewer hides or moves: DEL, C1,
 * bidi controls, zero-width characters, line and paragraph separators and BOM.
 */
const HIDDEN_RE =
  /[\u007f-\u009f\u061c\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g;

/**
 * The report as JSON with hidden characters written as `\uXXXX`. They only occur inside
 * strings, so escaping them keeps the same JSON value.
 */
export function jsonText(report: AuditLogReport): string {
  return JSON.stringify(report, null, 2).replace(
    HIDDEN_RE,
    (character) => String.raw`\u` + (character.codePointAt(0) ?? 0).toString(16).padStart(4, '0')
  );
}

function printText(report: AuditLogReport): void {
  if (report.head !== undefined) console.log(`head ${report.head}`);
  for (const event of report.events) {
    for (const line of textLines(event)) console.log(line);
  }
  if (report.success && report.events.length === 0) ConsoleOutput.muted('No events.');
}

function printReport(report: AuditLogReport, format: string): void {
  if (format === 'json') {
    console.log(jsonText(report));
    return;
  }
  if (format === 'cef') {
    for (const event of report.events) {
      console.log(cefLine(event, report.head ?? '', CLI_VERSION));
    }
  } else {
    printText(report);
  }
  for (const warning of report.warnings) console.error(`Warning: ${formatDiagnostic(warning)}`);
  for (const error of report.errors) ConsoleOutput.error(formatDiagnostic(error));
}

/**
 * `prs audit log`: the governance history of the project from Git, newest first. Exit
 * code 0 with the events, 1 on an error.
 */
export async function auditLogCommand(options: AuditLogOptions): Promise<void> {
  const format = options.format ?? 'text';
  if (format !== 'text' && format !== 'json' && format !== 'cef') {
    ConsoleOutput.error(
      `Invalid output format: ${stripControlCharacters(format)}. Expected text, json or cef.`
    );
    process.exitCode = 1;
    return;
  }
  const report: AuditLogReport = {
    $schema: AUDIT_LOG_SCHEMA_URL,
    version: 1,
    success: true,
    filters: {},
    events: [],
    warnings: [],
    errors: [],
  };
  try {
    const { filters, time } = checkFilters(options);
    report.filters = filters;
    await readAuditLog(options, report, time);
  } catch (error) {
    report.success = false;
    report.events = [];
    report.errors.push(toDiagnostic(error));
  }
  printReport(report, format);
  process.exitCode = report.success ? 0 : 1;
}
