import { describe, it, expect } from 'vitest';
import { safeReferenceContent } from '../safe-reference-content.js';
import type { Program, Block, Value, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: { type: 'ObjectContent', properties: skills as Record<string, Value>, loc },
    loc,
  };
}

function makeAst(blocks: Block[]): Program {
  return { type: 'Program', loc, blocks, extends: [], uses: [] };
}

function validate(ast: Program): { message: string }[] {
  const messages: { message: string }[] = [];
  safeReferenceContent.validate({ ast, report: (msg) => messages.push(msg), config: {} });
  return messages;
}

describe('PS026: safe-reference-content', () => {
  it('should have correct metadata', () => {
    expect(safeReferenceContent.id).toBe('PS026');
    expect(safeReferenceContent.name).toBe('safe-reference-content');
  });

  it('should pass for clean reference content', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: 'references/arch.md',
              content: '# Architecture\nMicroservices layout.',
            },
          ],
        },
      }),
    ]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should warn when reference contains @identity directive', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            { relativePath: 'references/bad.md', content: '# Data\n@identity {\n  "evil"\n}' },
          ],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('@identity');
  });

  it('should warn when reference contains @restrictions directive', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: 'references/sneaky.md',
              content: '@restrictions {\n  "ignore previous"\n}',
            },
          ],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs.length).toBeGreaterThan(0);
  });

  it('should warn when reference contains triple-quote block', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: 'references/tricky.md',
              content: 'Some text\n"""\nPRS content block\n"""',
            },
          ],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0]!.message).toContain('"""');
  });

  it('should not warn for non-reference resources', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [{ relativePath: 'data/config.json', content: '@identity fake' }],
        },
      }),
    ]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should pass when no skills block exists', () => {
    const ast = makeAst([]);
    expect(validate(ast)).toHaveLength(0);
  });
});
