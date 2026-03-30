import { describe, it, expect } from 'vitest';
import { parseSkillMd } from '../skills.js';
import { applyExtends } from '../extensions.js';
import type {
  Program,
  Block,
  ObjectContent,
  ArrayContent,
  TextContent,
  ExtendBlock,
  Value,
} from '@promptscript/core';

describe('skill references', () => {
  describe('parseSkillMd with references', () => {
    it('should parse references from SKILL.md frontmatter', () => {
      const content = [
        '---',
        'name: test-skill',
        'description: A test skill',
        'references:',
        '  - references/architecture.md',
        '  - references/modules.md',
        '---',
        'Skill content here.',
      ].join('\n');

      const result = parseSkillMd(content);

      expect(result.name).toBe('test-skill');
      expect(result.references).toEqual(['references/architecture.md', 'references/modules.md']);
    });

    it('should return undefined references when not specified', () => {
      const content = [
        '---',
        'name: test-skill',
        'description: A test skill',
        '---',
        'Skill content here.',
      ].join('\n');

      const result = parseSkillMd(content);

      expect(result.references).toBeUndefined();
    });

    it('should parse empty references list', () => {
      const content = ['---', 'name: test-skill', 'references:', '---', 'Content.'].join('\n');

      const result = parseSkillMd(content);

      expect(result.references).toEqual([]);
    });
  });
});

const createLoc = () => ({ file: '<test>', line: 1, column: 1 });

const createProgram = (overrides: Partial<Program> = {}): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
  ...overrides,
});

const createBlock = (name: string, content: Block['content']): Block => ({
  type: 'Block',
  name,
  content,
  loc: createLoc(),
});

const createObjectContent = (properties: Record<string, Value>): ObjectContent => ({
  type: 'ObjectContent',
  properties,
  loc: createLoc(),
});

const createArrayContent = (elements: Value[]): ArrayContent => ({
  type: 'ArrayContent',
  elements,
  loc: createLoc(),
});

const createTextContent = (value: string): TextContent => ({
  type: 'TextContent',
  value,
  loc: createLoc(),
});

const createExtendBlock = (targetPath: string, content: Block['content']): ExtendBlock => ({
  type: 'ExtendBlock',
  targetPath,
  content,
  loc: createLoc(),
});

describe('skill-aware @extend semantics', () => {
  it('should append references when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base/spring.md']),
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['overlay/arch.md']),
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as ArrayContent;

    expect(refs.elements).toEqual(['base/spring.md', 'overlay/arch.md']);
  });

  it('should replace description when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base description',
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            description: 'Overridden description',
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    expect(expert['description']).toBe('Overridden description');
  });

  it('should replace content when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              content: createTextContent('Base content'),
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            content: createTextContent('New content'),
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const content = expert['content'] as TextContent;

    expect(content.value).toBe('New content');
  });

  it('should shallow merge params when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              params: createObjectContent({
                region: 'US',
                env: 'prod',
              }) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            params: createObjectContent({
              region: 'EMEA',
              client: 'Retail',
            }) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const params = expert['params'] as Record<string, Value>;

    expect(params['region']).toBe('EMEA');
    expect(params['env']).toBe('prod');
    expect(params['client']).toBe('Retail');
  });

  it('should cumulate references from multiple @extend blocks', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base',
              references: createArrayContent(['base.md']),
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['layer3.md']),
          })
        ),
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['layer4.md']),
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as ArrayContent;

    expect(refs.elements).toEqual(['base.md', 'layer3.md', 'layer4.md']);
  });

  it('should NOT apply skill-aware semantics to non-skill blocks (regression guard)', () => {
    const ast = createProgram({
      blocks: [createBlock('standards', createTextContent('Original standards'))],
      extends: [createExtendBlock('standards', createTextContent('Extended standards'))],
    });

    const result = applyExtends(ast);
    const content = result.blocks[0]?.content as TextContent;

    expect(content.value).toBe('Original standards\n\nExtended standards');
  });
});
