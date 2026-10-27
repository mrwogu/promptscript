import type { PromptScriptConfig } from '@promptscript/core';
import type { ValidatorConfig } from '@promptscript/validator';

/**
 * Build the validator config of a command from the project config. Policies get
 * the `governance` and `releases` sections to check roles and environments.
 * A `skipPolicies` key under `validation` in `promptscript.yaml` is dropped:
 * only the `--skip-policies` flag of `prs validate` turns policies off.
 */
export function buildValidatorConfig(config: PromptScriptConfig): ValidatorConfig {
  const validator: ValidatorConfig = {
    ...config.validation,
    policies: config.policies,
    governance: config.governance,
    releases: config.releases,
  };
  delete validator.skipPolicies;
  return validator;
}
