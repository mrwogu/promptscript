import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, readdirSync, type Stats } from 'node:fs';
import { join } from 'node:path';
import {
  approvalRecordPath,
  compareCodeUnits,
  parseApprovalRecord,
  isPromptId,
  serializeApprovalRecord,
  type ApprovalRecordV1,
} from '@promptscript/core';
import {
  GovernanceError,
  PS5105_APPROVAL_EXISTS,
  PS5108_GIT_UNAVAILABLE,
  PS5109_APPROVAL_INVALID,
} from '../../utils/governance-error.js';
import type { ReleaseDiagnostic } from '../../utils/release-report.js';
import { createFileExclusive } from '../../utils/write-file-atomic.js';
import {
  errorMessage,
  readBlobs,
  runGit,
  stripControlCharacters,
  type BlobBatch,
  type GitResult,
} from '../release/git.js';
import { readRegularFile, UnreadableFileError } from '../release/layout.js';

/** Approval records live here, next to the release files. */
export const APPROVALS_DIRECTORY = '.promptscript/approvals';
/** Directory levels read below the approvals directory: the role and up to 7 id segments. */
export const MAX_APPROVAL_DEPTH = 8;

/** Is this a prompt id an approval can name: the pattern, and few enough segments to fit. */
export function isApprovalPromptId(id: string): boolean {
  // The role takes one directory level, each id segment one more.
  return isPromptId(id) && id.split('/').length <= MAX_APPROVAL_DEPTH - 1;
}

/** Most files and directories one read takes. */
export const MAX_APPROVAL_ENTRIES = 10_000;
/** Largest record file read. */
const MAX_RECORD_BYTES = 64 * 1024;

/**
 * Keeps Git from converting the line endings of records under `core.autocrlf`, since a
 * record counts only with the exact bytes `prs approve` writes.
 */
const ATTRIBUTES_RULE = '* -text';
const ATTRIBUTES_PATH = `${APPROVALS_DIRECTORY}/.gitattributes`;
const ATTRIBUTES_TEXT = `# Approval records must keep their exact bytes, so Git never converts them.\n${ATTRIBUTES_RULE}\n`;

/** One `.json` file found under the approvals directory. */
export interface FoundApproval {
  /** Project-relative path with `/` separators */
  path: string;
  /** The record, when the file holds a valid one */
  record?: ApprovalRecordV1;
  /** Why the file holds no valid record */
  problem?: string;
}

/** Record files and the warnings of one read of the approvals directory. */
export interface FoundApprovals {
  /** Sorted by path */
  found: FoundApproval[];
  warnings: ReleaseDiagnostic[];
}

function absolute(root: string, path: string): string {
  return join(root, ...path.split('/'));
}

function child(parent: string, name: string): string {
  return parent === '' ? name : `${parent}/${name}`;
}

function treeError(path: string, problem: string): GovernanceError {
  const shown = stripControlCharacters(path);
  return new GovernanceError(
    PS5109_APPROVAL_INVALID,
    `${shown} ${problem}. Approval records live in plain directories inside the project, named exactly as their path says; fix or remove it in a commit.`,
    shown
  );
}

/**
 * One component of a path below the project root, as `lstat` sees it, or undefined when
 * it is missing. The name must be listed by `readdir` exactly: a name that differs only
 * in case is PS5109, since a case-insensitive disk would use it while Git sees another.
 */
function exactEntry(root: string, parent: string, name: string): Stats | undefined {
  const names = readdirSync(parent === '' ? root : absolute(root, parent));
  if (names.includes(name)) return lstatSync(absolute(root, child(parent, name)));
  const clash = names.find((entry) => entry.toLowerCase() === name.toLowerCase());
  if (clash !== undefined) {
    throw treeError(child(parent, name), `differs only in case from the existing ${clash}`);
  }
  return undefined;
}

function assertDirectory(path: string, details: Stats): void {
  if (details.isSymbolicLink() || !details.isDirectory()) {
    throw treeError(path, 'is a symbolic link or not a directory');
  }
}

function existsError(record: ApprovalRecordV1, path: string): GovernanceError {
  return new GovernanceError(
    PS5105_APPROVAL_EXISTS,
    `An approval by ${record.approver.value} as ${record.role} for this hash exists: ${path}. To withdraw it, delete it in a commit. To change its scope, comment or ceiling, delete the file in the same change and approve again.`,
    path
  );
}

/**
 * Walk the record path from the project root. Each existing directory is checked before
 * a missing one below it is created, and the record itself must not exist.
 */
function prepareRecordPath(root: string, path: string, record: ApprovalRecordV1): void {
  const directories = path.split('/');
  const name = directories.pop() ?? '';
  let parent = '';
  for (const directory of directories) {
    const current = child(parent, directory);
    const details = exactEntry(root, parent, directory);
    if (details === undefined) mkdirSync(absolute(root, current));
    else assertDirectory(current, details);
    parent = current;
  }
  const existing = exactEntry(root, parent, name);
  if (existing?.isFile()) throw existsError(record, path);
  if (existing !== undefined) throw treeError(path, 'exists and is not a regular file');
}

/**
 * Write a new approval record at its computed path, after the `.gitattributes` rule,
 * so no record lands without it. An existing record is never replaced: that is PS5105.
 * @returns The project-relative path of the record, and a warning about the rule
 */
export function writeApprovalRecord(
  root: string,
  record: ApprovalRecordV1
): { path: string; warning?: ReleaseDiagnostic } {
  const path = approvalRecordPath(record);
  prepareRecordPath(root, path, record);
  const warning = ensureApprovalAttributes(root);
  try {
    createFileExclusive(absolute(root, path), serializeApprovalRecord(record), 0o644);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw existsError(record, path);
    throw error;
  }
  return warning === undefined ? { path } : { path, warning };
}

/**
 * Write `.promptscript/approvals/.gitattributes` with `* -text` when it is missing. An
 * existing file is kept, with a warning when it lacks the rule.
 */
export function ensureApprovalAttributes(root: string): ReleaseDiagnostic | undefined {
  const path = absolute(root, ATTRIBUTES_PATH);
  try {
    createFileExclusive(path, ATTRIBUTES_TEXT, 0o644);
    return undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  let problem = `has no "${ATTRIBUTES_RULE}" line`;
  try {
    const text = readRegularFile(path, MAX_RECORD_BYTES)?.toString('utf-8');
    if (text?.split(/\r?\n/).some((line) => line.trim() === ATTRIBUTES_RULE)) return undefined;
  } catch (error) {
    if (!(error instanceof UnreadableFileError)) throw error;
    problem = `${error.message}, so its rules do not apply`;
  }
  return {
    message: `${ATTRIBUTES_PATH} ${problem}. Make it a regular file with a "${ATTRIBUTES_RULE}" line, or a checkout with core.autocrlf changes the line endings of records and they stop counting.`,
    location: { file: ATTRIBUTES_PATH },
  };
}

function readFound(root: string, path: string): FoundApproval {
  let bytes: Buffer | undefined;
  try {
    bytes = readRegularFile(absolute(root, path), MAX_RECORD_BYTES);
  } catch (error) {
    if (error instanceof UnreadableFileError) return { path, problem: error.message };
    throw error;
  }
  if (bytes === undefined) return { path, problem: 'was removed while it was read' };
  const record = parseApprovalRecord(bytes);
  if (record !== undefined) return { path, record };
  const problem = bytes.includes(0x0d)
    ? `has CRLF line endings, likely from core.autocrlf. Restore LF line endings and add "${ATTRIBUTES_RULE}" to ${ATTRIBUTES_PATH}`
    : 'is not a v1 approval record in the exact form prs approve writes';
  return { path, problem };
}

/** Whether the approvals directory exists. A link or a file on the way is PS5109. */
function hasApprovalsDirectory(root: string): boolean {
  let parent = '';
  for (const name of APPROVALS_DIRECTORY.split('/')) {
    const details = exactEntry(root, parent, name);
    if (details === undefined) return false;
    parent = child(parent, name);
    assertDirectory(parent, details);
  }
  return true;
}

interface PendingDirectory {
  path: string;
  depth: number;
}

/** Read a record file, queue a directory, or report a link, which is never followed. */
function visit(
  root: string,
  path: string,
  depth: number,
  result: FoundApprovals,
  pending: PendingDirectory[]
): void {
  const details = lstatSync(absolute(root, path));
  if (details.isSymbolicLink()) {
    result.found.push({ path, problem: 'is a symbolic link, which is never followed' });
  } else if (details.isDirectory() && depth < MAX_APPROVAL_DEPTH) {
    pending.push({ path, depth: depth + 1 });
  } else if (details.isDirectory()) {
    result.warnings.push({
      message: `${stripControlCharacters(path)} is more than ${MAX_APPROVAL_DEPTH} levels below ${APPROVALS_DIRECTORY}, so it was not read. Records never sit that deep; remove it.`,
    });
  } else if (path.endsWith('.json')) {
    result.found.push(readFound(root, path));
  }
}

function sortedByPath(result: FoundApprovals): FoundApprovals {
  result.found.sort((a, b) => compareCodeUnits(a.path, b.path));
  return result;
}

/**
 * Find the record files under the approvals directory, one file at a time and without
 * following a link. Directories below {@link MAX_APPROVAL_DEPTH} levels and anything
 * after {@link MAX_APPROVAL_ENTRIES} files and directories are not read, with a warning.
 */
export function findApprovalRecords(root: string): FoundApprovals {
  const result: FoundApprovals = { found: [], warnings: [] };
  if (!hasApprovalsDirectory(root)) return result;
  const pending: PendingDirectory[] = [{ path: APPROVALS_DIRECTORY, depth: 0 }];
  let entries = 0;
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const names = readdirSync(absolute(root, next.path)).sort(compareCodeUnits);
    for (const name of names) {
      if (entries >= MAX_APPROVAL_ENTRIES) {
        result.warnings.push({
          message: `Reading stopped after ${MAX_APPROVAL_ENTRIES} files and directories in ${APPROVALS_DIRECTORY}; the rest was not read. Delete records of prompts that are gone.`,
        });
        return sortedByPath(result);
      }
      entries++;
      visit(root, `${next.path}/${name}`, next.depth, result, pending);
    }
  }
  return sortedByPath(result);
}

/** A `git ls-files -s -z` entry of a regular file at stage 0: `<mode> <blob id> 0\t<path>`. */
const INDEX_ENTRY_RE = /^100(?:644|755) ([0-9a-f]{40}|[0-9a-f]{64}) 0\t(.+)$/s;

/**
 * The blob id Git has for each record path it tracks, from `git ls-files -s`, by path
 * relative to the project root. A record counts only under the path Git has for it, since
 * CODEOWNERS matches that path and not the one a case-insensitive disk shows, and only with
 * the bytes Git has, since those are the reviewed ones. Every path is read: the output
 * limit bounds the size, and more output fails closed with PS5108.
 */
export async function trackedApprovals(root: string): Promise<Map<string, string>> {
  let listed: GitResult;
  try {
    listed = await runGit(['ls-files', '-s', '-z', '--', APPROVALS_DIRECTORY], root, {
      maxBuffer: MAX_APPROVAL_ENTRIES * 1024,
    });
  } catch (error) {
    throw gitError(error instanceof Error ? error.message : String(error), root);
  }
  if (listed.status !== 0) throw gitError(stripControlCharacters(listed.stderr.trim()), root);
  const blobs = new Map<string, string>();
  for (const entry of listed.stdout.split('\0')) {
    const [, blob, path] = INDEX_ENTRY_RE.exec(entry) ?? [];
    if (blob !== undefined && path !== undefined) blobs.set(path, blob);
  }
  return blobs;
}

/**
 * A `git ls-tree -r -z -l` entry of a regular file: `<mode> blob <blob id> <size>\t<path>`.
 * The size is `BAD` for a blob Git does not have.
 */
const TREE_ENTRY_RE = /^100(?:644|755) blob ([0-9a-f]{40}|[0-9a-f]{64}) +(\S+)\t(.+)$/s;
/** What to do about a blob at HEAD that Git does not have. */
const MISSING_BLOB_FIX =
  'A partial clone (--filter, or actions/checkout `filter:`) does not have it. Clone without a filter, or include .promptscript/approvals in the sparse checkout';

/** One record file as committed at HEAD. */
export interface CommittedApproval {
  /** Path relative to the project root, as Git has it */
  path: string;
  /** The record, when the blob holds a valid one */
  record?: ApprovalRecordV1;
}

/** Two paths that differ only in case are one file on a case-insensitive disk. */
function refuseCaseDuplicates(paths: readonly string[]): void {
  const seen = new Map<string, string>();
  for (const path of paths) {
    const other = seen.get(path.toLowerCase());
    if (other !== undefined) {
      const shown = stripControlCharacters(path);
      throw new GovernanceError(
        PS5109_APPROVAL_INVALID,
        `${stripControlCharacters(other)} and ${shown} differ only in case, and a case-insensitive disk keeps one of them. No approval counts until one is deleted in a commit.`,
        shown
      );
    }
    seen.set(path.toLowerCase(), path);
  }
}

/** A regular file committed under the approvals directory. */
export interface CommittedFile {
  /** Path relative to the project root, as Git has it */
  path: string;
  blob: string;
  /** Size of the blob in bytes; undefined for a blob Git does not have, as in a partial clone */
  size: number | undefined;
}

/**
 * The regular files committed at HEAD under the approvals directory, listed once with
 * `git ls-tree`, so only committed records count: a record that is only staged or edited
 * changes nothing. Links, submodules and trees are no files and never records. Two paths
 * that differ only in case are PS5109.
 */
export async function committedApprovalFiles(root: string): Promise<CommittedFile[]> {
  let listed: GitResult;
  try {
    listed = await runGit(['ls-tree', '-r', '-z', '-l', 'HEAD', '--', APPROVALS_DIRECTORY], root, {
      maxBuffer: MAX_APPROVAL_ENTRIES * 1024,
    });
  } catch (error) {
    throw gitError(error instanceof Error ? error.message : String(error), root);
  }
  if (listed.status !== 0) throw gitError(stripControlCharacters(listed.stderr.trim()), root);
  const files = listed.stdout.split('\0').flatMap((entry): CommittedFile[] => {
    const [, blob, size, path] = TREE_ENTRY_RE.exec(entry) ?? [];
    if (blob === undefined || size === undefined || path === undefined) return [];
    // A blob this run does not need may be missing; committedRecords refuses one it needs.
    if (size === 'BAD') return [{ blob, path, size: undefined }];
    if (!/^\d+$/.test(size)) {
      throw gitError(
        `git ls-tree printed size "${stripControlCharacters(size)}" for ${blob}`,
        root
      );
    }
    return [{ blob, path, size: Number(size) }];
  });
  refuseCaseDuplicates(files.map((file) => file.path));
  return files;
}

/** The files below `<approvals>/<role>/<prompt>/` of any of the prompts and roles. */
export function approvalFilesOf<T extends { path: string }>(
  files: readonly T[],
  prompts: readonly string[],
  roles: readonly string[]
): T[] {
  const prefixes = prompts.flatMap((prompt) =>
    roles.map((role) => `${APPROVALS_DIRECTORY}/${role}/${prompt}/`)
  );
  return files.filter(({ path }) => prefixes.some((prefix) => path.startsWith(prefix)));
}

/**
 * The records of committed files, read with one `git cat-file --batch`. A blob larger than
 * a record can be is never read and has no record, nor has a blob that is no record. A blob
 * Git does not have, bytes that do not hash to their blob id, or any Git failure is PS5108,
 * so a Git problem never shows as a missing approval.
 */
export async function committedRecords(
  root: string,
  files: readonly CommittedFile[]
): Promise<CommittedApproval[]> {
  const absent = files.filter((file) => file.size === undefined);
  if (absent.length > 0) {
    const blobs = absent.map((file) => file.blob).join(', ');
    throw gitError(`Git has no blob ${blobs}. ${MISSING_BLOB_FIX}`, root);
  }
  const small = files.filter((file) => file.size !== undefined && file.size <= MAX_RECORD_BYTES);
  let read: BlobBatch;
  try {
    read = await readBlobs(
      small.map((file) => file.blob),
      root,
      { maxBytes: MAX_RECORD_BYTES }
    );
  } catch (error) {
    throw gitError(errorMessage(error), root);
  }
  if (read.missing.size > 0) {
    throw gitError(`Git has no blob ${[...read.missing].join(', ')}. ${MISSING_BLOB_FIX}`, root);
  }
  // cat-file does not check that an object holds what its id says.
  const corrupt = [...read.blobs].filter(([blob, bytes]) => gitBlobId(bytes, blob.length) !== blob);
  if (corrupt.length > 0) {
    throw gitError(
      `the object store holds other bytes for blob ${corrupt.map(([blob]) => blob).join(', ')}. Run git fsck and restore the object from a clean clone`,
      root
    );
  }
  return files.map(({ path, blob }) => {
    const bytes = read.blobs.get(blob);
    const record = bytes === undefined ? undefined : parseApprovalRecord(bytes);
    return record === undefined ? { path } : { path, record };
  });
}

function gitError(reason: string, root: string): GovernanceError {
  const sentence = reason.endsWith('.') ? reason.slice(0, -1) : reason;
  return new GovernanceError(
    PS5108_GIT_UNAVAILABLE,
    `Git cannot read the approval records in ${root}: ${sentence}. Records count only as files Git tracks, so run this in a Git checkout with git on PATH.`
  );
}

/**
 * The Git blob id of file content, in the hash of the repository: SHA-1 for 40 hex digits,
 * SHA-256 for 64.
 */
export function gitBlobId(content: Uint8Array, idLength: number): string {
  // Git's own object id format, so the weak hash is not a choice made here.
  return createHash(idLength === 64 ? 'sha256' : 'sha1') // NOSONAR
    .update(`blob ${content.length}\0`)
    .update(content)
    .digest('hex');
}

/**
 * The path Git tracks for each record file found on disk: the same bytes, or another
 * spelling that a case-insensitive disk resolves to the same file (`Legal/` for the
 * `legal/` directory). Undefined for a file Git does not track.
 */
export function gitPathsOf(
  root: string,
  found: FoundApproval[],
  tracked: Map<string, string>
): Map<string, string | undefined> {
  const fileId = (path: string): string | undefined => {
    const details = lstatSync(absolute(root, path), { throwIfNoEntry: false });
    return details?.isFile() ? `${details.dev}:${details.ino}` : undefined;
  };
  const onDisk = new Set(found.map((entry) => entry.path));
  const byFile = new Map<string, string>();
  for (const path of tracked.keys()) {
    const id = onDisk.has(path) ? undefined : fileId(path);
    if (id !== undefined) byFile.set(id, path);
  }
  return new Map(
    found.map((entry): [string, string | undefined] => {
      if (tracked.has(entry.path)) return [entry.path, entry.path];
      const id = fileId(entry.path);
      return [entry.path, id === undefined ? undefined : byFile.get(id)];
    })
  );
}
