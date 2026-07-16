import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { lstat, open, readFile, readdir, unlink, type FileHandle } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
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
  const desiredFiles = collectDesiredFiles(outputs, outputRoot);
  const removed: string[] = [];

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

  return { removed };
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
  if (await isPackagedRuntime()) {
    return guardedUnlinkInProcess(directory, name, directoryStat, fileStat);
  }

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
  } catch (error: unknown) {
    if (!isSpawnUnavailable(error)) throw error;
    // The runtime cannot evaluate a child script (e.g. SEA/pkg single
    // executables where process.execPath does not accept -e). Fall back to an
    // in-process guarded unlink that repeats the directory and file identity
    // checks immediately before removing the file.
    return guardedUnlinkInProcess(directory, name, directoryStat, fileStat);
  }
}

async function guardedUnlinkInProcess(
  directory: string,
  name: string,
  directoryStat: FileIdentity,
  fileStat: FileIdentity
): Promise<boolean> {
  if (!name || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
    return false;
  }

  const currentDirectory = await safeLstat(directory);
  if (
    !currentDirectory?.isDirectory() ||
    currentDirectory.isSymbolicLink() ||
    !isSameIdentity(currentDirectory, directoryStat)
  ) {
    return false;
  }

  const entryPath = resolve(directory, name);
  const currentFile = await safeLstat(entryPath);
  if (
    !currentFile?.isFile() ||
    currentFile.isSymbolicLink() ||
    !isSameIdentity(currentFile, fileStat)
  ) {
    return false;
  }

  try {
    await unlink(entryPath);
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') return false;
    throw error;
  }
  return true;
}

function isSpawnUnavailable(error: unknown): boolean {
  return (
    isNodeError(error) &&
    (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'ENOEXEC')
  );
}

let packagedRuntimeCache: boolean | undefined;

async function isPackagedRuntime(): Promise<boolean> {
  if (packagedRuntimeCache === undefined) {
    packagedRuntimeCache = await detectPackagedRuntime();
  }
  return packagedRuntimeCache;
}

async function detectPackagedRuntime(): Promise<boolean> {
  if ((process as unknown as { pkg?: unknown }).pkg !== undefined) return true;
  if (typeof (process.versions as { bun?: string }).bun === 'string') return true;
  try {
    const seaModule = 'node:sea';
    const sea = (await import(seaModule)) as { isSea?: () => boolean };
    if (typeof sea.isSea === 'function' && sea.isSea()) return true;
  } catch {
    // node:sea is unavailable on this runtime; treat it as a standard Node build.
  }
  return false;
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

async function isPromptScriptGenerated(path: string): Promise<boolean> {
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
    return candidateLines.some(
      (line) =>
        line !== undefined && PROMPTSCRIPT_MARKER_PATTERNS.some((pattern) => pattern.test(line))
    );
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') return false;
    throw error;
  }
}

function isWithin(root: string, candidate: string): boolean {
  const relativePath = relative(root, candidate);
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
