import type { ValidationRule } from '../types.js';
import { parsePolicies } from '../policy/parser.js';
import { evaluatePolicies } from '../policy/evaluator.js';
import { evaluatePromptPolicies, promptPolicySubjects } from '../policy/prompt-evaluator.js';

/**
 * PS030: Policy compliance.
 *
 * Evaluates the policies defined in promptscript.yaml: layer boundaries,
 * property protection and registry allowlists on skills, and the prompt kinds
 * on `@prompts` entries. Prompt findings carry the location of the entry.
 */
export const policyCompliance: ValidationRule = {
  id: 'PS030',
  name: 'policy-compliance',
  description: 'Policies from promptscript.yaml must be satisfied',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const { policies, skipPolicies } = ctx.config;

    if (skipPolicies || !policies || policies.length === 0) {
      return;
    }

    // Parse and validate policy definitions
    const parsed = parsePolicies(policies, ctx.config);

    // Report parse errors
    for (const error of parsed.errors) {
      ctx.report({
        message: error,
        severity: 'error',
      });
    }

    if (parsed.policies.length === 0) return;

    const violations = [
      ...evaluatePolicies(parsed.policies, ctx.ast),
      ...evaluatePromptPolicies(
        parsed.policies,
        promptPolicySubjects(ctx.canonicalAst ?? ctx.ast),
        ctx.config
      ),
    ];

    for (const violation of violations) {
      ctx.report({
        message: `[${violation.policyName}] ${violation.message}`,
        severity: violation.severity,
        suggestion: violation.suggestion,
        location: violation.location,
      });
    }
  },
};
