import { compareCodeUnits, type PromptReleaseLabelEntryV2 } from '@promptscript/core';
import { runGit, stripControlCharacters } from '../release/git.js';
import { RELEASE_DIRECTORY } from '../release/layout.js';
import {
  approvalsDirectory,
  labelEntryMap,
  labelEnvironment,
  type AuditEvent,
  type AuditExperimentArm,
  type AuditSources,
} from './events.js';
import { armsOf } from './experiments.js';
import { gitError, type BlobReader } from './history.js';
import { inSequence } from './sequence.js';

/** Record paths and label entries as the mainline events leave them. */
export interface ReplayedState {
  records: Set<string>;
  /** Label path to prompt id to hash */
  labels: Map<string, Map<string, string>>;
  /** Label path to prompt id to the experiment as text, see `experimentKey` */
  experiments: Map<string, Map<string, string>>;
}

/**
 * Apply the events of the first-parent chain, oldest first, to an empty checkout. Off-chain
 * events never reached the head on their own, and a merge brings its changes in its own
 * events, so they are left out.
 * @param events - Newest first, as the log has them
 */
export function replayMainline(events: readonly AuditEvent[]): ReplayedState {
  const state: ReplayedState = { records: new Set(), labels: new Map(), experiments: new Map() };
  for (const event of oldestCommitFirst(events)) {
    if (event.mainline) applyEvent(state, event);
  }
  return state;
}

/** The events with their commits oldest first, the events of one commit in their own order. */
function oldestCommitFirst(events: readonly AuditEvent[]): AuditEvent[] {
  const commits: AuditEvent[][] = [];
  for (const event of events) {
    const last = commits.at(-1);
    if (last?.[0]?.commit === event.commit) last.push(event);
    else commits.push([event]);
  }
  commits.reverse();
  return commits.flat();
}

function isExperimentEvent(event: AuditEvent): boolean {
  return (
    event.type === 'experiment-started' ||
    event.type === 'experiment-changed' ||
    event.type === 'experiment-ended'
  );
}

/** An experiment event applied: started and changed set the experiment, ended drops it. */
function applyExperiment(state: ReplayedState, event: AuditEvent, prompt: string): void {
  const experiments = state.experiments.get(event.path) ?? new Map<string, string>();
  state.experiments.set(event.path, experiments);
  if (event.type === 'experiment-ended') {
    experiments.delete(prompt);
  } else {
    experiments.set(prompt, experimentKey(event.experiment ?? '', event.arms ?? []));
  }
}

/**
 * `tone control@hash=9000 warm@hash=1000`. Names, variants and hashes hold no space, `@` or
 * `=`, so the text tells two experiments apart and can be shown as it is.
 */
function experimentKey(name: string, arms: readonly AuditExperimentArm[]): string {
  const text = arms.map((arm) => `${arm.variant}@${arm.contentHash}=${arm.weight}`).join(' ');
  return `${name} ${text}`;
}

/** One event applied to the record paths and label entries. */
function applyEvent(state: ReplayedState, event: AuditEvent): void {
  if (event.type === 'approved') state.records.add(event.path);
  if (event.type === 'approval-removed') state.records.delete(event.path);
  if (event.prompt === undefined) return;
  if (isExperimentEvent(event)) {
    applyExperiment(state, event, event.prompt);
    return;
  }
  const label = state.labels.get(event.path) ?? new Map<string, string>();
  state.labels.set(event.path, label);
  if (event.type === 'promoted' || event.type === 'rolled-back') {
    label.set(event.prompt, event.contentHash ?? '');
  } else if (event.type === 'label-removed') {
    label.delete(event.prompt);
  }
}

/** A regular file, link or submodule entry of `git ls-tree -r -z`: `<mode> <type> <id>\t<path>`. */
const TREE_ENTRY_RE = /^(\d{6}) \w+ ([0-9a-f]{40}|[0-9a-f]{64})\t(.+)$/s;

/** The record paths and label entries the head has. Labels that do not parse are left out. */
export async function headState(
  top: string,
  head: string,
  sources: AuditSources,
  read: BlobReader
): Promise<ReplayedState> {
  const approvals = approvalsDirectory(sources);
  const releases = `${sources.projectPrefix}${RELEASE_DIRECTORY}`;
  let listed;
  try {
    listed = await runGit(
      ['ls-tree', '-r', '-z', head, '--', approvals.slice(0, -1), releases],
      top,
      { maxBuffer: 256 * 1024 * 1024 }
    );
  } catch (error) {
    throw gitError(error instanceof Error ? error.message : String(error));
  }
  if (listed.status !== 0) throw gitError(stripControlCharacters(listed.stderr.trim()));
  const state: ReplayedState = { records: new Set(), labels: new Map(), experiments: new Map() };
  const labels: { mode: string; blob: string; path: string; environment: string }[] = [];
  for (const entry of listed.stdout.split('\0')) {
    const [, mode = '', blob = '', path = ''] = TREE_ENTRY_RE.exec(entry) ?? [];
    if (path.startsWith(approvals) && path.endsWith('.json')) state.records.add(path);
    const environment = labelEnvironment(path, sources);
    if (environment !== undefined) labels.push({ mode, blob, path, environment });
  }
  const ignore = (): void => {
    // A label that does not parse at the head was warned about at its commit.
  };
  const entries = await inSequence(labels, (label) =>
    labelEntryMap(read, label.blob, label.mode, label.environment, label.path, 'HEAD', ignore)
  );
  labels.forEach((label, index) => {
    const found = entries[index];
    if (found !== undefined) addLabel(state, label.path, found);
  });
  return state;
}

function addLabel(
  state: ReplayedState,
  path: string,
  entries: ReadonlyMap<string, PromptReleaseLabelEntryV2>
): void {
  const hashes = new Map<string, string>();
  const experiments = new Map<string, string>();
  for (const [prompt, entry] of entries) {
    hashes.set(prompt, entry.contentHash);
    if (entry.experiment === undefined) continue;
    experiments.set(prompt, experimentKey(entry.experiment.name, armsOf(entry.experiment)));
  }
  state.labels.set(path, hashes);
  state.experiments.set(path, experiments);
}

function shown(entries: Map<string, string> | undefined): string {
  return [...(entries ?? [])]
    .sort(([a], [b]) => compareCodeUnits(a, b))
    .map(([prompt, hash]) => `${prompt}@${hash}`)
    .join(', ');
}

/** `prompt:name control@hash=9000, warm@hash=1000` per experiment. */
function shownExperiments(experiments: Map<string, string> | undefined): string {
  return [...(experiments ?? [])]
    .sort(([a], [b]) => compareCodeUnits(a, b))
    .map(([prompt, key]) => `${prompt}:${key}`)
    .join(', ');
}

/**
 * What the replayed mainline and the head disagree on: record paths and label entries.
 * Labels that did not parse at some commit cannot be replayed and are skipped.
 */
export function stateMismatches(
  replayed: ReplayedState,
  head: ReplayedState,
  unreadableLabels: ReadonlySet<string>
): string[] {
  const problems: string[] = [];
  for (const path of [...replayed.records].filter((record) => !head.records.has(record))) {
    problems.push(`${path} is in the log but not at the head`);
  }
  for (const path of [...head.records].filter((record) => !replayed.records.has(record))) {
    problems.push(`${path} is at the head but no event added it`);
  }
  const labels = new Set([
    ...replayed.labels.keys(),
    ...head.labels.keys(),
    ...replayed.experiments.keys(),
    ...head.experiments.keys(),
  ]);
  for (const path of [...labels].sort(compareCodeUnits)) {
    if (unreadableLabels.has(path)) continue;
    const logged = shown(replayed.labels.get(path));
    const actual = shown(head.labels.get(path));
    if (logged !== actual) {
      problems.push(`${path} holds [${actual}] at the head, but the log leads to [${logged}]`);
    }
    const runs = shownExperiments(head.experiments.get(path));
    const logRuns = shownExperiments(replayed.experiments.get(path));
    if (runs !== logRuns) {
      problems.push(`${path} runs [${runs}] at the head, but the log leads to [${logRuns}]`);
    }
  }
  return problems.sort(compareCodeUnits);
}

/** PS5108 when the mainline events do not lead to the records and labels of the head. */
export function assertConsistent(problems: string[]): void {
  if (problems.length === 0) return;
  throw gitError(
    `the history has a change the log cannot explain: ${problems.map(stripControlCharacters).join('; ')}. Report this with the shape of the merge that made it`
  );
}
