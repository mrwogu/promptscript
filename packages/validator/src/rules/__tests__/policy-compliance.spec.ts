import { describe, it, expect } from 'vitest';
import type { Block, ObjectContent, Program, SourceLocation } from '@promptscript/core';
import { policyCompliance } from '../policy-compliance.js';
import type { ValidationMessage, ValidatorConfig } from '../../types.js';

// ============================================================
// Test helpers
// ============================================================

const LOC: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: { type: 'ObjectContent', properties: skills } as ObjectContent,
    loc: LOC,
  };
}

function makeAst(blocks: Block[]): Program {
  return { type: 'Program', uses: [], blocks, extends: [], loc: LOC };
}

function validate(ast: Program, config: ValidatorConfig = {}): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  policyCompliance.validate({
    ast,
    config,
    report: (msg) =>
      messages.push({
        ruleId: policyCompliance.id,
        ruleName: policyCompliance.name,
        severity: msg.severity ?? policyCompliance.defaultSeverity,
        ...msg,
      }),
  });
  return messages;
}

// ============================================================
// Tests
// ============================================================

describe('policy-compliance (PS030)', () => {
  it('has correct metadata', () => {
    expect(policyCompliance.id).toBe('PS030');
    expect(policyCompliance.name).toBe('policy-compliance');
    expect(policyCompliance.defaultSeverity).toBe('error');
  });

  it('produces no messages when no policies are configured', () => {
    // Arrange
    const ast = makeAst([]);

    // Act
    const messages = validate(ast, {});

    // Assert
    expect(messages).toHaveLength(0);
  });

  it('produces no messages when policies array is empty', () => {
    // Arrange
    const ast = makeAst([]);

    // Act
    const messages = validate(ast, { policies: [] });

    // Assert
    expect(messages).toHaveLength(0);
  });

  it('produces no messages when skipPolicies is true even if policies would violate', () => {
    // Arrange – a skill with a disallowed registry in its layer trace
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            {
              property: 'content',
              source: '@evil/skills.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const messages = validate(ast, {
      skipPolicies: true,
      policies: [
        {
          name: 'allowed-registries',
          kind: 'registry-allowlist',
          severity: 'error',
          allowed: ['@core'],
        },
      ],
    });

    // Assert
    expect(messages).toHaveLength(0);
  });

  it('reports registry-allowlist violation when skill is modified by disallowed registry', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            {
              property: 'content',
              source: '@evil/skills.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const messages = validate(ast, {
      policies: [
        {
          name: 'allowed-registries',
          kind: 'registry-allowlist',
          severity: 'error',
          allowed: ['@core'],
        },
      ],
    });

    // Assert
    expect(messages).toHaveLength(1);
    expect(messages[0]!.ruleId).toBe('PS030');
    expect(messages[0]!.message).toContain('[allowed-registries]');
    expect(messages[0]!.message).toContain('@evil');
  });

  it('reports parse errors for invalid policy definitions', () => {
    // Arrange – a policy missing required "kind" field
    const ast = makeAst([]);

    // Act
    const messages = validate(ast, {
      policies: [
        {
          name: 'bad-policy',
          kind: 'registry-allowlist',
          severity: 'error',
          // missing "allowed" field — cast to satisfy TypeScript, but runtime will catch it
          allowed: [],
        } as unknown as import('@promptscript/core').PolicyDefinition,
      ],
    });

    // Assert
    expect(messages).toHaveLength(1);
    expect(messages[0]!.severity).toBe('error');
    expect(messages[0]!.message).toContain('bad-policy');
  });

  it('uses the policy severity for violations (warning)', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            {
              property: 'content',
              source: '@unofficial/skills.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const messages = validate(ast, {
      policies: [
        {
          name: 'warn-registries',
          kind: 'registry-allowlist',
          severity: 'warning',
          allowed: ['@core'],
        },
      ],
    });

    // Assert
    expect(messages).toHaveLength(1);
    expect(messages[0]!.severity).toBe('warning');
  });

  it('reports violation message with suggestion when available', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            {
              property: 'content',
              source: '@bad/skills.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const messages = validate(ast, {
      policies: [
        {
          name: 'strict-registries',
          kind: 'registry-allowlist',
          severity: 'error',
          allowed: ['@core', '@team'],
        },
      ],
    });

    // Assert
    expect(messages).toHaveLength(1);
    expect(messages[0]!.suggestion).toBeDefined();
    expect(messages[0]!.suggestion).toContain('@core');
  });
});
