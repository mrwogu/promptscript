import type { ValidationRule } from '../types.js';
import { parsePolicies } from '../policy/parser.js';
import { evaluatePolicies } from '../policy/evaluator.js';

/**
 * PS030: Policy compliance.
 *
 * Evaluates extension compliance policies defined in promptscript.yaml.
 * Checks layer boundaries, property protection, and registry allowlists.
 */
export const policyCompliance: ValidationRule = {
  id: 'PS030',
  name: 'policy-compliance',
  description: 'Extension compliance policies must be satisfied',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const { policies, skipPolicies } = ctx.config;

    if (skipPolicies || !policies || policies.length === 0) {
      return;
    }

    // Parse and validate policy definitions
    const parsed = parsePolicies(policies);

    // Report parse errors
    for (const error of parsed.errors) {
      ctx.report({
        message: error,
        severity: 'error',
      });
    }

    if (parsed.policies.length === 0) return;

    // Evaluate policies against AST
    const violations = evaluatePolicies(parsed.policies, ctx.ast);

    for (const violation of violations) {
      ctx.report({
        message: `[${violation.policyName}] ${violation.message}`,
        severity: violation.severity,
        suggestion: violation.suggestion,
      });
    }
  },
};
