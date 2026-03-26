/**
 * A single locked dependency.
 */
export interface LockfileDependency {
  /** Resolved version (tag name or branch) */
  version: string;
  /** Exact commit hash */
  commit: string;
  /** Content integrity hash */
  integrity: string;
  /** Source discriminator for .md-sourced dependencies */
  source?: 'md';
  /** ISO timestamp of last fetch (informational) */
  fetchedAt?: string;
  /** Discovered skill names for directory imports (advisory) */
  skills?: string[];
}

/**
 * PromptScript lockfile (promptscript.lock).
 * Pins all remote dependencies to exact commits for reproducible builds.
 */
export interface Lockfile {
  /** Lockfile format version. Use type guard `isValidLockfile()` after parsing. */
  version: number;
  /** Map of repo URL to locked dependency */
  dependencies: Record<string, LockfileDependency>;
}

/** Current lockfile format version */
export const LOCKFILE_VERSION = 1;

/** Type guard: validates parsed lockfile has correct version */
export function isValidLockfile(data: unknown): data is Lockfile {
  return (
    typeof data === 'object' &&
    data !== null &&
    'version' in data &&
    (data as Record<string, unknown>)['version'] === LOCKFILE_VERSION &&
    'dependencies' in data
  );
}
