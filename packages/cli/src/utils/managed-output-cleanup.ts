import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { lstat, open, readFile, readdir, rmdir, unlink, type FileHandle } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import type { FormatterOutput } from '@promptscript/compiler';

const execFileAsync = promisify(execFile);
const PROMPTSCRIPT_MARKER_PATTERNS = [
  /^<!-- PromptScript \d{4}-\d{2}-\d{2}T[\d:.]+Z \| source: .+ \| target: .+ - do not edit -->$/,
  /^# promptscript-generated: \d{4}-\d{2}-\d{2}T[\d:.]+Z \| source: .+ \| target: .+$/,
] as const;
const GUARDED_UNLINK_SCRIPT = String.raw`
const fs = require('node:fs');
const [name, directoryDev, directoryIno, fileDev, fileIno] = process.argv.slice(1);
const skip = () => process.stdout.write('skipped');
if (!name || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
  skip();
  process.exit(0);
}
const directory = fs.statSync('.');
if (String(directory.dev) !== directoryDev || String(directory.ino) !== directoryIno) {
  skip();
  process.exit(0);
}
let file;
try {
  file = fs.lstatSync(name);
} catch (error) {
  if (error && error.code === 'ENOENT') {
    skip();
    process.exit(0);
  }
  throw error;
}
if (
  !file.isFile() ||
  file.isSymbolicLink() ||
  String(file.dev) !== fileDev ||
  String(file.ino) !== fileIno
) {
  skip();
  process.exit(0);
}
fs.unlinkSync(name);
process.stdout.write('removed');
`;

export interface ManagedOutputCleanupResult {
  /** Obsolete files removed, or that would be removed in dry-run mode */
  removed: string[];
  /** Managed directories pruned because they became empty */
  removedDirectories: string[];
}

export interface ManagedOutputCleanupOptions {
  /** Absolute base directory used to resolve formatter output paths */
  outputRoot: string;
  /** Report actions without modifying the filesystem */
  dryRun?: boolean;
}

interface DirectoryGuard {
  path: string;
  handle: FileHandle;
}

interface FileIdentity {
  dev: number | bigint;
  ino: number | bigint;
}

/**
 * Remove obsolete generated files from formatter-declared managed directories.
 *
 * Only regular files carrying a PromptScript marker are eligible. Directory
 * symlinks and file symlinks are skipped, and unmarked files are preserved.
 */
export async function cleanupManagedOutputs(
  outputs: Map<string, FormatterOutput>,
  options: ManagedOutputCleanupOptions
): Promise<ManagedOutputCleanupResult> {
  const outputRoot = resolve(options.outputRoot);
  const managedDirectories = collectManagedDirectories(outputs, outputRoot);
  const managedFiles = collectManagedFiles(outputs, outputRoot);
  const desiredFiles = collectDesiredFiles(outputs, outputRoot);
  const removed: string[] = [];
  const removedDirectories: string[] = [];

  for (const directory of managedDirectories) {
    const ancestorGuards = await openAncestorDirectories(outputRoot, directory);
    if (!ancestorGuards) continue;
    try {
      await visitDirectory(
        directory,
        desiredFiles,
        options.dryRun === true,
        removed,
        ancestorGuards
      );
    } finally {
      await closeDirectoryGuards(ancestorGuards);
    }
  }

  for (const file of managedFiles) {
    if (desiredFiles.has(file)) continue;
    await removeManagedFile(file, outputRoot, options.dryRun === true, removed);
  }

  // Prune managed directories left empty by the removals (e.g. .github/hooks
  // after the obsolete promptscript.json is deleted). Deepest first so a
  // parent can be pruned right after its last child directory disappears.
  // Skipped entirely when nothing was removed so read-only runs never touch
  // directories the cleanup did not empty itself.
  if (removed.length > 0) {
    const prunable = [...managedDirectories].sort((a, b) => b.length - a.length);
    for (const directory of prunable) {
      await pruneEmptyDirectory(directory, outputRoot, options.dryRun === true, {
        removed,
        removedDirectories,
      });
    }
  }

  return { removed, removedDirectories };
}

interface PruneTracker {
  removed: string[];
  removedDirectories: string[];
}

/**
 * Remove a directory when every entry inside it is gone (or, in dry-run mode,
 * would be gone). Returns true when the directory is (or would be) removed.
 * Never removes the output root itself or follows symlinks.
 */
async function pruneEmptyDirectory(
  directory: string,
  outputRoot: string,
  dryRun: boolean,
  tracker: PruneTracker
): Promise<boolean> {
  if (resolve(directory) === outputRoot) return false;
  const directoryStat = await safeLstat(directory);
  if (!directoryStat?.isDirectory() || directoryStat.isSymbolicLink()) return false;

  const entries = await readdir(directory, { withFileTypes: true });
  let empty = true;
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (!(await pruneEmptyDirectory(entryPath, outputRoot, dryRun, tracker))) {
        empty = false;
      }
      continue;
    }
    if (!(dryRun && tracker.removed.includes(entryPath))) {
      empty = false;
    }
  }
  if (!empty) return false;

  if (dryRun) {
    tracker.removedDirectories.push(directory);
    return true;
  }

  try {
    await rmdir(directory);
    tracker.removedDirectories.push(directory);
    return true;
  } catch (error: unknown) {
    // Lost a race with an external writer or the directory is already gone.
    if (isNodeError(error) && (error.code === 'ENOTEMPTY' || error.code === 'ENOENT')) {
      return false;
    }
    throw error;
  }
}

function collectManagedDirectories(
  outputs: Map<string, FormatterOutput>,
  outputRoot: string
): string[] {
  const directories = new Set<string>();

  for (const output of outputs.values()) {
    for (const directory of output.managedOutputDirectories ?? []) {
      const normalized = directory.replace(/\\/g, '/');
      if (!normalized || isAbsolute(normalized)) continue;
      if (normalized.split('/').some((segment) => segment === '..')) continue;

      const absolutePath = resolve(outputRoot, normalized);
      if (isWithin(outputRoot, absolutePath)) directories.add(absolutePath);
    }
  }

  return [...directories].sort();
}

function collectDesiredFiles(
  outputs: Map<string, FormatterOutput>,
  outputRoot: string
): Set<string> {
  const files = new Set<string>();
  for (const output of outputs.values()) {
    const absolutePath = resolve(outputRoot, output.path);
    if (isWithin(outputRoot, absolutePath)) files.add(absolutePath);
  }
  return files;
}

function collectManagedFiles(outputs: Map<string, FormatterOutput>, outputRoot: string): string[] {
  const files = new Set<string>();

  for (const output of outputs.values()) {
    for (const file of output.managedOutputFiles ?? []) {
      const normalized = file.replace(/\\/g, '/');
      if (!normalized || isAbsolute(normalized)) continue;
      if (normalized.split('/').some((segment) => segment === '..')) continue;

      const absolutePath = resolve(outputRoot, normalized);
      if (isWithin(outputRoot, absolutePath)) files.add(absolutePath);
    }
  }

  return [...files].sort();
}

async function removeManagedFile(
  file: string,
  outputRoot: string,
  dryRun: boolean,
  removed: string[]
): Promise<void> {
  const fileStat = await safeLstat(file);
  if (!fileStat?.isFile() || fileStat.isSymbolicLink()) return;
  if (!(await isPromptScriptGenerated(file, true))) return;

  const guards = await openAncestorDirectories(outputRoot, file);
  if (!guards) return;
  try {
    if (!(await directoryGuardsMatch(guards))) return;
    if (dryRun) {
      removed.push(file);
      return;
    }

    const directory = dirname(file);
    const directoryStat = await safeLstat(directory);
    if (!directoryStat?.isDirectory() || directoryStat.isSymbolicLink()) return;
    if (await guardedUnlink(directory, basename(file), directoryStat, fileStat)) {
      removed.push(file);
    }
  } finally {
    await closeDirectoryGuards(guards);
  }
}

async function visitDirectory(
  directory: string,
  desiredFiles: Set<string>,
  dryRun: boolean,
  removed: string[],
  ancestorGuards: DirectoryGuard[]
): Promise<void> {
  const directoryHandle = await safeOpenDirectory(directory);
  if (!directoryHandle) return;
  const guards = [...ancestorGuards, { path: directory, handle: directoryHandle }];

  try {
    if (!(await directoryGuardsMatch(guards))) return;

    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const entryPath = resolve(directory, entry.name);
      const entryStat = await safeLstat(entryPath);
      if (!entryStat || entryStat.isSymbolicLink()) continue;

      if (entryStat.isDirectory()) {
        await visitDirectory(entryPath, desiredFiles, dryRun, removed, guards);
        continue;
      }

      if (!entryStat.isFile() || desiredFiles.has(entryPath)) continue;
      if (!(await isPromptScriptGenerated(entryPath))) continue;
      if (!(await directoryGuardsMatch(guards))) continue;

      if (dryRun) {
        removed.push(entryPath);
        continue;
      }

      const currentStat = await safeLstat(entryPath);
      if (
        currentStat?.isFile() &&
        !currentStat.isSymbolicLink() &&
        isSameFile(entryStat, currentStat) &&
        (await directoryGuardsMatch(guards))
      ) {
        const directoryStat = await directoryHandle.stat();
        if (await guardedUnlink(directory, entry.name, directoryStat, entryStat)) {
          removed.push(entryPath);
        }
      }
    }
  } finally {
    await directoryHandle.close();
  }
}

async function guardedUnlink(
  directory: string,
  name: string,
  directoryStat: FileIdentity,
  fileStat: FileIdentity
): Promise<boolean> {
  try {
    const result = await execFileAsync(
      process.execPath,
      [
        '-e',
        GUARDED_UNLINK_SCRIPT,
        '--',
        name,
        String(directoryStat.dev),
        String(directoryStat.ino),
        String(fileStat.dev),
        String(fileStat.ino),
      ],
      {
        cwd: directory,
        encoding: 'utf-8',
        windowsHide: true,
      }
    );
    return result.stdout === 'removed';
  } catch {
    // Runtimes where process.execPath cannot evaluate a child script (packaged
    // binaries or restricted spawn environments) fall back to an in-process
    // guarded unlink that re-verifies the file identity immediately before
    // removing it.
    return removeIfUnchanged(resolve(directory, name), fileStat);
  }
}

/**
 * Remove a file only when it is still a regular (non-symlink) file whose device
 * and inode match the previously observed identity. Used as an in-process
 * fallback when a child process cannot perform the cwd-relative guarded unlink.
 */
export async function removeIfUnchanged(
  entryPath: string,
  fileStat: FileIdentity
): Promise<boolean> {
  const current = await safeLstat(entryPath);
  if (!current?.isFile() || current.isSymbolicLink() || !isSameIdentity(current, fileStat)) {
    return false;
  }

  try {
    await unlink(entryPath);
  } catch (error: unknown) {
    /* v8 ignore next 2 -- unlink races with external removal between check and delete */
    if (isNodeError(error) && error.code === 'ENOENT') return false;
    throw error;
  }
  return true;
}

async function openAncestorDirectories(
  root: string,
  directory: string
): Promise<DirectoryGuard[] | undefined> {
  const relativePath = relative(root, directory);
  const segments = relativePath === '' ? [] : relativePath.split(/[\\/]+/);
  const paths = [root];
  let current = root;
  for (const segment of segments.slice(0, -1)) {
    current = resolve(current, segment);
    paths.push(current);
  }

  const guards: DirectoryGuard[] = [];
  for (const path of paths) {
    const handle = await safeOpenDirectory(path);
    if (!handle) {
      await closeDirectoryGuards(guards);
      return undefined;
    }
    guards.push({ path, handle });
    if (!(await directoryGuardsMatch(guards))) {
      await closeDirectoryGuards(guards);
      return undefined;
    }
  }
  return guards;
}

async function closeDirectoryGuards(guards: DirectoryGuard[]): Promise<void> {
  for (const guard of [...guards].reverse()) {
    await guard.handle.close();
  }
}

async function safeOpenDirectory(path: string): Promise<FileHandle | undefined> {
  try {
    return await open(path, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  } catch (error: unknown) {
    if (
      isNodeError(error) &&
      (error.code === 'ENOENT' || error.code === 'ENOTDIR' || error.code === 'ELOOP')
    ) {
      return undefined;
    }
    throw error;
  }
}

async function directoryGuardsMatch(guards: DirectoryGuard[]): Promise<boolean> {
  for (const guard of guards) {
    const pathStat = await safeLstat(guard.path);
    if (!pathStat?.isDirectory() || pathStat.isSymbolicLink()) return false;
    const handleStat = await guard.handle.stat();
    if (!isSameFile(pathStat, handleStat)) return false;
  }
  return true;
}

function isSameFile(
  left: Awaited<ReturnType<typeof lstat>>,
  right: Awaited<ReturnType<typeof lstat>>
): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function isSameIdentity(
  stat: { dev: number | bigint; ino: number | bigint },
  identity: FileIdentity
): boolean {
  return stat.dev === identity.dev && stat.ino === identity.ino;
}

async function safeLstat(path: string): Promise<Awaited<ReturnType<typeof lstat>> | undefined> {
  try {
    return await lstat(path);
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function isPromptScriptGenerated(path: string, allowInlineMarker = false): Promise<boolean> {
  try {
    const content = await readFile(path, 'utf-8');
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .slice(0, 4);
    const candidateLines =
      lines[0] === '---'
        ? [lines[1]]
        : [lines[0], ...(lines[0]?.startsWith('# ') && lines[1] === '' ? [lines[2]] : [])];
    const hasStandardMarker = candidateLines.some(
      (line) =>
        line !== undefined && PROMPTSCRIPT_MARKER_PATTERNS.some((pattern) => pattern.test(line))
    );
    return hasStandardMarker || (allowInlineMarker && hasOnlyOwnedHookCommands(content));
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') return false;
    throw error;
  }
}

interface HookOwnershipScan {
  found: boolean;
  valid: boolean;
}

export function hasOnlyOwnedHookCommands(content: string): boolean {
  try {
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false;
    const hooks = (parsed as Record<string, unknown>)['hooks'];
    const scan = scanHookOwnership(hooks);
    return scan.found && scan.valid;
  } catch {
    return false;
  }
}

function scanHookOwnership(value: unknown): HookOwnershipScan {
  if (Array.isArray(value)) {
    return value.reduce<HookOwnershipScan>(
      (result, item) => {
        const itemScan = scanHookOwnership(item);
        return {
          found: result.found || itemScan.found,
          valid: result.valid && itemScan.valid,
        };
      },
      { found: false, valid: true }
    );
  }

  if (typeof value !== 'object' || value === null) {
    return { found: false, valid: true };
  }

  const object = value as Record<string, unknown>;
  if (typeof object['type'] === 'string') {
    if (object['type'] !== 'command') return { found: true, valid: false };
    const commands = ['command', 'bash', 'powershell']
      .map((field) => object[field])
      .filter((command): command is string => typeof command === 'string');
    return {
      found: true,
      valid:
        commands.length > 0 &&
        commands.every((command) => /# promptscript-generated:[A-Za-z0-9._-]+\s*$/.test(command)),
    };
  }

  return scanHookOwnership(Object.values(object));
}

function isWithin(root: string, candidate: string): boolean {
  const relativePath = relative(root, candidate);
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
