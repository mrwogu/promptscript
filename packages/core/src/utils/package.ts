import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Package information from package.json.
 */
export interface PackageInfo {
  /** Package name */
  name: string;
  /** Package version (semver) */
  version: string;
  /** Package description */
  description?: string;
}

/**
 * Get package information from a package.json file.
 *
 * @param baseDir - Base directory containing package.json (typically __dirname of the caller)
 * @param relativePath - Relative path to package.json from baseDir (default: '../package.json')
 * @returns Package information
 *
 * @example
 * ```typescript
 * // In src/cli.ts
 * const pkg = getPackageInfo(__dirname);
 * console.log(pkg.version); // "1.0.0"
 * ```
 */
export function getPackageInfo(baseDir: string, relativePath = '../package.json'): PackageInfo {
  try {
    const pkgPath = join(baseDir, relativePath);
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as PackageInfo;

    return {
      name: pkg.name ?? 'unknown',
      version: pkg.version ?? '0.0.0',
      description: pkg.description,
    };
  } catch {
    return {
      name: 'unknown',
      version: '0.0.0',
    };
  }
}

/**
 * Get package version from a package.json file.
 *
 * @param baseDir - Base directory containing package.json (typically __dirname of the caller)
 * @param relativePath - Relative path to package.json from baseDir (default: '../package.json')
 * @returns Package version string
 *
 * @example
 * ```typescript
 * // In src/cli.ts
 * const version = getPackageVersion(__dirname);
 * console.log(version); // "1.0.0"
 * ```
 */
export function getPackageVersion(baseDir: string, relativePath = '../package.json'): string {
  return getPackageInfo(baseDir, relativePath).version;
}
