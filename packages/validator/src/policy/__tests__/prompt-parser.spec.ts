import { describe, expect, it } from 'vitest';
import type { PolicyDefinition } from '@promptscript/core';
import { parsePolicies, percentToBasisPoints } from '../parser.js';
import type { PolicyContext } from '../types.js';

const CONTEXT: PolicyContext = {
  governance: { roles: { legal: ['@acme/legal'], security: ['@acme/appsec'] } },
  releases: { environments: ['staging', 'prod'] },
};

function parse(policy: Record<string, unknown>, context: PolicyContext = CONTEXT) {
  return parsePolicies([policy] as unknown as PolicyDefinition[], context);
}

describe('parsePolicies - prompt kinds', () => {
  it('parses one policy of every prompt kind', () => {
    // Arrange
    const input = [
      {
        name: 'fields',
        kind: 'required-metadata',
        severity: 'error',
        description: 'Owners for risky prompts',
        match: { minRisk: 'high', domains: ['payments'], dataClasses: ['pii'] },
        fields: ['owner', 'reviewers', 'owner'],
      },
      {
        name: 'floor',
        kind: 'risk-floor',
        severity: 'warning',
        floors: [
          { dataClasses: ['phi'], minimum: 'critical' },
          { domains: ['payments'], minimum: 'high' },
          { inputTypes: ['string'], minimum: 'medium' },
        ],
      },
      { name: 'models', kind: 'model-allowlist', severity: 'error', models: ['sonnet'] },
      {
        name: 'signoff',
        kind: 'required-approvals',
        severity: 'error',
        environments: ['prod'],
        approvals: [{ role: 'legal' }, { role: 'security', count: 1 }],
      },
      { name: 'evals', kind: 'required-evals', severity: 'warning', environments: ['prod'] },
      {
        name: 'content',
        kind: 'content-rules',
        severity: 'error',
        checks: ['suspicious-urls', 'PS012'],
        deny: ['guaranteed refund'],
        allow: ['jailbreak'],
      },
    ] as unknown as PolicyDefinition[];

    // Act
    const result = parsePolicies(input, CONTEXT);

    // Assert
    expect(result.errors).toEqual([]);
    expect(result.policies.map((policy) => policy.kind)).toEqual([
      'required-metadata',
      'risk-floor',
      'model-allowlist',
      'required-approvals',
      'required-evals',
      'content-rules',
    ]);
    expect(result.policies[0]).toMatchObject({
      description: 'Owners for risky prompts',
      fields: ['owner', 'reviewers'],
    });
    expect(result.policies[3]).toMatchObject({
      approvals: [{ role: 'legal' }, { role: 'security', count: 1 }],
    });
  });

  it('accepts a policy without match and without environments', () => {
    // Act
    const result = parse({ name: 'evals', kind: 'required-evals', severity: 'error' });

    // Assert
    expect(result.errors).toEqual([]);
    expect(result.policies[0]).toEqual({
      name: 'evals',
      kind: 'required-evals',
      severity: 'error',
    });
  });

  it('rejects an unknown key with the closest key', () => {
    // Act
    const result = parse({
      name: 'fields',
      kind: 'required-metadata',
      severity: 'error',
      feilds: ['owner'],
      fields: ['owner'],
    });

    // Assert
    expect(result.policies).toEqual([]);
    expect(result.errors).toEqual([
      'Policy "fields": unknown key "feilds". Did you mean "fields"?',
    ]);
  });

  it('rejects an unknown match key, since a typo would change what the policy selects', () => {
    // Act
    const result = parse({
      name: 'fields',
      kind: 'required-metadata',
      severity: 'error',
      match: { minrisk: 'high' },
      fields: ['owner'],
    });

    // Assert
    expect(result.errors).toEqual([
      'Policy "fields": match: unknown key "minrisk". Did you mean "minRisk"?',
    ]);
  });

  it('lists the allowed keys when no key is close', () => {
    // Act
    const result = parse({
      name: 'fields',
      kind: 'required-metadata',
      severity: 'error',
      match: { somethingElse: true },
      fields: ['owner'],
    });

    // Assert
    expect(result.errors[0]).toContain('Use one of: minRisk, domains, dataClasses.');
  });

  it('refuses __proto__ in a policy and in a nested object', () => {
    // Arrange
    const top = JSON.parse(
      '{"name":"a","kind":"registry-allowlist","severity":"error","allowed":["@core"],"__proto__":{"x":1}}'
    ) as Record<string, unknown>;
    const nested = JSON.parse(
      '{"name":"b","kind":"required-metadata","severity":"error","fields":["owner"],"match":{"__proto__":{"minRisk":"low"}}}'
    ) as Record<string, unknown>;

    // Act
    const result = parsePolicies([top, nested] as unknown as PolicyDefinition[]);

    // Assert
    expect(result.policies).toEqual([]);
    expect(result.errors).toEqual([
      'Policy "a": the key "__proto__" is not allowed',
      'Policy "b": match: unknown key "__proto__". Use one of: minRisk, domains, dataClasses.',
    ]);
  });

  it('reads own keys only, so a prototype cannot supply a field', () => {
    // Arrange
    const policy = Object.create({ fields: ['owner'] }) as Record<string, unknown>;
    Object.assign(policy, { name: 'fields', kind: 'required-metadata', severity: 'error' });

    // Act
    const result = parsePolicies([policy] as unknown as PolicyDefinition[]);

    // Assert
    expect(result.errors).toEqual(['Policy "fields": required-metadata requires a "fields" list']);
  });

  it('checks the match values', () => {
    // Act
    const result = parse({
      name: 'fields',
      kind: 'required-metadata',
      severity: 'error',
      match: { minRisk: 'severe', domains: [], dataClasses: ['pii', ' '] },
      fields: ['owner'],
    });

    // Assert
    expect(result.errors).toEqual([
      'Policy "fields": match: "minRisk" must be one of: low, medium, high, critical',
      'Policy "fields": match: "domains" must be a non-empty list of non-empty strings',
      'Policy "fields": match: "dataClasses" must be a non-empty list of non-empty strings',
    ]);
  });

  it('rejects a match that is not an object', () => {
    // Act
    const result = parse({
      name: 'fields',
      kind: 'required-metadata',
      severity: 'error',
      match: 'high',
      fields: ['owner'],
    });

    // Assert
    expect(result.errors).toEqual([
      'Policy "fields": "match" must be an object with minRisk, domains or dataClasses',
    ]);
  });

  describe('data classes in policies', () => {
    const vocabulary: PolicyContext = { governance: { dataClasses: ['pii', 'PHI', 'financial'] } };
    const policies = [
      {
        name: 'fields',
        kind: 'required-metadata',
        severity: 'error',
        match: { dataClasses: ['PII', 'pji'] },
        fields: ['owner'],
      },
      {
        name: 'floor',
        kind: 'risk-floor',
        severity: 'error',
        floors: [{ dataClasses: ['phi', 'secret'], minimum: 'critical' }],
      },
    ];

    it('refuses a data class outside governance.dataClasses in match and floors', () => {
      // Act
      const result = parsePolicies(policies, vocabulary);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([
        'Policy "fields": match: data class "pji" is not in governance.dataClasses. Did you mean "pii"?',
        'Policy "floor": floors[0]: data class "secret" is not in governance.dataClasses. Add it there or fix the name.',
      ]);
    });

    it('checks nothing without a vocabulary, or with one that is not a list of strings', () => {
      // Arrange
      const inherited = Object.create({ dataClasses: ['pii'] }) as object;

      // Act
      const without = parsePolicies(policies, {});
      const notAList = parsePolicies(policies, { governance: { dataClasses: 'pii' as never } });
      const fromPrototype = parsePolicies(policies, { governance: inherited });

      // Assert
      expect(without.errors).toEqual([]);
      expect(notAList.errors).toEqual([]);
      expect(fromPrototype.errors).toEqual([]);
    });

    it('checks the data classes of every prompt kind that takes match', () => {
      // Arrange
      const content = {
        name: 'content',
        kind: 'content-rules',
        severity: 'error',
        match: { dataClasses: ['pij'] },
        deny: ['x'],
      };

      // Act
      const result = parsePolicies([content], vocabulary);

      // Assert
      expect(result.errors).toEqual([
        'Policy "content": match: data class "pij" is not in governance.dataClasses. Did you mean "pii"?',
      ]);
    });
  });

  describe('required-metadata', () => {
    it('rejects a field that is not a governance field', () => {
      // Act
      const result = parse({
        name: 'fields',
        kind: 'required-metadata',
        severity: 'error',
        fields: ['owners'],
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "fields": field "owners" is not a governance field. Did you mean "owner"?',
      ]);
    });

    it('rejects fields that are not a list', () => {
      // Act
      const result = parse({
        name: 'fields',
        kind: 'required-metadata',
        severity: 'error',
        fields: 'owner',
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "fields": "fields" must be a non-empty list of non-empty strings',
      ]);
    });
  });

  describe('risk-floor', () => {
    it('requires floors', () => {
      // Act
      const result = parse({ name: 'floor', kind: 'risk-floor', severity: 'error', floors: [] });

      // Assert
      expect(result.errors).toEqual([
        'Policy "floor": risk-floor requires a non-empty "floors" list',
      ]);
    });

    it('rejects match, since floors select prompts themselves', () => {
      // Act
      const result = parse({
        name: 'floor',
        kind: 'risk-floor',
        severity: 'error',
        match: { minRisk: 'low' },
        floors: [{ dataClasses: ['pii'], minimum: 'high' }],
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "floor": unknown key "match". Use one of: name, description, kind, severity, floors.',
      ]);
    });

    it('checks every row', () => {
      // Act
      const result = parse({
        name: 'floor',
        kind: 'risk-floor',
        severity: 'error',
        floors: [
          'pii',
          { dataClasses: ['pii'] },
          { minimum: 'high' },
          { inputTypes: ['text'], minimum: 'medium', domain: ['x'] },
        ],
      });

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([
        'Policy "floor": floors[0]: each row must be an object with conditions and a "minimum"',
        'Policy "floor": floors[1]: "minimum" must be one of: low, medium, high, critical',
        'Policy "floor": floors[2]: a row needs at least one of dataClasses, domains or inputTypes',
        'Policy "floor": floors[3]: unknown key "domain". Did you mean "domains"?',
        'Policy "floor": floors[3]: input type "text" is not a prompt input type. Use one of: string, number, boolean, enum.',
      ]);
    });
  });

  describe('model-allowlist', () => {
    it('names the closest catalog id for an unknown model', () => {
      // Act
      const result = parse({
        name: 'models',
        kind: 'model-allowlist',
        severity: 'error',
        models: ['claude-opus-5-55'],
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "models": model "claude-opus-5-55" is not in the model catalog. Did you mean "claude-opus-5-5"?',
      ]);
    });

    it('accepts a custom profile from models.profiles', () => {
      // Arrange
      const context: PolicyContext = {
        models: { profiles: { 'acme-model': { provider: 'openai', family: 'acme' } } },
      };

      // Act
      const result = parse(
        { name: 'models', kind: 'model-allowlist', severity: 'error', models: ['acme-model'] },
        context
      );

      // Assert
      expect(result.errors).toEqual([]);
    });

    it('points at models.profiles when nothing is close', () => {
      // Act
      const result = parse({
        name: 'models',
        kind: 'model-allowlist',
        severity: 'error',
        models: ['zzzzzzzzzzzz'],
      });

      // Assert
      expect(result.errors[0]).toContain('Use a catalog id or declare it under models.profiles.');
    });

    it('refuses inherit, which no prompt can pass', () => {
      // Act
      const result = parse({
        name: 'models',
        kind: 'model-allowlist',
        severity: 'error',
        models: ['claude-opus-5-5', 'inherit'],
      });

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([
        'Policy "models": "inherit" is not a model, a prompt on it always fails this policy. Remove it from models.',
      ]);
    });

    it('requires models', () => {
      // Act
      const result = parse({ name: 'models', kind: 'model-allowlist', severity: 'error' });

      // Assert
      expect(result.errors).toEqual(['Policy "models": model-allowlist requires a "models" list']);
    });
  });

  describe('required-approvals', () => {
    it('refuses a count above 1, since unsigned records cannot tell approvers apart', () => {
      // Act
      const result = parse({
        name: 'signoff',
        kind: 'required-approvals',
        severity: 'error',
        approvals: [{ role: 'legal', count: 2 }],
      });

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([
        'Policy "signoff": approvals[0]: role "legal" asks for 2 approvals, but approval records are unsigned and cannot tell two approvers apart under one review. Use count: 1.',
      ]);
    });

    it.each([0, 1.5, '1'])('refuses count %j', (count) => {
      // Act
      const result = parse({
        name: 'signoff',
        kind: 'required-approvals',
        severity: 'error',
        approvals: [{ role: 'legal', count }],
      });

      // Assert
      expect(result.errors).toEqual(['Policy "signoff": approvals[0]: "count" must be 1']);
    });

    it('refuses a role missing from governance.roles, prototype names included', () => {
      // Act
      const result = parse({
        name: 'signoff',
        kind: 'required-approvals',
        severity: 'error',
        approvals: [{ role: 'finance' }, { role: 'constructor' }, { role: 'legal', approver: 'x' }],
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "signoff": approvals[0]: role "finance" is not in governance.roles. Add it there with the teams that review it.',
        'Policy "signoff": approvals[1]: role "constructor" is not in governance.roles. Add it there with the teams that review it.',
        'Policy "signoff": approvals[2]: unknown key "approver". Use one of: role, count.',
      ]);
    });

    it('refuses every role when the project has no governance section', () => {
      // Act
      const result = parse(
        {
          name: 'signoff',
          kind: 'required-approvals',
          severity: 'error',
          approvals: [{ role: 'legal' }],
        },
        {}
      );

      // Assert
      expect(result.errors).toEqual([
        'Policy "signoff": approvals[0]: role "legal" is not in governance.roles. Add it there with the teams that review it.',
      ]);
    });

    it('checks the shape of approvals', () => {
      // Act
      const result = parse({
        name: 'signoff',
        kind: 'required-approvals',
        severity: 'error',
        approvals: ['legal', { role: '' }],
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "signoff": approvals[0]: each approval must be an object with a "role"',
        'Policy "signoff": approvals[1]: "role" must name a role from governance.roles',
      ]);
    });

    it('requires approvals', () => {
      // Act
      const result = parse({ name: 'signoff', kind: 'required-approvals', severity: 'error' });

      // Assert
      expect(result.errors).toEqual([
        'Policy "signoff": required-approvals requires a non-empty "approvals" list',
      ]);
    });

    it('refuses an environment missing from releases.environments', () => {
      // Act
      const withReleases = parse({
        name: 'signoff',
        kind: 'required-approvals',
        severity: 'error',
        environments: ['production'],
        approvals: [{ role: 'legal' }],
      });
      const withoutReleases = parse(
        { name: 'evals', kind: 'required-evals', severity: 'error', environments: ['prod'] },
        {}
      );

      // Assert
      expect(withReleases.errors).toEqual([
        'Policy "signoff": environment "production" is not in releases.environments. Add it there or fix the name.',
      ]);
      expect(withoutReleases.errors).toEqual([
        'Policy "evals": environment "prod" is not in releases.environments. Add it there or fix the name.',
      ]);
    });
  });

  describe('content-rules', () => {
    it('refuses path-traversal, which does not read prompt text', () => {
      // Act
      const result = parse({
        name: 'content',
        kind: 'content-rules',
        severity: 'error',
        checks: ['path-traversal', 'PS013'],
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "content": check "path-traversal" looks at @inherit and @use paths, not prompt text. Remove it from checks.',
        'Policy "content": check "PS013" looks at @inherit and @use paths, not prompt text. Remove it from checks.',
      ]);
    });

    it('names the closest check for an unknown one', () => {
      // Act
      const result = parse({
        name: 'content',
        kind: 'content-rules',
        severity: 'error',
        checks: ['suspicious-url'],
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "content": check "suspicious-url" is not a content check. Did you mean "suspicious-urls"?',
      ]);
    });

    it('needs checks or deny', () => {
      // Act
      const result = parse({
        name: 'content',
        kind: 'content-rules',
        severity: 'error',
        allow: ['x'],
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "content": content-rules requires a "checks" or a "deny" list',
      ]);
    });

    it('refuses a deny phrase that is empty after normalization', () => {
      // Act
      const result = parse({
        name: 'content',
        kind: 'content-rules',
        severity: 'error',
        deny: ['\u200B\u200B'],
      });

      // Assert
      expect(result.errors).toEqual([
        'Policy "content": deny phrase "\u200B\u200B" is empty after normalization, so it would match every text',
      ]);
    });
  });

  describe('max-experiment-weight', () => {
    const exposure = (fields: Record<string, unknown>): Record<string, unknown> => ({
      name: 'exposure',
      kind: 'max-experiment-weight',
      severity: 'error',
      ...fields,
    });

    it('parses a full policy and keeps the percents', () => {
      // Act
      const result = parse(
        exposure({
          match: { minRisk: 'high' },
          environments: ['prod'],
          maxWeight: 5,
          approvals: [{ role: 'legal' }, { role: 'security', count: 1 }],
          ceiling: 25,
        })
      );

      // Assert
      expect(result.errors).toEqual([]);
      expect(result.policies).toEqual([
        {
          name: 'exposure',
          kind: 'max-experiment-weight',
          severity: 'error',
          match: { minRisk: 'high' },
          environments: ['prod'],
          maxWeight: 5,
          approvals: [{ role: 'legal' }, { role: 'security', count: 1 }],
          ceiling: 25,
        },
      ]);
    });

    it.each([
      ['a hard cap', { maxWeight: 10 }],
      ['a zero cap', { maxWeight: 0 }],
      ['two decimals', { maxWeight: 0.07, approvals: [{ role: 'legal' }], ceiling: 12.35 }],
      ['the full range', { maxWeight: 0, approvals: [{ role: 'legal' }], ceiling: 100 }],
      ['ceiling equal to maxWeight', { maxWeight: 5, approvals: [{ role: 'legal' }], ceiling: 5 }],
      ['approvals without ceiling', { maxWeight: 5, approvals: [{ role: 'legal' }] }],
    ])('accepts %s', (_name, fields) => {
      // Act
      const result = parse(exposure(fields));

      // Assert
      expect(result.errors).toEqual([]);
      expect(result.policies).toHaveLength(1);
    });

    it.each([2.505, 0.001, -1, 100.01, Number.NaN, Number.POSITIVE_INFINITY, '5', null])(
      'refuses maxWeight %j',
      (maxWeight) => {
        // Act
        const result = parse(exposure({ maxWeight }));

        // Assert
        expect(result.policies).toEqual([]);
        expect(result.errors).toEqual([
          'Policy "exposure": "maxWeight" must be a percent from 0 to 100 with at most two decimals, such as 5 or 2.5',
        ]);
      }
    );

    it('refuses a ceiling with more than two decimals', () => {
      // Act
      const result = parse(
        exposure({ maxWeight: 5, approvals: [{ role: 'legal' }], ceiling: 12.345 })
      );

      // Assert
      expect(result.errors).toEqual([
        'Policy "exposure": "ceiling" must be a percent from 0 to 100 with at most two decimals, such as 5 or 2.5',
      ]);
    });

    it('requires maxWeight', () => {
      // Act
      const result = parse(exposure({ approvals: [{ role: 'legal' }] }));

      // Assert
      expect(result.errors).toEqual([
        'Policy "exposure": max-experiment-weight requires "maxWeight", the percent an arm may get',
      ]);
    });

    it('refuses a ceiling below maxWeight', () => {
      // Act
      const result = parse(
        exposure({ maxWeight: 10, approvals: [{ role: 'legal' }], ceiling: 9.99 })
      );

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([
        'Policy "exposure": "ceiling" (9.99) is below "maxWeight" (10). Set it to at least 10.',
      ]);
    });

    it('compares ceiling and maxWeight in basis points, so float noise is not below', () => {
      // Act
      const result = parse(
        exposure({ maxWeight: 0.1 + 0.2, approvals: [{ role: 'legal' }], ceiling: 0.3 })
      );

      // Assert
      expect(result.errors).toEqual([]);
      expect(result.policies[0]).toMatchObject({ maxWeight: 0.3, ceiling: 0.3 });
    });

    it('refuses a ceiling without approvals, since the cap is then maxWeight', () => {
      // Act
      const result = parse(exposure({ maxWeight: 5, ceiling: 25 }));

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([
        'Policy "exposure": "ceiling" needs "approvals": without them the cap is maxWeight. Add approvals or remove ceiling.',
      ]);
    });

    it('refuses an empty approvals list', () => {
      // Act
      const result = parse(exposure({ maxWeight: 5, approvals: [] }));

      // Assert
      expect(result.errors).toEqual([
        'Policy "exposure": "approvals" must be a non-empty list of roles, or left out for a hard cap',
      ]);
    });

    it('refuses an unknown role and an unknown environment', () => {
      // Act
      const result = parse(
        exposure({ environments: ['production'], maxWeight: 5, approvals: [{ role: 'product' }] })
      );

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([
        'Policy "exposure": environment "production" is not in releases.environments. Add it there or fix the name.',
        'Policy "exposure": approvals[0]: role "product" is not in governance.roles. Add it there with the teams that review it.',
      ]);
    });

    it('refuses an approval count of 2, like required-approvals', () => {
      // Act
      const result = parse(exposure({ maxWeight: 5, approvals: [{ role: 'legal', count: 2 }] }));

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([
        'Policy "exposure": approvals[0]: role "legal" asks for 2 approvals, but approval records are unsigned and cannot tell two approvers apart under one review. Use count: 1.',
      ]);
    });

    it('refuses an unknown key, such as a weight written as maxweight', () => {
      // Act
      const result = parse(exposure({ maxweight: 5, maxWeight: 5 }));

      // Assert
      expect(result.errors).toEqual([
        'Policy "exposure": unknown key "maxweight". Did you mean "maxWeight"?',
      ]);
    });
  });

  describe('percentToBasisPoints', () => {
    it.each([
      [0, 0],
      [0.07, 7],
      [2.5, 250],
      [12.35, 1235],
      [100, 10000],
    ])('turns %j percent into %j basis points', (percent, points) => {
      // Act
      const result = percentToBasisPoints(percent);

      // Assert
      expect(result).toBe(points);
    });

    it.each([2.505, -0.01, 100.01, Number.NaN, '5', undefined])('refuses %j', (value) => {
      // Act
      const result = percentToBasisPoints(value);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
