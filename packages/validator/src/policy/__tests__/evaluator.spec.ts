import { describe, it, expect } from 'vitest';
import type { Block, ObjectContent, Program } from '@promptscript/core';
import { evaluatePolicies } from '../evaluator.js';

// ============================================================
// Test helpers
// ============================================================

const LOC = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: { type: 'ObjectContent', properties: skills } as ObjectContent,
    loc: LOC,
  };
}

function makeAst(blocks: Block[], exts: Program['extends'] = []): Program {
  return { type: 'Program', uses: [], blocks, extends: exts, loc: LOC };
}

// ============================================================
// layer-boundary
// ============================================================

describe('evaluatePolicies – layer-boundary', () => {
  const policy = {
    name: 'enforce-layers',
    kind: 'layer-boundary' as const,
    severity: 'error' as const,
    layers: ['@core', '@team', '@project'],
    maxDistance: 1,
  };

  it('returns no violations when skill has no layer trace', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: { description: 'test' },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('returns no violations when source is within maxDistance (adjacent layers)', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __baseSource: '@core/skills.prs',
          __layerTrace: [
            {
              property: 'content',
              source: '@team/overlay.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('produces a violation when source skips a layer (distance > maxDistance)', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __baseSource: '@core/skills.prs',
          __layerTrace: [
            // @project is 2 hops from @core, maxDistance=1
            {
              property: 'content',
              source: '@project/local.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0]!).toMatchObject({
      policyName: 'enforce-layers',
      kind: 'layer-boundary',
      severity: 'error',
    });
    expect(violations[0]!.message).toContain('mySkill');
    expect(violations[0]!.message).toContain('@project');
    expect(violations[0]!.message).toContain('@core');
  });

  it('allows larger distance when maxDistance is increased', () => {
    // Arrange
    const relaxedPolicy = { ...policy, maxDistance: 2 };
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __baseSource: '@core/skills.prs',
          __layerTrace: [
            {
              property: 'content',
              source: '@project/local.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([relaxedPolicy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('skips trace entries whose registry is not in the layers list', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __baseSource: '@core/skills.prs',
          __layerTrace: [
            // @unknown is not in policy.layers — should be ignored, not violated
            {
              property: 'content',
              source: '@unknown/overlay.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });
});

// ============================================================
// property-protection
// ============================================================

describe('evaluatePolicies – property-protection', () => {
  const policy = {
    name: 'protect-content',
    kind: 'property-protection' as const,
    severity: 'error' as const,
    properties: ['content', 'trigger'],
  };

  it('returns no violations when skill has no layer trace', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: { description: 'test' },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('returns no violations when overridden property is not protected', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            {
              property: 'description',
              source: '@team/overlay.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('produces a violation when a protected property is overridden', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            {
              property: 'content',
              source: '@team/overlay.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0]!).toMatchObject({
      policyName: 'protect-content',
      kind: 'property-protection',
      severity: 'error',
    });
    expect(violations[0]!.message).toContain('mySkill');
    expect(violations[0]!.message).toContain('content');
  });

  it('produces multiple violations for multiple protected properties overridden', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            {
              property: 'content',
              source: '@team/overlay.prs',
              strategy: 'replace',
              action: 'override',
            },
            {
              property: 'trigger',
              source: '@team/overlay.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(2);
  });

  it('respects targetPattern — skips skills that do not match', () => {
    // Arrange
    const policyWithPattern = {
      ...policy,
      targetPattern: '@core/*',
    };
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          // composedFrom from @team, not @core — should not trigger
          __composedFrom: [{ source: '@team/skills.prs', phase: 'main' }],
          __layerTrace: [
            {
              property: 'content',
              source: '@project/local.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policyWithPattern], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('respects targetPattern — flags skills that match the pattern', () => {
    // Arrange
    const policyWithPattern = {
      ...policy,
      targetPattern: '@core/*',
    };
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          // composedFrom from @core — should trigger
          __composedFrom: [{ source: '@core/skills.prs', phase: 'main' }],
          __layerTrace: [
            {
              property: 'content',
              source: '@project/local.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policyWithPattern], ast);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0]!.message).toContain('content');
  });
});

// ============================================================
// registry-allowlist
// ============================================================

describe('evaluatePolicies – registry-allowlist', () => {
  const policy = {
    name: 'allowlist',
    kind: 'registry-allowlist' as const,
    severity: 'warning' as const,
    allowed: ['@core', '@team'],
  };

  it('returns no violations when skill has no layer trace', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: { description: 'test' },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('returns no violations when all source registries are allowed', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            {
              property: 'content',
              source: '@core/skills.prs',
              strategy: 'replace',
              action: 'override',
            },
            {
              property: 'description',
              source: '@team/overlay.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('produces a violation when source registry is not allowed', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            {
              property: 'content',
              source: '@rogue/overlay.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0]!).toMatchObject({
      policyName: 'allowlist',
      kind: 'registry-allowlist',
      severity: 'warning',
    });
    expect(violations[0]!.message).toContain('@rogue');
  });

  it('ignores trace entries without a registry prefix', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            // relative path — extractRegistry returns null, should be skipped
            { property: 'content', source: './local.prs', strategy: 'replace', action: 'override' },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });
});

// ============================================================
// Multiple policies
// ============================================================

describe('evaluatePolicies – multiple policies', () => {
  it('evaluates all policies and collects all violations', () => {
    // Arrange
    const policies = [
      {
        name: 'protect-content',
        kind: 'property-protection' as const,
        severity: 'error' as const,
        properties: ['content'],
      },
      {
        name: 'allowlist',
        kind: 'registry-allowlist' as const,
        severity: 'warning' as const,
        allowed: ['@core'],
      },
    ];

    const ast = makeAst([
      makeSkillsBlock({
        mySkill: {
          description: 'test',
          __layerTrace: [
            // Triggers property-protection (content is protected)
            // AND registry-allowlist (@rogue is not allowed)
            {
              property: 'content',
              source: '@rogue/overlay.prs',
              strategy: 'replace',
              action: 'override',
            },
          ],
        },
      }),
    ]);

    // Act
    const violations = evaluatePolicies(policies, ast);

    // Assert
    expect(violations).toHaveLength(2);
    const kinds = violations.map((v) => v.policyName);
    expect(kinds).toContain('protect-content');
    expect(kinds).toContain('allowlist');
  });

  it('returns empty when no policies are provided', () => {
    // Arrange
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: { description: 'test' },
      }),
    ]);

    // Act
    const violations = evaluatePolicies([], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('returns empty when skills block is absent', () => {
    // Arrange
    const policy = {
      name: 'allowlist',
      kind: 'registry-allowlist' as const,
      severity: 'error' as const,
      allowed: ['@core'],
    };
    const ast = makeAst([]); // no blocks at all

    // Act
    const violations = evaluatePolicies([policy], ast);

    // Assert
    expect(violations).toHaveLength(0);
  });
});

// ============================================================
// extractRegistry
// ============================================================

describe('extractRegistry', () => {
  it('extracts the registry prefix from a scoped path', async () => {
    const { extractRegistry } = await import('../evaluator.js');
    expect(extractRegistry('@core/skills.prs')).toBe('@core');
    expect(extractRegistry('@team/overlay.prs')).toBe('@team');
  });

  it('returns the full string when there is no slash', async () => {
    const { extractRegistry } = await import('../evaluator.js');
    expect(extractRegistry('@core')).toBe('@core');
  });

  it('returns null for paths not starting with @', async () => {
    const { extractRegistry } = await import('../evaluator.js');
    expect(extractRegistry('./local.prs')).toBeNull();
    expect(extractRegistry('relative/path.prs')).toBeNull();
  });
});
