import { describe, expect, it } from 'vitest';
import { normalizeProgram, type PolicyDefinition, type PolicySubject } from '@promptscript/core';
import { PROMPT_LOC, promptProgram } from '../../__tests__/prompt-helper.js';
import { normalizeDenyText } from '../content-rules.js';
import {
  evaluatePromptPolicies,
  promptPolicyMatches,
  promptPolicyRisk,
  promptPolicySubjects,
} from '../prompt-evaluator.js';

function subject(overrides: Partial<PolicySubject> = {}): PolicySubject {
  return {
    id: 'acme/refund-reply',
    governance: {},
    model: { ref: 'claude-sonnet-5-5' },
    inputs: { status: { type: 'enum', options: ['open', 'closed'] } },
    texts: [{ role: 'system', content: 'You answer refund requests.' }],
    loc: PROMPT_LOC,
    ...overrides,
  };
}

const DATA_FLOOR: PolicyDefinition = {
  name: 'data-floor',
  kind: 'risk-floor',
  severity: 'error',
  floors: [
    { dataClasses: ['phi', 'credentials'], minimum: 'critical' },
    { dataClasses: ['pii', 'financial'], minimum: 'high' },
    { domains: ['payments'], minimum: 'medium' },
    { inputTypes: ['string'], minimum: 'medium' },
  ],
};

const REVIEWERS_AT_HIGH: PolicyDefinition = {
  name: 'governance-fields',
  kind: 'required-metadata',
  severity: 'error',
  match: { minRisk: 'high' },
  fields: ['owner', 'reviewers'],
};

function messages(policies: PolicyDefinition[], subjects: PolicySubject[]): string[] {
  return evaluatePromptPolicies(policies, subjects).map((violation) => violation.message);
}

describe('promptPolicySubjects', () => {
  it('builds a subject per entry with effective governance and the entry location', () => {
    // Arrange
    const program = promptProgram(
      { risk: 'high', dataClasses: ['pii'], model: { ref: 'sonnet' } },
      { meta: { owner: '@acme/support', dataClasses: ['internal'] } }
    );

    // Act
    const subjects = promptPolicySubjects(program);

    // Assert
    expect(subjects).toEqual([
      {
        id: 'acme-support/review',
        governance: { risk: 'high', owner: '@acme/support', dataClasses: ['internal', 'pii'] },
        model: { ref: 'sonnet' },
        inputs: { message: { type: 'string', description: 'Customer message' } },
        texts: [
          { role: 'system', content: 'You answer refund requests.' },
          { role: 'user', content: 'Customer wrote: {{input.message}}' },
        ],
        loc: PROMPT_LOC,
      },
    ]);
  });

  it('reads a canonical program the same way', () => {
    // Arrange
    const program = promptProgram({ risk: 'high' }, { meta: { owner: '@acme/support' } });

    // Act
    const [canonical] = promptPolicySubjects(normalizeProgram(program));

    // Assert
    expect(canonical).toMatchObject({
      id: 'acme-support/review',
      governance: { risk: 'high', owner: '@acme/support' },
    });
  });

  it('uses the entry key as id when @meta has no id, and skips missing texts', () => {
    // Arrange
    const noSystem = promptProgram({ system: undefined }, { meta: { id: 42 } });
    const noUser = promptProgram({ user: undefined, inputs: undefined });

    // Act
    const [first] = promptPolicySubjects(noSystem);
    const [second] = promptPolicySubjects(noUser);

    // Assert
    expect(first?.id).toBe('review');
    expect(first?.texts).toEqual([{ role: 'user', content: 'Customer wrote: {{input.message}}' }]);
    expect(first).not.toHaveProperty('model');
    expect(second?.texts).toEqual([{ role: 'system', content: 'You answer refund requests.' }]);
  });
});

describe('evaluatePromptPolicies', () => {
  it('reports at the location of the prompt with the policy severity', () => {
    // Arrange
    const policy: PolicyDefinition = { ...REVIEWERS_AT_HIGH, severity: 'warning' };

    // Act
    const violations = evaluatePromptPolicies(
      [policy],
      [subject({ governance: { risk: 'high', owner: '@a' } })]
    );

    // Assert
    expect(violations).toEqual([
      {
        policyName: 'governance-fields',
        kind: 'required-metadata',
        severity: 'warning',
        message: 'Prompt "acme/refund-reply" has risk "high" but no reviewers',
        suggestion: 'Add reviewers to the entry or to @meta.',
        location: PROMPT_LOC,
      },
    ]);
  });

  it('leaves the location out for a subject without one', () => {
    // Act
    const [violation] = evaluatePromptPolicies(
      [REVIEWERS_AT_HIGH],
      [subject({ governance: { risk: 'critical' }, loc: undefined })]
    );

    // Assert
    expect(violation).not.toHaveProperty('location');
  });

  it('evaluates no skill kind, approvals or evals', () => {
    // Arrange
    const policies: PolicyDefinition[] = [
      { name: 'registries', kind: 'registry-allowlist', severity: 'error', allowed: ['@core'] },
      {
        name: 'signoff',
        kind: 'required-approvals',
        severity: 'error',
        approvals: [{ role: 'legal' }],
      },
      { name: 'evals', kind: 'required-evals', severity: 'error' },
    ];

    // Act
    const violations = evaluatePromptPolicies(policies, [
      subject({ governance: { risk: 'critical' } }),
    ]);

    // Assert
    expect(violations).toEqual([]);
  });

  describe('required-metadata', () => {
    it('names a missing risk on its own', () => {
      // Arrange
      const policy: PolicyDefinition = {
        name: 'risk-set',
        kind: 'required-metadata',
        severity: 'error',
        fields: ['risk'],
      };

      // Act / Assert
      expect(messages([policy], [subject()])).toEqual(['Prompt "acme/refund-reply" has no risk']);
    });

    it('counts empty values as missing', () => {
      // Act
      const result = messages(
        [REVIEWERS_AT_HIGH],
        [subject({ governance: { risk: 'high', owner: '', reviewers: [] } })]
      );

      // Assert
      expect(result).toEqual([
        'Prompt "acme/refund-reply" has risk "high" but no owner',
        'Prompt "acme/refund-reply" has risk "high" but no reviewers',
      ]);
    });

    it('passes a prompt that has every field', () => {
      // Act
      const result = messages(
        [REVIEWERS_AT_HIGH],
        [subject({ governance: { risk: 'high', owner: '@a', reviewers: ['@b'] } })]
      );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('policy risk', () => {
    it('counts unset risk as low', () => {
      // Act / Assert
      expect(messages([REVIEWERS_AT_HIGH], [subject()])).toEqual([]);
    });

    it('raises policy risk with a floor, whatever the floor severity', () => {
      // Arrange
      const floor: PolicyDefinition = { ...DATA_FLOOR, severity: 'warning' };
      const pii = subject({ governance: { risk: 'low', dataClasses: ['PII'] } });

      // Act
      const result = messages([floor, REVIEWERS_AT_HIGH], [pii]);

      // Assert
      expect(result).toEqual([
        'Prompt "acme/refund-reply" has risk "low", below "high" required for data class "PII"',
        'Prompt "acme/refund-reply" has risk "high" but no owner',
        'Prompt "acme/refund-reply" has risk "high" but no reviewers',
      ]);
    });

    it('treats an unknown risk value as low', () => {
      // Arrange
      const odd = subject({ governance: { risk: 'severe' as never } });
      const policy: PolicyDefinition = { ...REVIEWERS_AT_HIGH, match: { minRisk: 'low' } };

      // Act / Assert
      expect(messages([policy], [odd])).toHaveLength(2);
    });
  });

  describe('match', () => {
    const policy: PolicyDefinition = {
      ...REVIEWERS_AT_HIGH,
      match: { domains: ['Payments'], dataClasses: ['pii'] },
    };

    it('selects a prompt only when every key matches, lowercased', () => {
      // Arrange
      const both = subject({
        id: 'both',
        governance: { domain: 'payments', dataClasses: ['PII'] },
      });
      const domainOnly = subject({ id: 'domain', governance: { domain: 'PAYMENTS' } });
      const classOnly = subject({
        id: 'class',
        governance: { domain: 'hr', dataClasses: ['pii'] },
      });

      // Act
      const result = evaluatePromptPolicies([policy], [both, domainOnly, classOnly]);

      // Assert
      expect(new Set(result.map((violation) => violation.message.split('"')[1]))).toEqual(
        new Set(['both'])
      );
    });

    it('selects every prompt without match', () => {
      // Arrange
      const all: PolicyDefinition = { ...REVIEWERS_AT_HIGH, match: undefined };

      // Act / Assert
      expect(messages([all], [subject()])).toHaveLength(2);
    });
  });

  describe('risk-floor', () => {
    it('reports an unset risk below the floor', () => {
      // Act
      const result = evaluatePromptPolicies(
        [DATA_FLOOR],
        [subject({ governance: { dataClasses: ['credentials'] } })]
      );

      // Assert
      expect(result).toEqual([
        expect.objectContaining({
          message:
            'Prompt "acme/refund-reply" has no risk, which counts as "low", below "critical" required for data class "credentials"',
          suggestion: 'Set risk: "critical" on the entry or in @meta.',
        }),
      ]);
    });

    it('takes the highest matching row', () => {
      // Act
      const result = messages(
        [DATA_FLOOR],
        [
          subject({
            governance: { risk: 'medium', domain: 'payments', dataClasses: ['pii', 'phi'] },
          }),
        ]
      );

      // Assert
      expect(result).toEqual([
        'Prompt "acme/refund-reply" has risk "medium", below "critical" required for data class "phi"',
      ]);
    });

    it('names the domain or the free-text input that raised the floor', () => {
      // Arrange
      const domain = subject({ id: 'domain', governance: { domain: 'Payments' } });
      const input = subject({ id: 'input', inputs: { message: { type: 'string' } } });

      // Act
      const result = messages([DATA_FLOOR], [domain, input]);

      // Assert
      expect(result).toEqual([
        'Prompt "domain" has no risk, which counts as "low", below "medium" required for domain "Payments"',
        'Prompt "input" has no risk, which counts as "low", below "medium" required for input "message" of type string',
      ]);
    });

    it('passes a prompt at or above its floor, and one no row matches', () => {
      // Arrange
      const atFloor = subject({ governance: { risk: 'high', dataClasses: ['pii'] } });
      const noRow = subject({ governance: { dataClasses: ['public'] } });

      // Act / Assert
      expect(messages([DATA_FLOOR], [atFloor, noRow])).toEqual([]);
    });
  });

  describe('model-allowlist', () => {
    const allowlist: PolicyDefinition = {
      name: 'high-risk-models',
      kind: 'model-allowlist',
      severity: 'error',
      match: { minRisk: 'high' },
      models: ['claude-opus-5-5', 'sonnet'],
    };
    const high = { risk: 'high' as const };

    it('passes a listed model, a listed floating alias and its release', () => {
      // Arrange
      const subjects = [
        subject({ governance: high, model: { ref: 'claude-opus-5-5' } }),
        subject({ governance: high, model: { ref: 'sonnet' } }),
        subject({ governance: high, model: { ref: 'claude-sonnet-5-5' } }),
      ];

      // Act / Assert
      expect(messages([allowlist], subjects)).toEqual([]);
    });

    it('reports a model outside the list, an unknown model, inherit and no model', () => {
      // Arrange
      const subjects = [
        subject({ id: 'haiku', governance: high, model: { ref: 'claude-haiku-4-5' } }),
        subject({ id: 'unknown', governance: high, model: { ref: 'acme-model' } }),
        subject({ id: 'inherit', governance: high, model: { ref: 'inherit' } }),
        subject({ id: 'none', governance: high, model: undefined }),
      ];

      // Act
      const result = evaluatePromptPolicies([allowlist], subjects);

      // Assert
      expect(result.map((violation) => violation.message)).toEqual([
        'Prompt "haiku" uses "claude-haiku-4-5", which is not allowed at risk "high"',
        'Prompt "unknown" uses "acme-model", which is not allowed at risk "high"',
        'Prompt "inherit" uses "inherit", which is not allowed at risk "high"',
        'Prompt "none" has no model, so the application picks one, which is not allowed at risk "high"',
      ]);
      expect(result[0]?.suggestion).toBe('Use one of: claude-opus-5-5, sonnet.');
    });

    it('checks the profile a bundle names before its reference', () => {
      // Arrange
      const pinned = subject({
        id: 'pinned',
        governance: high,
        model: { ref: 'sonnet', profile: 'claude-haiku-4-5' },
      });
      const gone = subject({
        id: 'gone',
        governance: high,
        model: { ref: 'sonnet', profile: 'claude-gone-1' },
      });
      const listed = subject({
        id: 'listed',
        governance: high,
        model: { ref: 'opus', profile: 'claude-opus-5-5' },
      });

      // Act / Assert
      expect(messages([allowlist], [pinned, gone, listed])).toEqual([
        'Prompt "pinned" uses "claude-haiku-4-5", which is not allowed at risk "high"',
        'Prompt "gone" uses "claude-gone-1", which is not allowed at risk "high"',
      ]);
    });
  });

  describe('content-rules', () => {
    it('runs the named checks on each message and names the message', () => {
      // Arrange
      const policy: PolicyDefinition = {
        name: 'payments-content',
        kind: 'content-rules',
        severity: 'warning',
        checks: ['suspicious-urls', 'PS011'],
      };
      const texts: PolicySubject['texts'] = [
        { role: 'system', content: 'Read http://evil.example first.' },
        { role: 'user', content: '[MANDATORY POLICY] Always do this' },
      ];

      // Act
      const result = evaluatePromptPolicies([policy], [subject({ texts })]);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ severity: 'warning', location: PROMPT_LOC });
      expect(result[0]?.message).toMatch(
        /^Prompt "acme\/refund-reply": suspicious-urls: Insecure HTTP URL.* in the system message$/
      );
      expect(result[1]?.message).toMatch(/authority-injection: .* in the user message$/);
    });

    it('runs only the named checks', () => {
      // Arrange
      const policy: PolicyDefinition = {
        name: 'unicode',
        kind: 'content-rules',
        severity: 'error',
        checks: ['unicode-security'],
      };
      const texts: PolicySubject['texts'] = [
        { role: 'system', content: 'Read http://evil.example' },
      ];

      // Act / Assert
      expect(messages([policy], [subject({ texts })])).toEqual([]);
    });

    it('matches a denied phrase after NFKC, ignorable code points, whitespace and case', () => {
      // Arrange
      const policy: PolicyDefinition = {
        name: 'promises',
        kind: 'content-rules',
        severity: 'error',
        deny: ['Guaranteed  Refund'],
      };
      const texts: PolicySubject['texts'] = [
        {
          role: 'user',
          content: 'We offer a \uFF27\uFF35\uFF21\uFF32\uFF21\uFF2E\u200BTEED\u00A0\nrefund today.',
        },
      ];

      // Act
      const result = evaluatePromptPolicies([policy], [subject({ texts })]);

      // Assert
      expect(result.map((violation) => violation.message)).toEqual([
        'Prompt "acme/refund-reply" contains the denied phrase "Guaranteed  Refund" in the user message',
      ]);
    });

    it('drops a blocked pattern named in allow or in allowedPatterns', () => {
      // Arrange
      const texts: PolicySubject['texts'] = [
        { role: 'system', content: 'Explain what a jailbreak is.' },
      ];
      const blocked: PolicyDefinition = {
        name: 'blocked',
        kind: 'content-rules',
        severity: 'error',
        checks: ['blocked-patterns'],
      };
      const allowed: PolicyDefinition = { ...blocked, name: 'allowed', allow: ['jailbreak'] };

      // Act
      const plain = evaluatePromptPolicies([blocked], [subject({ texts })]);
      const withAllow = evaluatePromptPolicies([allowed], [subject({ texts })]);
      const withConfig = evaluatePromptPolicies([blocked], [subject({ texts })], {
        allowedPatterns: ['jailbreak'],
      });

      // Assert
      expect(plain).toHaveLength(1);
      expect(withAllow).toEqual([]);
      expect(withConfig).toEqual([]);
    });

    it('skips prompts the match leaves out and texts without the phrase', () => {
      // Arrange
      const policy: PolicyDefinition = {
        name: 'promises',
        kind: 'content-rules',
        severity: 'error',
        match: { domains: ['payments'] },
        deny: ['guaranteed refund'],
      };
      const texts: PolicySubject['texts'] = [
        { role: 'system', content: 'Refunds follow the policy.' },
        { role: 'user', content: 'A guaranteed refund for everyone.' },
      ];
      const payments = subject({
        id: 'payments',
        governance: { domain: 'payments' },
        texts: texts.slice(0, 1),
      });
      const hr = subject({ id: 'hr', governance: { domain: 'hr' }, texts });

      // Act / Assert
      expect(messages([policy], [payments, hr])).toEqual([]);
    });

    it('adds the configured blocked patterns', () => {
      // Arrange
      const policy: PolicyDefinition = {
        name: 'blocked',
        kind: 'content-rules',
        severity: 'error',
        checks: ['PS005'],
      };
      const texts: PolicySubject['texts'] = [
        { role: 'system', content: 'Use the secret handshake.' },
      ];

      // Act
      const result = evaluatePromptPolicies([policy], [subject({ texts, loc: undefined })], {
        blockedPatterns: ['secret handshake'],
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.message).toContain('blocked-patterns: Blocked pattern detected');
    });
  });
});

describe('normalizeDenyText', () => {
  it('folds compatibility forms, drops ignorable code points and collapses whitespace', () => {
    // Act / Assert
    expect(normalizeDenyText('  \uFB01\u00AD\u200Bne\t\n PRINT ')).toBe('fine print');
  });
});

describe('promptPolicyRisk and promptPolicyMatches', () => {
  it('raises the effective risk with every risk floor', () => {
    // Arrange
    const pii = subject({ governance: { risk: 'low', dataClasses: ['pii'] } });

    // Act
    const risk = promptPolicyRisk(pii, [DATA_FLOOR, REVIEWERS_AT_HIGH]);
    const unset = promptPolicyRisk(subject({ inputs: {} }), [REVIEWERS_AT_HIGH]);

    // Assert
    expect(risk).toBe('high');
    expect(unset).toBe('low');
  });

  it('selects on the policy risk it is given, not the authored one', () => {
    // Arrange
    const low = subject({ governance: { risk: 'low', domain: 'payments' } });

    // Act
    const atHigh = promptPolicyMatches({ minRisk: 'high', domains: ['payments'] }, low, 'high');
    const atLow = promptPolicyMatches({ minRisk: 'high' }, low, 'low');

    // Assert
    expect(atHigh).toBe(true);
    expect(atLow).toBe(false);
    expect(promptPolicyMatches(undefined, low, 'low')).toBe(true);
  });
});

describe('evaluatePromptPolicies with a scope', () => {
  it('uses the given risk and selection instead of the subject own', () => {
    // Arrange
    const low = subject({ governance: { risk: 'low' } });

    // Act
    const selected = evaluatePromptPolicies(
      [REVIEWERS_AT_HIGH],
      [low],
      {},
      {
        risk: 'critical',
        selects: () => true,
      }
    );
    const notSelected = evaluatePromptPolicies(
      [REVIEWERS_AT_HIGH],
      [low],
      {},
      {
        risk: 'critical',
        selects: () => false,
      }
    );

    // Assert
    expect(selected.map((violation) => violation.message)).toEqual([
      'Prompt "acme/refund-reply" has risk "critical" but no owner',
      'Prompt "acme/refund-reply" has risk "critical" but no reviewers',
    ]);
    expect(notSelected).toEqual([]);
  });

  it('still judges a risk floor on the subject itself', () => {
    // Arrange
    const pii = subject({ governance: { risk: 'low', dataClasses: ['pii'] } });

    // Act
    const violations = evaluatePromptPolicies(
      [DATA_FLOOR],
      [pii],
      {},
      {
        risk: 'critical',
        selects: () => false,
      }
    );

    // Assert
    expect(violations.map((violation) => violation.policyName)).toEqual(['data-floor']);
  });
});
