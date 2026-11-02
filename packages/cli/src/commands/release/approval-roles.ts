import { compareCodeUnits, type PromptScriptConfig } from '@promptscript/core';
import { parsePolicies, type PolicyContext } from '@promptscript/validator';
import { releaseValidatorConfig } from './project.js';

/** The settings policies are parsed and evaluated with, the same as a release build. */
export function policyContext(config: PromptScriptConfig): PolicyContext {
  const validator = releaseValidatorConfig(config);
  return {
    governance: config.governance,
    releases: config.releases,
    models: config.models,
    blockedPatterns: validator.blockedPatterns,
    allowedPatterns: validator.allowedPatterns,
  };
}

/**
 * Roles that the approval policies of `config` ask for in any of `environments`, sorted. A
 * policy counts when it lists one of them or no environment at all; its `match` is not
 * evaluated, so a role is named when some prompt could need it. Policies that do not parse
 * name nothing: the gates report them.
 */
export function approvalRolesFor(
  config: PromptScriptConfig,
  environments: readonly string[]
): string[] {
  const parsed = parsePolicies(config.policies ?? undefined, policyContext(config));
  if (parsed.errors.length > 0) return [];
  const roles = new Set<string>();
  for (const policy of parsed.policies) {
    if (policy.kind !== 'required-approvals' && policy.kind !== 'max-experiment-weight') continue;
    const applies =
      policy.environments === undefined ||
      environments.some((environment) => policy.environments?.includes(environment));
    if (!applies) continue;
    for (const { role } of policy.approvals ?? []) roles.add(role);
  }
  return [...roles].sort(compareCodeUnits);
}
