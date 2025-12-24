import type { Program } from '@promptscript/core';
import type { ValidateOptions, ValidationResult } from './types';
import { createValidator } from './validator';

// Validator
export { Validator, createValidator } from './validator';

// Types
export type {
  Severity,
  ValidationMessage,
  ValidationResult,
  RuleContext,
  ValidationRule,
  ValidatorConfig,
  ValidateOptions,
} from './types';

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
} from './rules';

// Walker utilities
export { walkText, walkBlocks, walkUses, hasContent } from './walker';

// Formatting utilities
export {
  formatValidationMessage,
  formatValidationMessages,
  formatValidationResult,
  formatDiagnostic,
  formatDiagnostics,
  type FormatValidationOptions,
} from './format';

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
