import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation, Block, ObjectContent } from '@promptscript/core';
import { validAppendNegation } from '../valid-append-negation.js';
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
        ruleId: 'PS028',
        ruleName: 'valid-append-negation',
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

describe('valid-append-negation (PS028)', () => {
  it('should warn when ! prefix appears in base skill references', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            references: ['!should-not-negate.md', 'ok.md'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain("Negation prefix '!'");
    expect(messages[0]!.message).toContain('@extend');
  });

  it('should warn when ! prefix appears in base skill requires', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            requires: ['!legacy-tool'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain("Negation prefix '!'");
  });

  it('should warn on empty negation path (just "!")', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            references: ['!'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages.some((m) => m.message.includes('Empty negation'))).toBe(true);
  });

  it('should warn on double negation !! prefix', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            references: ['!!double.md'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages.some((m) => m.message.includes('Double negation'))).toBe(true);
  });

  it('should not warn for normal references without ! prefix', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            references: ['arch.md', 'patterns.md'],
            requires: ['bash'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should not warn when there are no skills blocks', () => {
    const ast = createTestProgram({ blocks: [] });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should skip non-object skill values', () => {
    const ast = createTestProgram({
      blocks: [makeSkillsBlock({ expert: 'just a string' })],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(0);
  });
});
