import {
  approvalRecordPath,
  compareCodeUnits,
  parseApprovalRecord,
  type ApprovalRecordV1,
  type PromptReleaseLabelEntryV2,
} from '@promptscript/core';
import { gitBlobId } from '../approve/records.js';
import { parseLabel, RELEASE_DIRECTORY, RESERVED_RELEASE_NAMES } from '../release/layout.js';
import {
  isNullBlob,
  isRegularMode,
  type BlobReader,
  type FileChange,
  type GitPerson,
  type HistoryCommit,
} from './history.js';
import { experimentEvents } from './experiments.js';
import { inSequence } from './sequence.js';

export type AuditEventType =
  | 'changed'
  | 'approved'
  | 'approval-removed'
  | 'promoted'
  | 'rolled-back'
  | 'label-removed'
  | 'merge-dropped'
  | 'generated'
  | 'config-changed'
  | 'experiment-started'
  | 'experiment-changed'
  | 'experiment-ended';

/**
 * State of an approval record from its bytes and its path alone: `well-formed` sits at the
 * path its fields give, `misplaced` elsewhere, `invalid` is no v1 record in the exact form.
 * A well-formed record still counts in a gate only with a configured role and the review.
 */
export type AuditRecordState = 'well-formed' | 'misplaced' | 'invalid';

/** One arm of an experiment as a label has it; the weight is in basis points. */
export interface AuditExperimentArm {
  variant: string;
  contentHash: string;
  weight: number;
}

/** One audit event. Fields past `path` depend on the type. */
export interface AuditEvent {
  type: AuditEventType;
  commit: string;
  /** Committer date, ISO 8601 */
  at: string;
  author: GitPerson;
  committer: GitPerson;
  /** Path relative to the repository top level */
  path: string;
  /** `changed` and `config-changed`: added, modified or deleted */
  change?: 'A' | 'M' | 'D';
  prompt?: string;
  contentHash?: string;
  role?: string;
  environment?: string;
  approver?: string;
  approverSource?: 'asserted';
  recordCreatedAt?: string;
  comment?: string;
  /** Approval record ceiling in basis points; such a record never approves an entry hash */
  maxWeight?: number;
  state?: AuditRecordState;
  previousContentHash?: string;
  /** The commit is on the first-parent chain of the head; off it, a branch's history */
  mainline: boolean;
  /** The commit is a merge and the change is what it brought to the first parent */
  viaMerge?: true;
  /** `merge-dropped`: the parent whose change the merge did not keep */
  parent?: string;
  /** `merge-dropped` of a label entry: the hash that parent had, absent when it removed it */
  droppedContentHash?: string;
  /** A label of an environment that is not in `releases.environments` */
  configured?: false;
  /** Experiment events: the experiment name */
  experiment?: string;
  /** Experiment events: the arms after the change; for `experiment-ended`, the last arms */
  arms?: AuditExperimentArm[];
  /** `experiment-changed`: the arms before the change */
  previousArms?: AuditExperimentArm[];
  /** `experiment-ended`: the arm whose hash the entry serves now */
  keptVariant?: string;
}

/** The files the log covers, by their path relative to the repository top level. */
export interface AuditSources {
  /** The project directory with a trailing `/`, `''` at the top level */
  projectPrefix: string;
  /** `.prs` files outside the project directory that a prompt is built from */
  extraPrsFiles: ReadonlySet<string>;
  /** Environments in `releases.environments` */
  environments: ReadonlySet<string>;
  configFiles: ReadonlySet<string>;
  codeownersFiles: ReadonlySet<string>;
  /** This project's CODEOWNERS marker line */
  marker: string;
}

/** A commit of the log, and whether it is on the first-parent chain of the head. */
export interface AuditCommit extends HistoryCommit {
  mainline: boolean;
}

/** Something the log could not read; it goes into the warnings. */
export type AuditWarn = (message: string) => void;

export function approvalsDirectory(sources: AuditSources): string {
  return `${sources.projectPrefix}.promptscript/approvals/`;
}

const LABEL_NAME_RE = /^([a-z][a-z0-9-]{0,31})\.json$/;

/** The environment of a label path, configured or not, or undefined for other paths. */
export function labelEnvironment(path: string, sources: AuditSources): string | undefined {
  const directory = `${sources.projectPrefix}${RELEASE_DIRECTORY}/`;
  if (!path.startsWith(directory)) return undefined;
  const environment = LABEL_NAME_RE.exec(path.slice(directory.length))?.[1];
  return environment === undefined || RESERVED_RELEASE_NAMES.has(environment)
    ? undefined
    : environment;
}

/** A `.prs` file of the project, or one outside it that a prompt is built from. */
export function isPrsFile(path: string, sources: AuditSources): boolean {
  return (
    (path.startsWith(sources.projectPrefix) && path.endsWith('.prs')) ||
    sources.extraPrsFiles.has(path)
  );
}

export function baseEvent(commit: AuditCommit, type: AuditEventType, path: string): AuditEvent {
  return {
    type,
    commit: commit.commit,
    at: commit.at,
    author: commit.author,
    committer: commit.committer,
    path,
    mainline: commit.mainline,
    ...(commit.parents.length > 1 ? { viaMerge: true as const } : {}),
  };
}

export function recordFields(record: ApprovalRecordV1): Partial<AuditEvent> {
  return {
    prompt: record.prompt,
    contentHash: record.contentHash,
    role: record.role,
    ...(record.environment === undefined ? {} : { environment: record.environment }),
    approver: record.approver.value,
    approverSource: record.approver.source,
    recordCreatedAt: record.createdAt,
    ...(record.comment === undefined ? {} : { comment: record.comment }),
    ...(record.maxWeight === undefined ? {} : { maxWeight: record.maxWeight }),
  };
}

/** The record of a blob and its state at `path`. */
export async function readRecord(
  read: BlobReader,
  blob: string,
  mode: string,
  path: string,
  sources: AuditSources
): Promise<{ state: AuditRecordState; record?: ApprovalRecordV1 }> {
  if (!isRegularMode(mode)) return { state: 'invalid' };
  const text = await read(blob);
  if (text === undefined) return { state: 'invalid' };
  // Git output is decoded as UTF-8; the bytes count only when they hash back to the blob.
  const bytes = Buffer.from(text, 'utf-8');
  if (gitBlobId(bytes, blob.length) !== blob) return { state: 'invalid' };
  const record = parseApprovalRecord(bytes);
  if (record === undefined) return { state: 'invalid' };
  const projectPath = path.slice(sources.projectPrefix.length);
  return {
    state: approvalRecordPath(record) === projectPath ? 'well-formed' : 'misplaced',
    record,
  };
}

async function approvalEvent(
  commit: AuditCommit,
  type: 'approved' | 'approval-removed',
  file: FileChange,
  read: BlobReader,
  sources: AuditSources
): Promise<AuditEvent> {
  const removed = type === 'approval-removed';
  const blob = removed ? file.oldBlob : file.newBlob;
  const mode = removed ? file.oldMode : file.newMode;
  const { state, record } = await readRecord(read, blob, mode, file.path, sources);
  return {
    ...baseEvent(commit, type, file.path),
    ...(record === undefined ? {} : recordFields(record)),
    state,
  };
}

/** A changed record file: added, deleted, or replaced, which removes one and adds another. */
async function approvalEvents(
  commit: AuditCommit,
  file: FileChange,
  read: BlobReader,
  sources: AuditSources
): Promise<AuditEvent[]> {
  const events: AuditEvent[] = [];
  if (file.change !== 'A') {
    events.push(await approvalEvent(commit, 'approval-removed', file, read, sources));
  }
  if (file.change !== 'D') {
    events.push(await approvalEvent(commit, 'approved', file, read, sources));
  }
  return events;
}

/**
 * Prompt id to entry of one side of a label change: empty when there is no file, undefined
 * with a warning when the file is no readable label.
 */
export async function labelEntryMap(
  read: BlobReader,
  blob: string,
  mode: string,
  environment: string,
  path: string,
  where: string,
  warn: AuditWarn
): Promise<Map<string, PromptReleaseLabelEntryV2> | undefined> {
  if (isNullBlob(blob)) return new Map();
  const text = isRegularMode(mode) ? await read(blob) : undefined;
  try {
    if (text === undefined) throw new Error('not a regular file or too large');
    const label = parseLabel(text, environment, path);
    const prompts: PromptReleaseLabelEntryV2[] = label.prompts;
    return new Map(prompts.map((entry) => [entry.id, entry]));
  } catch {
    warn(`${path} at ${where} is not a release label, so its entries were not read.`);
    return undefined;
  }
}

function hashesOf(entries: ReadonlyMap<string, PromptReleaseLabelEntryV2>): Map<string, string> {
  return new Map([...entries].map(([prompt, entry]) => [prompt, entry.contentHash]));
}

/** Prompt id to hash of one side of a label change, see `labelEntryMap`. */
export async function labelEntries(
  read: BlobReader,
  blob: string,
  mode: string,
  environment: string,
  path: string,
  where: string,
  warn: AuditWarn
): Promise<Map<string, string> | undefined> {
  const entries = await labelEntryMap(read, blob, mode, environment, path, where, warn);
  return entries === undefined ? undefined : hashesOf(entries);
}

/**
 * Hashes each prompt held in each label so far on the first-parent chain, oldest commit
 * first. A side branch only reads it, so its own commits never make a later merge of the
 * same promotion look like a rollback.
 */
type LabelHistory = Map<string, Map<string, Set<string>>>;

/** How one commit reads and updates the label history. */
interface LabelContext {
  history: LabelHistory;
  /** The commit is on the first-parent chain of the head */
  mainline: boolean;
  /** The environment is in `releases.environments` */
  configured: boolean;
  /** Label paths that did not parse at some commit */
  unreadable: Set<string>;
  /** Last readable parsed entries per label path, from mainline commits */
  lastReadable: Map<string, Map<string, PromptReleaseLabelEntryV2>>;
}

function heldHashes(context: LabelContext, environment: string, prompt: string): Set<string> {
  const held = context.history.get(environment) ?? new Map<string, Set<string>>();
  const seen = held.get(prompt) ?? new Set<string>();
  if (context.mainline) {
    context.history.set(environment, held);
    held.set(prompt, seen);
  }
  return seen;
}

/** Entry events of one label file change: removed, then promoted or rolled back. */
function entryEvents(
  commit: AuditCommit,
  path: string,
  environment: string,
  context: LabelContext,
  previous: Map<string, string> | undefined,
  next: Map<string, string>
): AuditEvent[] {
  const remember = (seen: Set<string>, hash: string): void => {
    if (context.mainline) seen.add(hash);
  };
  const configured = context.configured ? {} : { configured: false as const };
  const events: AuditEvent[] = [];
  for (const [prompt, before] of [...(previous ?? [])].sort(([a], [b]) => compareCodeUnits(a, b))) {
    if (next.has(prompt)) continue;
    remember(heldHashes(context, environment, prompt), before);
    events.push({
      ...baseEvent(commit, 'label-removed', path),
      environment,
      prompt,
      previousContentHash: before,
      ...configured,
    });
  }
  for (const [prompt, contentHash] of [...next].sort(([a], [b]) => compareCodeUnits(a, b))) {
    const before = previous?.get(prompt);
    const seen = heldHashes(context, environment, prompt);
    if (before !== undefined) remember(seen, before);
    if (before === contentHash) continue;
    events.push({
      ...baseEvent(commit, seen.has(contentHash) ? 'rolled-back' : 'promoted', path),
      environment,
      prompt,
      contentHash,
      ...(before === undefined ? {} : { previousContentHash: before }),
      ...configured,
    });
    remember(seen, contentHash);
  }
  return events;
}

/**
 * Events of one label file change: ended experiments, then the entry events, then started
 * and changed experiments, so a kept variant reads as ended and then promoted.
 */
async function labelEvents(
  commit: AuditCommit,
  file: FileChange,
  environment: string,
  context: LabelContext,
  read: BlobReader,
  warn: AuditWarn
): Promise<AuditEvent[]> {
  const short = commit.commit.slice(0, 12);
  const parent = commit.parents[0]?.slice(0, 12) ?? 'the parent';
  const readPrevious = await labelEntryMap(
    read,
    file.oldBlob,
    file.oldMode,
    environment,
    file.path,
    parent,
    warn
  );
  const next = await labelEntryMap(
    read,
    file.newBlob,
    file.newMode,
    environment,
    file.path,
    short,
    warn
  );
  if (readPrevious === undefined || next === undefined) context.unreadable.add(file.path);
  // A label that does not parse changes nothing: no entry was promoted or removed by it.
  if (next === undefined) return [];
  // On the mainline an unreadable old side is diffed against the last readable state of the
  // path. A side commit can sit between newer mainline commits, so it never uses that state.
  const previous =
    readPrevious ?? (context.mainline ? context.lastReadable.get(file.path) : undefined);
  if (context.mainline) context.lastReadable.set(file.path, next);
  const entries = entryEvents(
    commit,
    file.path,
    environment,
    context,
    previous === undefined ? undefined : hashesOf(previous),
    hashesOf(next)
  );
  const configured = context.configured ? {} : { configured: false as const };
  const { ended, startedOrChanged } = experimentEvents(
    (type) => baseEvent(commit, type, file.path),
    environment,
    previous,
    next,
    configured
  );
  return [...ended, ...entries, ...startedOrChanged];
}

/** The lines from this project's marker to the end, or undefined without the marker. */
export function managedSection(text: string | undefined, marker: string): string | undefined {
  if (text === undefined) return undefined;
  const lines = text.split('\n').map((line) => line.replace(/\r$/, ''));
  const index = lines.indexOf(marker);
  return index < 0 ? undefined : lines.slice(index).join('\n');
}

async function generatedEvent(
  commit: AuditCommit,
  file: FileChange,
  read: BlobReader,
  sources: AuditSources,
  warn: AuditWarn
): Promise<AuditEvent[]> {
  let tooLarge = false;
  const side = async (blob: string, mode: string): Promise<string | undefined> => {
    if (isNullBlob(blob) || !isRegularMode(mode)) return undefined;
    const text = await read(blob);
    if (text === undefined) tooLarge = true;
    return text;
  };
  const before = await side(file.oldBlob, file.oldMode);
  const after = await side(file.newBlob, file.newMode);
  if (tooLarge) {
    warn(
      `${file.path} at ${commit.commit.slice(0, 12)} or its parent is larger than 1 MiB, so its generated section was not compared.`
    );
    return [];
  }
  const changed = managedSection(before, sources.marker) !== managedSection(after, sources.marker);
  return changed ? [baseEvent(commit, 'generated', file.path)] : [];
}

async function commitEvents(
  commit: AuditCommit,
  sources: AuditSources,
  history: LabelHistory,
  unreadable: Set<string>,
  lastReadable: LabelContext['lastReadable'],
  read: BlobReader,
  warn: AuditWarn
): Promise<AuditEvent[]> {
  const approvals = approvalsDirectory(sources);
  const fileEvents = (file: FileChange): Promise<AuditEvent[]> => {
    const environment = labelEnvironment(file.path, sources);
    if (isPrsFile(file.path, sources)) {
      return Promise.resolve([{ ...baseEvent(commit, 'changed', file.path), change: file.change }]);
    }
    if (file.path.startsWith(approvals) && file.path.endsWith('.json')) {
      return approvalEvents(commit, file, read, sources);
    }
    if (environment !== undefined) {
      const configured = sources.environments.has(environment);
      const context: LabelContext = {
        history,
        mainline: commit.mainline,
        configured,
        unreadable,
        lastReadable,
      };
      return labelEvents(commit, file, environment, context, read, warn);
    }
    if (sources.configFiles.has(file.path)) {
      return Promise.resolve([
        { ...baseEvent(commit, 'config-changed', file.path), change: file.change },
      ]);
    }
    if (sources.codeownersFiles.has(file.path)) {
      return generatedEvent(commit, file, read, sources, warn);
    }
    return Promise.resolve([]);
  };
  // In order: label events of one commit build on each other through the history.
  return (await inSequence(commit.changes, fileEvents)).flat();
}

/** What the events of the commits need besides the commits. */
export interface BuildOptions {
  /** Commits of the first-parent chain of the head */
  mainline: ReadonlySet<string>;
  /** The changes a merge commit did not keep from its parents after the first */
  dropped?: (commit: AuditCommit) => Promise<AuditEvent[]>;
}

export interface BuiltEvents {
  /** Newest commit first */
  events: AuditEvent[];
  /** Label paths that did not parse at some commit */
  unreadableLabels: Set<string>;
}

/**
 * The blobs the events of `commits` read, oldest commit first, as `blobReader` takes them:
 * the sides of approval records, labels and CODEOWNERS files that are regular files.
 */
export function plannedBlobs(commits: readonly HistoryCommit[], sources: AuditSources): string[] {
  const approvals = approvalsDirectory(sources);
  const ids: string[] = [];
  for (const commit of [...commits].reverse()) {
    for (const file of commit.changes) {
      const read =
        (file.path.startsWith(approvals) && file.path.endsWith('.json')) ||
        labelEnvironment(file.path, sources) !== undefined ||
        sources.codeownersFiles.has(file.path);
      if (!read) continue;
      if (!isNullBlob(file.oldBlob) && isRegularMode(file.oldMode)) ids.push(file.oldBlob);
      if (!isNullBlob(file.newBlob) && isRegularMode(file.newMode)) ids.push(file.newBlob);
    }
  }
  return ids;
}

/**
 * The events of the commits, newest commit first. Commits are read oldest first, so a label entry
 * set back to a hash it held before on the mainline commits is a `rolled-back` event.
 */
export async function buildEvents(
  commits: HistoryCommit[],
  options: BuildOptions,
  sources: AuditSources,
  read: BlobReader,
  warn: AuditWarn
): Promise<BuiltEvents> {
  const history: LabelHistory = new Map();
  const unreadable = new Set<string>();
  const lastReadable: LabelContext['lastReadable'] = new Map();
  const unconfigured = new Set<string>();
  for (const commit of commits) {
    for (const file of commit.changes) {
      const environment = labelEnvironment(file.path, sources);
      if (environment !== undefined && !sources.environments.has(environment)) {
        unconfigured.add(environment);
      }
    }
  }
  for (const environment of [...unconfigured].sort(compareCodeUnits)) {
    warn(
      `${sources.projectPrefix}${RELEASE_DIRECTORY}/${environment}.json has history, but ${environment} is not in releases.environments. Its events are shown.`
    );
  }
  const oldestFirst = [...commits];
  oldestFirst.reverse();
  const byCommit = await inSequence(oldestFirst, async (parsed) => {
    const commit: AuditCommit = { ...parsed, mainline: options.mainline.has(parsed.commit) };
    const events = await commitEvents(
      commit,
      sources,
      history,
      unreadable,
      lastReadable,
      read,
      warn
    );
    if (commit.parents.length > 1 && options.dropped !== undefined) {
      events.push(...(await options.dropped(commit)));
    }
    return events;
  });
  // Newest commit first; inside a commit the events keep Git's path order.
  byCommit.reverse();
  return { events: byCommit.flat(), unreadableLabels: unreadable };
}
