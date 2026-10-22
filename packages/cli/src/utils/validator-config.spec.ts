import { describe, expect, it } from 'vitest';
import type { PromptScriptConfig } from '@promptscript/core';
import { buildValidatorConfig } from './validator-config.js';

describe('buildValidatorConfig', () => {
  it('drops skipPolicies from the config and keeps the other validation settings', () => {
    // Arrange
    const policies = [{ name: 'approved', kind: 'registry-allowlist', allowed: ['@core'] }];
    const validation = { skipPolicies: true, requiredGuards: ['safety'] };
    const config = {
      id: 'app',
      syntax: '1.6.0',
      targets: ['claude'],
      validation,
      policies,
    } as unknown as PromptScriptConfig;

    // Act
    const validator = buildValidatorConfig(config);

    // Assert
    expect(validator).toEqual({ requiredGuards: ['safety'], policies });
    expect(validator).not.toHaveProperty('skipPolicies');
    expect(validation.skipPolicies).toBe(true);
  });

  it('returns only the policies when the config has no validation block', () => {
    // Arrange
    const config = { id: 'app', syntax: '1.6.0', targets: [] } as unknown as PromptScriptConfig;

    // Act
    const validator = buildValidatorConfig(config);

    // Assert
    expect(validator).toEqual({ policies: undefined });
  });
});
