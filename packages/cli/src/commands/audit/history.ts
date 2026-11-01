import { GovernanceError, PS5108_GIT_UNAVAILABLE } from '../../utils/governance-error.js';
import {
  errorMessage,
  readBlobs,
  runGit,
  stripControlCharacters,
  type BlobBatch,
  type GitResult,
} from '../release/git.js';

/** Largest log output read; more fails closed with PS5108. */
const MAX_LOG_BYTES = 256 * 1024 * 1024;
/** Largest blob read; a larger file is reported as too large, never parsed. */
export const MAX_BLOB_BYTES = 1024 * 1024;

const COMMIT_MARK = '\u0001';
// One NUL-separated field each: hash, parents, committer date, author, committer.
const LOG_FORMAT = `${COMMIT_MARK}%H%x00%P%x00%cI%x00%an%x00%ae%x00%cn%x00%ce`;
const HEADER_FIELDS = 7;
const MODE_RE = /^\d{6}$/;
const BLOB_RE = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const SHALLOW_FIX =
  'Fetch the full history, for example with actions/checkout fetch-depth: 0 or git fetch --unshallow.';

export interface GitPerson {
  name: string;
  email: string;
}

/** One file a commit added, modified or deleted, from `git log --raw`. */
export interface FileChange {
  change: 'A' | 'M' | 'D';
  /** Path relative to the repository top level, as Git has it */
  path: string;
  oldMode: string;
  newMode: string;
  oldBlob: string;
  newBlob: string;
}

export interface HistoryCommit {
  commit: string;
  parents: string[];
  /** Committer date, strict ISO 8601 */
  at: string;
  author: GitPerson;
  committer: GitPerson;
  changes: FileChange[];
}

/** A file mode of a regular file; links and submodules are never read as files. */
export function isRegularMode(mode: string): boolean {
  return mode === '100644' || mode === '100755';
}

/** A blob id of all zeros: no file on that side of the change. */
export function isNullBlob(blob: string): boolean {
  return /^0+$/.test(blob);
}

export function gitError(reason: string): GovernanceError {
  const sentence = reason.endsWith('.') ? reason.slice(0, -1) : reason;
  return new GovernanceError(
    PS5108_GIT_UNAVAILABLE,
    `Git cannot read the audit history: ${sentence}. Run the command in a Git checkout with the full history and git on PATH.`
  );
}

async function git(args: string[], top: string, maxBuffer?: number): Promise<GitResult> {
  try {
    return await runGit(args, top, maxBuffer === undefined ? {} : { maxBuffer });
  } catch (error) {
    throw gitError(error instanceof Error ? error.message : String(error));
  }
}

/**
 * A raw entry: `:<old mode> <new mode> <old blob> <new blob> <status>` for a commit with
 * one parent, or the combined form of a merge with n parents, `::...` with n colons,
 * n + 1 modes, n + 1 blobs and n status letters. The first parent is the old side, so a
 * merge reads as the change it made to the branch it was merged into.
 */
function toChange(meta: string, path: string): FileChange | undefined {
  const parents = /^:+/.exec(meta)?.[0].length ?? 0;
  const fields = meta.slice(parents).split(' ');
  const modes = fields.slice(0, parents + 1);
  const blobs = fields.slice(parents + 1, 2 * parents + 2);
  const status = fields[2 * parents + 2] ?? '';
  if (parents === 0 || !modes.every((mode) => MODE_RE.test(mode))) return undefined;
  if (blobs.length !== parents + 1 || !blobs.every((blob) => BLOB_RE.test(blob))) return undefined;
  if (!/^[A-Z]/.test(status)) return undefined;
  const oldMode = modes[0] ?? '';
  const newMode = modes[parents] ?? '';
  const oldBlob = blobs[0] ?? '';
  const newBlob = blobs[parents] ?? '';
  // A type change (T) or a merge result replaces the content like a modification does.
  let change: FileChange['change'] = 'M';
  if (isNullBlob(oldBlob)) change = 'A';
  else if (isNullBlob(newBlob)) change = 'D';
  return { change, path, oldMode, newMode, oldBlob, newBlob };
}

/**
 * Parse `git log -z --raw` output written with {@link LOG_FORMAT}. Paths are taken by
 * position after their raw entry, so no file name can start a commit or an entry.
 */
export function parseHistory(output: string): HistoryCommit[] {
  const tokens = output.split('\0');
  const commits: HistoryCommit[] = [];
  let index = 0;
  while (index < tokens.length) {
    const token = (tokens[index] ?? '').replace(/^\n+/, '');
    if (token.startsWith(COMMIT_MARK)) {
      const fields = [token.slice(1), ...tokens.slice(index + 1, index + HEADER_FIELDS)];
      const [commit = '', parents = '', at = '', an = '', ae = '', cn = '', ce = ''] = fields;
      commits.push({
        commit,
        parents: parents.split(' ').filter((parent) => parent !== ''),
        at,
        author: { name: an, email: ae },
        committer: { name: cn, email: ce },
        changes: [],
      });
      index += HEADER_FIELDS;
    } else if (token.startsWith(':')) {
      const change = toChange(token, tokens[index + 1] ?? '');
      if (change !== undefined) commits.at(-1)?.changes.push(change);
      index += 2;
    } else {
      index += 1;
    }
  }
  return commits;
}

/**
 * The commit HEAD names. A repository without commits, or a shallow one whose history
 * would end early, is PS5108.
 */
export async function headCommit(top: string): Promise<string> {
  const shallow = await git(['rev-parse', '--is-shallow-repository'], top);
  if (shallow.status !== 0) throw gitError(stripControlCharacters(shallow.stderr.trim()));
  if (shallow.stdout.trim() === 'true') {
    throw gitError(`the checkout is a shallow clone, so its history is cut off. ${SHALLOW_FIX}`);
  }
  const head = await git(['rev-parse', '--verify', '--quiet', 'HEAD^{commit}'], top);
  const commit = head.stdout.trim();
  if (head.status !== 0 || commit === '') {
    throw gitError('the repository has no commit yet. Commit the project first');
  }
  return commit;
}

/** Options that keep the log stable whatever the user's Git config says. */
const LOG_OPTIONS = [
  '--no-mailmap',
  '--no-renames',
  '--no-show-signature',
  '--no-relative',
  '--no-ext-diff',
  '--no-notes',
  '--encoding=UTF-8',
];

/**
 * Every commit reachable from `head` that changed one of `paths` (relative to the top
 * level, a directory covers what is under it), newest first, with the changed files.
 */
export async function readHistory(
  top: string,
  head: string,
  paths: string[]
): Promise<HistoryCommit[]> {
  if (paths.length === 0) return [];
  const result = await git(
    [
      // The root commit counts too, whatever log.showRoot says.
      '-c',
      'log.showRoot=true',
      'log',
      ...LOG_OPTIONS,
      '--date-order',
      // Every side branch, and what a merge brought to the mainline: its diff against the
      // first parent, so a version a merge takes over from the side is an event too.
      '--full-history',
      '--diff-merges=first-parent',
      '--raw',
      '--no-abbrev',
      '-z',
      `--format=${LOG_FORMAT}`,
      head,
      '--',
      ...paths,
    ],
    top,
    MAX_LOG_BYTES
  );
  if (result.status !== 0) throw gitError(stripControlCharacters(result.stderr.trim()));
  return parseHistory(result.stdout);
}

/**
 * Every best common ancestor of two commits (several after criss-cross merges), empty for
 * unrelated histories.
 */
export async function mergeBases(top: string, a: string, b: string): Promise<string[]> {
  const result = await git(['merge-base', '--all', a, b], top);
  // Status 1 without output: no common ancestor.
  if (result.status === 1 && result.stdout.trim() === '') return [];
  if (result.status !== 0) throw gitError(stripControlCharacters(result.stderr.trim()));
  return result.stdout.split('\n').filter((line) => line.trim() !== '');
}

/** The files that differ between two commits under `paths`, from `git diff-tree -r --raw`. */
export async function diffTrees(
  top: string,
  from: string,
  to: string,
  paths: string[]
): Promise<FileChange[]> {
  const result = await git(
    ['diff-tree', '-r', '-z', '--no-renames', '--no-abbrev', from, to, '--', ...paths],
    top,
    MAX_LOG_BYTES
  );
  if (result.status !== 0) throw gitError(stripControlCharacters(result.stderr.trim()));
  const tokens = result.stdout.split('\0');
  const changes: FileChange[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = (tokens[index] ?? '').replace(/^\n+/, '');
    if (!token.startsWith(':')) continue;
    const change = toChange(token, tokens[index + 1] ?? '');
    if (change !== undefined) changes.push(change);
    index++;
  }
  return changes;
}

/**
 * The commits of the first-parent chain of `head`, the mainline: label history is tracked
 * along it, so a side branch does not change what counts as held before.
 */
export async function firstParentChain(top: string, head: string): Promise<Set<string>> {
  const result = await git(['rev-list', '--first-parent', head], top, MAX_LOG_BYTES);
  if (result.status !== 0) throw gitError(stripControlCharacters(result.stderr.trim()));
  return new Set(result.stdout.split('\n').filter((commit) => commit !== ''));
}

/** Reads blobs once each; `undefined` for a blob over {@link MAX_BLOB_BYTES} or not UTF-8 text. */
export type BlobReader = (blob: string) => Promise<string | undefined>;

/** Most raw blob bytes held at once; one batch keeps no more than what is left of it. */
const BLOB_CACHE_BYTES = 32 * 1024 * 1024;
/** Most blobs one `git cat-file --batch` is asked for. */
const BLOB_BATCH_SIZE = 256;
const MISSING_BLOB_HINT =
  'A partial clone does not fetch it here; fetch the full history, for example with actions/checkout fetch-depth: 0 or git fetch --unshallow.';

/**
 * A reader of blobs by id with `git cat-file --batch`. `planned` lists the ids in the order
 * they are going to be read, repeats included. A read that is not cached asks Git for that
 * blob and the planned ones after it in one process, as many as fit the cache by the size
 * of the blobs seen so far (at most {@link BLOB_BATCH_SIZE}), so many revisions cost a few
 * processes, not one each. An id outside the plan is read alone. Bytes are held up to
 * {@link BLOB_CACHE_BYTES}: room is made first from blobs the reads have passed, and a
 * dropped blob is read again if needed. Git runs without lazy fetch, so a blob a partial
 * clone lacks is PS5108, as is any Git failure; the Git timeout covers one batch.
 */
export function blobReader(
  top: string,
  planned: readonly string[] = [],
  load: typeof readBlobs = readBlobs
): BlobReader {
  const occurrences = new Map<string, number[]>();
  planned.forEach((id, index) => occurrences.set(id, [...(occurrences.get(id) ?? []), index]));
  const cache = new Map<string, Buffer>();
  const tooLarge = new Set<string>();
  let cachedBytes = 0;
  let cursor = 0;
  let seenBytes = 0;
  let seenBlobs = 0;

  const drop = (id: string): void => {
    cachedBytes -= cache.get(id)?.length ?? 0;
    cache.delete(id);
  };

  const isPassed = (id: string): boolean => (occurrences.get(id)?.at(-1) ?? -1) < cursor;

  /** Make room for a batch: blobs the reads have passed first, then the oldest held. */
  const makeRoom = (): void => {
    for (const id of [...cache.keys()].filter(isPassed)) {
      if (cachedBytes <= BLOB_CACHE_BYTES / 2) break;
      drop(id);
    }
    for (const id of [...cache.keys()]) {
      if (cachedBytes <= BLOB_CACHE_BYTES - MAX_BLOB_BYTES) break;
      drop(id);
    }
  };

  /** Where `blob` is read next in the plan, and the cursor moves there. */
  const locate = (blob: string): number | undefined => {
    const all = occurrences.get(blob);
    const at = all?.find((index) => index >= cursor) ?? all?.at(-1);
    if (at !== undefined) cursor = Math.max(cursor, at);
    return at;
  };

  const fetchBlobs = async (blob: string, at: number | undefined): Promise<void> => {
    makeRoom();
    const budget = BLOB_CACHE_BYTES - cachedBytes;
    const average = seenBlobs === 0 ? MAX_BLOB_BYTES : seenBytes / seenBlobs;
    const count = Math.max(1, Math.min(BLOB_BATCH_SIZE, Math.floor(budget / average)));
    // A read behind the cursor is a second look at a blob; what follows it was read already.
    const next = at === undefined || at < cursor ? [] : planned.slice(at + 1, at + count);
    const ids = new Set([blob, ...next.filter((id) => !cache.has(id) && !tooLarge.has(id))]);
    let batch: BlobBatch;
    try {
      batch = await load([...ids], top, { maxBytes: MAX_BLOB_BYTES, budgetBytes: budget });
    } catch (error) {
      throw gitError(stripControlCharacters(errorMessage(error)));
    }
    if (batch.missing.has(blob)) throw gitError(`blob ${blob} is missing. ${MISSING_BLOB_HINT}`);
    for (const id of batch.tooLarge) tooLarge.add(id);
    for (const [id, content] of batch.blobs) {
      cache.set(id, content);
      cachedBytes += content.length;
      seenBytes += content.length;
      seenBlobs++;
    }
  };

  return async (blob) => {
    if (tooLarge.has(blob)) return undefined;
    const at = locate(blob);
    if (!cache.has(blob)) await fetchBlobs(blob, at);
    // Git output was always read as UTF-8 with bad bytes replaced; a record is still
    // checked against its blob id where it is parsed.
    return cache.get(blob)?.toString('utf-8');
  };
}
