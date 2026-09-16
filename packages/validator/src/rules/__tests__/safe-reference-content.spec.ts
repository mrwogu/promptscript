import { describe, it, expect } from 'vitest';
import { safeReferenceContent } from '../safe-reference-content.js';
import type { Program, Block, Value, SourceLocation } from '@promptscript/core';
import type { ValidatorConfig } from '../../types.js';

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

function validate(
  ast: Program,
  config: ValidatorConfig = {}
): { message: string; location?: SourceLocation }[] {
  const messages: { message: string; location?: SourceLocation }[] = [];
  safeReferenceContent.validate({ ast, report: (msg) => messages.push(msg), config });
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

  it('should skip non-object skill values', () => {
    const ast = makeAst([makeSkillsBlock({ expert: 'just a string' })]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should skip when resources contain non-object entries', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: ['not-an-object', null, 42],
        },
      }),
    ]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should skip when resource has non-string relativePath or content', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [{ relativePath: 123, content: 456 }],
        },
      }),
    ]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should check references in nested /references/ paths', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: '@shared/references/evil.md',
              content: '@guards {\n  check\n}',
            },
          ],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('@guards');
  });

  it('should report the origin file when the resource carries one', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: 'references/bad.md',
              content: '@identity {\n  "evil"\n}',
              origin: '/cache/repo/skills/expert/references/bad.md',
            },
          ],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.location?.file).toBe('/cache/repo/skills/expert/references/bad.md');
  });

  it('should fall back to the skills block loc without an origin', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [{ relativePath: 'references/bad.md', content: '@identity {\n"evil"\n}' }],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.location?.file).toBe('test.prs');
  });

  it('should skip reference files imported from registry cache by default', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: 'references/bad.md',
              content: '@identity {\n  "evil"\n}',
              origin: '/home/user/.promptscript/cache/repo/skills/expert/references/bad.md',
            },
          ],
        },
      }),
    ]);
    const config: ValidatorConfig = {
      externalRoots: ['/home/user/.promptscript/cache'],
    };
    expect(validate(ast, config)).toHaveLength(0);
  });

  it('should scan imported reference files when scanExternalContent is set', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: 'references/bad.md',
              content: '@identity {\n  "evil"\n}',
              origin: '/home/user/.promptscript/cache/repo/skills/expert/references/bad.md',
            },
          ],
        },
      }),
    ]);
    const config: ValidatorConfig = {
      externalRoots: ['/home/user/.promptscript/cache'],
      scanExternalContent: true,
    };
    const msgs = validate(ast, config);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.location?.file).toBe(
      '/home/user/.promptscript/cache/repo/skills/expert/references/bad.md'
    );
  });

  it('should not treat paths outside externalRoots as imported', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: 'references/bad.md',
              content: '@identity {\n  "evil"\n}',
              origin: '/home/user/.promptscript/cache-other/references/bad.md',
            },
          ],
        },
      }),
    ]);
    const config: ValidatorConfig = {
      externalRoots: ['/home/user/.promptscript/cache'],
    };
    expect(validate(ast, config)).toHaveLength(1);
  });
});
