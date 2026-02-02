/**
 * AST validation rules for PromptScript files.
 *
 * Ensures correctness of the PromptScript code by checking for semantic errors,
 * required fields, and other constraints.
 *
 * @packageDocumentation
 */

import type { Program } from '@promptscript/core';
import type { ValidateOptions, ValidationResult } from './types.js';
import { createValidator } from './validator.js';

// Validator
export { Validator, createValidator } from './validator.js';

// Types
export type {
  Severity,
  ValidationMessage,
  ValidationResult,
  RuleContext,
  ValidationRule,
  ValidatorConfig,
  ValidateOptions,
} from './types.js';

// Rules
export {
  allRules,
  getRuleById,
  getRuleByName,
  requiredMetaId,
  requiredMetaSyntax,
  validSemver,
  isValidSemver,
  requiredGuards,
  blockedPatterns,
  validPath,
  isValidPath,
  deprecated,
  emptyBlock,
  validParams,
  suspiciousUrls,
  authorityInjection,
  obfuscatedContent,
} from './rules/index.js';

// Security presets
export {
  SECURITY_STRICT,
  SECURITY_MODERATE,
  SECURITY_MINIMAL,
  getSecurityPreset,
  // Multilingual support
  SECURITY_STRICT_MULTILINGUAL,
  createMultilingualConfig,
  getPatternsForLanguage,
  getSupportedLanguages,
  // Language-specific patterns (26 languages)
  // Western European
  BLOCKED_PATTERNS_PL,
  BLOCKED_PATTERNS_ES,
  BLOCKED_PATTERNS_DE,
  BLOCKED_PATTERNS_FR,
  BLOCKED_PATTERNS_PT,
  BLOCKED_PATTERNS_IT,
  BLOCKED_PATTERNS_NL,
  // Nordic
  BLOCKED_PATTERNS_SV,
  BLOCKED_PATTERNS_NO,
  BLOCKED_PATTERNS_DA,
  BLOCKED_PATTERNS_FI,
  // Central/Eastern European
  BLOCKED_PATTERNS_CS,
  BLOCKED_PATTERNS_HU,
  BLOCKED_PATTERNS_UK,
  BLOCKED_PATTERNS_EL,
  BLOCKED_PATTERNS_RO,
  // Asian
  BLOCKED_PATTERNS_RU,
  BLOCKED_PATTERNS_ZH,
  BLOCKED_PATTERNS_JA,
  BLOCKED_PATTERNS_KO,
  BLOCKED_PATTERNS_HI,
  BLOCKED_PATTERNS_ID,
  BLOCKED_PATTERNS_VI,
  BLOCKED_PATTERNS_TH,
  // Middle Eastern
  BLOCKED_PATTERNS_AR,
  BLOCKED_PATTERNS_TR,
  BLOCKED_PATTERNS_HE,
  // Combined
  BLOCKED_PATTERNS_ALL_LANGUAGES,
  type SupportedLanguage,
} from './presets.js';

// Walker utilities
export { walkText, walkBlocks, walkUses, hasContent } from './walker.js';

// Formatting utilities
export {
  formatValidationMessage,
  formatValidationMessages,
  formatValidationResult,
  formatDiagnostic,
  formatDiagnostics,
  type FormatValidationOptions,
} from './format.js';

/**
 * Validate an AST with a standalone function.
 *
 * @param ast - The AST to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * import { validate } from '@promptscript/validator';
 *
 * const result = validate(ast, {
 *   rules: { 'empty-block': 'warning' },
 *   disableRules: ['deprecated'],
 * });
 *
 * if (!result.valid) {
 *   console.error('Validation failed');
 * }
 * ```
 */
export function validate(ast: Program, options: ValidateOptions = {}): ValidationResult {
  const { validator, ...config } = options;

  if (validator) {
    return validator.validate(ast);
  }

  const v = createValidator(config);
  return v.validate(ast);
}
