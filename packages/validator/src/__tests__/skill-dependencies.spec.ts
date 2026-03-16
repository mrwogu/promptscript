import { describe, it, expect } from 'vitest';
import { skillDependencies } from '../rules/skill-dependencies.js';
import type { RuleContext, ValidatorConfig, ValidationMessage } from '../types.js';
import type { Program, Block, ObjectContent, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makeSkillsBlock(properties: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: {
      type: 'ObjectContent',
      properties: properties as Record<string, import('@promptscript/core').Value>,
      loc,
    } as ObjectContent,
    loc,
  };
}

function makeAST(blocks: Block[]): Program {
  return {
    type: 'Program',
    uses: [],
    blocks,
    extends: [],
    loc,
  };
}

function runRule(ast: Program): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const config: ValidatorConfig = {};
  const ctx: RuleContext = {
    ast,
    config,
    report: (msg) => {
      messages.push({
        ...msg,
        ruleId: skillDependencies.id,
        ruleName: skillDependencies.name,
        severity: skillDependencies.defaultSeverity,
      });
    },
  };
  skillDependencies.validate(ctx);
  return messages;
}

describe('skill-dependencies rule', () => {
  it('passes for valid requires', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'lint-check': { description: 'Lint code' },
        'full-review': {
          description: 'Full review',
          requires: ['lint-check'],
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('errors on requires nonexistent skill', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'full-review': {
          description: 'Full review',
          requires: ['missing-skill'],
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('missing-skill');
    expect(msgs[0]!.message).toContain('does not exist');
  });

  it('errors on self-referencing requires', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'self-ref': {
          description: 'Self-referencing',
          requires: ['self-ref'],
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('self-ref');
    expect(msgs[0]!.message).toContain('itself');
  });

  it('errors on circular dependency', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'skill-a': {
          description: 'A',
          requires: ['skill-b'],
        },
        'skill-b': {
          description: 'B',
          requires: ['skill-a'],
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs.length).toBeGreaterThanOrEqual(1);
    const hasCircular = msgs.some((m) => m.message.toLowerCase().includes('circular'));
    expect(hasCircular).toBe(true);
  });

  it('passes when no requires defined (backward compat)', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'simple-skill': { description: 'Simple' },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('passes when no skills block exists', () => {
    const ast = makeAST([]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('passes for skills with simple string values', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'code-review': 'Review code',
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });
});
