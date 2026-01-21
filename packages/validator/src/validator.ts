import type { Program } from '@promptscript/core';
import type {
  ValidationRule,
  ValidatorConfig,
  ValidationResult,
  ValidationMessage,
  Severity,
  RuleContext,
} from './types.js';
import { allRules } from './rules/index.js';

/**
 * AST validator for PromptScript files.
 *
 * Validates resolved AST for semantic correctness and compliance.
 *
 * @example
 * ```typescript
 * import { Validator } from '@promptscript/validator';
 *
 * const validator = new Validator({
 *   requiredGuards: ['@core/guards/compliance'],
 *   rules: { 'empty-block': 'warning' },
 * });
 *
 * const result = validator.validate(ast);
 * if (!result.valid) {
 *   for (const err of result.errors) {
 *     console.error(`${err.ruleId}: ${err.message}`);
 *   }
 * }
 * ```
 */
export class Validator {
  private rules: ValidationRule[];
  private config: ValidatorConfig;
  private disabledRules: Set<string>;

  /**
   * Create a new validator instance.
   *
   * @param config - Validator configuration
   */
  constructor(config: ValidatorConfig = {}) {
    this.config = config;
    this.rules = [...allRules];
    this.disabledRules = new Set(config.disableRules ?? []);

    // Add custom rules if provided
    if (config.customRules) {
      for (const rule of config.customRules) {
        this.rules.push(rule);
      }
    }
  }

  /**
   * Validate an AST.
   *
   * @param ast - The resolved AST to validate
   * @returns Validation result with all messages
   */
  validate(ast: Program): ValidationResult {
    const messages: ValidationMessage[] = [];

    for (const rule of this.rules) {
      // Skip if rule is disabled via disableRules
      if (this.disabledRules.has(rule.name) || this.disabledRules.has(rule.id)) {
        continue;
      }

      // Determine the severity for this rule
      const configuredSeverity = this.config.rules?.[rule.name];
      const severity: Severity | 'off' = configuredSeverity ?? rule.defaultSeverity;

      // Skip if rule is turned off
      if (severity === 'off') {
        continue;
      }

      // Create rule context
      const ctx: RuleContext = {
        ast,
        config: this.config,
        report: (msg) => {
          messages.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity,
            ...msg,
          });
        },
      };

      // Run the rule
      rule.validate(ctx);
    }

    // Categorize messages
    const errors = messages.filter((m) => m.severity === 'error');
    const warnings = messages.filter((m) => m.severity === 'warning');
    const infos = messages.filter((m) => m.severity === 'info');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      infos,
      all: messages,
    };
  }

  /**
   * Add a custom validation rule.
   *
   * @param rule - The rule to add
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a validation rule by name or id.
   *
   * @param ruleNameOrId - The rule name or id to remove
   * @returns True if the rule was found and removed
   */
  removeRule(ruleNameOrId: string): boolean {
    const index = this.rules.findIndex((r) => r.name === ruleNameOrId || r.id === ruleNameOrId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get the current configuration.
   */
  getConfig(): ValidatorConfig {
    return { ...this.config };
  }

  /**
   * Get all registered rules.
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }
}

/**
 * Create a validator with default configuration.
 */
export function createValidator(config?: ValidatorConfig): Validator {
  return new Validator(config);
}
