import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation, Block, ObjectContent } from '@promptscript/core';
import { validSealedProperty } from '../valid-sealed-property.js';
import type { RuleContext, ValidationMessage, ValidatorConfig } from '../../types.js';

const LOC: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function createTestProgram(overrides: Partial<Program> = {}): Program {
  return {
    type: 'Program',
    loc: LOC,
    meta: { type: 'MetaBlock', loc: LOC, fields: { id: 'test' } },
    uses: [],
    blocks: [],
    extends: [],
    ...overrides,
  };
}

function createRuleContext(ast: Program): { ctx: RuleContext; messages: ValidationMessage[] } {
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config: {} as ValidatorConfig,
    report: (msg) => {
      messages.push({
        ruleId: 'PS029',
        ruleName: 'valid-sealed-property',
        severity: 'warning',
        ...msg,
      });
    },
  };
  return { ctx, messages };
}

function makeSkillsBlock(skills: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    loc: LOC,
    content: { type: 'ObjectContent', properties: skills, loc: LOC } as ObjectContent,
  };
}

describe('valid-sealed-property (PS029)', () => {
  it('should warn when sealed contains a non-replace-strategy property', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: ['references'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('references');
    expect(messages[0]!.message).toContain('not a replace-strategy property');
  });

  it('should warn on empty sealed array', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: [],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Empty sealed list');
  });

  it('should not warn for valid sealed with replace-strategy properties', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: ['content', 'description'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should not warn for sealed: true', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: true,
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should not warn when there are no skills blocks', () => {
    const ast = createTestProgram({ blocks: [] });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should skip non-object skill values', () => {
    const ast = createTestProgram({
      blocks: [makeSkillsBlock({ expert: 'just a string' })],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should warn about multiple non-replace properties in sealed', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: ['references', 'requires', 'params'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(3);
  });
});
