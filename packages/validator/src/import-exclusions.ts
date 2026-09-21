import { isAbsolute, relative, resolve, sep } from 'node:path';
import type { Lockfile, SourceLocation, ValidationExclude } from '@promptscript/core';
import type { ImportRoot, ValidatorConfig } from './types.js';

/**
 * Normalize an import source to its lockfile key form.
 *
 * Strips transport details so `https://github.com/org/repo.git`,
 * `git@github.com:org/repo`, and `github.com/org/repo` all compare equal.
 * Mirrors the normalization the compiler applies to lockfile dependency keys.
 */
export function normalizeImportKey(value: string): string {
  return value
    .replace(/^(?:https?:\/\/|git:\/\/)/i, '')
    .replace(/^git@([^:]+):/, '$1/')
    .replace(/\.git(?=\/|$)/, '')
    .replace(/\/+$/, '');
}

function isPathInside(root: string, candidate: string): boolean {
  const relation = relative(resolve(root), resolve(candidate));
  return (
    relation === '' ||
    (relation !== '..' && !relation.startsWith(`..${sep}`) && !isAbsolute(relation))
  );
}

interface ExcludeMatch {
  /** Import root holding the location's file */
  root: ImportRoot;
  /** Consumer-declared exclude that covers the location */
  exclude: ValidationExclude;
  /** Sub-path of the import the exclude is scoped to ('' for the whole repository) */
  subPath: string;
}

/**
 * Find the exclude covering a source location, if any.
 *
 * The location must sit inside an import root (registry cache, vendored
 * repository, or configured reference root) reported by the compiler, so
 * local project content is never excluded. An exclude declared with a
 * sub-path (e.g. `github.com/org/repo/skills/foo`) only covers content under
 * that sub-path.
 */
function findExcludeMatch(
  loc: SourceLocation | undefined,
  config: ValidatorConfig
): ExcludeMatch | undefined {
  if (!loc || !config.excludes || config.excludes.length === 0) return undefined;
  const roots = config.importRoots;
  if (!roots || roots.length === 0) return undefined;

  // Longest import key first so a nested root wins over its parent repository.
  const sortedRoots = [...roots].sort((left, right) => right.import.length - left.import.length);
  for (const root of sortedRoots) {
    if (!isPathInside(root.path, loc.file)) continue;
    const rootImport = normalizeImportKey(root.import);
    for (const exclude of config.excludes) {
      const excludeImport = normalizeImportKey(exclude.import);
      if (excludeImport === rootImport) {
        return { root, exclude, subPath: '' };
      }
      if (excludeImport.startsWith(`${rootImport}/`)) {
        const subPath = excludeImport.slice(rootImport.length + 1);
        const relation = relative(resolve(root.path), resolve(loc.file)).replaceAll('\\', '/');
        if (relation === subPath || relation.startsWith(`${subPath}/`)) {
          return { root, exclude, subPath };
        }
      }
    }
  }
  return undefined;
}

/**
 * Check whether a rule is excluded for the given source location.
 *
 * Exclusion is consumer-declared (promptscript.yaml `validation.excludes`)
 * and only ever applies to imported content, never to local project files.
 */
export function isRuleExcludedForLocation(
  rule: { name: string; id: string },
  loc: SourceLocation | undefined,
  config: ValidatorConfig
): boolean {
  const match = findExcludeMatch(loc, config);
  if (!match) return false;
  return match.exclude.rules.some((excluded) => excluded === rule.name || excluded === rule.id);
}

/** Lockfile dependency resolved for an exclude's import source. */
export interface ResolvedImportDependency {
  /** Lockfile dependency key the exclude bound to */
  key: string;
  /** Commit SHA pinned for the dependency */
  commit: string;
}

/**
 * Resolve an exclude's import source against lockfile dependency keys.
 *
 * Exact normalized match first; otherwise the longest lockfile key that is a
 * path prefix, so an exclude declared with a sub-path (`org/repo/skills/foo`)
 * still binds to its repository pin (`org/repo`).
 */
export function findLockfileDependency(
  importSource: string,
  lockfile: Lockfile
): ResolvedImportDependency | undefined {
  const normalized = normalizeImportKey(importSource);
  const entries = Object.entries(lockfile.dependencies);

  const exact = entries.find(([key]) => normalizeImportKey(key) === normalized);
  if (exact) {
    return { key: exact[0], commit: exact[1].commit };
  }

  const prefixed = entries
    .filter(([key]) => normalized.startsWith(`${normalizeImportKey(key)}/`))
    .sort(
      (left, right) => normalizeImportKey(right[0]).length - normalizeImportKey(left[0]).length
    );
  const best = prefixed[0];
  return best ? { key: best[0], commit: best[1].commit } : undefined;
}

/**
 * Runtime guard for exclude entries.
 *
 * The YAML config is cast to `PromptScriptConfig` without shape validation,
 * so entries must be narrowed before use.
 */
export function isValidationExcludeLike(value: unknown): value is ValidationExclude {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record['import'] !== 'string') return false;
  if (record['commit'] !== undefined && typeof record['commit'] !== 'string') return false;
  return (
    Array.isArray(record['rules']) && record['rules'].every((rule) => typeof rule === 'string')
  );
}
