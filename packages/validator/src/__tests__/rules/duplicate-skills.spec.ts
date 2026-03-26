import { describe, it, expect } from 'vitest';
import { duplicateSkills } from '../../rules/duplicate-skills.js';
import type { RuleContext, ValidatorConfig, ValidationMessage } from '../../types.js';
import type {
  Program,
  Block,
  ObjectContent,
  SourceLocation,
  UseDeclaration,
  PathReference,
} from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makePath(raw: string): PathReference {
  return {
    type: 'PathReference',
    raw,
    segments: raw.split('/'),
    isRelative: raw.startsWith('./'),
    loc,
  };
}

function makeUse(path: string, alias?: string): UseDeclaration {
  return {
    type: 'UseDeclaration',
    path: makePath(path),
    alias,
    loc,
  };
}

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

function makeAST(opts: { blocks?: Block[]; uses?: UseDeclaration[] }): Program {
  return {
    type: 'Program',
    uses: opts.uses ?? [],
    blocks: opts.blocks ?? [],
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
        ruleId: duplicateSkills.id,
        ruleName: duplicateSkills.name,
        severity: duplicateSkills.defaultSeverity,
      });
    },
  };
  duplicateSkills.validate(ctx);
  return messages;
}

describe('PS020: duplicate-skills', () => {
  it('should have correct metadata', () => {
    expect(duplicateSkills.id).toBe('PS020');
    expect(duplicateSkills.name).toBe('duplicate-skills');
    expect(duplicateSkills.defaultSeverity).toBe('error');
  });

  // --- @skills block duplicate keys ---

  it('should error when two @use directives import skills with the same name into @skills', () => {
    const ast = makeAST({
      blocks: [
        makeSkillsBlock({
          review: { description: 'Review code' },
        }),
      ],
      uses: [makeUse('@org/skills-a', 'review'), makeUse('@org/skills-b', 'review')],
    });
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('review');
    expect(msgs[0]!.message).toMatch(/duplicate/i);
  });

  it('should error when duplicate aliases exist across @use directives', () => {
    const ast = makeAST({
      uses: [makeUse('@org/tool-a', 'helper'), makeUse('@org/tool-b', 'helper')],
    });
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('helper');
  });

  it('should not error when all skill names are unique', () => {
    const ast = makeAST({
      blocks: [
        makeSkillsBlock({
          review: { description: 'Review code' },
          deploy: { description: 'Deploy code' },
        }),
      ],
      uses: [makeUse('@org/skills-a', 'review'), makeUse('@org/skills-b', 'deploy')],
    });
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('should not error when there are no @use directives', () => {
    const ast = makeAST({
      blocks: [
        makeSkillsBlock({
          review: { description: 'Review code' },
        }),
      ],
    });
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('should not error when there are no skills block or uses', () => {
    const ast = makeAST({});
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('should detect multiple sets of duplicates', () => {
    const ast = makeAST({
      uses: [
        makeUse('@org/a', 'alpha'),
        makeUse('@org/b', 'alpha'),
        makeUse('@org/c', 'beta'),
        makeUse('@org/d', 'beta'),
      ],
    });
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(2);
  });

  it('should not flag uses without aliases as duplicates', () => {
    const ast = makeAST({
      uses: [makeUse('@org/tool-a'), makeUse('@org/tool-b')],
    });
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });
});
