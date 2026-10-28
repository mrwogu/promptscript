import { compareCodeUnits } from '@promptscript/core';
import { RELEASE_DIRECTORY } from '../release/layout.js';
import {
  approvalsDirectory,
  baseEvent,
  labelEntries,
  labelEnvironment,
  managedSection,
  readRecord,
  recordFields,
  type AuditCommit,
  type AuditEvent,
  type AuditSources,
  type AuditWarn,
} from './events.js';
import {
  diffTrees,
  isNullBlob,
  isRegularMode,
  mergeBases,
  type BlobReader,
  type FileChange,
} from './history.js';
import { inSequence } from './sequence.js';

/** What finding the changes a merge dropped needs. */
export interface DroppedContext {
  top: string;
  sources: AuditSources;
  read: BlobReader;
  warn: AuditWarn;
}

/** The directories and files whose changes a merge must not drop silently. */
function mergePaths(sources: AuditSources): string[] {
  return [
    approvalsDirectory(sources).slice(0, -1),
    `${sources.projectPrefix}${RELEASE_DIRECTORY}`,
    ...sources.codeownersFiles,
  ];
}

function isRecordPath(path: string, sources: AuditSources): boolean {
  return path.startsWith(approvalsDirectory(sources)) && path.endsWith('.json');
}

async function droppedRecord(
  event: AuditEvent,
  side: FileChange,
  merged: FileChange,
  context: DroppedContext
): Promise<AuditEvent> {
  // The record as the parent left it, or as the merge kept it when the parent deleted it.
  const [blob, mode] =
    side.change === 'D' ? [merged.newBlob, merged.newMode] : [side.newBlob, side.newMode];
  if (isNullBlob(blob)) return { ...event, change: side.change };
  const { state, record } = await readRecord(context.read, blob, mode, side.path, context.sources);
  return {
    ...event,
    change: side.change,
    ...(record === undefined ? {} : recordFields(record)),
    state,
  };
}

async function droppedEntries(
  event: AuditEvent,
  environment: string,
  side: FileChange,
  merged: FileChange,
  context: DroppedContext
): Promise<AuditEvent[]> {
  const where = event.commit.slice(0, 12);
  const entries = (blob: string, mode: string): Promise<Map<string, string> | undefined> =>
    labelEntries(context.read, blob, mode, environment, side.path, where, context.warn);
  const before = await entries(side.oldBlob, side.oldMode);
  const parent = await entries(side.newBlob, side.newMode);
  const kept = await entries(merged.newBlob, merged.newMode);
  const configured = context.sources.environments.has(environment)
    ? {}
    : { configured: false as const };
  if (before === undefined || parent === undefined || kept === undefined) {
    return [{ ...event, environment, ...configured }];
  }
  const prompts = [...new Set([...before.keys(), ...parent.keys()])].sort(compareCodeUnits);
  return prompts.flatMap((prompt) => {
    const dropped = parent.get(prompt);
    const contentHash = kept.get(prompt);
    if (dropped === before.get(prompt) || contentHash === dropped) return [];
    return [
      {
        ...event,
        environment,
        prompt,
        ...(contentHash === undefined ? {} : { contentHash }),
        ...(dropped === undefined ? {} : { droppedContentHash: dropped }),
        ...configured,
      },
    ];
  });
}

async function droppedSection(
  event: AuditEvent,
  side: FileChange,
  merged: FileChange,
  context: DroppedContext
): Promise<AuditEvent[]> {
  const text = async (blob: string, mode: string): Promise<string | undefined> =>
    isNullBlob(blob) || !isRegularMode(mode) ? undefined : context.read(blob);
  const { marker } = context.sources;
  const before = managedSection(await text(side.oldBlob, side.oldMode), marker);
  const parent = managedSection(await text(side.newBlob, side.newMode), marker);
  const kept = managedSection(await text(merged.newBlob, merged.newMode), marker);
  return before !== parent && kept !== parent ? [event] : [];
}

/** The changes of `parent` since `base` that the merge result does not have. */
async function droppedFrom(
  commit: AuditCommit,
  parent: string,
  base: string,
  context: DroppedContext
): Promise<AuditEvent[]> {
  const { sources, top } = context;
  const paths = mergePaths(sources);
  const tracked = (path: string): boolean =>
    isRecordPath(path, sources) ||
    labelEnvironment(path, sources) !== undefined ||
    sources.codeownersFiles.has(path);
  const changes = (await diffTrees(top, base, parent, paths)).filter((change) =>
    tracked(change.path)
  );
  if (changes.length === 0) return [];
  const merged = new Map(
    (await diffTrees(top, parent, commit.commit, paths)).map((change) => [change.path, change])
  );
  const dropped = changes.flatMap((side) => {
    const kept = merged.get(side.path);
    return kept === undefined ? [] : [{ side, kept }];
  });
  const events = await inSequence(dropped, async ({ side, kept }) => {
    const event: AuditEvent = { ...baseEvent(commit, 'merge-dropped', side.path), parent };
    const environment = labelEnvironment(side.path, sources);
    if (isRecordPath(side.path, sources)) return [await droppedRecord(event, side, kept, context)];
    if (environment !== undefined) {
      return droppedEntries(event, environment, side, kept, context);
    }
    return droppedSection(event, side, kept, context);
  });
  return events.flat();
}

/**
 * The changes a merge did not keep from each parent after the first: a record, label entry
 * or generated CODEOWNERS section the parent changed since the merge base, which the merge
 * result has in another form. The first-parent diff of the merge cannot show these.
 */
export async function droppedChanges(
  commit: AuditCommit,
  context: DroppedContext
): Promise<AuditEvent[]> {
  const { top } = context;
  const [first, ...others] = commit.parents;
  if (first === undefined) return [];
  const perParent = await inSequence(others, async (parent) => {
    const bases = await mergeBases(top, first, parent);
    if (bases.length === 0) {
      context.warn(
        `Merge ${commit.commit.slice(0, 12)} joins unrelated histories, so the changes it dropped from ${parent.slice(0, 12)} were not checked.`
      );
    }
    // After criss-cross merges a change can show against one base only, so every base counts.
    return (await inSequence(bases, (base) => droppedFrom(commit, parent, base, context))).flat();
  });
  const events = new Map<string, AuditEvent>();
  for (const event of perParent.flat()) {
    const key = [event.parent, event.path, event.prompt, event.droppedContentHash].join('\0');
    if (!events.has(key)) events.set(key, event);
  }
  return [...events.values()];
}
