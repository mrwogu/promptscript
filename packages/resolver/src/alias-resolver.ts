/**
 * Alias resolver for expanding `@alias/path` references to Git URLs.
 *
 * Handles resolution of registry aliases defined in `registries` config,
 * expanding them into structured { repoUrl, path, version } objects for
 * downstream Git-based import fetching.
 *
 * @packageDocumentation
 */

import type { RegistriesConfig, RegistryAliasEntry } from '@promptscript/core';
import { UnknownAliasError } from '@promptscript/core';

/**
 * Result of expanding a registry alias path.
 */
export interface ExpandedAlias {
  /** Resolved Git repository URL (HTTPS or SSH) */
  repoUrl: string;
  /** Path within the repository (subPath, with root prepended if configured) */
  path: string;
  /** Optional version tag or semver string (e.g., 'v1.2.0', '1.2.3') */
  version?: string;
}

/**
 * Result of validating the registries config.
 */
export interface RegistriesValidationResult {
  /** Whether the config is valid */
  valid: boolean;
  /** Validation error messages (empty when valid) */
  errors: string[];
}

/**
 * Pattern for valid alias names: lowercase letters, digits, and hyphens.
 * Must start with `@` followed by at least one `[a-z0-9-]` character.
 */
const ALIAS_NAME_PATTERN = /^@[a-z0-9][a-z0-9-]*$/;

/**
 * Validate that an alias name conforms to the required format.
 *
 * Valid aliases match `@[a-z0-9][a-z0-9-]*` (e.g., `@acme`, `@my-org`).
 * Uppercase letters, spaces, underscores, and other special characters are rejected.
 *
 * @param alias - The alias name to validate (e.g., `@acme`)
 * @returns True if the alias is valid
 *
 * @example
 * ```typescript
 * validateAlias('@acme');     // true
 * validateAlias('@my-org');   // true
 * validateAlias('@Acme');     // false — uppercase not allowed
 * validateAlias('acme');      // false — missing '@'
 * validateAlias('@');         // false — no name after '@'
 * ```
 */
export function validateAlias(alias: string): boolean {
  return ALIAS_NAME_PATTERN.test(alias);
}

/**
 * Validate all alias entries in a registries configuration.
 *
 * Checks that:
 * - The config is non-empty
 * - All alias names conform to the valid format (`@[a-z0-9][a-z0-9-]*`)
 * - All entries have a non-empty `url` field
 *
 * @param registries - Registry alias configuration to validate
 * @returns Validation result with errors list
 *
 * @example
 * ```typescript
 * validateRegistriesConfig({
 *   '@acme': 'https://github.com/acme/prs-standards.git',
 *   '@internal': { url: 'git@gitlab.internal.com:company/monorepo', root: 'packages/prs' },
 * });
 * // { valid: true, errors: [] }
 * ```
 */
export function validateRegistriesConfig(registries: RegistriesConfig): RegistriesValidationResult {
  const errors: string[] = [];

  const keys = Object.keys(registries);

  if (keys.length === 0) {
    errors.push('Registries config must not be empty.');
    return { valid: false, errors };
  }

  for (const alias of keys) {
    if (!validateAlias(alias)) {
      errors.push(
        `Invalid alias name '${alias}': must match @[a-z0-9][a-z0-9-]* (lowercase, no uppercase or special characters).`
      );
    }

    const entry = registries[alias];
    if (typeof entry === 'string') {
      if (entry.trim().length === 0) {
        errors.push(`Registry entry for '${alias}' must have a non-empty URL.`);
      }
    } else {
      const extEntry = entry as RegistryAliasEntry;
      if (!extEntry.url || extEntry.url.trim().length === 0) {
        errors.push(`Registry entry for '${alias}' must have a non-empty 'url' field.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Expand a registry alias path to its Git repository URL, sub-path, and version.
 *
 * The `aliasPath` format is: `@alias/subpath[@version]`
 * - `@alias` — the registry alias name (must exist in `registries`)
 * - `/subpath` — the path within the repository (required)
 * - `@version` — optional version suffix (semver or tag, e.g., `@1.2.0`, `@v1.2.0`)
 *
 * When the registry entry includes a `root`, the root is prepended to the subpath.
 *
 * @param aliasPath - Import path starting with an alias (e.g., `@acme/standards/security@1.2.0`)
 * @param registries - Registry alias configuration
 * @returns Expanded alias with resolved repo URL, path, and optional version
 * @throws {UnknownAliasError} When the alias is not found in the registries config
 *
 * @example
 * ```typescript
 * expandAlias('@acme/standards/security@1.2.0', {
 *   '@acme': 'https://github.com/acme/prs-standards.git',
 * });
 * // { repoUrl: 'https://github.com/acme/prs-standards.git', path: 'standards/security', version: '1.2.0' }
 *
 * expandAlias('@internal/auth', {
 *   '@internal': { url: 'git@gitlab.internal.com:company/monorepo', root: 'packages/prs' },
 * });
 * // { repoUrl: 'git@gitlab.internal.com:company/monorepo', path: 'packages/prs/auth' }
 * ```
 */
export function expandAlias(aliasPath: string, registries: RegistriesConfig): ExpandedAlias {
  // Extract version suffix — find the first '@' after the initial alias segment
  // e.g., '@acme/standards/security@1.2.0' → version = '1.2.0', rest = '@acme/standards/security'
  let version: string | undefined;
  let pathWithoutVersion = aliasPath;

  const firstSlash = aliasPath.indexOf('/');
  if (firstSlash !== -1) {
    const atAfterAlias = aliasPath.indexOf('@', firstSlash);
    if (atAfterAlias !== -1) {
      version = aliasPath.slice(atAfterAlias + 1);
      pathWithoutVersion = aliasPath.slice(0, atAfterAlias);
    }
  }

  // Extract alias name (everything up to the first '/')
  const slashIndex = pathWithoutVersion.indexOf('/');
  let aliasName: string;
  let subPath: string;

  if (slashIndex === -1) {
    // Single-segment alias path with no sub-path: '@acme'
    aliasName = pathWithoutVersion;
    subPath = '';
  } else {
    aliasName = pathWithoutVersion.slice(0, slashIndex);
    subPath = pathWithoutVersion.slice(slashIndex + 1);
  }

  // Look up in registries config
  const entry = registries[aliasName];
  if (entry === undefined) {
    throw new UnknownAliasError(aliasName);
  }

  let repoUrl: string;
  let resolvedPath: string;

  if (typeof entry === 'string') {
    repoUrl = entry;
    resolvedPath = subPath;
  } else {
    const extEntry = entry as RegistryAliasEntry;
    repoUrl = extEntry.url;
    // Prepend root to subPath when root is configured
    if (extEntry.root) {
      resolvedPath = subPath ? `${extEntry.root}/${subPath}` : extEntry.root;
    } else {
      resolvedPath = subPath;
    }
  }

  return { repoUrl, path: resolvedPath, version };
}
