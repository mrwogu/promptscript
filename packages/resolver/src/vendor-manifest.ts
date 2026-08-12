import { createHash } from 'crypto';
import { execFile, spawn } from 'child_process';
import { constants } from 'fs';
import { lstat, open, readFile, readdir, readlink, realpath } from 'fs/promises';
import { basename, dirname, join, posix, relative, sep } from 'path';
import { promisify } from 'util';
import { isInsideCachePath } from './reference-hasher.js';

export const VENDOR_MANIFEST_FILE = '.vendor-manifest.json';
export const VENDOR_GIT_DIR = '.promptscript-git';
const execFileAsync = promisify(execFile);
const NULL_DEVICE = process.platform === 'win32' ? 'NUL' : '/dev/null';
const MAX_GIT_STDERR_BYTES = 64 * 1024;
const MAX_GIT_TREE_RECORD_BYTES = 1024 * 1024;
const MAX_GIT_CONFIG_BYTES = 1024 * 1024;

export interface VendorManifestEntry {
  commit: string;
  integrity: string;
  path: string;
  version: string;
}

export interface VendorManifest {
  version: 1;
  dependencies: Record<string, VendorManifestEntry>;
}

interface GitProcessResult {
  code: number | null;
  signal: NodeJS.Signals | null;
}

interface TrackedGitFile {
  objectId: string;
  executable: boolean;
  symbolicLink: boolean;
}

function hashGitBlob(content: Buffer): string {
  return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
}

async function readBoundedRegularFile(
  filePath: string,
  maxBytes: number,
  description: string
): Promise<Buffer> {
  const flags = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0);
  const handle = await open(filePath, flags);
  try {
    const metadata = await handle.stat();
    if (!metadata.isFile()) {
      throw new Error(`${description} is not a regular file: ${filePath}`);
    }
    const content = Buffer.alloc(maxBytes + 1);
    let offset = 0;
    while (offset < content.length) {
      const { bytesRead } = await handle.read(content, offset, content.length - offset, null);
      if (bytesRead === 0) {
        break;
      }
      offset += bytesRead;
    }
    if (offset > maxBytes) {
      throw new Error(`${description} exceeds ${maxBytes} bytes: ${filePath}`);
    }
    return content.subarray(0, offset);
  } finally {
    await handle.close();
  }
}

async function resolveSafeRepositorySymlink(
  symlinkPath: string,
  repositoryRoot: string,
  gitMetadataRoot: string
): Promise<string> {
  let targetPath: string;
  try {
    targetPath = await realpath(symlinkPath);
  } catch (error) {
    throw new Error(`Symbolic links must resolve inside vendor repositories: ${symlinkPath}`, {
      cause: error,
    });
  }
  if (
    targetPath === repositoryRoot ||
    !isInsideCachePath(targetPath, repositoryRoot) ||
    isInsideCachePath(targetPath, gitMetadataRoot)
  ) {
    throw new Error(`Symbolic links must resolve inside vendor repositories: ${symlinkPath}`);
  }
  const targetMetadata = await lstat(targetPath);
  if (!targetMetadata.isFile()) {
    throw new Error(
      `Symbolic links must resolve to regular files in vendor repositories: ${symlinkPath}`
    );
  }
  return targetPath;
}

export function getVendorRepositoryRelativePath(repoUrl: string): string {
  const sshMatch = /^git@([^:]+):(.+)$/.exec(repoUrl);
  const candidate = sshMatch
    ? `https://${sshMatch[1]}/${sshMatch[2]}`
    : /^[a-z][a-z\d+.-]*:\/\//i.test(repoUrl)
      ? repoUrl
      : `https://${repoUrl}`;
  let url: URL;
  try {
    url = new URL(candidate.replace(/^git:\/\//, 'https://'));
  } catch {
    throw new Error(`Invalid Git repository URL: ${repoUrl}`);
  }
  const host = url.port ? `${url.hostname}_${url.port}` : url.hostname;
  const segments = url.pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, all) =>
      index === all.length - 1 ? segment.replace(/\.git$/, '') : segment
    );
  if (
    !host ||
    segments.length < 2 ||
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error(`Invalid Git repository URL: ${repoUrl}`);
  }
  return posix.join(host, ...segments);
}

export function isValidVendorManifest(value: unknown): value is VendorManifest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const dependencies = record['dependencies'];
  if (
    record['version'] !== 1 ||
    typeof dependencies !== 'object' ||
    dependencies === null ||
    Array.isArray(dependencies)
  ) {
    return false;
  }
  return Object.values(dependencies as Record<string, unknown>).every((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return false;
    }
    const metadata = entry as Record<string, unknown>;
    return (
      typeof metadata['commit'] === 'string' &&
      typeof metadata['integrity'] === 'string' &&
      typeof metadata['path'] === 'string' &&
      typeof metadata['version'] === 'string'
    );
  });
}

export async function hashVendorRepository(directory: string): Promise<string> {
  const hash = createHash('sha256');
  const repositoryRoot = await realpath(directory);
  const gitMetadataRoot = join(repositoryRoot, VENDOR_GIT_DIR);

  async function visit(currentDirectory: string, prefix: string): Promise<void> {
    const entries = await readdir(currentDirectory, { withFileTypes: true });
    entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
    for (const entry of entries) {
      if (prefix === '' && entry.name === VENDOR_GIT_DIR) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) {
          throw new Error(
            `Invalid vendor Git metadata directory: ${join(currentDirectory, entry.name)}`
          );
        }
        continue;
      }
      const entryPath = join(currentDirectory, entry.name);
      const relativePath = posix.join(prefix, entry.name);
      if (entry.isSymbolicLink()) {
        await resolveSafeRepositorySymlink(entryPath, repositoryRoot, gitMetadataRoot);
        // Hash link text so retargeting changes integrity without following external content.
        hash.update(`symlink:${relativePath}\0`);
        hash.update(await readlink(entryPath, { encoding: 'buffer' }));
        hash.update('\0');
      } else if (entry.isDirectory()) {
        hash.update(`directory:${relativePath}\0`);
        await visit(entryPath, relativePath);
      } else if (entry.isFile()) {
        hash.update(`file:${relativePath}\0`);
        hash.update(await readFile(entryPath));
        hash.update('\0');
      } else {
        throw new Error(`Unsupported vendor repository entry: ${entryPath}`);
      }
    }
  }

  await visit(directory, '');
  return `sha256-${hash.digest('hex')}`;
}

export async function verifyGitRepositoryCheckout(
  directory: string,
  gitDirectoryName: string,
  expectedCommit: string,
  allowedUntrackedFiles: ReadonlySet<string> = new Set()
): Promise<void> {
  const gitDir = join(directory, gitDirectoryName);
  async function rejectMetadataSymlinks(currentDirectory: string): Promise<void> {
    for (const entry of await readdir(currentDirectory, { withFileTypes: true })) {
      const entryPath = join(currentDirectory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Symbolic links are not allowed in vendor Git metadata: ${entryPath}`);
      }
      if (entry.isDirectory()) {
        await rejectMetadataSymlinks(entryPath);
      }
    }
  }
  async function rejectMetadataPath(relativePath: string, message: string): Promise<void> {
    try {
      await lstat(join(gitDir, ...relativePath.split('/')));
      throw new Error(`${message}: ${gitDir}`);
    } catch (error) {
      if (!(
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      )) {
        throw error;
      }
    }
  }
  const gitMetadata = await lstat(gitDir);
  if (!gitMetadata.isDirectory() || gitMetadata.isSymbolicLink()) {
    throw new Error(`Invalid vendor Git metadata directory: ${gitDir}`);
  }
  await rejectMetadataSymlinks(gitDir);
  const [repositoryRoot, gitMetadataRoot] = await Promise.all([
    realpath(directory),
    realpath(gitDir),
  ]);
  const localConfigContent = await readBoundedRegularFile(
    join(gitDir, 'config'),
    MAX_GIT_CONFIG_BYTES,
    'Vendor Git config'
  );
  const localConfig = localConfigContent.toString('utf-8');
  if (
    /^[ \t]*\[(?:include|includeif)\b/im.test(localConfig) ||
    /\bpromisor\s*=\s*true\b/i.test(localConfig) ||
    /\bpartialclone/i.test(localConfig) ||
    /\bworktreeconfig\s*=\s*true\b/i.test(localConfig)
  ) {
    throw new Error(`External or partial Git object sources are not allowed: ${gitDir}`);
  }
  await rejectMetadataPath('commondir', 'Git common directories are not allowed');
  await rejectMetadataPath(
    'objects/info/alternates',
    'Git object alternates are not allowed in vendor metadata'
  );
  await rejectMetadataPath(
    'objects/info/http-alternates',
    'Git HTTP alternates are not allowed in vendor metadata'
  );
  const commonArgs = [`--git-dir=${gitDir}`, `--work-tree=${directory}`];
  const environment: NodeJS.ProcessEnv = {
    PATH: process.env['PATH'],
    GIT_CONFIG_GLOBAL: NULL_DEVICE,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'protocol.allow',
    GIT_CONFIG_VALUE_0: 'never',
    GIT_NO_LAZY_FETCH: '1',
    GIT_NO_REPLACE_OBJECTS: '1',
  };
  const head = await execFileAsync('git', [...commonArgs, 'rev-parse', 'HEAD'], {
    env: environment,
  });
  if (head.stdout.trim().toLowerCase() !== expectedCommit.toLowerCase()) {
    throw new Error(`Vendored repository commit does not match the lockfile: ${directory}`);
  }

  const trackedFiles = new Map<string, TrackedGitFile>();
  const treeProcess = spawn('git', [...commonArgs, 'ls-tree', '-r', '-z', expectedCommit], {
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let processError: Error | null = null;
  const processCompletion = new Promise<GitProcessResult>((resolveProcess) => {
    treeProcess.once('error', (error: Error) => {
      processError = new Error(`Failed to run git ls-tree: ${error.message}`, { cause: error });
      resolveProcess({ code: null, signal: null });
    });
    treeProcess.once('close', (code, signal) => {
      resolveProcess({ code, signal });
    });
  });

  const stderrChunks: Buffer[] = [];
  let stderrBytes = 0;
  let stderrTruncated = false;
  const stderrCompletion = (async (): Promise<void> => {
    for await (const chunk of treeProcess.stderr as AsyncIterable<Buffer>) {
      const remaining = MAX_GIT_STDERR_BYTES - stderrBytes;
      if (remaining > 0) {
        const captured = chunk.subarray(0, remaining);
        stderrChunks.push(Buffer.from(captured));
        stderrBytes += captured.length;
      }
      if (chunk.length > remaining) {
        stderrTruncated = true;
      }
    }
  })();

  let pendingRecord = Buffer.alloc(0);
  let stdoutError: Error | null = null;
  try {
    for await (const chunk of treeProcess.stdout as AsyncIterable<Buffer>) {
      const output = pendingRecord.length > 0 ? Buffer.concat([pendingRecord, chunk]) : chunk;
      let recordStart = 0;
      let separator = output.indexOf(0, recordStart);
      while (separator >= 0) {
        if (separator > recordStart) {
          const row = output.toString('utf8', recordStart, separator);
          const metadataSeparator = row.indexOf('\t');
          const metadata = row.slice(0, metadataSeparator).split(' ');
          const path = row.slice(metadataSeparator + 1);
          const [mode, entryType, objectId, ...extraFields] = metadata;
          if (
            metadataSeparator < 0 ||
            entryType !== 'blob' ||
            extraFields.length > 0 ||
            mode === undefined ||
            objectId === undefined
          ) {
            throw new Error(`Unsupported Git tree entry in vendored repository: ${path}`);
          }
          if (mode !== '100644' && mode !== '100755' && mode !== '120000') {
            throw new Error(`Unsupported Git tree mode in vendored repository: ${path}`);
          }
          trackedFiles.set(path, {
            objectId,
            executable: mode === '100755',
            symbolicLink: mode === '120000',
          });
        }
        recordStart = separator + 1;
        separator = output.indexOf(0, recordStart);
      }
      pendingRecord =
        recordStart < output.length ? Buffer.from(output.subarray(recordStart)) : Buffer.alloc(0);
      if (pendingRecord.length > MAX_GIT_TREE_RECORD_BYTES) {
        throw new Error(`Git ls-tree record exceeds ${MAX_GIT_TREE_RECORD_BYTES} bytes`);
      }
    }
  } catch (error) {
    stdoutError = error instanceof Error ? error : new Error(String(error), { cause: error });
    treeProcess.kill();
  }

  const [{ code, signal }] = await Promise.all([processCompletion, stderrCompletion]);
  if (processError) {
    throw processError;
  }
  if (stdoutError) {
    throw stdoutError;
  }
  if (code !== 0) {
    const stderrOutput = Buffer.concat(stderrChunks, stderrBytes).toString('utf8');
    const stderrDetails = stderrTruncated ? `${stderrOutput}\n[stderr truncated]` : stderrOutput;
    const details = stderrDetails.trim();
    const status = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`;
    throw new Error(`Git ls-tree failed with ${status}${details ? `: ${details}` : ''}`);
  }
  if (pendingRecord.length > 0) {
    throw new Error('Git ls-tree output ended with an unterminated record');
  }

  let worktreeFileCount = 0;
  const regularFiles: string[] = [];
  const worktreeSymlinks = new Map<string, Buffer>();
  async function collectFiles(currentDirectory: string, prefix: string): Promise<void> {
    const entries = await readdir(currentDirectory, { withFileTypes: true });
    for (const entry of entries) {
      if (prefix === '' && entry.name === gitDirectoryName) {
        continue;
      }
      const entryPath = join(currentDirectory, entry.name);
      const relativePath = posix.join(prefix, entry.name);
      if (entry.isSymbolicLink()) {
        const tracked = trackedFiles.get(relativePath);
        if (!tracked?.symbolicLink) {
          throw new Error(`Symbolic links are not allowed for regular files: ${entryPath}`);
        }
        const targetPath = await resolveSafeRepositorySymlink(
          entryPath,
          repositoryRoot,
          gitMetadataRoot
        );
        const targetRelativePath = relative(repositoryRoot, targetPath).split(sep).join('/');
        const trackedTarget = trackedFiles.get(targetRelativePath);
        if (!trackedTarget || trackedTarget.symbolicLink) {
          throw new Error(`Symbolic links must target tracked regular files: ${entryPath}`);
        }
        worktreeFileCount += 1;
        worktreeSymlinks.set(relativePath, await readlink(entryPath, { encoding: 'buffer' }));
      } else if (entry.isDirectory()) {
        await collectFiles(entryPath, relativePath);
      } else if (entry.isFile()) {
        if (!allowedUntrackedFiles.has(relativePath)) {
          const tracked = trackedFiles.get(relativePath);
          if (tracked?.symbolicLink) {
            throw new Error(
              `Vendored repository symbolic links do not match commit ${expectedCommit}`
            );
          }
          if (tracked && process.platform !== 'win32') {
            const metadata = await lstat(entryPath);
            if (Boolean(metadata.mode & 0o111) !== tracked.executable) {
              throw new Error(
                `Vendored repository executable modes do not match commit ${expectedCommit}`
              );
            }
          }
          worktreeFileCount += 1;
          regularFiles.push(relativePath);
        }
      } else {
        throw new Error(`Unsupported vendor repository entry: ${entryPath}`);
      }
    }
  }
  await collectFiles(directory, '');

  if (
    worktreeFileCount !== trackedFiles.size ||
    regularFiles.some((path) => !trackedFiles.has(path))
  ) {
    throw new Error(`Vendored repository contents do not match commit ${expectedCommit}`);
  }
  const batchSize = 100;
  for (let index = 0; index < regularFiles.length; index += batchSize) {
    const paths = regularFiles.slice(index, index + batchSize);
    const filePaths = paths.map((path) => join(directory, ...path.split('/')));
    const objects = await execFileAsync(
      'git',
      [...commonArgs, 'hash-object', '--no-filters', '--', ...filePaths],
      { env: environment }
    );
    const objectIds = objects.stdout.trim().split(/\r?\n/);
    if (
      objectIds.length !== paths.length ||
      paths.some((path, offset) => objectIds[offset] !== trackedFiles.get(path)?.objectId)
    ) {
      throw new Error(`Vendored repository contents do not match commit ${expectedCommit}`);
    }
  }
  for (const [path, linkTarget] of worktreeSymlinks) {
    const tracked = trackedFiles.get(path);
    // Git stores symlink target text as a blob, so no object database read is needed.
    if (!tracked || hashGitBlob(linkTarget) !== tracked.objectId) {
      throw new Error(`Vendored repository contents do not match commit ${expectedCommit}`);
    }
  }
}

export async function verifyVendoredGitRepository(
  directory: string,
  expectedCommit: string
): Promise<void> {
  await verifyGitRepositoryCheckout(directory, VENDOR_GIT_DIR, expectedCommit);
}

export async function loadVendorManifest(vendorDir: string): Promise<VendorManifest | null> {
  try {
    const raw = await readFile(join(vendorDir, VENDOR_MANIFEST_FILE), 'utf-8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Invalid vendor manifest: ${join(vendorDir, VENDOR_MANIFEST_FILE)}`, {
        cause: error,
      });
    }
    if (!isValidVendorManifest(parsed)) {
      throw new Error(`Invalid vendor manifest: ${join(vendorDir, VENDOR_MANIFEST_FILE)}`);
    }
    return parsed;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      const parentDir = dirname(vendorDir);
      const backupPrefix = `${basename(vendorDir)}.backup-`;
      try {
        const interruptedBackup = (await readdir(parentDir, { withFileTypes: true })).some(
          (entry) => entry.isDirectory() && entry.name.startsWith(backupPrefix)
        );
        if (interruptedBackup) {
          throw new Error(`Vendor update was interrupted. Run "prs vendor check" to recover it.`, {
            cause: error,
          });
        }
      } catch (backupError) {
        if (!(
          typeof backupError === 'object' &&
          backupError !== null &&
          'code' in backupError &&
          backupError.code === 'ENOENT'
        )) {
          throw backupError;
        }
      }
      return null;
    }
    throw error;
  }
}

export async function resolveVendoredRepository(
  vendorDir: string,
  repoUrl: string,
  expectedVersion: string,
  expectedCommit: string | null
): Promise<string | null> {
  const manifest = await loadVendorManifest(vendorDir);
  if (!manifest) {
    return null;
  }
  const entry = manifest.dependencies[repoUrl];
  if (!entry) {
    throw new Error(`Vendored dependency is missing from the manifest: ${repoUrl}`);
  }
  if (entry.version !== expectedVersion || (expectedCommit && entry.commit !== expectedCommit)) {
    throw new Error(`Vendored dependency is out of sync with the lockfile: ${repoUrl}`);
  }
  const expectedPath = getVendorRepositoryRelativePath(repoUrl);
  if (entry.path !== expectedPath) {
    throw new Error(`Invalid vendor manifest path for ${repoUrl}`);
  }
  const fullPath = join(vendorDir, entry.path);
  try {
    const [vendorRealPath, repositoryRealPath, metadata] = await Promise.all([
      realpath(vendorDir),
      realpath(fullPath),
      lstat(fullPath),
    ]);
    if (
      !isInsideCachePath(repositoryRealPath, vendorRealPath) ||
      repositoryRealPath === vendorRealPath
    ) {
      throw new Error(`Vendored dependency escapes the vendor directory: ${repoUrl}`);
    }
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
      throw new Error(`Vendored dependency is not a directory: ${repoUrl}`);
    }
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Vendored dependency is missing: ${repoUrl}`, { cause: error });
    }
    throw error;
  }
  await verifyVendoredGitRepository(fullPath, entry.commit);
  if ((await hashVendorRepository(fullPath)) !== entry.integrity) {
    throw new Error(`Vendored dependency contents do not match the manifest: ${repoUrl}`);
  }
  return fullPath;
}
