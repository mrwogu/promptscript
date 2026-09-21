/**
 * Managed output worker - spawnable backend for guarded filesystem
 * operations on compiled output directories.
 *
 * Security model: the parent process spawns this worker with its cwd pinned
 * to the verified output directory and passes entry names relative to that
 * directory. The worker re-verifies the directory identity (device + inode)
 * before every operation, refuses symlinks, verifies file identity and
 * content hashes before touching anything, creates temporary files with
 * O_EXCL | O_NOFOLLOW, fsyncs, and renames/links atomically. On any
 * unexpected state it skips and reports instead of proceeding.
 *
 * The module is deliberately self-contained (Node builtins only, no relative
 * imports) so it can be spawned directly as TypeScript source in development
 * (Node type stripping) and as the bundled managed-output-worker.js in
 * published installs.
 *
 * Entry contract, kept from the previous inline-script protocol:
 * - operation arguments via argv: <op> <name> <directory dev> <directory ino> ...
 * - file content (when needed) via stdin
 * - one status word via stdout: removed | rewritten | created | ready | skipped
 */
import { createHash } from 'node:crypto';
import {
  closeSync,
  constants,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';

/** Hidden CLI command that dispatches to this worker. */
export const MANAGED_OUTPUT_WORKER_COMMAND = '__managed-output-worker';

/** Status words reported on stdout, kept identical to the inline scripts. */
export const WORKER_STATUSES = {
  removed: 'removed',
  rewritten: 'rewritten',
  created: 'created',
  ready: 'ready',
  skipped: 'skipped',
} as const;

/** Arguments of one guarded operation, as passed through argv. */
export interface ManagedOutputOperationArgs {
  name: string;
  directoryDev: string;
  directoryIno: string;
  fileDev?: string;
  fileIno?: string;
  expectedHash?: string;
  requestedMode?: string;
}

/** Pinned-directory arguments shared by every operation. */
interface PinnedDirectoryArgs {
  name: string;
  directoryDev: string;
  directoryIno: string;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function isEntryName(name: string): boolean {
  return (
    name !== '' && name !== '.' && name !== '..' && !name.includes('/') && !name.includes('\\')
  );
}

/**
 * Reject dot and traversal names and verify the directory identity of the
 * cwd. Returns false when the operation must be skipped.
 */
function isPinnedDirectory(args: PinnedDirectoryArgs): boolean {
  if (!isEntryName(args.name)) return false;
  const directory = statSync('.');
  return String(directory.dev) === args.directoryDev && String(directory.ino) === args.directoryIno;
}

function isRegularFileIdentity(
  file: {
    isFile(): boolean;
    isSymbolicLink(): boolean;
    dev: number | bigint;
    ino: number | bigint;
  },
  fileDev: string | undefined,
  fileIno: string | undefined
): boolean {
  return (
    file.isFile() &&
    !file.isSymbolicLink() &&
    fileDev !== undefined &&
    fileIno !== undefined &&
    String(file.dev) === fileDev &&
    String(file.ino) === fileIno
  );
}

function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

/** Guarded unlink: only removes a regular file with a verified identity. */
function guardedUnlink(args: ManagedOutputOperationArgs): string {
  if (!isPinnedDirectory(args)) return WORKER_STATUSES.skipped;
  let file;
  try {
    file = lstatSync(args.name);
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') return WORKER_STATUSES.skipped;
    throw error;
  }
  if (!isRegularFileIdentity(file, args.fileDev, args.fileIno)) return WORKER_STATUSES.skipped;
  if (args.expectedHash) {
    const currentHash = sha256(readFileSync(args.name));
    if (currentHash !== args.expectedHash) return WORKER_STATUSES.skipped;
  }
  unlinkSync(args.name);
  return WORKER_STATUSES.removed;
}

/** Temporary file name for atomic rewrite/create, unique per process. */
function temporaryName(name: string): string {
  return `.${name}.promptscript-${process.pid}-${Date.now()}`;
}

/** Guarded rewrite: replace file content only when it still matches expectations. */
function guardedRewrite(args: ManagedOutputOperationArgs, content: Buffer): string {
  if (!isPinnedDirectory(args)) return WORKER_STATUSES.skipped;
  let file;
  try {
    file = lstatSync(args.name);
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') return WORKER_STATUSES.skipped;
    throw error;
  }
  if (!isRegularFileIdentity(file, args.fileDev, args.fileIno)) return WORKER_STATUSES.skipped;
  const expectedHash = args.expectedHash ?? '';
  if (sha256(readFileSync(args.name)) !== expectedHash) return WORKER_STATUSES.skipped;

  const temporary = temporaryName(args.name);
  let temporaryCreated = false;
  try {
    const descriptor = openSync(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      args.requestedMode === undefined || args.requestedMode === ''
        ? file.mode & 0o777
        : Number(args.requestedMode) & 0o777
    );
    temporaryCreated = true;
    try {
      writeFileSync(descriptor, content);
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }

    // The file must still be the same regular file with the same content at
    // the moment of the swap, otherwise the race was lost.
    const latest = lstatSync(args.name);
    const latestHash = sha256(readFileSync(args.name));
    if (!isRegularFileIdentity(latest, args.fileDev, args.fileIno) || latestHash !== expectedHash) {
      unlinkSync(temporary);
      temporaryCreated = false;
      return WORKER_STATUSES.skipped;
    }
    renameSync(temporary, args.name);
    temporaryCreated = false;
    return WORKER_STATUSES.rewritten;
  } finally {
    if (temporaryCreated) {
      try {
        unlinkSync(temporary);
      } catch {
        // Best effort cleanup of a temp file the swap never consumed.
      }
    }
  }
}

/** Guarded create: create a new file via link() so it never clobbers an existing entry. */
function guardedCreate(args: ManagedOutputOperationArgs, content: Buffer): string {
  if (!isPinnedDirectory(args)) return WORKER_STATUSES.skipped;
  try {
    lstatSync(args.name);
    return WORKER_STATUSES.skipped;
  } catch (error: unknown) {
    if (!isNodeError(error) || error.code !== 'ENOENT') throw error;
  }

  const temporary = temporaryName(args.name);
  let temporaryCreated = false;
  try {
    const descriptor = openSync(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      Number(args.requestedMode)
    );
    temporaryCreated = true;
    try {
      writeFileSync(descriptor, content);
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
    linkSync(temporary, args.name);
    unlinkSync(temporary);
    temporaryCreated = false;
    return WORKER_STATUSES.created;
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'EEXIST') return WORKER_STATUSES.skipped;
    throw error;
  } finally {
    if (temporaryCreated) {
      try {
        unlinkSync(temporary);
      } catch {
        // Best effort cleanup of a temp file the link never consumed.
      }
    }
  }
}

/** Guarded mkdir: create a directory, tolerating EEXIST, never accepting a symlink. */
function guardedMkdir(args: ManagedOutputOperationArgs): string {
  if (!isPinnedDirectory(args)) return WORKER_STATUSES.skipped;
  try {
    mkdirSync(args.name);
  } catch (error: unknown) {
    if (!isNodeError(error) || error.code !== 'EEXIST') throw error;
  }
  const created = lstatSync(args.name);
  if (!created.isDirectory() || created.isSymbolicLink()) return WORKER_STATUSES.skipped;
  return WORKER_STATUSES.ready;
}

/** Reject incomplete operation arguments with a protocol error. */
function requireDirectoryArgs(
  op: string,
  name: string | undefined,
  directoryDev: string | undefined,
  directoryIno: string | undefined
): { name: string; directoryDev: string; directoryIno: string } {
  if (name === undefined || directoryDev === undefined || directoryIno === undefined) {
    throw new Error(`Managed output worker received incomplete arguments for ${op}`);
  }
  return { name, directoryDev, directoryIno };
}

/**
 * Run one guarded operation and return its status word. Throws on protocol
 * violations (unknown operation, missing arguments) and unexpected
 * filesystem errors; callers report them as worker failures.
 *
 * Argument positions are flat and operation-specific, exactly like the
 * inline scripts this worker replaced.
 */
export function performManagedOutputOperation(op: string, args: string[]): string {
  switch (op) {
    case 'unlink': {
      const [name, directoryDev, directoryIno, fileDev, fileIno, expectedHash] = args;
      const dir = requireDirectoryArgs(op, name, directoryDev, directoryIno);
      return guardedUnlink({ ...dir, fileDev, fileIno, expectedHash });
    }
    case 'rewrite': {
      const [name, directoryDev, directoryIno, fileDev, fileIno, expectedHash, requestedMode] =
        args;
      const dir = requireDirectoryArgs(op, name, directoryDev, directoryIno);
      return guardedRewrite(
        { ...dir, fileDev, fileIno, expectedHash, requestedMode },
        readFileSync(0)
      );
    }
    case 'create': {
      const [name, directoryDev, directoryIno, requestedMode] = args;
      const dir = requireDirectoryArgs(op, name, directoryDev, directoryIno);
      return guardedCreate({ ...dir, requestedMode }, readFileSync(0));
    }
    case 'mkdir': {
      const [name, directoryDev, directoryIno] = args;
      const dir = requireDirectoryArgs(op, name, directoryDev, directoryIno);
      return guardedMkdir(dir);
    }
    default:
      throw new Error(`Unknown managed output worker operation: ${op}`);
  }
}

/**
 * Run the worker protocol for a full argument list (`<op> <args...>`).
 * Returns the process exit code: 0 when the operation reported a status
 * word, 1 on unexpected failures.
 */
export function runManagedOutputWorkerProtocol(opArgs: string[]): number {
  const [op, ...rest] = opArgs;
  if (op === undefined) {
    return 1;
  }
  try {
    process.stdout.write(performManagedOutputOperation(op, rest));
    return 0;
  } catch {
    return 1;
  }
}

let dispatchedAsWorker = false;

// Entry dispatch: runs when this process was spawned as a worker - either
// `node managed-output-worker.js __managed-output-worker <op> ...` (node and
// deno run) or `<compiled binary> __managed-output-worker <op> ...` (deno
// compile). Importing the module normally (tests, the CLI bundle) never
// passes the hidden command, so this is a no-op there. Uses exitCode instead
// of process.exit so stdout can drain before the process exits, and records
// the dispatch so the CLI runner does not also parse the worker arguments.
if (process.argv[2] === MANAGED_OUTPUT_WORKER_COMMAND) {
  dispatchedAsWorker = true;
  process.exitCode = runManagedOutputWorkerProtocol(process.argv.slice(3));
}

/**
 * True when this process handled the hidden worker command and already
 * finished. The CLI runner checks this before parsing arguments.
 */
export function wasDispatchedAsManagedOutputWorker(): boolean {
  return dispatchedAsWorker;
}
