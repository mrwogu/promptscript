import { createHash } from 'crypto';
import { execFile } from 'child_process';
import { lstat, readFile, readdir, realpath } from 'fs/promises';
import { basename, dirname, isAbsolute, join, posix, relative, sep } from 'path';
import { promisify } from 'util';

export const VENDOR_MANIFEST_FILE = '.vendor-manifest.json';
export const VENDOR_GIT_DIR = '.promptscript-git';
const execFileAsync = promisify(execFile);
const NULL_DEVICE = process.platform === 'win32' ? 'NUL' : '/dev/null';

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
        throw new Error(`Symbolic links are not allowed in vendor repositories: ${entryPath}`);
      }
      if (entry.isDirectory()) {
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
  const gitMetadata = await lstat(gitDir);
  if (!gitMetadata.isDirectory() || gitMetadata.isSymbolicLink()) {
    throw new Error(`Invalid vendor Git metadata directory: ${gitDir}`);
  }
  await rejectMetadataSymlinks(gitDir);
  const localConfig = await readFile(join(gitDir, 'config'), 'utf-8');
  if (
    /^\s*\[(?:include|includeif)\b/im.test(localConfig) ||
    /\bpromisor\s*=\s*true\b/i.test(localConfig) ||
    /\bpartialclone/i.test(localConfig)
  ) {
    throw new Error(`External or partial Git object sources are not allowed: ${gitDir}`);
  }
  try {
    await lstat(join(gitDir, 'objects', 'info', 'alternates'));
    throw new Error(`Git object alternates are not allowed in vendor metadata: ${gitDir}`);
  } catch (error) {
    if (
      !(typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
    ) {
      throw error;
    }
  }
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

  const tree = await execFileAsync('git', [...commonArgs, 'ls-tree', '-r', '-z', expectedCommit], {
    env: environment,
  });
  const trackedFiles = new Map<string, { objectId: string; executable: boolean }>();
  for (const row of tree.stdout.split('\0').filter(Boolean)) {
    const separator = row.indexOf('\t');
    const metadata = row.slice(0, separator).split(' ');
    const path = row.slice(separator + 1);
    if (separator < 0 || metadata.length !== 3 || metadata[1] !== 'blob') {
      throw new Error(`Unsupported Git tree entry in vendored repository: ${path}`);
    }
    const mode = metadata[0];
    if (mode !== '100644' && mode !== '100755') {
      throw new Error(`Unsupported Git tree mode in vendored repository: ${path}`);
    }
    trackedFiles.set(path, {
      objectId: metadata[2]!,
      executable: mode === '100755',
    });
  }

  const worktreeFiles: string[] = [];
  async function collectFiles(currentDirectory: string, prefix: string): Promise<void> {
    const entries = await readdir(currentDirectory, { withFileTypes: true });
    for (const entry of entries) {
      if (prefix === '' && entry.name === gitDirectoryName) {
        continue;
      }
      const entryPath = join(currentDirectory, entry.name);
      const relativePath = posix.join(prefix, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Symbolic links are not allowed in vendor repositories: ${entryPath}`);
      }
      if (entry.isDirectory()) {
        await collectFiles(entryPath, relativePath);
      } else if (entry.isFile()) {
        if (!allowedUntrackedFiles.has(relativePath)) {
          const tracked = trackedFiles.get(relativePath);
          if (tracked && process.platform !== 'win32') {
            const metadata = await lstat(entryPath);
            if (Boolean(metadata.mode & 0o111) !== tracked.executable) {
              throw new Error(
                `Vendored repository executable modes do not match commit ${expectedCommit}`
              );
            }
          }
          worktreeFiles.push(relativePath);
        }
      } else {
        throw new Error(`Unsupported vendor repository entry: ${entryPath}`);
      }
    }
  }
  await collectFiles(directory, '');

  if (
    worktreeFiles.length !== trackedFiles.size ||
    worktreeFiles.some((path) => !trackedFiles.has(path))
  ) {
    throw new Error(`Vendored repository contents do not match commit ${expectedCommit}`);
  }
  const batchSize = 100;
  for (let index = 0; index < worktreeFiles.length; index += batchSize) {
    const paths = worktreeFiles.slice(index, index + batchSize);
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
        if (
          !(
            typeof backupError === 'object' &&
            backupError !== null &&
            'code' in backupError &&
            backupError.code === 'ENOENT'
          )
        ) {
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
    const containment = relative(vendorRealPath, repositoryRealPath);
    if (
      containment === '..' ||
      containment.startsWith(`..${sep}`) ||
      isAbsolute(containment) ||
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
