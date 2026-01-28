import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { ConsoleOutput, isQuiet, isVerbose } from '../output/console.js';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@promptscript/cli/latest';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 3000;

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
function readCache(): VersionCache | null {
  try {
    const cachePath = getCachePath();
    if (!existsSync(cachePath)) {
      return null;
    }
    const content = readFileSync(cachePath, 'utf-8');
    return JSON.parse(content) as VersionCache;
  } catch {
    return null;
  }
}

/**
 * Write the version cache to disk.
 */
function writeCache(cache: VersionCache): void {
  try {
    const cacheDir = getCacheDir();
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = getCachePath();
    writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
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
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (isVerbose()) {
        ConsoleOutput.verbose(`Could not check for updates: HTTP ${response.status}`);
      }
      return null;
    }

    const data = (await response.json()) as { version?: string };
    return data.version ?? null;
  } catch (error) {
    if (isVerbose()) {
      const code = (error as NodeJS.ErrnoException).code;
      const message = error instanceof Error ? error.message : 'Unknown error';
      ConsoleOutput.verbose(`Could not check for updates: ${code ?? message}`);
    }
    return null;
  }
}

/**
 * Compare two semver versions.
 * Returns true if latestVersion is greater than currentVersion.
 */
function isNewerVersion(currentVersion: string, latestVersion: string): boolean {
  // Remove 'v' prefix if present
  const cleanCurrent = currentVersion.replace(/^v/, '');
  const cleanLatest = latestVersion.replace(/^v/, '');

  // Split into base version and prerelease
  const [currentBase, currentPrerelease] = cleanCurrent.split('-');
  const [latestBase, latestPrerelease] = cleanLatest.split('-');

  // Compare base versions (e.g., 1.0.0)
  const currentParts = (currentBase ?? '').split('.').map((p) => parseInt(p, 10) || 0);
  const latestParts = (latestBase ?? '').split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] ?? 0;
    const l = latestParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  // Base versions are equal - check prerelease
  // A version without prerelease is newer than one with prerelease
  // e.g., 1.0.0 > 1.0.0-alpha.1
  if (currentPrerelease && !latestPrerelease) {
    return true;
  }

  return false;
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
  const cache = readCache();
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
  writeCache({
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
  writeCache({
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
  console.log(
    `Update available: ${info.currentVersion} \u2192 ${info.latestVersion} (npm i -g @promptscript/cli)`
  );
}
