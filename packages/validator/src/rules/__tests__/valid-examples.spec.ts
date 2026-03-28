import { describe, it, expect } from 'vitest';
import { validExamples } from '../valid-examples.js';
import type { Program, SourceLocation, Block, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeExamplesBlock(properties: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'examples',
    content: {
      type: 'ObjectContent',
      properties: properties as Record<string, Value>,
      loc,
    },
    loc,
  };
}

function makeSkillsBlock(properties: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: {
      type: 'ObjectContent',
      properties: properties as Record<string, Value>,
      loc,
    },
    loc,
  };
}

function makeAst(blocks: Block[]): Program {
  return {
    type: 'Program',
    loc,
    blocks,
    extends: [],
    uses: [],
  };
}

function validate(ast: Program): { message: string; suggestion?: string }[] {
  const messages: { message: string; suggestion?: string }[] = [];
  validExamples.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS023: valid-examples', () => {
  it('should have correct metadata', () => {
    expect(validExamples.id).toBe('PS023');
    expect(validExamples.name).toBe('valid-examples');
    expect(validExamples.defaultSeverity).toBe('warning');
  });

  it('should pass when example has input and output', () => {
    const ast = makeAst([
      makeExamplesBlock({
        'greeting-example': {
          input: 'Hello',
          output: 'Hi there!',
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should report error when example is missing input', () => {
    const ast = makeAst([
      makeExamplesBlock({
        'bad-example': {
          output: 'Some output',
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('missing required "input" field');
    expect(messages[0]!.message).toContain('bad-example');
  });

  it('should report error when example is missing output', () => {
    const ast = makeAst([
      makeExamplesBlock({
        'bad-example': {
          input: 'Some input',
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('missing required "output" field');
    expect(messages[0]!.message).toContain('bad-example');
  });

  it('should report errors when example is missing both input and output', () => {
    const ast = makeAst([
      makeExamplesBlock({
        'empty-example': {
          description: 'just a description',
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(2);
    expect(messages[0]!.message).toContain('input');
    expect(messages[1]!.message).toContain('output');
  });

  it('should validate examples nested inside @skills', () => {
    const ast = makeAst([
      makeSkillsBlock({
        'review-code': {
          description: 'Review code',
          examples: {
            'good-review': {
              input: 'Review this code',
              output: 'LGTM',
            },
            'bad-review': {
              output: 'Needs work',
            },
          },
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('review-code');
    expect(messages[0]!.message).toContain('bad-review');
    expect(messages[0]!.message).toContain('input');
  });

  it('should pass when no examples blocks exist', () => {
    const ast = makeAst([]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should skip skill examples that are not objects (string)', () => {
    const ast = makeAst([
      makeSkillsBlock({
        'my-skill': {
          description: 'A skill',
          examples: 'not an object',
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should skip skill examples that are arrays', () => {
    const ast = makeAst([
      makeSkillsBlock({
        'my-skill': {
          description: 'A skill',
          examples: ['item1', 'item2'],
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should skip skill examples that are AST nodes', () => {
    const ast = makeAst([
      makeSkillsBlock({
        'my-skill': {
          description: 'A skill',
          examples: { type: 'TextContent', value: 'some text', loc },
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should skip skill entries that are not objects', () => {
    const ast = makeAst([
      makeSkillsBlock({
        'my-skill': 'just a string',
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });
});
