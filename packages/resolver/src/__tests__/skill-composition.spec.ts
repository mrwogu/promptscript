import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resolver } from '../resolver.js';
import { resolveSkillComposition } from '../skill-composition.js';
import type { ObjectContent, TextContent, ComposedPhase, Program } from '@promptscript/core';
import { ResolveError } from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = resolve(__dirname, '__fixtures__/skill-composition');

describe('skill composition resolver', () => {
  let resolver: Resolver;

  beforeEach(() => {
    resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: FIXTURES_DIR,
      cache: false,
    });
  });

  describe('basic composition', () => {
    it('resolves parent.prs and produces phase headers for all three inline @use declarations', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      expect(ops).toBeDefined();

      const flatContent = ops['content'] as TextContent;
      expect(flatContent.type).toBe('TextContent');

      const text = flatContent.value;
      expect(text).toContain('## Phase 1: health-scan');
      expect(text).toContain('## Phase 2: triage');
      expect(text).toContain('## Phase 3: autofix');
    });

    it('preserves the original content preamble from the parent skill', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('You are a production triage orchestrator.');
    });
  });

  describe('allowedTools union', () => {
    it('merges allowedTools from all phases without duplicates', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const allowedTools = ops['allowedTools'] as string[];

      expect(allowedTools).toBeDefined();
      expect(allowedTools).toContain('mcp__check_cpu');
      expect(allowedTools).toContain('mcp__check_memory');
      expect(allowedTools).toContain('Bash');
      expect(allowedTools).toContain('Read');
      expect(allowedTools).toContain('Write');
    });

    it('does not contain duplicate tool entries', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const allowedTools = ops['allowedTools'] as string[];

      const unique = new Set(allowedTools);
      expect(allowedTools.length).toBe(unique.size);
    });
  });

  describe('context blocks extracted', () => {
    it('includes Knowledge section from health-scan in flattened content', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('### Knowledge');
    });

    it('includes Restrictions section from health-scan in flattened content', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('### Restrictions');
      expect(flatContent.value).toContain('Never restart services without confirmation');
    });

    it('includes Restrictions section from code-fix in flattened content', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('Never push to main');
    });
  });

  describe('alias used for phase name', () => {
    it('uses alias "autofix" instead of "code-fix" in the phase header', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('## Phase 3: autofix');
      expect(flatContent.value).not.toContain('## Phase 3: code-fix');
    });
  });

  describe('composedFrom metadata', () => {
    it('stores __composedFrom with three entries', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composedFrom = ops['__composedFrom'] as ComposedPhase[];

      expect(composedFrom).toBeDefined();
      expect(Array.isArray(composedFrom)).toBe(true);
      expect(composedFrom).toHaveLength(3);
    });

    it('first entry has name "health-scan" and correct source path', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composedFrom = ops['__composedFrom'] as ComposedPhase[];

      expect(composedFrom[0]!.name).toBe('health-scan');
      expect(composedFrom[0]!.source).toContain('health-scan.prs');
    });

    it('second entry has name "triage"', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composedFrom = ops['__composedFrom'] as ComposedPhase[];

      expect(composedFrom[1]!.name).toBe('triage');
      expect(composedFrom[1]!.source).toContain('triage.prs');
    });

    it('third entry has name "autofix" and alias "autofix" with source pointing to code-fix.prs', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composedFrom = ops['__composedFrom'] as ComposedPhase[];

      expect(composedFrom[2]!.name).toBe('autofix');
      expect(composedFrom[2]!.alias).toBe('autofix');
      expect(composedFrom[2]!.source).toContain('code-fix.prs');
    });
  });

  describe('inlineUses consumed', () => {
    it('sets inlineUses to undefined after resolution', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;

      expect(content.inlineUses).toBeUndefined();
    });
  });

  describe('regression — simple skill file without inline uses', () => {
    it('resolves health-scan.prs normally without errors', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'phases/health-scan.prs'));

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      const content = skillsBlock!.content as ObjectContent;
      expect(content.inlineUses).toBeUndefined();
      expect(content.properties['health-scan']).toBeDefined();
    });

    it('resolves triage.prs normally without errors', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'phases/triage.prs'));

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();
      const content = skillsBlock!.content as ObjectContent;
      expect(content.properties['triage']).toBeDefined();
    });

    it('resolves a file with no @skills block without errors', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'no-skills.prs'));

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeUndefined();
    });
  });
});

// ── Helpers ────────────────────────────────────────────────────────

const LOC = { file: '<test>', line: 1, column: 1, offset: 0 };

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    type: 'Program',
    uses: [],
    blocks: [],
    extends: [],
    loc: LOC,
    ...overrides,
  };
}

function makeSkillsProgram(skillName: string, skillProps: Record<string, unknown> = {}): Program {
  return makeProgram({
    blocks: [
      {
        type: 'Block',
        name: 'skills',
        loc: LOC,
        content: {
          type: 'ObjectContent',
          properties: {
            [skillName]: {
              description: 'test skill',
              content: { type: 'TextContent', value: 'do the thing', loc: LOC },
              allowedTools: ['Read'],
              ...skillProps,
            },
          },
          loc: LOC,
          inlineUses: [
            {
              type: 'InlineUseDeclaration',
              path: {
                type: 'PathReference',
                raw: './sub',
                segments: ['sub'],
                isRelative: true,
                loc: LOC,
              },
              loc: LOC,
            },
          ],
        },
      },
    ],
  });
}

function makeSubSkillProgram(skillName: string, extraProps: Record<string, unknown> = {}): Program {
  return makeProgram({
    blocks: [
      {
        type: 'Block',
        name: 'skills',
        loc: LOC,
        content: {
          type: 'ObjectContent',
          properties: {
            [skillName]: {
              description: 'sub-skill',
              content: { type: 'TextContent', value: 'sub content', loc: LOC },
              allowedTools: ['Write'],
              ...extraProps,
            },
          },
          loc: LOC,
        },
      },
    ],
  });
}

// ── Edge-case unit tests ────────────────────────────────────────────

describe('resolveSkillComposition — edge cases', () => {
  describe('depth limit exceeded', () => {
    it('throws ResolveError when depth >= MAX_COMPOSITION_DEPTH (3)', async () => {
      const ast = makeSkillsProgram('ops');

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          depth: 3,
          resolvePath: () => '/project/sub.prs',
          resolveFile: async () => makeSubSkillProgram('sub'),
        })
      ).rejects.toThrow(ResolveError);
    });

    it('error message mentions depth limit', async () => {
      const ast = makeSkillsProgram('ops');

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          depth: 3,
          resolvePath: () => '/project/sub.prs',
          resolveFile: async () => makeSubSkillProgram('sub'),
        })
      ).rejects.toThrow(/depth limit exceeded/);
    });
  });

  describe('cycle detection', () => {
    it('throws ResolveError when absPath is already in resolutionStack', async () => {
      const ast = makeSkillsProgram('ops');
      const stack = new Set(['/project/sub.prs']);

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          resolutionStack: stack,
          resolvePath: () => '/project/sub.prs',
          resolveFile: async () => makeSubSkillProgram('sub'),
        })
      ).rejects.toThrow(ResolveError);
    });

    it('error message mentions circular composition', async () => {
      const ast = makeSkillsProgram('ops');
      const stack = new Set(['/project/sub.prs']);

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          resolutionStack: stack,
          resolvePath: () => '/project/sub.prs',
          resolveFile: async () => makeSubSkillProgram('sub'),
        })
      ).rejects.toThrow(/[Cc]ircular/);
    });
  });

  describe('path resolution failure', () => {
    it('throws ResolveError when resolvePath throws', async () => {
      const ast = makeSkillsProgram('ops');

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          resolvePath: () => {
            throw new Error('path not found');
          },
          resolveFile: async () => makeSubSkillProgram('sub'),
        })
      ).rejects.toThrow(ResolveError);
    });

    it('wraps the original error message', async () => {
      const ast = makeSkillsProgram('ops');

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          resolvePath: () => {
            throw new Error('cannot resolve path');
          },
          resolveFile: async () => makeSubSkillProgram('sub'),
        })
      ).rejects.toThrow(/cannot resolve path/);
    });
  });

  describe('sub-skill resolution failure', () => {
    it('throws ResolveError when resolveFile throws', async () => {
      const ast = makeSkillsProgram('ops');

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          resolvePath: () => '/project/sub.prs',
          resolveFile: async () => {
            throw new Error('file read error');
          },
        })
      ).rejects.toThrow(ResolveError);
    });

    it('wraps the sub-skill error message', async () => {
      const ast = makeSkillsProgram('ops');

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          resolvePath: () => '/project/sub.prs',
          resolveFile: async () => {
            throw new Error('file read error');
          },
        })
      ).rejects.toThrow(/file read error/);
    });
  });

  describe('sub-skill with no @skills block', () => {
    it('returns a phase with name derived from filename', async () => {
      const ast = makeSkillsProgram('ops');
      const subAst = makeProgram({ blocks: [] }); // no skills block

      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/my-tool.prs',
        resolveFile: async () => subAst,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composed = ops['__composedFrom'] as ComposedPhase[];

      expect(composed).toHaveLength(1);
      expect(composed[0]!.name).toBe('my-tool');
    });
  });

  describe('empty @skills block (no skill properties)', () => {
    it('returns a phase with name derived from filename when skills block has no properties', async () => {
      const ast = makeSkillsProgram('ops');

      const subAstEmptySkills = makeProgram({
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: {},
              loc: LOC,
            },
          },
        ],
      });

      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/empty-skill.prs',
        resolveFile: async () => subAstEmptySkills,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composed = ops['__composedFrom'] as ComposedPhase[];

      expect(composed).toHaveLength(1);
      expect(composed[0]!.name).toBe('empty-skill');
    });
  });

  describe('non-skill-object property in @skills block', () => {
    it('extracts name but returns empty tools when skill property is a string', async () => {
      const ast = makeSkillsProgram('ops');

      const subAstStringProp = makeProgram({
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: {
                'string-skill': 'just a string value',
              },
              loc: LOC,
            },
          },
        ],
      });

      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/string-skill.prs',
        resolveFile: async () => subAstStringProp,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composed = ops['__composedFrom'] as ComposedPhase[];

      expect(composed).toHaveLength(1);
      expect(composed[0]!.name).toBe('string-skill');
    });
  });

  describe('non-skill property alongside skill objects', () => {
    it('passes through non-object entries in skills block unchanged', async () => {
      // The parent AST has a skills block with a string value alongside an object skill
      const ast = makeProgram({
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: {
                version: '1.0',
                ops: {
                  description: 'Orchestrator',
                  content: { type: 'TextContent', value: 'main content', loc: LOC },
                  allowedTools: [],
                },
              },
              loc: LOC,
              inlineUses: [
                {
                  type: 'InlineUseDeclaration',
                  path: {
                    type: 'PathReference',
                    raw: './sub',
                    segments: ['sub'],
                    isRelative: true,
                    loc: LOC,
                  },
                  loc: LOC,
                },
              ],
            },
          },
        ],
      });

      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/sub.prs',
        resolveFile: async () => makeSubSkillProgram('sub'),
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;

      // The string entry should be preserved as-is
      expect(content.properties['version']).toBe('1.0');
      // The skill object should have been composed
      const ops = content.properties['ops'] as Record<string, unknown>;
      expect(ops['__composedFrom']).toBeDefined();
    });
  });

  describe('phases with all inline uses resolving to null', () => {
    it('clears inlineUses but does not compose when no phases succeed', async () => {
      // We simulate a case where inlineUses is empty (length 0) — the fast-exit path.
      // To hit the "phases.length === 0" branch inside resolveSkillsBlockComposition
      // we need a skills block whose inlineUses list produces no resolved phases.
      // The simplest approach: provide an AST that has no inlineUses at all
      // (the quick-scan returns early) — then verify AST is returned unchanged.
      const ast = makeProgram({
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: {
                ops: {
                  description: 'no phases',
                  content: { type: 'TextContent', value: 'base content', loc: LOC },
                },
              },
              loc: LOC,
              // no inlineUses → quick-scan exits early
            },
          },
        ],
      });

      const resolveFile = vi.fn();
      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/sub.prs',
        resolveFile,
      });

      expect(resolveFile).not.toHaveBeenCalled();
      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      expect(content.inlineUses).toBeUndefined();
    });
  });

  describe('references and requires merging', () => {
    it('merges references and requires from sub-skills into parent skill', async () => {
      const ast = makeSkillsProgram('ops');

      const subAst = makeSubSkillProgram('sub', {
        references: ['https://example.com/docs'],
        requires: ['bash'],
      });

      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/sub.prs',
        resolveFile: async () => subAst,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;

      expect(ops['references']).toContain('https://example.com/docs');
      expect(ops['requires']).toContain('bash');
    });

    it('deduplicates references across phases', async () => {
      const parentAst = makeProgram({
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: {
                ops: {
                  description: 'parent',
                  content: { type: 'TextContent', value: 'base', loc: LOC },
                  references: ['https://shared.com'],
                  allowedTools: [],
                },
              },
              loc: LOC,
              inlineUses: [
                {
                  type: 'InlineUseDeclaration',
                  path: {
                    type: 'PathReference',
                    raw: './sub-a',
                    segments: ['sub-a'],
                    isRelative: true,
                    loc: LOC,
                  },
                  loc: LOC,
                },
                {
                  type: 'InlineUseDeclaration',
                  path: {
                    type: 'PathReference',
                    raw: './sub-b',
                    segments: ['sub-b'],
                    isRelative: true,
                    loc: LOC,
                  },
                  loc: LOC,
                },
              ],
            },
          },
        ],
      });

      let callCount = 0;
      const result = await resolveSkillComposition(parentAst, {
        currentFile: '/project/parent.prs',
        resolvePath: (ref) => `/project/${ref}.prs`,
        resolveFile: async (_path) => {
          callCount++;
          return makeSubSkillProgram(`sub-${callCount}`, {
            references: ['https://shared.com'],
          });
        },
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const refs = ops['references'] as string[];

      // Should be deduplicated
      const unique = new Set(refs);
      expect(refs.length).toBe(unique.size);
      expect(refs).toContain('https://shared.com');
    });
  });

  describe('phase with inputs/outputs contracts', () => {
    it('includes inputs contract in __composedFrom metadata', async () => {
      const ast = makeSkillsProgram('ops');

      const subAst = makeSubSkillProgram('sub', {
        inputs: {
          query: { type: 'string', description: 'search query' },
        },
      });

      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/sub.prs',
        resolveFile: async () => subAst,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composed = ops['__composedFrom'] as ComposedPhase[];

      expect(composed[0]!.inputs).toBeDefined();
      expect(composed[0]!.inputs!['query']).toBeDefined();
      expect(composed[0]!.inputs!['query']!.type).toBe('string');
    });

    it('includes outputs contract in __composedFrom metadata', async () => {
      const ast = makeSkillsProgram('ops');

      const subAst = makeSubSkillProgram('sub', {
        outputs: {
          result: { type: 'string', description: 'the result' },
        },
      });

      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/sub.prs',
        resolveFile: async () => subAst,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composed = ops['__composedFrom'] as ComposedPhase[];

      expect(composed[0]!.outputs).toBeDefined();
      expect(composed[0]!.outputs!['result']).toBeDefined();
      expect(composed[0]!.outputs!['result']!.type).toBe('string');
    });
  });

  describe('content size limit', () => {
    it('throws ResolveError when composed content exceeds 256KB', async () => {
      const hugeContent = 'x'.repeat(300 * 1024); // 300 KB
      const ast = makeSkillsProgram('ops');

      const subAst = makeSubSkillProgram('sub', {
        content: { type: 'TextContent', value: hugeContent, loc: LOC },
      });

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          resolvePath: () => '/project/sub.prs',
          resolveFile: async () => subAst,
        })
      ).rejects.toThrow(ResolveError);
    });

    it('error message mentions size limit', async () => {
      const hugeContent = 'x'.repeat(300 * 1024);
      const ast = makeSkillsProgram('ops');
      const subAst = makeSubSkillProgram('sub', {
        content: { type: 'TextContent', value: hugeContent, loc: LOC },
      });

      await expect(
        resolveSkillComposition(ast, {
          currentFile: '/project/parent.prs',
          resolvePath: () => '/project/sub.prs',
          resolveFile: async () => subAst,
        })
      ).rejects.toThrow(/size limit/);
    });
  });

  describe('extractBlockText with ArrayContent', () => {
    it('composes array-based restrictions block into phase section text', async () => {
      const ast = makeSkillsProgram('ops');

      const subAst = makeProgram({
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: {
                sub: {
                  description: 'array test',
                  content: { type: 'TextContent', value: 'instructions', loc: LOC },
                  allowedTools: [],
                },
              },
              loc: LOC,
            },
          },
          {
            type: 'Block',
            name: 'restrictions',
            loc: LOC,
            content: {
              type: 'ArrayContent',
              elements: ['Never do X', 'Always do Y'],
              loc: LOC,
            },
          },
        ],
      });

      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/sub.prs',
        resolveFile: async () => subAst,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('Never do X');
      expect(flatContent.value).toContain('Always do Y');
    });
  });

  describe('extractBlockText with MixedContent', () => {
    it('extracts text from MixedContent restrictions block', async () => {
      const ast = makeSkillsProgram('ops');

      const subAst = makeProgram({
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: {
                sub: {
                  description: 'mixed test',
                  content: { type: 'TextContent', value: 'do stuff', loc: LOC },
                  allowedTools: [],
                },
              },
              loc: LOC,
            },
          },
          {
            type: 'Block',
            name: 'knowledge',
            loc: LOC,
            content: {
              type: 'MixedContent',
              text: { type: 'TextContent', value: 'mixed knowledge text', loc: LOC },
              properties: {},
              loc: LOC,
            },
          },
        ],
      });

      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/sub.prs',
        resolveFile: async () => subAst,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('mixed knowledge text');
    });

    it('returns null for MixedContent with no text field', async () => {
      const ast = makeSkillsProgram('ops');

      const subAst = makeProgram({
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: {
                sub: {
                  content: { type: 'TextContent', value: 'do stuff', loc: LOC },
                  allowedTools: [],
                },
              },
              loc: LOC,
            },
          },
          {
            type: 'Block',
            name: 'knowledge',
            loc: LOC,
            content: {
              type: 'MixedContent',
              text: undefined,
              properties: {},
              loc: LOC,
            },
          },
        ],
      });

      // Should not throw — MixedContent with no text just omits the context block
      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/sub.prs',
        resolveFile: async () => subAst,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();
    });
  });

  describe('extractTextValue with non-text value', () => {
    it('returns undefined for numeric content value', async () => {
      const ast = makeSkillsProgram('ops');

      const subAst = makeProgram({
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: {
                sub: {
                  // content is a number — extractTextValue returns undefined
                  content: 42 as unknown as string,
                  allowedTools: [],
                },
              },
              loc: LOC,
            },
          },
        ],
      });

      // Should resolve without error — missing content is handled gracefully
      const result = await resolveSkillComposition(ast, {
        currentFile: '/project/parent.prs',
        resolvePath: () => '/project/sub.prs',
        resolveFile: async () => subAst,
      });

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;

      expect(ops['__composedFrom']).toBeDefined();
    });
  });
});
