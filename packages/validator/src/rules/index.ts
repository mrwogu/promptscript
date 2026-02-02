import type { ValidationRule } from '../types.js';

// Import all rules
import { requiredMetaId, requiredMetaSyntax } from './required-meta.js';
import { validSemver } from './valid-semver.js';
import { requiredGuards } from './required-guards.js';
import { blockedPatterns } from './blocked-patterns.js';
import { validPath } from './valid-path.js';
import { deprecated } from './deprecated.js';
import { emptyBlock } from './empty-block.js';
import { validParams } from './valid-params.js';
import { suspiciousUrls } from './suspicious-urls.js';
import { authorityInjection } from './authority-injection.js';
import { obfuscatedContent } from './obfuscated-content.js';
import { pathTraversal } from './path-traversal.js';
import { unicodeSecurity } from './unicode-security.js';

// Re-export all rules
export { requiredMetaId, requiredMetaSyntax } from './required-meta.js';
export { validSemver, isValidSemver } from './valid-semver.js';
export { requiredGuards } from './required-guards.js';
export {
  blockedPatterns,
  BLOCKED_PATTERNS_PL,
  BLOCKED_PATTERNS_ES,
  BLOCKED_PATTERNS_DE,
  BLOCKED_PATTERNS_FR,
  BLOCKED_PATTERNS_PT,
  BLOCKED_PATTERNS_RU,
  BLOCKED_PATTERNS_ZH,
  BLOCKED_PATTERNS_IT,
  BLOCKED_PATTERNS_NL,
  BLOCKED_PATTERNS_JA,
  BLOCKED_PATTERNS_KO,
  BLOCKED_PATTERNS_AR,
  BLOCKED_PATTERNS_TR,
  BLOCKED_PATTERNS_SV,
  BLOCKED_PATTERNS_NO,
  BLOCKED_PATTERNS_DA,
  BLOCKED_PATTERNS_FI,
  BLOCKED_PATTERNS_CS,
  BLOCKED_PATTERNS_HU,
  BLOCKED_PATTERNS_UK,
  BLOCKED_PATTERNS_HI,
  BLOCKED_PATTERNS_ID,
  BLOCKED_PATTERNS_VI,
  BLOCKED_PATTERNS_TH,
  BLOCKED_PATTERNS_EL,
  BLOCKED_PATTERNS_RO,
  BLOCKED_PATTERNS_HE,
  BLOCKED_PATTERNS_ALL_LANGUAGES,
} from './blocked-patterns.js';
export { validPath, isValidPath } from './valid-path.js';
export { deprecated } from './deprecated.js';
export { emptyBlock } from './empty-block.js';
export { validParams } from './valid-params.js';
export { suspiciousUrls } from './suspicious-urls.js';
export { authorityInjection } from './authority-injection.js';
export { obfuscatedContent } from './obfuscated-content.js';
export { pathTraversal, hasPathTraversal } from './path-traversal.js';
export { unicodeSecurity } from './unicode-security.js';

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
  // Valid params (PS009)
  validParams,
  // Security rules (PS010, PS011, PS012, PS013, PS014)
  suspiciousUrls,
  authorityInjection,
  obfuscatedContent,
  pathTraversal,
  unicodeSecurity,
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
