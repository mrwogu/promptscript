import type { ValidationRule } from '../types.js';

// Import all rules
import { requiredMetaId, requiredMetaSyntax } from './required-meta.js';
import { validSemver } from './valid-semver.js';
import { requiredGuards } from './required-guards.js';
import { blockedPatterns } from './blocked-patterns.js';
import { validPath } from './valid-path.js';
import { deprecated } from './deprecated.js';
import { emptyBlock } from './empty-block.js';

// Re-export all rules
export { requiredMetaId, requiredMetaSyntax } from './required-meta.js';
export { validSemver, isValidSemver } from './valid-semver.js';
export { requiredGuards } from './required-guards.js';
export { blockedPatterns } from './blocked-patterns.js';
export { validPath, isValidPath } from './valid-path.js';
export { deprecated } from './deprecated.js';
export { emptyBlock } from './empty-block.js';

/**
 * All validation rules in the order they should be executed.
 */
export const allRules: ValidationRule[] = [
  // Required meta rules (PS001, PS002)
  requiredMetaId,
  requiredMetaSyntax,
  // Semver validation (PS003)
  validSemver,
  // Required guards (PS004)
  requiredGuards,
  // Blocked patterns (PS005)
  blockedPatterns,
  // Valid paths (PS006)
  validPath,
  // Deprecated features (PS007)
  deprecated,
  // Empty blocks (PS008)
  emptyBlock,
];

/**
 * Get a rule by its ID.
 */
export function getRuleById(id: string): ValidationRule | undefined {
  return allRules.find((rule) => rule.id === id);
}

/**
 * Get a rule by its name.
 */
export function getRuleByName(name: string): ValidationRule | undefined {
  return allRules.find((rule) => rule.name === name);
}
