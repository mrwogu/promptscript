import { describe, it, expect } from 'vitest';
import type {
  Program,
  Block,
  TextContent,
  ObjectContent,
  ArrayContent,
  MixedContent,
  Value,
} from '@promptscript/core';
import {
  resolveUses,
  isImportMarker,
  getImportAlias,
  getOriginalBlockName,
  IMPORT_MARKER_PREFIX,
} from '../imports.js';

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

const createTextContent = (value: string): TextContent => ({
  type: 'TextContent',
  value,
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

const createMixedContent = (
  properties: Record<string, Value>,
  text?: TextContent
): MixedContent => ({
  type: 'MixedContent',
  properties,
  text,
  loc: createLoc(),
});

const createUseDeclaration = (path: string, alias?: string) => ({
  type: 'UseDeclaration' as const,
  path: {
    type: 'PathReference' as const,
    raw: path,
    segments: [path],
    isRelative: path.startsWith('./'),
    loc: createLoc(),
  },
  alias,
  loc: createLoc(),
});

describe('imports', () => {
  describe('resolveUses', () => {
    it('should merge blocks from source into target', () => {
      const target = createProgram({
        blocks: [createBlock('identity', createTextContent('main'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './guards',
          segments: ['guards'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('guards', createObjectContent({ level: 'high' }))],
      });

      const result = resolveUses(target, use, source);

      // Should have original block + merged block (no markers without alias)
      expect(result.blocks).toHaveLength(2);
      expect(result.blocks[0]?.name).toBe('identity');
      expect(result.blocks[1]?.name).toBe('guards');
    });

    it('should add aliased blocks when alias is provided', () => {
      const target = createProgram({
        blocks: [createBlock('identity', createTextContent('main'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './guards',
          segments: ['guards'],
          isRelative: true,
          loc: createLoc(),
        },
        alias: 'sec',
        loc: createLoc(),
      };

      const source = createProgram({
        meta: {
          type: 'MetaBlock',
          fields: { id: 'guards-module' },
          loc: createLoc(),
        },
        blocks: [createBlock('guards', createObjectContent({ level: 'high' }))],
      });

      const result = resolveUses(target, use, source);

      // Should have: original + merged + marker + aliased
      expect(result.blocks).toHaveLength(4);
      expect(result.blocks[0]?.name).toBe('identity');
      expect(result.blocks[1]?.name).toBe('guards');
      expect(result.blocks[2]?.name).toBe(`${IMPORT_MARKER_PREFIX}sec`);
      expect(result.blocks[3]?.name).toBe(`${IMPORT_MARKER_PREFIX}sec.guards`);
    });

    it('should merge same-name blocks with target winning on conflict', () => {
      const target = createProgram({
        blocks: [createBlock('rules', createTextContent('target rules'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './guards',
          segments: ['guards'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('rules', createTextContent('source rules'))],
      });

      const result = resolveUses(target, use, source);

      // Should have merged block with concatenated text (source + target)
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0]?.name).toBe('rules');
      const content = result.blocks[0]?.content as TextContent;
      expect(content.value).toBe('source rules\n\ntarget rules');
    });

    it('should override string properties in ObjectContent (source wins)', () => {
      const target = createProgram({
        blocks: [
          createBlock(
            'shortcuts',
            createObjectContent({
              '/test': 'target value',
              '/other': 'only in target',
            })
          ),
        ],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './commands',
          segments: ['commands'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [
          createBlock(
            'shortcuts',
            createObjectContent({
              '/test': 'source value',
              '/new': 'only in source',
            })
          ),
        ],
      });

      const result = resolveUses(target, use, source);

      // Source (import) should override target for string properties
      expect(result.blocks).toHaveLength(1);
      const content = result.blocks[0]?.content as ObjectContent;
      expect(content.properties['/test']).toBe('source value'); // source wins
      expect(content.properties['/other']).toBe('only in target'); // only in target
      expect(content.properties['/new']).toBe('only in source'); // only in source
    });

    it('should deduplicate identical text content', () => {
      const target = createProgram({
        blocks: [createBlock('identity', createTextContent('Same content'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './base',
          segments: ['base'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('identity', createTextContent('Same content'))],
      });

      const result = resolveUses(target, use, source);

      // Should deduplicate identical content
      expect(result.blocks).toHaveLength(1);
      const content = result.blocks[0]?.content as TextContent;
      expect(content.value).toBe('Same content');
    });

    it('should deduplicate when target contains source', () => {
      const target = createProgram({
        blocks: [createBlock('identity', createTextContent('Full text with more details'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './base',
          segments: ['base'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('identity', createTextContent('Full text'))],
      });

      const result = resolveUses(target, use, source);

      // Should return target only since it contains source
      expect(result.blocks).toHaveLength(1);
      const content = result.blocks[0]?.content as TextContent;
      expect(content.value).toBe('Full text with more details');
    });

    it('should store source info in marker when alias provided', () => {
      const target = createProgram();

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: '@company/guards',
          namespace: 'company',
          segments: ['guards'],
          isRelative: false,
          loc: createLoc(),
        },
        alias: 'g',
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('rules', createTextContent('rule 1'))],
      });

      const result = resolveUses(target, use, source);

      // Merged block + marker + aliased block
      expect(result.blocks).toHaveLength(3);
      expect(result.blocks[0]?.name).toBe('rules');

      const marker = result.blocks[1];
      expect(marker?.name).toBe(`${IMPORT_MARKER_PREFIX}g`);
      const content = marker?.content as ObjectContent;

      expect(content.properties['__source']).toBe('@company/guards');
      expect(content.properties['__blocks']).toEqual(['rules']);
    });
  });

  describe('isImportMarker', () => {
    it('should return true for import markers', () => {
      expect(isImportMarker(`${IMPORT_MARKER_PREFIX}alias`)).toBe(true);
      expect(isImportMarker(`${IMPORT_MARKER_PREFIX}alias.block`)).toBe(true);
    });

    it('should return false for regular blocks', () => {
      expect(isImportMarker('identity')).toBe(false);
      expect(isImportMarker('standards')).toBe(false);
    });
  });

  describe('getImportAlias', () => {
    it('should extract alias from marker name', () => {
      expect(getImportAlias(`${IMPORT_MARKER_PREFIX}sec`)).toBe('sec');
      expect(getImportAlias(`${IMPORT_MARKER_PREFIX}guards`)).toBe('guards');
    });

    it('should extract alias from aliased block name', () => {
      expect(getImportAlias(`${IMPORT_MARKER_PREFIX}sec.rules`)).toBe('sec');
    });

    it('should return undefined for non-import blocks', () => {
      expect(getImportAlias('identity')).toBeUndefined();
    });
  });

  describe('getOriginalBlockName', () => {
    it('should extract original block name from aliased import', () => {
      expect(getOriginalBlockName(`${IMPORT_MARKER_PREFIX}sec.rules`)).toBe('rules');
      expect(getOriginalBlockName(`${IMPORT_MARKER_PREFIX}g.guards`)).toBe('guards');
    });

    it('should return undefined for marker-only names', () => {
      expect(getOriginalBlockName(`${IMPORT_MARKER_PREFIX}sec`)).toBeUndefined();
    });

    it('should return undefined for non-import blocks', () => {
      expect(getOriginalBlockName('identity')).toBeUndefined();
    });
  });

  describe('content type merging', () => {
    describe('ArrayContent', () => {
      it('should merge ArrayContent blocks with unique concatenation', () => {
        const target = createProgram({
          blocks: [createBlock('restrictions', createArrayContent(['rule1', 'rule2']))],
        });

        const source = createProgram({
          blocks: [createBlock('restrictions', createArrayContent(['rule2', 'rule3']))],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        expect(result.blocks).toHaveLength(1);
        const content = result.blocks[0]?.content as ArrayContent;
        expect(content.elements).toEqual(['rule2', 'rule3', 'rule1']);
      });

      it('should handle array elements that are objects', () => {
        const target = createProgram({
          blocks: [createBlock('items', createArrayContent([{ id: 1 }, { id: 2 }]))],
        });

        const source = createProgram({
          blocks: [createBlock('items', createArrayContent([{ id: 2 }, { id: 3 }]))],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as ArrayContent;
        // Objects are compared by JSON.stringify for uniqueness
        expect(content.elements).toHaveLength(3);
      });
    });

    describe('MixedContent', () => {
      it('should merge MixedContent with MixedContent', () => {
        const target = createProgram({
          blocks: [
            createBlock(
              'context',
              createMixedContent({ project: 'target-proj' }, createTextContent('target text'))
            ),
          ],
        });

        const source = createProgram({
          blocks: [
            createBlock(
              'context',
              createMixedContent({ project: 'source-proj' }, createTextContent('source text'))
            ),
          ],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as MixedContent;
        expect(content.properties['project']).toBe('source-proj'); // source wins
        expect(content.text?.value).toBe('source text\n\ntarget text'); // concatenated
      });

      it('should merge MixedContent (source) with TextContent (target)', () => {
        const target = createProgram({
          blocks: [createBlock('context', createTextContent('target text'))],
        });

        const source = createProgram({
          blocks: [
            createBlock(
              'context',
              createMixedContent({ project: 'proj' }, createTextContent('source text'))
            ),
          ],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as MixedContent;
        expect(content.type).toBe('MixedContent');
        expect(content.text?.value).toBe('source text\n\ntarget text');
      });

      it('should merge TextContent (source) with MixedContent (target)', () => {
        const target = createProgram({
          blocks: [
            createBlock(
              'context',
              createMixedContent({ project: 'proj' }, createTextContent('target text'))
            ),
          ],
        });

        const source = createProgram({
          blocks: [createBlock('context', createTextContent('source text'))],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as MixedContent;
        expect(content.type).toBe('MixedContent');
        expect(content.text?.value).toBe('source text\n\ntarget text');
      });

      it('should merge MixedContent (source) with ObjectContent (target)', () => {
        const target = createProgram({
          blocks: [createBlock('standards', createObjectContent({ code: 'target' }))],
        });

        const source = createProgram({
          blocks: [
            createBlock('standards', createMixedContent({ code: 'source', extra: 'val' })),
          ],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as MixedContent;
        expect(content.properties['code']).toBe('source'); // source wins
        expect(content.properties['extra']).toBe('val');
      });

      it('should merge ObjectContent (source) with MixedContent (target)', () => {
        const target = createProgram({
          blocks: [
            createBlock(
              'standards',
              createMixedContent({ code: 'target' }, createTextContent('some text'))
            ),
          ],
        });

        const source = createProgram({
          blocks: [createBlock('standards', createObjectContent({ code: 'source', extra: 'val' }))],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as MixedContent;
        expect(content.properties['code']).toBe('source'); // source wins
        expect(content.properties['extra']).toBe('val');
        expect(content.text?.value).toBe('some text'); // preserved from target
      });

      it('should handle MixedContent without text merging with TextContent', () => {
        const target = createProgram({
          blocks: [createBlock('context', createTextContent('target text'))],
        });

        const source = createProgram({
          blocks: [createBlock('context', createMixedContent({ project: 'proj' }))],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as MixedContent;
        expect(content.text?.value).toBe('target text');
      });

      it('should handle TextContent merging with MixedContent without text', () => {
        const target = createProgram({
          blocks: [createBlock('context', createMixedContent({ project: 'proj' }))],
        });

        const source = createProgram({
          blocks: [createBlock('context', createTextContent('source text'))],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as MixedContent;
        expect(content.text?.value).toBe('source text');
      });

      it('should handle MixedContent merging when only target has text', () => {
        const target = createProgram({
          blocks: [
            createBlock(
              'context',
              createMixedContent({ key: 'target' }, createTextContent('target text'))
            ),
          ],
        });

        const source = createProgram({
          blocks: [createBlock('context', createMixedContent({ key: 'source' }))],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as MixedContent;
        expect(content.text?.value).toBe('target text');
      });

      it('should handle MixedContent merging when only source has text', () => {
        const target = createProgram({
          blocks: [createBlock('context', createMixedContent({ key: 'target' }))],
        });

        const source = createProgram({
          blocks: [
            createBlock(
              'context',
              createMixedContent({ key: 'source' }, createTextContent('source text'))
            ),
          ],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as MixedContent;
        expect(content.text?.value).toBe('source text');
      });
    });

    describe('different content types', () => {
      it('should use target when source is ObjectContent and target is ArrayContent', () => {
        const target = createProgram({
          blocks: [createBlock('data', createArrayContent(['item1', 'item2']))],
        });

        const source = createProgram({
          blocks: [createBlock('data', createObjectContent({ key: 'value' }))],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as ArrayContent;
        expect(content.type).toBe('ArrayContent');
        expect(content.elements).toEqual(['item1', 'item2']);
      });

      it('should use target when source is TextContent and target is ObjectContent', () => {
        const target = createProgram({
          blocks: [createBlock('data', createObjectContent({ key: 'value' }))],
        });

        const source = createProgram({
          blocks: [createBlock('data', createTextContent('some text'))],
        });

        const result = resolveUses(target, createUseDeclaration('./source'), source);

        const content = result.blocks[0]?.content as ObjectContent;
        expect(content.type).toBe('ObjectContent');
        expect(content.properties['key']).toBe('value');
      });
    });
  });

  describe('text content deduplication', () => {
    it('should deduplicate when source contains target', () => {
      const target = createProgram({
        blocks: [createBlock('identity', createTextContent('Short'))],
      });

      const source = createProgram({
        blocks: [createBlock('identity', createTextContent('Short text with more content'))],
      });

      const result = resolveUses(target, createUseDeclaration('./source'), source);

      const content = result.blocks[0]?.content as TextContent;
      expect(content.value).toBe('Short text with more content');
    });
  });

  describe('property merging edge cases', () => {
    it('should deep merge nested objects', () => {
      const target = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              code: {
                style: 'target-style',
                testing: { coverage: 80 },
              },
            })
          ),
        ],
      });

      const source = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              code: {
                style: 'source-style',
                testing: { framework: 'vitest' },
                linting: true,
              },
            })
          ),
        ],
      });

      const result = resolveUses(target, createUseDeclaration('./source'), source);

      const content = result.blocks[0]?.content as ObjectContent;
      const code = content.properties['code'] as Record<string, Value>;
      expect(code['style']).toBe('source-style'); // source wins for same-type primitives
      expect(code['linting']).toBe(true); // only in source
      const testing = code['testing'] as Record<string, Value>;
      expect(testing['coverage']).toBe(80); // only in target
      expect(testing['framework']).toBe('vitest'); // only in source
    });

    it('should unique concat array properties', () => {
      const target = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              frameworks: ['react', 'vue'],
            })
          ),
        ],
      });

      const source = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              frameworks: ['vue', 'angular'],
            })
          ),
        ],
      });

      const result = resolveUses(target, createUseDeclaration('./source'), source);

      const content = result.blocks[0]?.content as ObjectContent;
      expect(content.properties['frameworks']).toEqual(['vue', 'angular', 'react']);
    });

    it('should handle TextContent property in ObjectContent', () => {
      const target = createProgram({
        blocks: [
          createBlock(
            'shortcuts',
            createObjectContent({
              '/test': createTextContent('target test'),
            })
          ),
        ],
      });

      const source = createProgram({
        blocks: [
          createBlock(
            'shortcuts',
            createObjectContent({
              '/test': createTextContent('source test'),
            })
          ),
        ],
      });

      const result = resolveUses(target, createUseDeclaration('./source'), source);

      const content = result.blocks[0]?.content as ObjectContent;
      const testVal = content.properties['/test'] as TextContent;
      expect(testVal.value).toBe('source test'); // source wins for TextContent
    });

    it('should handle mixed TextContent and string properties', () => {
      const target = createProgram({
        blocks: [
          createBlock(
            'shortcuts',
            createObjectContent({
              '/test': 'target string',
            })
          ),
        ],
      });

      const source = createProgram({
        blocks: [
          createBlock(
            'shortcuts',
            createObjectContent({
              '/test': createTextContent('source text'),
            })
          ),
        ],
      });

      const result = resolveUses(target, createUseDeclaration('./source'), source);

      const content = result.blocks[0]?.content as ObjectContent;
      // Source wins when one is TextContent and other is string
      const testVal = content.properties['/test'] as TextContent;
      expect(testVal.value).toBe('source text');
    });

    it('should handle type mismatch where target wins', () => {
      const target = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              value: 42, // number
            })
          ),
        ],
      });

      const source = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              value: 'string', // string - different type
            })
          ),
        ],
      });

      const result = resolveUses(target, createUseDeclaration('./source'), source);

      const content = result.blocks[0]?.content as ObjectContent;
      // Target wins on type mismatch
      expect(content.properties['value']).toBe(42);
    });

    it('should preserve null values', () => {
      const target = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              value: null,
            })
          ),
        ],
      });

      const source = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              other: 'val',
            })
          ),
        ],
      });

      const result = resolveUses(target, createUseDeclaration('./source'), source);

      const content = result.blocks[0]?.content as ObjectContent;
      expect(content.properties['value']).toBeNull();
      expect(content.properties['other']).toBe('val');
    });
  });

  describe('deep cloning', () => {
    it('should deep clone array values', () => {
      const originalArray = [{ nested: 'value' }];
      const target = createProgram({
        blocks: [createBlock('data', createArrayContent(originalArray))],
      });

      const source = createProgram({
        blocks: [],
      });

      const result = resolveUses(target, createUseDeclaration('./source'), source);

      const content = result.blocks[0]?.content as ArrayContent;
      // Modify original - cloned should be unaffected
      (originalArray[0] as Record<string, string>)['nested'] = 'modified';
      expect((content.elements[0] as Record<string, string>)['nested']).toBe('value');
    });

    it('should deep clone nested object values', () => {
      const original = { level1: { level2: { value: 'deep' } } };
      const target = createProgram({
        blocks: [createBlock('data', createObjectContent(original))],
      });

      const source = createProgram({
        blocks: [],
      });

      const result = resolveUses(target, createUseDeclaration('./source'), source);

      const content = result.blocks[0]?.content as ObjectContent;
      // Modify original - cloned should be unaffected
      (original.level1.level2 as Record<string, string>).value = 'modified';
      const level1 = content.properties['level1'] as Record<string, unknown>;
      const level2 = level1['level2'] as Record<string, string>;
      expect(level2['value']).toBe('deep');
    });
  });
});
