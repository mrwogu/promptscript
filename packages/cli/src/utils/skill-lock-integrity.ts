import { createHash } from 'crypto';
import type { LockfileDependency } from '@promptscript/core';

/** Integrity marker used when a dependency cannot claim a complete hash. */
export const PENDING_INTEGRITY = 'sha256-pending';

const CONCRETE_INTEGRITY_PATTERN = /^sha256-[0-9a-f]{64}$/i;

interface SkillIntegrityEntry {
  source: string;
  integrity: string;
}

/**
 * Return whether an integrity value is a complete SHA-256 SRI hash.
 */
export function isConcreteIntegrity(integrity: string): boolean {
  return CONCRETE_INTEGRITY_PATTERN.test(integrity);
}

/**
 * Hash the canonical representation of managed child entries.
 *
 * Entries are represented as JSON objects containing only their source key and
 * integrity, sorted by source key. Missing or incomplete children keep the
 * owner in its pending state.
 */
export function calculateManagedSkillIntegrity(
  dependencies: Readonly<Record<string, LockfileDependency>>,
  childSources: readonly string[]
): string {
  if (childSources.length === 0) {
    return PENDING_INTEGRITY;
  }

  const entries: SkillIntegrityEntry[] = [];
  for (const source of childSources) {
    const integrity = dependencies[source]?.integrity;
    if (integrity === undefined || !isConcreteIntegrity(integrity)) {
      return PENDING_INTEGRITY;
    }
    entries.push({ source, integrity });
  }

  entries.sort((left, right) => {
    if (left.source < right.source) return -1;
    if (left.source > right.source) return 1;
    return 0;
  });

  const canonical = JSON.stringify(entries);
  const digest = createHash('sha256').update(canonical, 'utf8').digest('hex');
  return `sha256-${digest}`;
}

/**
 * Refresh aggregate integrity for managed Markdown repository owners.
 */
export function refreshManagedSkillOwnerIntegrity(
  dependencies: Record<string, LockfileDependency>
): void {
  for (const dependency of Object.values(dependencies)) {
    if (dependency.source !== 'md' || dependency.skills === undefined) {
      continue;
    }
    dependency.integrity = calculateManagedSkillIntegrity(dependencies, dependency.skills);
  }
}
