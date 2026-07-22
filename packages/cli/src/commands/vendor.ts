import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, dirname, join, resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import type { VendorSyncOptions, VendorCheckOptions } from '../types.js';
import { loadConfig } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import type { Lockfile, LockfileDependency } from '@promptscript/core';
import { isValidLockfile } from '@promptscript/core';
import {
  getVendorRepositoryRelativePath,
  GitRegistry,
  hashVendorRepository,
  loadVendorManifest,
  normalizeGitUrl,
  resolveVendoredRepository,
  VENDOR_GIT_DIR,
  VENDOR_MANIFEST_FILE,
  verifyVendoredGitRepository,
  type VendorManifest,
} from '@promptscript/resolver';
import { LOCKFILE_PATH } from './lock.js';

/** Local vendor directory where dependencies are copied. */
const VENDOR_DIR = '.promptscript/vendor';

/**
 * Clone all locked dependencies into .promptscript/vendor/.
 *
 * Reads promptscript.lock to determine which repositories and commits are
 * pinned, then creates a self-contained tree for offline and CI builds.
 */
export async function vendorSyncCommand(options: VendorSyncOptions): Promise<void> {
  const spinner = createSpinner('Syncing vendor directory...').start();

  try {
    const lockfile = await loadLockfile();
    if (!lockfile) {
      spinner.fail('No lockfile found');
      ConsoleOutput.muted('Run: prs lock');
      process.exitCode = 1;
      return;
    }

    const deps = getRepositoryDependencies(lockfile);
    const config = await loadConfig();
    const defaultGitRegistry = config.registry?.git;
    validateDependencyPaths(deps);

    if (options.dryRun) {
      spinner.succeed(`Dry run completed (${deps.length} dependencies ready)`);
      return;
    }

    const vendorDir = resolve(VENDOR_DIR);
    const recoveredBackup = await recoverVendorDirectory(vendorDir);
    if (recoveredBackup) {
      ConsoleOutput.warn(`Recovered interrupted vendor update: ${recoveredBackup}`);
    }
    await mkdir(dirname(vendorDir), { recursive: true });
    const stagingDir = await mkdtemp(join(dirname(vendorDir), '.vendor-stage-'));
    try {
      const manifest: VendorManifest = { version: 1, dependencies: {} };
      const clonedPaths = new Map<string, string>();

      for (const [repoUrl, dependency] of deps) {
        const vendorPath = getVendorRepositoryRelativePath(repoUrl);
        let integrity = clonedPaths.get(vendorPath);
        if (!integrity) {
          const matchesRepository = (candidate: string): boolean =>
            normalizeGitUrl(toCloneUrl(candidate)) === normalizeGitUrl(toCloneUrl(repoUrl));
          const defaultRegistryMatches =
            defaultGitRegistry !== undefined &&
            [defaultGitRegistry.url, defaultGitRegistry.fallbackUrl]
              .filter((candidate): candidate is string => candidate !== undefined)
              .some(matchesRepository);
          const aliasRegistry = Object.values(config.registries ?? {})
            .map((entry) => (typeof entry === 'string' ? { url: entry } : entry))
            .find((entry) => matchesRepository(entry.url));
          const configuredRegistry = defaultRegistryMatches ? defaultGitRegistry : aliasRegistry;
          const cloneUrl = toCloneUrl(configuredRegistry?.url ?? repoUrl);
          const configuredFallback = configuredRegistry?.fallbackUrl ?? dependency.gitUrl;
          const fallbackUrl =
            configuredFallback && toCloneUrl(configuredFallback) !== cloneUrl
              ? toCloneUrl(configuredFallback)
              : dependency.gitUrl && cloneUrl !== toCloneUrl(repoUrl)
                ? toCloneUrl(repoUrl)
                : undefined;
          const registryAuth = defaultRegistryMatches ? defaultGitRegistry.auth : undefined;
          const targetDir = join(stagingDir, vendorPath);
          const tag =
            dependency.version !== 'latest' && !/^[0-9a-f]{40}$/i.test(dependency.version)
              ? dependency.version
              : undefined;
          const registry = new GitRegistry({ url: cloneUrl, auth: registryAuth });
          await registry.cloneAtTag(cloneUrl, tag, targetDir, fallbackUrl);
          await registry.checkoutCommit(targetDir, dependency.commit);
          await registry.removeRemote(targetDir);
          await rename(join(targetDir, '.git'), join(targetDir, VENDOR_GIT_DIR));
          await verifyVendoredGitRepository(targetDir, dependency.commit);
          integrity = await hashVendorRepository(targetDir);
          clonedPaths.set(vendorPath, integrity);
        }
        manifest.dependencies[repoUrl] = {
          commit: dependency.commit,
          integrity,
          path: vendorPath,
          version: dependency.version,
        };
      }

      await writeFile(
        join(stagingDir, VENDOR_MANIFEST_FILE),
        `${JSON.stringify(manifest, null, 2)}\n`,
        'utf-8'
      );
      const retainedBackup = await replaceVendorDirectory(stagingDir, vendorDir);
      if (retainedBackup) {
        ConsoleOutput.warn(`Old vendor backup could not be removed: ${retainedBackup}`);
      }
    } catch (error) {
      await rm(stagingDir, { recursive: true, force: true });
      throw error;
    }

    spinner.succeed(`Vendor synced (${deps.length} dependencies downloaded)`);
  } catch (error) {
    spinner.fail('Vendor sync failed');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

/**
 * Verify that the vendor directory matches the lockfile.
 */
export async function vendorCheckCommand(_options: VendorCheckOptions): Promise<void> {
  const spinner = createSpinner('Checking vendor directory...').start();

  try {
    const lockfile = await loadLockfile();
    if (!lockfile) {
      spinner.fail('No lockfile found');
      ConsoleOutput.muted('Run: prs lock');
      process.exitCode = 1;
      return;
    }

    const deps = getRepositoryDependencies(lockfile);
    validateDependencyPaths(deps);
    const vendorDir = resolve(VENDOR_DIR);
    const recoveredBackup = await recoverVendorDirectory(vendorDir);
    if (recoveredBackup) {
      ConsoleOutput.warn(`Recovered interrupted vendor update: ${recoveredBackup}`);
    }
    if (deps.length === 0 && !existsSync(vendorDir)) {
      spinner.succeed('Vendor directory matches lockfile');
      return;
    }
    if (!existsSync(vendorDir)) {
      spinner.fail('Vendor directory does not exist');
      ConsoleOutput.muted('Run: prs vendor sync');
      process.exitCode = 1;
      return;
    }

    const manifest = await loadVendorManifest(vendorDir);
    if (!manifest) {
      throw new Error(`Vendor manifest is missing: ${VENDOR_MANIFEST_FILE}`);
    }
    const issues: Array<{ repoUrl: string; issue: string }> = [];
    const expectedKeys = new Set(deps.map(([repoUrl]) => repoUrl));

    for (const [repoUrl, dep] of deps) {
      const manifestEntry = manifest.dependencies[repoUrl];
      if (!manifestEntry) {
        issues.push({ repoUrl, issue: 'missing from vendor manifest' });
        continue;
      }
      if (manifestEntry.version !== dep.version) {
        issues.push({ repoUrl, issue: 'version does not match lockfile' });
        continue;
      }
      if (manifestEntry.commit !== dep.commit) {
        issues.push({ repoUrl, issue: 'commit does not match lockfile' });
        continue;
      }
      try {
        await resolveVendoredRepository(vendorDir, repoUrl, dep.version, dep.commit);
      } catch (error) {
        issues.push({
          repoUrl,
          issue: error instanceof Error ? error.message : String(error),
        });
      }
    }

    for (const repoUrl of Object.keys(manifest.dependencies)) {
      if (!expectedKeys.has(repoUrl)) {
        issues.push({ repoUrl, issue: 'not present in lockfile' });
      }
    }

    if (issues.length === 0) {
      spinner.succeed('Vendor directory matches lockfile');
    } else {
      spinner.fail(`Vendor directory out of sync (${issues.length} issue(s))`);
      ConsoleOutput.newline();
      for (const { repoUrl, issue } of issues) {
        ConsoleOutput.error(`${repoUrl}: ${issue}`);
      }
      ConsoleOutput.newline();
      ConsoleOutput.muted('Run: prs vendor sync');
      process.exitCode = 1;
    }
  } catch (error) {
    spinner.fail('Vendor check failed');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

/** Load and validate the project lockfile. */
async function loadLockfile(): Promise<Lockfile | null> {
  if (!existsSync(LOCKFILE_PATH)) {
    return null;
  }

  try {
    const content = await readFile(LOCKFILE_PATH, 'utf-8');
    const parsed: unknown = parseYaml(content, { maxAliasCount: 100 });
    if (!isValidLockfile(parsed)) {
      throw new Error(`Invalid lockfile: ${LOCKFILE_PATH}`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`Unable to read lockfile: ${LOCKFILE_PATH}`, { cause: error });
  }
}

function getRepositoryDependencies(lockfile: Lockfile): Array<[string, LockfileDependency]> {
  return Object.entries(lockfile.dependencies).filter(
    ([, dependency]) => dependency.source !== 'md' || dependency.skills !== undefined
  );
}

function validateDependencyPaths(dependencies: Array<[string, LockfileDependency]>): void {
  const paths = new Map<string, { commit: string; path: string }>();
  for (const [repoUrl, dependency] of dependencies) {
    if (!/^[0-9a-f]{40}$/i.test(dependency.commit) || /^0{40}$/.test(dependency.commit)) {
      throw new Error(`Dependency is not pinned to an exact commit: ${repoUrl}`);
    }
    const vendorPath = getVendorRepositoryRelativePath(repoUrl);
    const portablePath = vendorPath.toLowerCase();
    const existing = paths.get(portablePath);
    if (existing && existing.path !== vendorPath) {
      throw new Error(`Lockfile entries collide at vendor path ${vendorPath}`);
    }
    if (existing && existing.commit !== dependency.commit) {
      throw new Error(`Conflicting lockfile entries map to ${vendorPath}`);
    }
    paths.set(portablePath, { commit: dependency.commit, path: vendorPath });
  }
}

function toCloneUrl(repoUrl: string): string {
  return /^[a-z][a-z\d+.-]*:\/\//i.test(repoUrl) || repoUrl.startsWith('git@')
    ? repoUrl
    : `https://${repoUrl}`;
}

async function replaceVendorDirectory(
  stagingDir: string,
  vendorDir: string
): Promise<string | null> {
  if (!existsSync(vendorDir)) {
    await rename(stagingDir, vendorDir);
    return null;
  }

  const backupDir = `${vendorDir}.backup-${process.pid}-${Date.now()}`;
  await rename(vendorDir, backupDir);
  try {
    await rename(stagingDir, vendorDir);
  } catch (error) {
    if (!existsSync(vendorDir)) {
      await rename(backupDir, vendorDir);
    }
    throw error;
  }
  try {
    await rm(backupDir, { recursive: true, force: true });
    return null;
  } catch {
    return backupDir;
  }
}

async function recoverVendorDirectory(vendorDir: string): Promise<string | null> {
  if (existsSync(vendorDir)) {
    return null;
  }
  const parentDir = dirname(vendorDir);
  const prefix = `${basename(vendorDir)}.backup-`;
  let backups;
  try {
    backups = (await readdir(parentDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
      .sort((left, right) => {
        const leftTime = Number(left.name.slice(left.name.lastIndexOf('-') + 1));
        const rightTime = Number(right.name.slice(right.name.lastIndexOf('-') + 1));
        return rightTime - leftTime;
      });
  } catch {
    return null;
  }
  const backup = backups[0];
  if (!backup) {
    return null;
  }
  const backupPath = join(parentDir, backup.name);
  await rename(backupPath, vendorDir);
  return backupPath;
}
