import { describe, expect, it } from 'vitest';
import {
  BLOCK_SHAPE_CONTRACTS,
  createBlockBody,
  type Block,
  type BlockContent,
  type BlockShape,
  type ObjectContent,
  type Program,
  type SourceLocation,
} from '@promptscript/core';
import { validBlockShape } from '../../rules/valid-block-shape.js';

const LOC: SourceLocation = { file: 'shapes.prs', line: 3, column: 1, offset: 20 };

function contentFor(shape: BlockShape): BlockContent {
  switch (shape) {
    case 'text':
      return { type: 'TextContent', value: 'Text', loc: LOC };
    case 'object':
      return { type: 'ObjectContent', properties: { value: 'Example' }, loc: LOC };
    case 'array':
      return { type: 'ArrayContent', elements: ['Example'], loc: LOC };
    case 'mixed':
      return {
        type: 'MixedContent',
        text: { type: 'TextContent', value: 'Text', loc: LOC },
        properties: { value: 'Example' },
        loc: LOC,
      };
  }
}

function block(name: string, content: BlockContent): Block {
  return { type: 'Block', name, content, loc: LOC };
}

function program(blocks: Block[]): Program {
  return {
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'shapes', syntax: '1.5.0' },
      loc: LOC,
    },
    uses: [],
    blocks,
    extends: [],
    loc: LOC,
  };
}

function run(blocks: Block[]): Array<{
  message: string;
  suggestion?: string;
  severity?: string;
}> {
  const messages: Array<{ message: string; suggestion?: string; severity?: string }> = [];
  validBlockShape.validate({
    ast: program(blocks),
    config: {},
    report: (message) => messages.push(message),
  });
  return messages;
}

describe('PS038: valid-block-shape', () => {
  it('has stable rule metadata', () => {
    expect(validBlockShape).toMatchObject({
      id: 'PS038',
      name: 'valid-block-shape',
      defaultSeverity: 'warning',
    });
  });

  it('accepts the canonical shape for every built-in block', () => {
    const blocks = Object.entries(BLOCK_SHAPE_CONTRACTS).map(([name, contract]) =>
      block(name, contentFor(contract.canonicalShape))
    );

    expect(run(blocks)).toEqual([]);
  });

  it('accepts documented context variants without warnings', () => {
    expect(
      run([block('context', contentFor('text')), block('context', contentFor('object'))])
    ).toEqual([]);
  });

  it('warns for supported legacy shapes with a canonical replacement', () => {
    const messages = run([
      block('identity', contentFor('object')),
      block('standards', contentFor('text')),
      block('restrictions', contentFor('object')),
    ]);

    expect(messages).toHaveLength(3);
    expect(messages[0]).toMatchObject({
      message: '@identity uses supported legacy object content; canonical shape is text.',
      suggestion: expect.stringContaining('@identity'),
    });
    expect(messages[1]?.message).toContain('legacy text content');
    expect(messages[2]?.message).toContain('legacy object content');
  });

  it('rejects unsupported shapes with expected shapes and a minimal example', () => {
    const messages = run([
      block('hooks', contentFor('text')),
      block('identity', contentFor('array')),
    ]);

    expect(messages).toEqual([
      expect.objectContaining({
        message: '@hooks uses unsupported text content; expected object.',
        suggestion: expect.stringContaining('@hooks'),
        severity: 'error',
      }),
      expect.objectContaining({
        message: '@identity uses unsupported array content; expected text or object or mixed.',
        suggestion: expect.stringContaining('@identity'),
        severity: 'error',
      }),
    ]);
  });

  it('leaves custom blocks open-world', () => {
    expect(run([block('custom-block', contentFor('array'))])).toEqual([]);
  });

  it('uses canonical dash-list shape instead of its object projection', () => {
    const restrictions = block('restrictions', {
      type: 'ObjectContent',
      properties: { items: ['Keep secrets safe'] },
      loc: LOC,
    });
    restrictions.canonicalBody = createBlockBody(
      [
        {
          type: 'ListEntry',
          value: { type: 'ScalarValueNode', value: 'Keep secrets safe', loc: LOC },
          loc: LOC,
        },
      ],
      LOC
    );

    expect(run([restrictions])).toEqual([]);
  });

  it('warns when multiline shortcut scalars make output target-dependent', () => {
    const messages = run([
      block('shortcuts', {
        type: 'ObjectContent',
        properties: {
          '/review': 'Review code',
          '/test': {
            type: 'TextContent',
            value: 'Run tests\nReport failures',
            loc: LOC,
          },
        },
        loc: LOC,
      }),
    ]);

    expect(messages).toEqual([
      expect.objectContaining({
        message:
          '@shortcuts entry "/test" uses a multiline scalar, which changes native output by target.',
        suggestion: 'Use an explicit content object: "/test": { content: """...""" }.',
      }),
    ]);
  });

  it('accepts canonical shortcut content and the commands alias', () => {
    const content: BlockContent = {
      type: 'ObjectContent',
      properties: {
        '/test': {
          description: 'Run tests',
          content: { type: 'TextContent', value: 'Run tests', loc: LOC },
        },
      },
      loc: LOC,
    };

    expect(run([block('shortcuts', content), block('commands', content)])).toEqual([]);
  });

  it('rejects unsupported shortcut values and content fields', () => {
    const messages = run([
      block('shortcuts', {
        type: 'ObjectContent',
        properties: {
          '/array': ['Run', 'tests'],
          '/content-array': { content: ['Run', 'tests'] },
          '/description-object': {
            description: { label: 'Run tests' },
            content: 'Run tests',
          },
          '../../escape': 'Run tests',
          '/CON': 'Run tests',
          '/bad:name': 'Run tests',
          '/trailing.': 'Run tests',
        },
        loc: LOC,
      }),
    ]);

    expect(messages).toEqual([
      expect.objectContaining({
        message: '@shortcuts entry "/array" has unsupported array content.',
        severity: 'error',
      }),
      expect.objectContaining({
        message: '@shortcuts entry "/content-array" has unsupported array content field.',
        severity: 'error',
      }),
      expect.objectContaining({
        message: '@shortcuts entry "/description-object" has unsupported object description field.',
        severity: 'error',
      }),
      expect.objectContaining({
        message: '@shortcuts entry "../../escape" cannot be used as a safe command file name.',
        severity: 'error',
      }),
      expect.objectContaining({
        message: '@shortcuts entry "/CON" cannot be used as a safe command file name.',
        severity: 'error',
      }),
      expect.objectContaining({
        message: '@shortcuts entry "/bad:name" cannot be used as a safe command file name.',
        severity: 'error',
      }),
      expect.objectContaining({
        message: '@shortcuts entry "/trailing." cannot be used as a safe command file name.',
        severity: 'error',
      }),
    ]);
  });

  it('rejects typed AST nodes as shortcut definitions', () => {
    const messages = run([
      block('shortcuts', {
        type: 'ObjectContent',
        properties: {
          '/typed': {
            type: 'TypeExpression',
            kind: 'string',
            loc: LOC,
          },
          '/template': {
            type: 'TemplateExpression',
            name: 'command',
            loc: LOC,
          },
        },
        loc: LOC,
      }),
    ]);

    expect(messages).toEqual([
      expect.objectContaining({
        message: '@shortcuts entry "/typed" has unsupported type expression content.',
        severity: 'error',
      }),
      expect.objectContaining({
        message: '@shortcuts entry "/template" has unsupported template expression content.',
        severity: 'error',
      }),
    ]);
  });

  it('rejects command names that normalize to the same output path', () => {
    const messages = run([
      block('shortcuts', {
        type: 'ObjectContent',
        properties: { '/test': 'Run tests' },
        loc: LOC,
      }),
      block('commands', {
        type: 'ObjectContent',
        properties: {
          test: 'Run tests again',
          '//test': 'Run tests once more',
        },
        loc: LOC,
      }),
    ]);

    expect(messages).toEqual([
      expect.objectContaining({
        message:
          '@commands entry "test" resolves to the same command file name as @shortcuts entry "/test".',
        severity: 'error',
      }),
      expect.objectContaining({
        message:
          '@commands entry "//test" resolves to the same command file name as @shortcuts entry "/test".',
        severity: 'error',
      }),
    ]);
  });

  it('rejects duplicate names across repeated shortcut blocks', () => {
    const content: ObjectContent = {
      type: 'ObjectContent',
      properties: { '/test': 'Run tests' },
      loc: LOC,
    };

    expect(run([block('shortcuts', content), block('shortcuts', content)])).toEqual([
      expect.objectContaining({
        message:
          '@shortcuts entry "/test" resolves to the same command file name as @shortcuts entry "/test".',
        severity: 'error',
      }),
    ]);
  });

  it('rejects names that collide after target normalization', () => {
    const messages = run([
      block('shortcuts', {
        type: 'ObjectContent',
        properties: {
          '/Foo Bar': 'Run first workflow',
          '/foo-bar': 'Run second workflow',
        },
        loc: LOC,
      }),
    ]);

    expect(messages).toEqual([
      expect.objectContaining({
        message:
          '@shortcuts entry "/foo-bar" resolves to the same target-normalized file name as @shortcuts entry "/Foo Bar".',
        severity: 'error',
      }),
    ]);
  });

  it('does not confuse domain header fields with presentation metadata', () => {
    expect(
      run([
        block('context', {
          type: 'ObjectContent',
          properties: { header: 'Domain heading', headers: ['one', 'two'] },
          loc: LOC,
        }),
        block('mcpServers', {
          type: 'ObjectContent',
          properties: {
            remote: {
              transport: 'http',
              url: 'https://example.com/mcp',
              headers: { Authorization: 'runtime-secret' },
            },
          },
          loc: LOC,
        }),
      ])
    ).toEqual([]);
  });
});
