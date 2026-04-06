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
 * A locked reference file from a registry.
 * Key format in lockfile: `<repoUrl>\0<relativePath>\0<version>`
 */
export interface LockfileReference {
  /** Content integrity hash in SRI format: "sha256-<hex>" */
  hash: string;
  /** ISO timestamp of when prs lock recorded this hash */
  lockedAt: string;
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
  /** Map of reference key to integrity hash (optional, for registry reference files) */
  references?: Record<string, LockfileReference>;
}

/** Current lockfile format version */
export const LOCKFILE_VERSION = 1;

/** Type guard: validates parsed lockfile has correct version and shape */
export function isValidLockfile(data: unknown): data is Lockfile {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('version' in data) ||
    (data as Record<string, unknown>)['version'] !== LOCKFILE_VERSION ||
    !('dependencies' in data)
  ) {
    return false;
  }

  // Validate optional references section shape
  if ('references' in data) {
    const refs = (data as Record<string, unknown>)['references'];
    if (typeof refs !== 'object' || refs === null || Array.isArray(refs)) {
      return false;
    }
    for (const entry of Object.values(refs as Record<string, unknown>)) {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        typeof (entry as Record<string, unknown>)['hash'] !== 'string' ||
        typeof (entry as Record<string, unknown>)['lockedAt'] !== 'string'
      ) {
        return false;
      }
    }
  }

  return true;
}
