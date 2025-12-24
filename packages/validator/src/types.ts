import type { Program, SourceLocation } from '@promptscript/core';

/**
 * Severity level for validation messages.
 */
export type Severity = 'error' | 'warning' | 'info';

/**
 * A validation message produced by a rule.
 */
export interface ValidationMessage {
  /** Rule identifier (e.g., "PS001") */
  ruleId: string;
  /** Rule name (e.g., "required-meta-id") */
  ruleName: string;
  /** Message severity */
  severity: Severity;
  /** Human-readable message */
  message: string;
  /** Source location where the issue was found */
  location?: SourceLocation;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Result of validating an AST.
 */
export interface ValidationResult {
  /** True if no errors were found */
  valid: boolean;
  /** All error-level messages */
  errors: ValidationMessage[];
  /** All warning-level messages */
  warnings: ValidationMessage[];
  /** All info-level messages */
  infos: ValidationMessage[];
  /** All messages combined */
  all: ValidationMessage[];
}

/**
 * Context provided to validation rules.
 */
export interface RuleContext {
  /** The AST being validated */
  ast: Program;
  /** Validator configuration */
  config: ValidatorConfig;
  /** Report a validation issue */
  report: (msg: Omit<ValidationMessage, 'ruleId' | 'ruleName' | 'severity'>) => void;
}

/**
 * A validation rule definition.
 */
export interface ValidationRule {
  /** Unique rule identifier (e.g., "PS001") */
  id: string;
  /** Rule name (e.g., "required-meta-id") */
  name: string;
  /** Rule description */
  description: string;
  /** Default severity level */
  defaultSeverity: Severity;
  /** Validation function */
  validate: (ctx: RuleContext) => void;
}

/**
 * Validator configuration options.
 */
export interface ValidatorConfig {
  /** Override severity for specific rules (rule name -> severity or 'off') */
  rules?: Record<string, Severity | 'off'>;
  /** List of guards that must be present in @guards block */
  requiredGuards?: string[];
  /** Patterns to block in content (strings are converted to RegExp) */
  blockedPatterns?: (string | RegExp)[];
  /** Array of rule names to disable */
  disableRules?: string[];
  /** Custom validation rules to add */
  customRules?: ValidationRule[];
}

/**
 * Options for standalone validate function.
 */
export interface ValidateOptions extends ValidatorConfig {
  /** Reuse an existing validator instance */
  validator?: Validator;
}

// Forward declare to avoid circular dependency
interface Validator {
  validate(ast: Program): ValidationResult;
}
