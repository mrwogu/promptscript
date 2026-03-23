import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { parse as parseYaml } from 'yaml';
import type { VendorSyncOptions, VendorCheckOptions } from '../types.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import type { Lockfile } from '@promptscript/core';
import { isValidLockfile } from '@promptscript/core';
import { LOCKFILE_PATH } from './lock.js';

/** Local vendor directory where dependencies are copied. */
const VENDOR_DIR = '.promptscript/vendor';

/** Base directory for the PromptScript cache. */
const CACHE_BASE = join(homedir(), '.promptscript', 'cache', 'registries');

/**
 * Copy all cached dependencies to .promptscript/vendor/.
 *
 * Reads promptscript.lock to determine which repos are pinned, then copies
 * the cached content (from ~/.promptscript/cache/) to the vendor directory
 * for offline / CI builds.
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

    const deps = Object.entries(lockfile.dependencies);
    if (deps.length === 0) {
      spinner.warn('No dependencies in lockfile');
      return;
    }

    const results: Array<{ repoUrl: string; status: 'ok' | 'missing' }> = [];

    for (const [repoUrl, dep] of deps) {
      // Cache key: repoUrl/version (simplified — real impl uses getCacheKey)
      const cacheDir = join(CACHE_BASE, repoUrl.replace(/[/:]/g, '_'), dep.version);

      if (!existsSync(cacheDir)) {
        results.push({ repoUrl, status: 'missing' });
        continue;
      }

      if (!options.dryRun) {
        const vendorTarget = resolve(VENDOR_DIR, repoUrl.replace(/[/:]/g, '_'));
        await mkdir(vendorTarget, { recursive: true });

        // Copy all files from cache to vendor
        await copyDirectory(cacheDir, vendorTarget);
      }

      results.push({ repoUrl, status: 'ok' });
    }

    const ok = results.filter((r) => r.status === 'ok').length;
    const missing = results.filter((r) => r.status === 'missing').length;

    if (options.dryRun) {
      spinner.succeed('Dry run — vendor directory not modified');
    } else {
      spinner.succeed(`Vendor synced (${ok} copied, ${missing} missing from cache)`);
    }

    ConsoleOutput.newline();

    for (const { repoUrl, status } of results) {
      if (status === 'ok') {
        ConsoleOutput.success(repoUrl);
      } else {
        ConsoleOutput.warn(`${repoUrl}  (not in cache — run: prs pull)`);
      }
    }

    if (missing > 0) {
      ConsoleOutput.newline();
      ConsoleOutput.muted(`${missing} dep(s) not cached. Pull them first: prs pull`);
    }
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

    const deps = Object.entries(lockfile.dependencies);
    if (deps.length === 0) {
      spinner.warn('No dependencies in lockfile');
      return;
    }

    if (!existsSync(VENDOR_DIR)) {
      spinner.fail('Vendor directory does not exist');
      ConsoleOutput.muted('Run: prs vendor sync');
      process.exitCode = 1;
      return;
    }

    const issues: Array<{ repoUrl: string; issue: string }> = [];

    for (const [repoUrl] of deps) {
      const vendorTarget = resolve(VENDOR_DIR, repoUrl.replace(/[/:]/g, '_'));
      if (!existsSync(vendorTarget)) {
        issues.push({ repoUrl, issue: 'missing from vendor directory' });
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

/**
 * Load and parse the lockfile, returning null if it does not exist or is invalid.
 */
async function loadLockfile(): Promise<Lockfile | null> {
  if (!existsSync(LOCKFILE_PATH)) {
    return null;
  }

  try {
    const content = await readFile(LOCKFILE_PATH, 'utf-8');
    const parsed: unknown = parseYaml(content);
    return isValidLockfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Recursively copy a directory from src to dest.
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath);
    } else {
      const content = await readFile(srcPath);
      await writeFile(destPath, content);
    }
  }
}
