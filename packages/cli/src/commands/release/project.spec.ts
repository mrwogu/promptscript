import { describe, expect, it } from 'vitest';
import type { PromptScriptConfig } from '@promptscript/core';
import { FORCED_RELEASE_RULES, releaseValidatorConfig } from './project.js';

function config(validation: Record<string, unknown>, policies: unknown[] = []): PromptScriptConfig {
  return {
    id: 'app',
    syntax: '1.6.0',
    targets: ['bundle'],
    validation,
    policies,
  } as unknown as PromptScriptConfig;
}

describe('releaseValidatorConfig', () => {
  it('turns policies and the hash checks on whatever the YAML says', () => {
    const policies = [{ name: 'approved', kind: 'registry-allowlist', allowed: ['@core'] }];

    const validator = releaseValidatorConfig(
      config({ skipPolicies: true, ignoreHashes: true, requiredGuards: ['safety'] }, policies)
    );

    expect(validator.skipPolicies).toBe(false);
    expect(validator.ignoreHashes).toBe(false);
    expect(validator.policies).toBe(policies);
    expect(validator.requiredGuards).toEqual(['safety']);
  });

  it('forces the security rules to error and keeps the policy rule on', () => {
    const validator = releaseValidatorConfig(
      config({
        rules: {
          'blocked-patterns': 'off',
          'suspicious-urls': 'warning',
          'policy-compliance': 'off',
        },
        disableRules: ['PS012', 'unicode-security', 'PS030', 'policy-compliance', 'empty-block'],
      })
    );

    for (const name of Object.values(FORCED_RELEASE_RULES)) {
      expect(validator.rules?.[name]).toBe('error');
    }
    expect(validator.rules?.['policy-compliance']).toBeUndefined();
    expect(validator.disableRules).toEqual(['empty-block']);
  });

  it('keeps the other rule settings of the project', () => {
    const validator = releaseValidatorConfig(config({ rules: { 'empty-block': 'off' } }));

    expect(validator.rules?.['empty-block']).toBe('off');
  });

  it('drops the forced rules from import excludes and scans imported text', () => {
    const validator = releaseValidatorConfig(
      config({
        excludes: [
          { import: '@acme/base', rules: ['PS005', 'authority-injection', 'empty-block', 7] },
          { import: '@acme/other', rules: 'PS005' },
          'not an object',
        ],
      })
    );

    expect(validator.excludes).toEqual([
      { import: '@acme/base', rules: ['empty-block', 7] },
      { import: '@acme/other', rules: 'PS005' },
      'not an object',
    ]);
    expect(validator.scanExternalContent).toBe(true);
  });

  it('keeps allowedPatterns and leaves excludes that are not a list alone', () => {
    const validator = releaseValidatorConfig(
      config({ allowedPatterns: ['ignore previous'], excludes: { import: 'x' } })
    );

    expect(validator.allowedPatterns).toEqual(['ignore previous']);
    expect(validator.excludes).toEqual({ import: 'x' });
  });
});
