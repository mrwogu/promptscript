import { homedir } from 'os';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { ConsoleOutput, isQuiet, isVerbose } from '../output/console.js';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@promptscript/cli/latest';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 3000;
const SEMVER_PATTERN =
  /^(?:v)?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/**
 * Cached version check data.
 */
interface VersionCache {
  lastCheck: string;
  latestVersion: string;
  currentVersion: string;
}

/**
 * Result of a version check.
 */
export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

function parseVersion(version: string): ParsedVersion | null {
  const match = SEMVER_PATTERN.exec(version);
  if (!match) return null;

  const prerelease = match[4]?.split('.') ?? [];
  if (prerelease.some((part) => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0'))) {
    return null;
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (![major, minor, patch].every(Number.isSafeInteger)) return null;

  return {
    major,
    minor,
    patch,
    prerelease,
  };
}

function comparePrerelease(current: string[], latest: string[]): number {
  if (current.length === 0) return latest.length === 0 ? 0 : -1;
  if (latest.length === 0) return 1;

  for (let index = 0; index < Math.max(current.length, latest.length); index++) {
    const currentPart = current[index];
    const latestPart = latest[index];
    if (currentPart === undefined) return 1;
    if (latestPart === undefined) return -1;
    if (currentPart === latestPart) continue;

    const currentNumeric = /^\d+$/.test(currentPart);
    const latestNumeric = /^\d+$/.test(latestPart);
    if (currentNumeric && latestNumeric) {
      if (latestPart.length !== currentPart.length) {
        return latestPart.length > currentPart.length ? 1 : -1;
      }
      return latestPart > currentPart ? 1 : -1;
    }
    if (currentNumeric !== latestNumeric) {
      return latestNumeric ? -1 : 1;
    }
    return latestPart > currentPart ? 1 : -1;
  }

  return 0;
}

/**
 * Get the cache directory path.
 * Uses ~/.promptscript/.cache/ for consistency with Git registry cache.
 *
 * - All platforms: ~/.promptscript/.cache/
 */
export function getCacheDir(): string {
  return join(homedir(), '.promptscript', '.cache');
}

/**
 * Get the full path to the version cache file.
 */
export function getCachePath(): string {
  return join(getCacheDir(), 'version.json');
}

/**
 * Read the version cache from disk.
 */
async function readCache(): Promise<VersionCache | null> {
  try {
    const cachePath = getCachePath();
    const content = await readFile(cachePath, 'utf-8');
    return JSON.parse(content) as VersionCache;
  } catch {
    return null;
  }
}

/**
 * Write the version cache to disk.
 */
async function writeCache(cache: VersionCache): Promise<void> {
  try {
    const cacheDir = getCacheDir();
    await mkdir(cacheDir, { recursive: true });
    const cachePath = getCachePath();
    await writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // Silently ignore cache write errors
  }
}

/**
 * Check if the cache is still valid (less than 24 hours old).
 */
function isCacheValid(cache: VersionCache): boolean {
  try {
    const lastCheck = new Date(cache.lastCheck).getTime();
    const now = Date.now();
    return now - lastCheck < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Fetch the latest version from npm registry.
 * Returns null on any network error.
 */
export async function fetchLatestVersion(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (isVerbose()) {
        ConsoleOutput.verbose(`Could not check for updates: HTTP ${response.status}`);
      }
      return null;
    }

    const data: unknown = await response.json();
    if (
      typeof data !== 'object' ||
      data === null ||
      !('version' in data) ||
      typeof data.version !== 'string' ||
      !parseVersion(data.version)
    ) {
      return null;
    }
    return data.version;
  } catch (error) {
    if (isVerbose()) {
      const code = (error as NodeJS.ErrnoException).code;
      const message = error instanceof Error ? error.message : 'Unknown error';
      ConsoleOutput.verbose(`Could not check for updates: ${code ?? message}`);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Compare two semver versions.
 * Returns true if latestVersion is greater than currentVersion.
 */
function isNewerVersion(currentVersion: string, latestVersion: string): boolean {
  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);
  if (!current || !latest) return false;

  for (const field of ['major', 'minor', 'patch'] as const) {
    if (latest[field] > current[field]) return true;
    if (latest[field] < current[field]) return false;
  }

  return comparePrerelease(current.prerelease, latest.prerelease) > 0;
}

/**
 * Check for updates automatically (respects cache).
 * Called from preAction hook.
 *
 * @param currentVersion - The current CLI version
 * @returns Update info if a newer version is available, null otherwise
 */
export async function checkForUpdates(currentVersion: string): Promise<UpdateInfo | null> {
  // Disabled by environment variable
  if (process.env['PROMPTSCRIPT_NO_UPDATE_CHECK']) {
    return null;
  }

  // Disabled in quiet mode
  if (isQuiet()) {
    return null;
  }

  // Check cache first
  const cache = await readCache();
  if (cache && isCacheValid(cache) && cache.currentVersion === currentVersion) {
    // Use cached result
    if (isNewerVersion(currentVersion, cache.latestVersion)) {
      return {
        currentVersion,
        latestVersion: cache.latestVersion,
        updateAvailable: true,
      };
    }
    return null;
  }

  // Fetch latest version
  const latestVersion = await fetchLatestVersion();
  if (!latestVersion) {
    return null;
  }

  // Update cache
  await writeCache({
    lastCheck: new Date().toISOString(),
    latestVersion,
    currentVersion,
  });

  // Check if update is available
  if (isNewerVersion(currentVersion, latestVersion)) {
    return {
      currentVersion,
      latestVersion,
      updateAvailable: true,
    };
  }

  return null;
}

/**
 * Force check for updates (ignores cache).
 * Used by the update-check command.
 *
 * @param currentVersion - The current CLI version
 * @returns Update info with check result
 */
export async function forceCheckForUpdates(
  currentVersion: string
): Promise<{ info: UpdateInfo | null; error: boolean }> {
  const latestVersion = await fetchLatestVersion();

  if (!latestVersion) {
    return { info: null, error: true };
  }

  // Update cache
  await writeCache({
    lastCheck: new Date().toISOString(),
    latestVersion,
    currentVersion,
  });

  const updateAvailable = isNewerVersion(currentVersion, latestVersion);

  return {
    info: {
      currentVersion,
      latestVersion,
      updateAvailable,
    },
    error: false,
  };
}

/**
 * Print the update notification message.
 */
export function printUpdateNotification(info: UpdateInfo): void {
  console.error(
    `Update available: ${info.currentVersion} \u2192 ${info.latestVersion} (npm i -g @promptscript/cli)`
  );
}
