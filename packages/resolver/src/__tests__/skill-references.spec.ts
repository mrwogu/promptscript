import { describe, it, expect, vi } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { parseSkillMd, resolveSkillReferences } from '../skills.js';
import { applyExtends } from '../extensions.js';
import type { Logger } from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, '__fixtures__', 'skill-references');
import type {
  Program,
  Block,
  ObjectContent,
  ArrayContent,
  TextContent,
  ExtendBlock,
  Value,
} from '@promptscript/core';
import { ResolveError } from '@promptscript/core';

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
              references: createArrayContent(['base/spring.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['overlay/arch.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual(['base/spring.md', 'overlay/arch.md']);
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
              references: createArrayContent(['base.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['layer3.md']) as unknown as Value,
          })
        ),
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['layer4.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual(['base.md', 'layer3.md', 'layer4.md']);
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

  it('should append references when existing has no references (undefined)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['overlay/arch.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    expect(expert['references']).toBeDefined();
  });

  it('should append when existing references is a plain array (not ArrayContent)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: ['base/spring.md'] as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['overlay/arch.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    // ext is ArrayContent but existing is plain array — ext clone wins
    expect(expert['references']).toBeDefined();
  });

  it('should replace trigger property when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              trigger: 'old trigger',
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            trigger: 'new trigger',
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    expect(expert['trigger']).toBe('new trigger');
  });

  it('should replace allowedTools property when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              allowedTools: 'tool1',
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            allowedTools: 'tool2',
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    expect(expert['allowedTools']).toBe('tool2');
  });

  it('should shallow merge inputs when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              inputs: createObjectContent({
                fileType: 'string',
              }) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            inputs: createObjectContent({
              language: 'string',
            }) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const inputs = expert['inputs'] as Record<string, Value>;

    expect(inputs['fileType']).toBe('string');
    expect(inputs['language']).toBe('string');
  });

  it('should shallow merge outputs when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              outputs: createObjectContent({
                result: 'string',
              }) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            outputs: createObjectContent({
              summary: 'string',
            }) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const outputs = expert['outputs'] as Record<string, Value>;

    expect(outputs['result']).toBe('string');
    expect(outputs['summary']).toBe('string');
  });

  it('should append examples when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              examples: createArrayContent(['example1']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            examples: createArrayContent(['example2']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const examples = expert['examples'] as string[];

    expect(examples).toEqual(['example1', 'example2']);
  });

  it('should deep merge unknown skill properties', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              customConfig: createObjectContent({
                settingA: 'valueA',
              }) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            customConfig: createObjectContent({
              settingB: 'valueB',
            }) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const config = expert['customConfig'] as Record<string, unknown>;

    // deepMerge merges ObjectContent nodes at the structural level,
    // so both settings end up in the properties sub-object
    const props = (config['properties'] ?? config) as Record<string, Value>;
    expect(props['settingA']).toBe('valueA');
    expect(props['settingB']).toBe('valueB');
  });

  it('should replace unknown property when ext value is not an object', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              customProp: 'old value',
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            customProp: 'new value',
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    expect(expert['customProp']).toBe('new value');
  });

  it('should handle append when ext value is not ArrayContent (fallback)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              references: 'not-an-array' as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: 'new-ref' as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    // Both non-ArrayContent — fallback deepClone of ext value
    expect(expert['references']).toBe('new-ref');
  });

  it('should handle merge when existing is not ObjectContent but ext is', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              inputs: 'not-an-object' as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            inputs: createObjectContent({
              language: 'string',
            }) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    // ext ObjectContent cloned since base is not ObjectContent
    expect(expert['inputs']).toBeDefined();
  });

  it('should handle merge when ext value is not ObjectContent (fallback)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              inputs: createObjectContent({
                fileType: 'string',
              }) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            inputs: 'replaced' as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    // ext is not ObjectContent — deepClone fallback
    expect(expert['inputs']).toBe('replaced');
  });

  it('should negate a base reference via ! prefix', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base/spring.md', 'base/old.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!base/old.md', 'overlay/new.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toContain('base/spring.md');
    expect(refs).toContain('overlay/new.md');
    expect(refs).not.toContain('base/old.md');
  });

  it('should negate with normalized path matching', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['references/arch.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!./references/arch.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual([]);
  });

  it('should handle negation with plain arrays (real parser output)', () => {
    // The expert skill is an ObjectContent node (as the real parser produces)
    // but its `references` property is a plain JS array (also real parser output).
    // The extension references is also a plain array with a negation.
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: ['base/spring.md', 'base/old.md'] as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: ['!base/old.md', 'overlay/new.md'] as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toContain('base/spring.md');
    expect(refs).toContain('overlay/new.md');
    expect(refs).not.toContain('base/old.md');
  });

  it('should negate requires entries with ! prefix', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              requires: createArrayContent(['legacy-tool', 'bash']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            requires: createArrayContent(['!legacy-tool', 'modern-tool']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const requires = expert['requires'] as string[];

    expect(requires).toContain('bash');
    expect(requires).toContain('modern-tool');
    expect(requires).not.toContain('legacy-tool');
  });

  it('should handle all base entries negated', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['old1.md', 'old2.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!old1.md', '!old2.md', 'new.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual(['new.md']);
  });

  it('should handle negation when base has no entries for the property', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!nonexistent.md', 'new.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual(['new.md']);
  });

  it('should append plain arrays without negation (prerequisite fix)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: ['base/spring.md'] as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: ['overlay/arch.md'] as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toContain('base/spring.md');
    expect(refs).toContain('overlay/arch.md');
  });

  it('should negate entry added by a prior @extend in sequential extends', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['added-by-first.md']) as unknown as Value,
          })
        ),
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!added-by-first.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toContain('base.md');
    expect(refs).not.toContain('added-by-first.md');
  });

  it('should treat double negation !! as literal after stripping first !', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!!double.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    // !! strips first ! → negation target is "!double.md" (normalized)
    // Since base has no "!double.md", it's an unmatched negation
    // base.md remains, no additions
    expect(refs).toContain('base.md');
    expect(refs).toHaveLength(1);
  });

  it('should handle mixed ArrayContent and plain array in base vs ext', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: ['!base.md', 'new.md'] as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual(['new.md']);
  });

  describe('sealed property enforcement', () => {
    it('should throw ResolveError when extending a sealed property', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Critical instructions'),
                sealed: ['content'] as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              content: createTextContent('Override attempt'),
            })
          ),
        ],
      });

      expect(() => applyExtends(ast)).toThrow(ResolveError);
      expect(() => applyExtends(ast)).toThrow("Cannot override sealed property 'content'");
    });

    it('should throw when sealed: true and any replace-strategy property is overridden', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Instructions'),
                sealed: true as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              description: 'Override attempt',
            })
          ),
        ],
      });

      expect(() => applyExtends(ast)).toThrow(ResolveError);
      expect(() => applyExtends(ast)).toThrow("Cannot override sealed property 'description'");
    });

    it('should NOT block append-strategy properties even when sealed: true', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                references: createArrayContent(['base.md']) as unknown as Value,
                sealed: true as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              references: createArrayContent(['overlay.md']) as unknown as Value,
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, Value>;
      const refs = expert['references'] as string[];

      expect(refs).toContain('base.md');
      expect(refs).toContain('overlay.md');
    });

    it('should NOT block merge-strategy properties even when sealed: true', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                params: createObjectContent({ name: 'string' }) as unknown as Value,
                sealed: true as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              params: createObjectContent({ age: 'number' }) as unknown as Value,
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, Value>;
      expect(expert).toBeDefined();
    });

    it('should preserve sealed through multiple extends', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Critical'),
                sealed: ['content'] as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              references: createArrayContent(['layer2.md']) as unknown as Value,
            })
          ),
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              content: createTextContent('Override by layer 3'),
            })
          ),
        ],
      });

      expect(() => applyExtends(ast)).toThrow("Cannot override sealed property 'content'");
    });

    describe('__layerTrace recording', () => {
      it('should record trace entry when replacing a property via @extend', () => {
        const ast = createProgram({
          blocks: [
            createBlock(
              'skills',
              createObjectContent({
                expert: createObjectContent({
                  description: 'Base expert',
                  content: createTextContent('Base instructions'),
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
        const expert = skills.properties['expert'] as Record<string, unknown>;
        const trace = expert['__layerTrace'] as Array<Record<string, string>>;

        expect(trace).toBeDefined();
        expect(trace).toHaveLength(1);
        expect(trace[0]!['property']).toBe('description');
        expect(trace[0]!['strategy']).toBe('replace');
        expect(trace[0]!['action']).toBe('replaced');
        expect(trace[0]!['source']).toBeDefined();
      });

      it('should record trace entry when appending references via @extend', () => {
        const ast = createProgram({
          blocks: [
            createBlock(
              'skills',
              createObjectContent({
                expert: createObjectContent({
                  description: 'Base expert',
                  references: createArrayContent(['base.md']) as unknown as Value,
                }) as unknown as Value,
              })
            ),
          ],
          extends: [
            createExtendBlock(
              'skills.expert',
              createObjectContent({
                references: createArrayContent(['overlay.md']) as unknown as Value,
              })
            ),
          ],
        });

        const result = applyExtends(ast);
        const skills = result.blocks[0]?.content as ObjectContent;
        const expert = skills.properties['expert'] as Record<string, unknown>;
        const trace = expert['__layerTrace'] as Array<Record<string, string>>;

        expect(trace).toBeDefined();
        expect(trace).toHaveLength(1);
        expect(trace[0]!['property']).toBe('references');
        expect(trace[0]!['strategy']).toBe('append');
        expect(trace[0]!['action']).toBe('appended');
      });

      it('should record trace entry for merge-strategy properties', () => {
        const ast = createProgram({
          blocks: [
            createBlock(
              'skills',
              createObjectContent({
                expert: createObjectContent({
                  description: 'Base',
                  params: createObjectContent({ name: 'string' }) as unknown as Value,
                }) as unknown as Value,
              })
            ),
          ],
          extends: [
            createExtendBlock(
              'skills.expert',
              createObjectContent({
                params: createObjectContent({ age: 'number' }) as unknown as Value,
              })
            ),
          ],
        });

        const result = applyExtends(ast);
        const skills = result.blocks[0]?.content as ObjectContent;
        const expert = skills.properties['expert'] as Record<string, unknown>;
        const trace = expert['__layerTrace'] as Array<Record<string, string>>;

        expect(trace).toBeDefined();
        expect(trace).toHaveLength(1);
        expect(trace[0]!['property']).toBe('params');
        expect(trace[0]!['strategy']).toBe('merge');
        expect(trace[0]!['action']).toBe('merged');
      });

      it('should record source file from ext.loc.file', () => {
        const loc = { file: '/project/overlay.prs', line: 1, column: 1 };
        const ast = createProgram({
          blocks: [
            createBlock(
              'skills',
              createObjectContent({
                expert: createObjectContent({
                  description: 'Base',
                }) as unknown as Value,
              })
            ),
          ],
          extends: [
            {
              type: 'ExtendBlock' as const,
              targetPath: 'skills.expert',
              content: {
                type: 'ObjectContent' as const,
                properties: { description: 'New' },
                loc,
              },
              loc,
            },
          ],
        });

        const result = applyExtends(ast);
        const skills = result.blocks[0]?.content as ObjectContent;
        const expert = skills.properties['expert'] as Record<string, unknown>;
        const trace = expert['__layerTrace'] as Array<Record<string, string>>;

        expect(trace[0]!['source']).toBe('/project/overlay.prs');
      });

      it('should accumulate trace entries across multiple extends', () => {
        const ast = createProgram({
          blocks: [
            createBlock(
              'skills',
              createObjectContent({
                expert: createObjectContent({
                  description: 'Base',
                  references: createArrayContent(['base.md']) as unknown as Value,
                }) as unknown as Value,
              })
            ),
          ],
          extends: [
            createExtendBlock(
              'skills.expert',
              createObjectContent({
                description: 'Layer 2',
              })
            ),
            createExtendBlock(
              'skills.expert',
              createObjectContent({
                references: createArrayContent(['layer3.md']) as unknown as Value,
              })
            ),
          ],
        });

        const result = applyExtends(ast);
        const skills = result.blocks[0]?.content as ObjectContent;
        const expert = skills.properties['expert'] as Record<string, unknown>;
        const trace = expert['__layerTrace'] as Array<Record<string, string>>;

        expect(trace).toHaveLength(2);
        expect(trace[0]!['property']).toBe('description');
        expect(trace[1]!['property']).toBe('references');
      });

      it('should not have __layerTrace when no extends are applied', () => {
        const ast = createProgram({
          blocks: [
            createBlock(
              'skills',
              createObjectContent({
                expert: createObjectContent({
                  description: 'Base only',
                }) as unknown as Value,
              })
            ),
          ],
        });

        const result = applyExtends(ast);
        const skills = result.blocks[0]?.content as ObjectContent;
        const expert = skills.properties['expert'] as Record<string, unknown>;

        expect(expert['__layerTrace']).toBeUndefined();
      });

      it('should prevent __layerTrace from being overwritten by @extend', () => {
        const ast = createProgram({
          blocks: [
            createBlock(
              'skills',
              createObjectContent({
                expert: createObjectContent({
                  description: 'Base',
                }) as unknown as Value,
              })
            ),
          ],
          extends: [
            createExtendBlock(
              'skills.expert',
              createObjectContent({
                description: 'First extend',
              })
            ),
            createExtendBlock(
              'skills.expert',
              createObjectContent({
                __layerTrace: 'attempt to overwrite' as unknown as Value,
              })
            ),
          ],
        });

        const result = applyExtends(ast);
        const skills = result.blocks[0]?.content as ObjectContent;
        const expert = skills.properties['expert'] as Record<string, unknown>;
        const trace = expert['__layerTrace'] as Array<Record<string, string>>;

        expect(Array.isArray(trace)).toBe(true);
        expect(trace).toHaveLength(1);
      });
    });

    it('should silently ignore sealed added by @extend (SKILL_PRESERVE_PROPERTIES)', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Not sealed'),
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              sealed: ['content'] as unknown as Value,
            })
          ),
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              content: createTextContent('Override succeeds'),
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, Value>;
      const content = expert['content'] as { value: string };
      expect(content.value).toBe('Override succeeds');
    });

    it('should include property name in error message', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base',
                allowedTools: ['Read'] as unknown as Value,
                sealed: ['allowedTools'] as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              allowedTools: ['Write'] as unknown as Value,
            })
          ),
        ],
      });

      expect(() => applyExtends(ast)).toThrow("'allowedTools'");
    });

    it('should allow normal extends when no sealed property exists', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Original'),
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              content: createTextContent('Overridden'),
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, Value>;
      const content = expert['content'] as { value: string };
      expect(content.value).toBe('Overridden');
    });
  });
});

describe('resolveSkillReferences', () => {
  it('should load reference files from resolved paths', async () => {
    const refs = ['references/spring.md'];
    const basePath = join(FIXTURES, 'skills', 'expert');

    const resources = await resolveSkillReferences(refs, basePath);

    expect(resources).toHaveLength(1);
    expect(resources[0]!.relativePath).toBe('references/spring.md');
    expect(resources[0]!.content).toContain('Spring Patterns');
  });

  it('should reject path traversal', async () => {
    const refs = ['../../etc/passwd'];
    const basePath = join(FIXTURES, 'skills', 'expert');

    await expect(resolveSkillReferences(refs, basePath)).rejects.toThrow(/unsafe path/i);
  });

  it('should reject absolute paths', async () => {
    const refs = ['/etc/passwd'];
    const basePath = join(FIXTURES, 'skills', 'expert');

    await expect(resolveSkillReferences(refs, basePath)).rejects.toThrow(/unsafe path/i);
  });

  it('should throw for non-existent reference files', async () => {
    const refs = ['references/nonexistent.md'];
    const basePath = join(FIXTURES, 'skills', 'expert');

    await expect(resolveSkillReferences(refs, basePath)).rejects.toThrow(/not found/i);
  });
});

describe('resolveSkillReferences limits', () => {
  let tempDir: string;

  async function setupTempDir(): Promise<string> {
    tempDir = await mkdtemp(join(tmpdir(), 'prs-ref-test-'));
    await mkdir(join(tempDir, 'references'), { recursive: true });
    return tempDir;
  }

  async function cleanupTempDir(): Promise<void> {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  it('should throw when a single reference file exceeds MAX_RESOURCE_SIZE', async () => {
    const base = await setupTempDir();
    try {
      const bigContent = 'x'.repeat(1_048_577); // 1 byte over 1MB
      await writeFile(join(base, 'references', 'big.md'), bigContent);

      await expect(resolveSkillReferences(['references/big.md'], base)).rejects.toThrow(
        /exceeds.*1MB/i
      );
    } finally {
      await cleanupTempDir();
    }
  });

  it('should throw when aggregate reference size exceeds MAX_TOTAL_RESOURCE_SIZE', async () => {
    const base = await setupTempDir();
    try {
      // Each file just under 1MB, 11 files to exceed 10MB total
      const chunkContent = 'x'.repeat(1_000_000);
      const refs: string[] = [];
      for (let i = 0; i < 11; i++) {
        const name = `references/chunk${i}.md`;
        await writeFile(join(base, name), chunkContent);
        refs.push(name);
      }

      await expect(resolveSkillReferences(refs, base)).rejects.toThrow(/total reference size/i);
    } finally {
      await cleanupTempDir();
    }
  }, 30000);

  it('should throw when reference count exceeds MAX_RESOURCE_COUNT', async () => {
    const base = await setupTempDir();
    try {
      const refs: string[] = [];
      for (let i = 0; i < 101; i++) {
        const name = `references/file${i}.md`;
        await writeFile(join(base, name), 'content');
        refs.push(name);
      }

      await expect(resolveSkillReferences(refs, base)).rejects.toThrow(/too many reference/i);
    } finally {
      await cleanupTempDir();
    }
  });

  it('should log verbose message for empty reference files', async () => {
    const base = await setupTempDir();
    try {
      await writeFile(join(base, 'references', 'empty.md'), '');
      const mockLogger = { verbose: vi.fn(), debug: vi.fn(), warn: vi.fn() };

      await resolveSkillReferences(['references/empty.md'], base, mockLogger as unknown as Logger);
      expect(mockLogger.verbose).toHaveBeenCalledWith(expect.stringContaining('Empty reference'));
    } finally {
      await cleanupTempDir();
    }
  });
});

describe('reference name collision detection', () => {
  it('should deduplicate references by basename, keeping last occurrence', async () => {
    const refs = ['references/spring.md', 'references/spring.md'];
    const basePath = join(FIXTURES, 'skills', 'expert');
    const mockLogger = { verbose: vi.fn(), debug: vi.fn(), warn: vi.fn() };

    const resources = await resolveSkillReferences(refs, basePath, mockLogger as unknown as Logger);

    expect(resources).toHaveLength(1);
    expect(resources[0]!.relativePath).toBe('references/spring.md');
    expect(mockLogger.verbose).toHaveBeenCalledWith(expect.stringContaining('overridden'));
  });
});

import { normalizePath } from '../extensions.js';

describe('normalizePath', () => {
  it('should strip leading ./', () => {
    expect(normalizePath('./references/arch.md')).toBe('references/arch.md');
  });

  it('should leave paths without ./ prefix unchanged', () => {
    expect(normalizePath('references/arch.md')).toBe('references/arch.md');
  });

  it('should resolve ../ segments', () => {
    expect(normalizePath('foo/../bar/baz.md')).toBe('bar/baz.md');
  });

  it('should collapse duplicate slashes', () => {
    expect(normalizePath('foo//bar///baz.md')).toBe('foo/bar/baz.md');
  });

  it('should handle combined normalizations', () => {
    expect(normalizePath('./foo/../bar//baz.md')).toBe('bar/baz.md');
  });

  it('should return empty string for empty input', () => {
    expect(normalizePath('')).toBe('');
  });

  it('should handle bare filename', () => {
    expect(normalizePath('file.md')).toBe('file.md');
  });
});
