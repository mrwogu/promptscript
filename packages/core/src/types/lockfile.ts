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
  /** Original SSH clone URL for repositories that require SSH transport */
  gitUrl?: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

  const dependencies = (data as Record<string, unknown>)['dependencies'];
  if (!isRecord(dependencies)) {
    return false;
  }
  for (const dependency of Object.values(dependencies)) {
    if (!isRecord(dependency)) {
      return false;
    }
    if (
      typeof dependency['version'] !== 'string' ||
      typeof dependency['commit'] !== 'string' ||
      typeof dependency['integrity'] !== 'string' ||
      (dependency['source'] !== undefined && dependency['source'] !== 'md') ||
      (dependency['fetchedAt'] !== undefined && typeof dependency['fetchedAt'] !== 'string') ||
      (dependency['gitUrl'] !== undefined && typeof dependency['gitUrl'] !== 'string') ||
      (dependency['skills'] !== undefined &&
        (!Array.isArray(dependency['skills']) ||
          !dependency['skills'].every((skill) => typeof skill === 'string')))
    ) {
      return false;
    }
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
