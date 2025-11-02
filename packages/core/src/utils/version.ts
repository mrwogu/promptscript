/**
 * Parsed semantic version.
 */
export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

/**
 * Comparison result: -1 (less), 0 (equal), or 1 (greater).
 */
export type CompareResult = -1 | 0 | 1;

/**
 * Parse a semantic version string.
 *
 * @param version - Version string (e.g., "1.2.3", "1.0.0-beta.1")
 * @returns Parsed version object
 * @throws {Error} If version format is invalid
 */
export function parseVersion(version: string): SemVer {
  const match = version.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?$/
  );

  if (!match) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  return {
    major: parseInt(match[1] ?? '0', 10),
    minor: parseInt(match[2] ?? '0', 10),
    patch: parseInt(match[3] ?? '0', 10),
    prerelease: match[4],
  };
}

/**
 * Compare two semantic versions.
 *
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): CompareResult {
  const va = parseVersion(a);
  const vb = parseVersion(b);

  // Compare major, minor, patch in order
  const majorCmp = compareNumbers(va.major, vb.major);
  if (majorCmp !== 0) return majorCmp;

  const minorCmp = compareNumbers(va.minor, vb.minor);
  if (minorCmp !== 0) return minorCmp;

  const patchCmp = compareNumbers(va.patch, vb.patch);
  if (patchCmp !== 0) return patchCmp;

  // Prerelease versions have lower precedence
  return comparePrerelease(va.prerelease, vb.prerelease);
}

/**
 * Compare two numbers, returning -1, 0, or 1.
 */
function compareNumbers(a: number, b: number): CompareResult {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Compare prerelease strings.
 */
function comparePrerelease(
  a: string | undefined,
  b: string | undefined
): CompareResult {
  if (a && !b) return -1;
  if (!a && b) return 1;
  if (a && b) {
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}

/**
 * Check if a version string is valid semantic version.
 */
export function isValidVersion(version: string): boolean {
  try {
    parseVersion(version);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a SemVer object to string.
 */
export function formatVersion(version: SemVer): string {
  let result = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease) {
    result += `-${version.prerelease}`;
  }
  return result;
}

/**
 * Increment a version.
 */
export function incrementVersion(
  version: string,
  type: 'major' | 'minor' | 'patch'
): string {
  const v = parseVersion(version);

  switch (type) {
    case 'major':
      return formatVersion({ major: v.major + 1, minor: 0, patch: 0 });
    case 'minor':
      return formatVersion({ major: v.major, minor: v.minor + 1, patch: 0 });
    case 'patch':
      return formatVersion({
        major: v.major,
        minor: v.minor,
        patch: v.patch + 1,
      });
  }
}
