import { describe, it, expect, vi } from 'vitest';
import type {
  Program,
  Block,
  TextContent,
  ObjectContent,
  ArrayContent,
  ExtendBlock,
  MixedContent,
  Value,
  Logger,
} from '@promptscript/core';
import { applyExtends } from '../extensions.js';
import { IMPORT_MARKER_PREFIX } from '../imports.js';
import { Resolver } from '../resolver.js';
import { parseOrThrow } from '@promptscript/parser';

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
  text: TextContent | undefined,
  properties: Record<string, Value>
): MixedContent => ({
  type: 'MixedContent',
  text,
  properties,
  loc: createLoc(),
});

const createExtendBlock = (targetPath: string, content: ExtendBlock['content']): ExtendBlock => ({
  type: 'ExtendBlock',
  targetPath,
  content,
  loc: createLoc(),
});

describe('applyExtends', () => {
  describe('direct block extension', () => {
    it('should extend TextContent block', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [createExtendBlock('identity', createTextContent('extended'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as TextContent;

      expect(content.value).toBe('original\n\nextended');
    });

    it('should extend a multi-segment namespaced agent', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'agents',
            createObjectContent({
              'outer.inner.reviewer': { description: 'Original reviewer' },
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'agents.outer.inner.reviewer',
            createObjectContent({ description: 'Updated reviewer' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const agents = result.blocks[0]?.content;

      expect(agents).toMatchObject({
        type: 'ObjectContent',
        properties: {
          'outer.inner.reviewer': { description: 'Updated reviewer' },
        },
      });
    });

    it('preserves ordered canonical entries from direct extensions', () => {
      const ast = parseOrThrow(
        `@context {
  before: "base"
  """Base text"""
}
@extend context {
  """Extension text"""
  after: "extension"
}`,
        { filename: 'extensions.prs' }
      );

      const result = applyExtends(ast);
      const body = result.blocks[0]!.canonicalBody!;

      expect(body.entries.map((entry) => entry.type)).toEqual([
        'FieldEntry',
        'TextEntry',
        'TextEntry',
        'FieldEntry',
      ]);
      expect(
        body.entries.filter((entry) => entry.type === 'TextEntry').map((entry) => entry.text)
      ).toEqual(['Base text', 'Extension text']);
      expect(body.entries[2]!.loc.line).toBe(6);
    });

    it('preserves base nested locations in direct extensions', () => {
      const ast = parseOrThrow(
        `@standards {
  config: { baseOnly: "base" duplicate: "first" duplicate: "last" }
}
@extend standards {
  config: { firstExtension: true }
  config: { incomingOnly: "extension" }
}`,
        { filename: 'direct-extension.prs' }
      );

      const result = applyExtends(ast);
      const entries = result.blocks[0]!.canonicalBody!.entries.filter(
        (entry) => entry.type === 'FieldEntry' && entry.name === 'config'
      );
      if (
        entries[0]?.type !== 'FieldEntry' ||
        entries[0].value.type !== 'ObjectValueNode' ||
        entries[1]?.type !== 'FieldEntry' ||
        entries[1].value.type !== 'ObjectValueNode'
      ) {
        throw new Error('Expected duplicate config object fields');
      }
      const firstFields = entries[0].value.fields.map((field) => field.name);
      const fields = new Map(entries[1].value.fields.map((field) => [field.name, field]));

      expect(firstFields).toEqual(['firstExtension']);
      expect(fields.get('baseOnly')!.loc.line).toBe(2);
      expect(fields.get('incomingOnly')!.loc.line).toBe(6);
      expect(entries[1].value.fields.filter((field) => field.name === 'duplicate')).toHaveLength(2);
    });

    it('merges list and inline-use side channels', () => {
      const ast = parseOrThrow(
        `@restrictions {
  items: ["base field"]
  - "base list"
  @use ./base
}
@extend restrictions {
  items: ["extension field"]
  - "extension list"
  @use ./extension
}`
      );

      const result = applyExtends(ast);
      const content = result.blocks[0]!.content;
      if (content.type !== 'ObjectContent') {
        throw new Error('Expected object content');
      }

      expect(content.properties['items']).toEqual(['base field', 'extension field']);
      expect(content.listItems).toEqual(['base list', 'extension list']);
      expect(content.inlineUses?.map((use) => use.path.raw)).toEqual(['./base', './extension']);
    });

    it('keeps explicit items fields separate from cross-layer dash lists', () => {
      const ast = parseOrThrow(
        `@restrictions {
  items: ["field"]
}
@extend restrictions {
  - "list"
}`
      );

      const result = applyExtends(ast);
      const content = result.blocks[0]!.content;
      if (content.type !== 'ObjectContent') {
        throw new Error('Expected object content');
      }

      expect(content.properties['items']).toEqual(['field']);
      expect(content.listItems).toEqual(['list']);
      expect(result.blocks[0]!.canonicalBody!.entries.map((entry) => entry.type)).toEqual([
        'FieldEntry',
        'ListEntry',
      ]);
    });

    it('keeps surviving list locations after extension deduplication', () => {
      const ast = parseOrThrow(
        `@restrictions {
  - "same"
}
@extend restrictions {
  - "same"
  - "tail"
}`,
        { filename: 'list-provenance.prs' }
      );

      const result = applyExtends(ast);
      const listEntries = result.blocks[0]!.canonicalBody!.entries.filter(
        (entry) => entry.type === 'ListEntry'
      );

      expect(listEntries.map((entry) => entry.loc.line)).toEqual([2, 6]);
    });

    it('merges side channels for root skills extensions', () => {
      const ast = parseOrThrow(
        `@skills {
  review: { description: "Base" }
  items: { description: "Base item skill" }
  - "base list"
  @use ./base
}
@extend skills {
  review: { trigger: "extended" }
  items: { trigger: "extended item skill" }
  - "extension list"
  @use ./extension
}`
      );

      const result = applyExtends(ast);
      const content = result.blocks[0]!.content;
      if (content.type !== 'ObjectContent') {
        throw new Error('Expected object content');
      }

      expect(content.listItems).toEqual(['base list', 'extension list']);
      expect(content.inlineUses?.map((use) => use.path.raw)).toEqual(['./base', './extension']);
    });

    it('should extend ObjectContent block', () => {
      const ast = createProgram({
        blocks: [createBlock('standards', createObjectContent({ style: 'clean' }))],
        extends: [
          createExtendBlock('standards', createObjectContent({ lint: true, style: 'strict' })),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties).toEqual({
        style: 'strict',
        lint: true,
      });
    });

    it('should extend ArrayContent block', () => {
      const ast = createProgram({
        blocks: [createBlock('list', createArrayContent(['a', 'b']))],
        extends: [createExtendBlock('list', createArrayContent(['b', 'c']))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ArrayContent;

      expect(content.elements).toEqual(['a', 'b', 'c']);
    });
  });

  describe('deep path extension', () => {
    it('extends qualified agents through direct and aliased paths', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'agents',
            createObjectContent({
              'team.reviewer': { description: 'Original' },
            })
          ),
          createBlock(
            `${IMPORT_MARKER_PREFIX}team`,
            createObjectContent({
              __source: './team.prs',
              __blocks: ['agents'],
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'agents.team.reviewer',
            createObjectContent({ description: 'Direct update' })
          ),
          createExtendBlock(
            'team.agents.reviewer',
            createObjectContent({ description: 'Aliased update' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const agents = result.blocks.find((block) => block.name === 'agents');

      expect(agents?.content).toMatchObject({
        properties: {
          'team.reviewer': { description: 'Aliased update' },
        },
      });
      expect(result.blocks.some((block) => block.name === `${IMPORT_MARKER_PREFIX}team`)).toBe(
        false
      );
    });

    it('preserves nested canonical locations from deep extensions', () => {
      const ast = parseOrThrow(
        `@standards {
  tooling: { baseOnly: "base" duplicate: "first" duplicate: "last" }
}
@extend standards.tooling {
  incomingOnly: "extension"
}`,
        { filename: 'deep-extension.prs' }
      );

      const result = applyExtends(ast);
      const entry = result.blocks[0]!.canonicalBody!.entries[0]!;
      if (entry.type !== 'FieldEntry' || entry.value.type !== 'ObjectValueNode') {
        throw new Error('Expected tooling object field');
      }
      const fields = new Map(entry.value.fields.map((field) => [field.name, field]));

      expect(entry.loc.line).toBe(2);
      expect(fields.get('baseOnly')!.loc).toMatchObject({
        file: 'deep-extension.prs',
        line: 2,
      });
      expect(fields.get('incomingOnly')!.loc).toMatchObject({
        file: 'deep-extension.prs',
        line: 5,
      });
      expect(entry.value.fields.filter((field) => field.name === 'duplicate')).toHaveLength(2);
    });

    it('preserves text and properties in deep mixed extensions', () => {
      const ast = parseOrThrow(
        `@standards {
  tooling: { baseOnly: "base" }
}
@extend standards.tooling {
  """Extension text"""
  incomingOnly: "extension"
}
@extend standards.tooling {
  second: "two"
}
@extend standards.tooling {
  """More text"""
}`
      );

      const result = applyExtends(ast);
      const content = result.blocks[0]!.content;
      if (content.type !== 'ObjectContent') {
        throw new Error('Expected standards object content');
      }
      const tooling = content.properties['tooling'] as Record<string, Value>;

      expect(tooling['type']).toBe('MixedContent');
      expect(tooling['text']).toMatchObject({
        value: 'Extension text\n\nMore text',
      });
      expect(tooling['properties']).toMatchObject({
        baseOnly: 'base',
        incomingOnly: 'extension',
        second: 'two',
      });
      const entry = result.blocks[0]!.canonicalBody!.entries[0]!;
      if (entry.type !== 'FieldEntry' || entry.value.type !== 'ObjectValueNode') {
        throw new Error('Expected tooling canonical field');
      }
      const propertiesField = entry.value.fields.find((field) => field.name === 'properties');
      if (propertiesField?.value.type !== 'ObjectValueNode') {
        throw new Error('Expected mixed properties node');
      }
      const locations = new Map(
        propertiesField.value.fields.map((field) => [field.name, field.loc.line])
      );
      expect(locations).toEqual(
        new Map([
          ['baseOnly', 2],
          ['incomingOnly', 6],
          ['second', 9],
        ])
      );
    });

    it('locates a missing multi-segment root at the extension', () => {
      const ast = parseOrThrow(
        `@standards {
  existing: true
}
@extend standards.created.deep {
  value: "extension"
}`,
        { filename: 'created-extension.prs' }
      );

      const result = applyExtends(ast);
      const entry = result.blocks[0]!.canonicalBody!.entries.find(
        (candidate) => candidate.type === 'FieldEntry' && candidate.name === 'created'
      );

      expect(entry?.loc).toMatchObject({
        file: 'created-extension.prs',
        line: 4,
      });
      if (entry?.type !== 'FieldEntry' || entry.value.type !== 'ObjectValueNode') {
        throw new Error('Expected created object field');
      }
      const deep = entry.value.fields[0]!;
      expect(deep.loc).toMatchObject({ file: 'created-extension.prs', line: 4 });
      if (deep.value.type !== 'ObjectValueNode') {
        throw new Error('Expected deep object field');
      }
      expect(deep.value.fields[0]!.loc).toMatchObject({
        file: 'created-extension.prs',
        line: 5,
      });
    });

    it('updates only the last duplicate root field', () => {
      const ast = parseOrThrow(
        `@standards {
  config: { first: true }
  config: { last: true }
}
@extend standards.config {
  added: true
}`
      );

      const result = applyExtends(ast);
      const entries = result.blocks[0]!.canonicalBody!.entries.filter(
        (entry) => entry.type === 'FieldEntry' && entry.name === 'config'
      );
      if (
        entries[0]?.type !== 'FieldEntry' ||
        entries[0].value.type !== 'ObjectValueNode' ||
        entries[1]?.type !== 'FieldEntry' ||
        entries[1].value.type !== 'ObjectValueNode'
      ) {
        throw new Error('Expected duplicate config fields');
      }

      expect(entries[0].value.fields.map((field) => field.name)).toEqual(['first']);
      expect(entries[1].value.fields.map((field) => field.name)).toEqual(['last', 'added']);
    });

    it('should extend nested property', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              code: { style: 'clean', indent: 2 },
            })
          ),
        ],
        extends: [createExtendBlock('standards.code', createObjectContent({ lint: true }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['code']).toEqual({
        style: 'clean',
        indent: 2,
        lint: true,
      });
    });

    it('should create nested path if not exists', () => {
      const ast = createProgram({
        blocks: [createBlock('standards', createObjectContent({}))],
        extends: [createExtendBlock('standards.code', createObjectContent({ style: 'clean' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['code']).toEqual({ style: 'clean' });
    });

    it('should handle deeply nested paths', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              a: { b: { c: 'original' } },
            })
          ),
        ],
        extends: [createExtendBlock('config.a.b', createObjectContent({ d: 'new' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['a']).toEqual({
        b: { c: 'original', d: 'new' },
      });
    });
  });

  describe('multiple extensions', () => {
    it('should apply extensions in order', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('start'))],
        extends: [
          createExtendBlock('identity', createTextContent('middle')),
          createExtendBlock('identity', createTextContent('end')),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as TextContent;

      expect(content.value).toBe('start\n\nmiddle\n\nend');
    });

    it('should apply extensions to different blocks', () => {
      const ast = createProgram({
        blocks: [
          createBlock('identity', createTextContent('id')),
          createBlock('context', createTextContent('ctx')),
        ],
        extends: [
          createExtendBlock('identity', createTextContent('+ id')),
          createExtendBlock('context', createTextContent('+ ctx')),
        ],
      });

      const result = applyExtends(ast);

      expect((result.blocks[0]?.content as TextContent).value).toBe('id\n\n+ id');
      expect((result.blocks[1]?.content as TextContent).value).toBe('ctx\n\n+ ctx');
    });
  });

  describe('import marker handling', () => {
    it('should remove import markers after extension', () => {
      const ast = createProgram({
        blocks: [
          createBlock('identity', createTextContent('main')),
          createBlock(`${IMPORT_MARKER_PREFIX}sec`, createObjectContent({})),
          createBlock(`${IMPORT_MARKER_PREFIX}sec.guards`, createTextContent('guard')),
        ],
        extends: [],
      });

      const result = applyExtends(ast);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0]?.name).toBe('identity');
    });
  });

  describe('target not found', () => {
    it('should ignore extension for non-existent target and warn via logger', () => {
      const warnMessages: string[] = [];
      const logger: Logger = {
        verbose: () => {},
        debug: () => {},
        warn: (msg: string) => warnMessages.push(msg),
      };

      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [createExtendBlock('nonexistent', createTextContent('extended'))],
      });

      const result = applyExtends(ast, logger);

      expect(result.blocks).toHaveLength(1);
      expect((result.blocks[0]?.content as TextContent).value).toBe('original');
      expect(warnMessages.some((m) => m.includes('"nonexistent" not found'))).toBe(true);
    });
  });

  describe('mixed content type extension', () => {
    it('should create MixedContent when extending Object with Text', () => {
      const ast = createProgram({
        blocks: [createBlock('block', createObjectContent({ key: 'value' }))],
        extends: [createExtendBlock('block', createTextContent('text'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
    });

    it('should create MixedContent when extending Text with Object', () => {
      const ast = createProgram({
        blocks: [createBlock('block', createTextContent('text'))],
        extends: [createExtendBlock('block', createObjectContent({ key: 'value' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
    });
  });

  describe('clears extends after application', () => {
    it('should clear extends array', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('text'))],
        extends: [createExtendBlock('identity', createTextContent('more'))],
      });

      const result = applyExtends(ast);

      expect(result.extends).toEqual([]);
    });
  });

  describe('MixedContent extension', () => {
    it('should extend MixedContent with TextContent', () => {
      const ast = createProgram({
        blocks: [
          createBlock('block', createMixedContent(createTextContent('original'), { key: 'value' })),
        ],
        extends: [createExtendBlock('block', createTextContent('extended'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('original\n\nextended');
      expect(content.properties['key']).toBe('value');
    });

    it('should extend MixedContent with ObjectContent', () => {
      const ast = createProgram({
        blocks: [
          createBlock('block', createMixedContent(createTextContent('text'), { key1: 'value1' })),
        ],
        extends: [createExtendBlock('block', createObjectContent({ key2: 'value2' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should extend MixedContent without text with TextContent', () => {
      const ast = createProgram({
        blocks: [createBlock('block', createMixedContent(undefined, { key: 'value' }))],
        extends: [createExtendBlock('block', createTextContent('new text'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('new text');
    });

    it('should extend MixedContent with MixedContent', () => {
      const ast = createProgram({
        blocks: [createBlock('block', createMixedContent(createTextContent('text1'), { a: '1' }))],
        extends: [
          createExtendBlock('block', createMixedContent(createTextContent('text2'), { b: '2' })),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('text1\n\ntext2');
      expect(content.properties).toEqual({ a: '1', b: '2' });
    });
  });

  describe('deep path in MixedContent', () => {
    it('should extend nested property in MixedContent', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createMixedContent(createTextContent('desc'), {
              settings: { mode: 'dev' },
            })
          ),
        ],
        extends: [createExtendBlock('config.settings', createObjectContent({ debug: true }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties['settings']).toEqual({
        mode: 'dev',
        debug: true,
      });
    });

    it('should create nested path in MixedContent if not exists', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createMixedContent(createTextContent('desc'), {}))],
        extends: [createExtendBlock('config.newProp', createObjectContent({ value: 'test' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties['newProp']).toEqual({ value: 'test' });
    });

    it('should extend deeply nested property in MixedContent via mergeAtPathValue', () => {
      // This exercises the mergeAtPathValue path via MixedContent:
      // config.settings.sub navigates into MixedContent.settings (object), then
      // recurses with mergeAtPathValue to reach settings.sub.
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createMixedContent(createTextContent('desc'), {
              settings: { sub: { value: 'old' } },
            })
          ),
        ],
        extends: [createExtendBlock('config.settings.sub', createObjectContent({ extra: 'new' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;
      const settings = content.properties['settings'] as Record<string, Value>;

      expect(settings['sub']).toEqual({ value: 'old', extra: 'new' });
    });
  });

  describe('import aliased extension', () => {
    it('should extend imported block via alias', () => {
      const ast = createProgram({
        blocks: [
          createBlock(`${IMPORT_MARKER_PREFIX}sec`, createObjectContent({})),
          createBlock(`${IMPORT_MARKER_PREFIX}sec.guards`, createObjectContent({ level: 'low' })),
        ],
        extends: [createExtendBlock('sec.guards', createObjectContent({ level: 'high' }))],
      });

      const result = applyExtends(ast);

      // Import markers should be removed
      expect(result.blocks).toHaveLength(0);
    });
  });

  describe('TextContent and ArrayContent path extension', () => {
    it('should return unchanged when trying to navigate into TextContent', () => {
      const ast = createProgram({
        blocks: [createBlock('block', createTextContent('text'))],
        extends: [createExtendBlock('block.nested', createObjectContent({ key: 'value' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      // Should remain TextContent unchanged since we can't navigate into it
      expect(content?.type).toBe('TextContent');
    });

    it('should return unchanged when trying to navigate into ArrayContent', () => {
      const ast = createProgram({
        blocks: [createBlock('block', createArrayContent(['a', 'b']))],
        extends: [createExtendBlock('block.nested', createObjectContent({ key: 'value' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      // Should remain ArrayContent unchanged
      expect(content?.type).toBe('ArrayContent');
    });
  });

  describe('value merging', () => {
    it('should merge arrays when extending nested array', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ items: ['a', 'b'] }))],
        extends: [createExtendBlock('config.items', createArrayContent(['b', 'c']))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['items']).toEqual(['a', 'b', 'c']);
    });

    it('should merge TextContent when extending nested text', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              desc: { type: 'TextContent', value: 'original', loc: createLoc() },
            })
          ),
        ],
        extends: [createExtendBlock('config.desc', createTextContent('extended'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const desc = content.properties['desc'] as TextContent;

      expect(desc.value).toBe('original\n\nextended');
    });

    it('should handle primitive value replacement', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ value: 'old' }))],
        extends: [createExtendBlock('config.value', createTextContent('new'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['value']).toBe('new');
    });
  });

  describe('deeply nested path building', () => {
    it('should build deeply nested path when extending non-existent path', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [createExtendBlock('config.a.b.c', createObjectContent({ value: 'deep' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['a']).toEqual({
        b: { c: { value: 'deep' } },
      });
    });

    it('should handle extracting array value from ArrayContent', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [createExtendBlock('config.items', createArrayContent(['x', 'y']))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['items']).toEqual(['x', 'y']);
    });

    it('should handle extracting properties from MixedContent', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [
          createExtendBlock('config.mixed', createMixedContent(undefined, { prop: 'value' })),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['mixed']).toEqual({ prop: 'value' });
    });
  });

  describe('skill-aware merge on plain Record skill objects', () => {
    it('replaces content / description and appends references when the existing skill is a plain Record', () => {
      // Mirrors what the parser actually emits for `@skills { code-review: {...} }`:
      // a `code-review` value that is a plain `Record<string, Value>`, not an
      // ObjectContent AST node. Before this fix, mergeValue's
      // `isObjectContent(existing)` gate kept the skill-aware path from firing
      // and `content` was concatenated by the generic deepMerge fallback.
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              'code-review': {
                description: 'Generic code review',
                references: ['./standards/clean-code.md'],
                content: createTextContent('Generic review steps.'),
              } as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.code-review',
            createObjectContent({
              description: 'Banking-grade code review',
              references: ['./policies/pci-dss.md'],
              content: createTextContent('Banking-specific review steps.'),
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      if (skillsBlock?.content.type !== 'ObjectContent') {
        throw new Error('expected ObjectContent for skills block');
      }
      const codeReview = skillsBlock.content.properties['code-review'] as Record<string, Value>;

      // Replace strategy
      expect(codeReview['description']).toBe('Banking-grade code review');

      // Replace strategy on TextContent — banking wins, generic gone.
      const content = codeReview['content'] as unknown;
      const contentValue =
        typeof content === 'string' ? content : ((content as { value?: string })?.value ?? '');
      expect(contentValue).toBe('Banking-specific review steps.');
      expect(contentValue).not.toContain('Generic review steps');

      // Append strategy — both base and overlay refs present.
      const refs = codeReview['references'] as unknown[];
      expect(refs).toContain('./standards/clean-code.md');
      expect(refs).toContain('./policies/pci-dss.md');
    });
  });

  describe('SKILL_PRESERVE_PROPERTIES — composedFrom is never overwritten by @extend', () => {
    it('preserves __composedFrom when @extend targets a skill property inside @skills', () => {
      const composedFromValue = [{ name: 'phase-a', source: '/a.prs', composedBlocks: [] }];

      // The @skills block has an ObjectContent node containing an 'ops' skill object.
      // The 'ops' skill object itself is a plain Record that includes __composedFrom.
      // We use createObjectContent to represent the @skills block, and nest 'ops' as
      // an ObjectContent-shaped object (type + properties + loc) so isObjectContent()
      // recognises it and the skill-aware merge path fires.
      const opsSkillNode = {
        type: 'ObjectContent' as const,
        properties: {
          description: 'original description',
          __composedFrom: composedFromValue as unknown as Value,
        },
        loc: createLoc(),
      };

      const ast = createProgram({
        blocks: [
          createBlock('skills', createObjectContent({ ops: opsSkillNode as unknown as Value })),
        ],
        extends: [
          // Target 'skills.ops' — this sets skillContext=true and path=['ops'],
          // so mergeAtPath calls mergeValue with skillContext=true on the ObjectContent
          // 'ops' node, which routes through mergeSkillValue where SKILL_PRESERVE_PROPERTIES
          // prevents __composedFrom from being overwritten.
          createExtendBlock(
            'skills.ops',
            createObjectContent({
              description: 'extended description',
              __composedFrom: [
                { name: 'phase-b', source: '/b.prs', composedBlocks: [] },
              ] as unknown as Value,
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;

      // description should be replaced (SKILL_REPLACE_PROPERTIES)
      expect(ops['description']).toBe('extended description');

      // __composedFrom must survive — SKILL_PRESERVE_PROPERTIES blocks the overwrite
      expect(ops['__composedFrom']).toEqual(composedFromValue);
    });
  });

  describe('navigating into non-object values', () => {
    it('should build path when trying to navigate into primitive', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ value: 'primitive' }))],
        extends: [createExtendBlock('config.value.nested', createObjectContent({ key: 'val' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      // Should replace primitive with nested object
      expect(content.properties['value']).toEqual({ nested: { key: 'val' } });
    });

    it('should build path when trying to navigate into array', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ arr: [1, 2, 3] }))],
        extends: [createExtendBlock('config.arr.nested', createObjectContent({ key: 'val' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      // Should replace array with nested object
      expect(content.properties['arr']).toEqual({ nested: { key: 'val' } });
    });

    it('should build path when navigating through a primitive at depth 3+ (mergeAtPathValue line 338)', () => {
      // config.a is an object, but config.a.b is a primitive string.
      // Extending config.a.b.c enters mergeAtPathValue(value=a, path=['b','c']),
      // then recurses with mergeAtPathValue(value='primitive', path=['c']) which
      // hits the non-navigable branch (line 338) and builds the remaining path.
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              a: { b: 'primitive-string' } as unknown as Value,
            })
          ),
        ],
        extends: [createExtendBlock('config.a.b.c', createObjectContent({ key: 'val' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const a = content.properties['a'] as Record<string, Value>;

      // b was a primitive; navigating into it should build the new path
      expect(a['b']).toEqual({ c: { key: 'val' } });
    });

    it('should build path when navigating through an array at depth 3+ (mergeAtPathValue line 338)', () => {
      // Same as above but b is an array value.
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              a: { b: [1, 2, 3] } as unknown as Value,
            })
          ),
        ],
        extends: [createExtendBlock('config.a.b.c', createTextContent('new'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const a = content.properties['a'] as Record<string, Value>;

      // b was an array; navigating into it should build the new path
      expect(a['b']).toEqual({ c: 'new' });
    });
  });

  describe('empty path segment handling (consecutive dots in targetPath)', () => {
    it('should merge at block level when targetPath has consecutive dots producing empty segment (mergeAtPath line 234)', () => {
      // targetPath 'config..deep' splits to ['config', '', 'deep'].
      // deepPath becomes ['', 'deep']. In mergeAtPath, currentKey = '' which
      // is falsy, so it falls back to mergeContent at the block level (line 234).
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ existing: 'value' }))],
        extends: [createExtendBlock('config..deep', createObjectContent({ extra: 'added' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      // The empty path segment causes mergeContent to be called on the block,
      // so the ObjectContent properties are merged at block level.
      expect(content.properties['existing']).toBe('value');
      expect(content.properties['extra']).toBe('added');
    });

    it('should merge via mergeAtPathValue when an intermediate path segment is empty (mergeAtPathValue line 339)', () => {
      // targetPath 'config.key..deep' splits to ['config', 'key', '', 'deep'].
      // deepPath = ['key', '', 'deep']. mergeAtPath navigates into 'key' (an object),
      // calls mergeAtPathValue(keyValue, ['', 'deep'], ...).
      // In mergeAtPathValue, currentKey = '' is falsy → falls back to mergeValue (line 339).
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              key: { nested: 'original' } as unknown as Value,
            })
          ),
        ],
        extends: [createExtendBlock('config.key..deep', createObjectContent({ added: 'new' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const key = content.properties['key'] as Record<string, Value>;

      // mergeValue is called on the key object, merging ObjectContent into it
      expect(key['nested']).toBe('original');
      expect(key['added']).toBe('new');
    });
  });
});

describe('overlay consistency warnings', () => {
  const createMockLogger = () => {
    const logger = {
      verbose: vi.fn<(message: string) => void>(),
      debug: vi.fn<(message: string) => void>(),
      warn: vi.fn<(message: string) => void>(),
    };
    return logger satisfies Logger;
  };

  describe('stale skill target', () => {
    it('should warn when @extend creates new skill in ObjectContent @skills block', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              'existing-skill': { description: 'exists' } as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.nonexistent-skill',
            createObjectContent({
              description: 'overlay for removed skill',
            })
          ),
        ],
      });

      applyExtends(ast, logger);

      expect(logger.warn).toHaveBeenCalledOnce();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('"nonexistent-skill"'));
    });

    it('should warn when a root @skills overlay creates a new skill', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              'existing-skill': { description: 'exists' } as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills',
            createObjectContent({
              'nonexistent-skill': {
                description: 'overlay for removed skill',
              } as unknown as Value,
            })
          ),
        ],
      });

      applyExtends(ast, logger);

      expect(logger.warn).toHaveBeenCalledOnce();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('"nonexistent-skill"'));
    });

    it('should warn when @extend creates new skill in MixedContent @skills block', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createMixedContent(createTextContent('skill instructions'), {
              'existing-skill': { description: 'exists' } as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.nonexistent-skill',
            createObjectContent({
              description: 'overlay for removed skill',
            })
          ),
        ],
      });

      applyExtends(ast, logger);

      expect(logger.warn).toHaveBeenCalledOnce();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('"nonexistent-skill"'));
    });

    it('should not warn when extending existing skill', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              'code-review': {
                type: 'ObjectContent',
                properties: { description: 'base review' },
                loc: { file: '<test>', line: 1, column: 1 },
              } as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.code-review',
            createObjectContent({
              description: 'extended review',
            })
          ),
        ],
      });

      applyExtends(ast, logger);

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should not warn when creating key outside @skills context', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              existing: 'value' as unknown as Value,
            })
          ),
        ],
        extends: [createExtendBlock('standards.new-key', createTextContent('new content'))],
      });

      applyExtends(ast, logger);

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should detect stale skill target through aliased import', () => {
      const logger = createMockLogger();
      // Mirror what resolveUses produces for `@use ./base as base`: the
      // source's `skills` block is merged into the un-aliased namespace
      // AND a `__import__base.skills` aliased copy is stored. After this
      // fix, applyExtend resolves `base.skills.removed-skill` against the
      // surviving un-aliased `skills` block.
      const skillsContent = createObjectContent({
        'existing-skill': { description: 'exists' } as unknown as Value,
      });
      const ast = createProgram({
        blocks: [
          createBlock('skills', skillsContent),
          createBlock(`${IMPORT_MARKER_PREFIX}base`, createObjectContent({})),
          createBlock(`${IMPORT_MARKER_PREFIX}base.skills`, skillsContent),
        ],
        extends: [
          createExtendBlock(
            'base.skills.removed-skill',
            createObjectContent({
              description: 'overlay for removed skill',
            })
          ),
        ],
      });

      applyExtends(ast, logger);

      expect(logger.warn).toHaveBeenCalledOnce();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('"removed-skill"'));
    });
  });

  describe('orphaned extend', () => {
    it('should warn when @extend target block does not exist', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [createExtendBlock('nonexistent', createTextContent('extended'))],
      });

      const result = applyExtends(ast, logger);

      expect(result.blocks).toHaveLength(1);
      expect(logger.warn).toHaveBeenCalledOnce();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('"nonexistent" not found'));
    });

    it('should not warn when @extend target exists', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [createExtendBlock('identity', createTextContent('extended'))],
      });

      applyExtends(ast, logger);

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should not crash when logger is not provided', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [createExtendBlock('nonexistent', createTextContent('extended'))],
      });

      const result = applyExtends(ast);
      expect(result.blocks).toHaveLength(1);
    });
  });

  describe('negation orphan', () => {
    it('should warn via logger when negation does not match any base entry', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              'code-review': {
                type: 'ObjectContent',
                properties: {
                  description: 'base review',
                  references: {
                    type: 'ArrayContent',
                    elements: ['references/existing.md'],
                    loc: { file: '<test>', line: 1, column: 1 },
                  },
                },
                loc: { file: '<test>', line: 1, column: 1 },
              } as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.code-review',
            createObjectContent({
              references: {
                type: 'ArrayContent',
                elements: ['!references/nonexistent.md', 'references/new.md'],
                loc: { file: '<test>', line: 1, column: 1 },
              } as unknown as Value,
            })
          ),
        ],
      });

      applyExtends(ast, logger);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('references/nonexistent.md')
      );
    });

    it('should not warn when negation matches a base entry', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              'code-review': {
                type: 'ObjectContent',
                properties: {
                  description: 'base review',
                  references: {
                    type: 'ArrayContent',
                    elements: ['references/old.md'],
                    loc: { file: '<test>', line: 1, column: 1 },
                  },
                },
                loc: { file: '<test>', line: 1, column: 1 },
              } as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.code-review',
            createObjectContent({
              references: {
                type: 'ArrayContent',
                elements: ['!references/old.md', 'references/new.md'],
                loc: { file: '<test>', line: 1, column: 1 },
              } as unknown as Value,
            })
          ),
        ],
      });

      applyExtends(ast, logger);

      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});

describe('overlay warnings integration', () => {
  it('should propagate orphaned extend warning through Resolver', async () => {
    const warnMessages: string[] = [];
    const logger: Logger = {
      verbose: () => {},
      debug: () => {},
      warn: (msg: string) => warnMessages.push(msg),
    };

    const os = await import('node:os');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const testDir = path.join(os.tmpdir(), `prs-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    const prsContent = `@meta {
  id: "test/overlay-warn"
  syntax: "1.0"
}

@identity {
  """
  Test identity.
  """
}

@extend nonexistent {
  """
  This targets a block that doesn't exist.
  """
}
`;

    const testFile = path.join(testDir, 'test.prs');
    await fs.writeFile(testFile, prsContent);

    const resolver = new Resolver({
      registryPath: testDir,
      localPath: testDir,
      logger,
      cache: false,
    });

    try {
      await resolver.resolve(testFile);
    } catch {
      // May throw if file parsing has issues, but we're checking warnings
    }

    expect(warnMessages.some((m) => m.includes('"nonexistent" not found'))).toBe(true);

    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should apply @extend alias.skills.<name> to the surviving merged block', async () => {
    const os = await import('node:os');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const testDir = path.join(os.tmpdir(), `prs-overlay-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    const baseSkill = `@meta {
  id: "base-skill"
  syntax: "1.2.0"
}

@skills {
  code-review: {
    description: "Generic code review"
    references: ["./standards/clean-code.md"]
    content: """
      Generic review steps.
    """
  }
}
`;

    const project = `@meta {
  id: "banking-review"
  syntax: "1.2.0"
}

@use ./base-skill as base

@extend base.skills.code-review {
  description: "Banking-grade code review"
  references: ["./policies/pci-dss.md"]
  content: """
    Banking-specific review steps.
  """
}
`;

    await fs.writeFile(path.join(testDir, 'base-skill.prs'), baseSkill);
    const projectFile = path.join(testDir, 'project.prs');
    await fs.writeFile(projectFile, project);

    const resolver = new Resolver({
      registryPath: testDir,
      localPath: testDir,
      cache: false,
    });

    const result = await resolver.resolve(projectFile);

    try {
      expect(result.errors).toEqual([]);
      // Aliased import marker copies must be stripped from the final AST.
      expect(result.ast?.blocks.some((b) => b.name.startsWith(IMPORT_MARKER_PREFIX))).toBe(false);

      const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();
      if (skillsBlock?.content.type !== 'ObjectContent') {
        throw new Error('expected ObjectContent for skills block');
      }

      const codeReview = skillsBlock.content.properties['code-review'] as Record<string, Value>;
      expect(codeReview).toBeDefined();

      // The override must reach the surviving block. Before the alias fix,
      // @extend silently mutated `__import__base.skills` (which is stripped
      // at the end of applyExtends), so none of these properties appeared.
      // Before the skill-aware-record fix, `content` (replace-strategy) was
      // concatenated instead of replaced because the parser emits nested
      // skill objects as plain Records, not ObjectContent nodes.
      expect(codeReview['description']).toBe('Banking-grade code review');

      const refs = codeReview['references'] as unknown;
      const refList = Array.isArray(refs)
        ? refs
        : ((refs as { type?: string; elements?: unknown[] })?.elements ?? []);
      const refStrings = (refList as unknown[]).map((r) => String(r));
      expect(refStrings).toContain('./policies/pci-dss.md');
      expect(refStrings).toContain('./standards/clean-code.md');

      const content = codeReview['content'] as unknown;
      const contentValue =
        typeof content === 'string' ? content : ((content as { value?: string })?.value ?? '');
      expect(contentValue).toContain('Banking-specific review steps');
      // Replace-strategy: base content must be gone after the overlay wins.
      expect(contentValue).not.toContain('Generic review steps');
    } finally {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });
});
