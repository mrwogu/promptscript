import type { ValidationRule } from '../types';

// Import all rules
import { requiredMetaId, requiredMetaSyntax } from './required-meta';
import { validSemver } from './valid-semver';
import { requiredGuards } from './required-guards';
import { blockedPatterns } from './blocked-patterns';
import { validPath } from './valid-path';
import { deprecated } from './deprecated';
import { emptyBlock } from './empty-block';

// Re-export all rules
export { requiredMetaId, requiredMetaSyntax } from './required-meta';
export { validSemver, isValidSemver } from './valid-semver';
export { requiredGuards } from './required-guards';
export { blockedPatterns } from './blocked-patterns';
export { validPath, isValidPath } from './valid-path';
export { deprecated } from './deprecated';
export { emptyBlock } from './empty-block';

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
