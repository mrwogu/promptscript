import { describe, expect, it } from 'vitest';
import { normalizeProgram } from '../canonical-ast.js';
import {
  effectiveGovernance,
  extractPromptDefinitions,
  readMetaGovernance,
  validateGovernanceFields,
  type PromptExtraction,
} from '../prompt-definitions.js';
import type { Block, Program, SourceLocation, Value } from '../types/index.js';

const loc: SourceLocation = { file: 'prompts.prs', line: 3, column: 1, offset: 20 };

function text(value: string): Value {
  return { type: 'TextContent', value, loc };
}

function program(properties: Record<string, Value>, extraBlocks: string[] = []): Program {
  const blocks: Block[] = [
    { type: 'Block', name: 'prompts', content: { type: 'ObjectContent', properties, loc }, loc },
    ...extraBlocks.map((name): Block => ({
      type: 'Block',
      name,
      content: { type: 'TextContent', value: 'x', loc },
      loc,
    })),
  ];
  return { type: 'Program', loc, uses: [], blocks, extends: [] };
}

/** Run the extractor on the legacy AST and on its canonical twin. */
function extractBoth(
  properties: Record<string, Value>,
  extraBlocks: string[] = []
): PromptExtraction {
  const legacy = program(properties, extraBlocks);
  const result = extractPromptDefinitions(legacy);
  const canonical = extractPromptDefinitions(normalizeProgram(legacy));
  expect(canonical.prompts.map((p) => ({ ...p, loc: undefined }))).toEqual(
    result.prompts.map((p) => ({ ...p, loc: undefined }))
  );
  expect(canonical.issues.map((i) => i.message)).toEqual(result.issues.map((i) => i.message));
  for (const issue of result.issues) {
    expect(issue.suggestion.length).toBeGreaterThan(0);
  }
  return result;
}

const valid: Record<string, Value> = {
  description: 'Answer a refund request',
  risk: 'high',
  dataClasses: ['pii'],
  compose: ['identity', 'restrictions'],
  model: { ref: 'claude-sonnet-5-5', temperature: 0.2, maxTokens: 800, stop: ['END'], seed: 7 },
  inputs: { message: { type: 'string', description: 'Customer message' } },
  output: {
    decision: { type: 'enum', options: ['approve', 'escalate'] },
    citations: { type: 'list', items: { type: 'string' }, description: 'Sources' },
  },
  system: 'You answer refund requests.',
  user: text('Customer wrote: {{input.message}}'),
};

function issuesFor(entry: Record<string, Value>, blocks = ['identity', 'restrictions']): string[] {
  return extractBoth({ review: { ...valid, ...entry } }, blocks).issues.map((i) => i.message);
}

describe('extractPromptDefinitions', () => {
  it('reads a complete entry from both AST shapes', () => {
    const { prompts, issues } = extractBoth({ 'refund-reply': valid }, [
      'identity',
      'restrictions',
    ]);

    expect(issues).toEqual([]);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatchObject({
      name: 'refund-reply',
      description: 'Answer a refund request',
      system: 'You answer refund requests.',
      user: 'Customer wrote: {{input.message}}',
      compose: ['identity', 'restrictions'],
      inputs: { message: { type: 'string', description: 'Customer message' } },
      output: {
        fields: {
          decision: { type: 'enum', options: ['approve', 'escalate'], description: '' },
          citations: { type: 'list', items: { type: 'string' }, description: 'Sources' },
        },
      },
      model: {
        ref: 'claude-sonnet-5-5',
        params: { temperature: 0.2, maxTokens: 800, stop: ['END'], seed: 7 },
      },
      governance: { risk: 'high', dataClasses: ['pii'] },
    });
  });

  it('returns nothing without a @prompts block or with a non-object body', () => {
    const none: Program = { type: 'Program', loc, uses: [], blocks: [], extends: [] };
    const textBody = program({});
    textBody.blocks[0]!.content = { type: 'TextContent', value: 'free text', loc };

    expect(extractPromptDefinitions(none)).toEqual({ prompts: [], issues: [] });
    expect(extractPromptDefinitions(textBody)).toEqual({ prompts: [], issues: [] });
  });

  it('ignores free text next to the entries of a canonical body', () => {
    const ast = program({});
    ast.blocks[0]!.content = {
      type: 'MixedContent',
      text: { type: 'TextContent', value: 'notes', loc },
      properties: { one: { description: 'One', user: 'Hi' } },
      loc,
    };

    const { prompts, issues } = extractPromptDefinitions(normalizeProgram(ast));

    expect(issues).toEqual([]);
    expect(prompts.map((p) => p.name)).toEqual(['one']);
  });

  it('reports an enum default when the options are missing', () => {
    const messages = issuesFor({
      inputs: { pick: { type: 'enum', description: 'D', default: 'a' } },
    });

    expect(messages.join('\n')).toContain('enum without options');
    expect(messages.join('\n')).toContain('type "enum" and options');
  });

  it('reads mixed bodies and merges several @prompts blocks', () => {
    const ast = program({ one: { description: 'One', user: 'Hi' } });
    ast.blocks.push({
      type: 'Block',
      name: 'prompts',
      content: {
        type: 'MixedContent',
        properties: { two: { description: 'Two', user: 'Hi' } },
        loc,
      },
      loc,
    });

    expect(extractPromptDefinitions(ast).prompts.map((p) => p.name)).toEqual(['one', 'two']);
  });

  it('carries the entry location on canonical input and the block location on legacy input', () => {
    const legacy = program({ review: { description: 'R', user: 'Hi', bogus: 1 } });
    const canonical = normalizeProgram(legacy);

    expect(extractPromptDefinitions(legacy).issues[0]?.loc).toEqual(loc);
    expect(extractPromptDefinitions(canonical).issues[0]?.loc).toMatchObject({
      file: 'prompts.prs',
    });
  });

  describe('keys', () => {
    it.each([
      ['has a space', 'bad key', 'must start with a letter or digit'],
      ['starts with a dash', '-lead', 'must start with a letter or digit'],
      ['is 65 characters long', 'a'.repeat(65), 'must start with a letter or digit'],
      ['is index', 'Index', 'reserved as a file name'],
      ['is readme', 'README', 'reserved as a file name'],
      ['is a device name', 'Com3', 'reserved as a file name'],
      ['is a device name in lower case', 'nul', 'reserved as a file name'],
      ['is a prototype name', 'constructor', 'is reserved'],
      ['is toString', 'toString', 'is reserved'],
    ])('rejects a key that %s', (_title, key, fragment) => {
      const { prompts, issues } = extractBoth({ [key]: { description: 'D', user: 'U' } });

      expect(prompts).toEqual([]);
      expect(issues).toHaveLength(1);
      expect(issues[0]!.message).toContain(fragment);
      expect(issues[0]!.prompt).toBe(key);
    });

    it('accepts the longest key and leading digits', () => {
      const long = `a${'b'.repeat(63)}`;
      const { prompts, issues } = extractBoth({
        [long]: { description: 'D', user: 'U' },
        '1st': { description: 'D', user: 'U' },
      });

      expect(issues).toEqual([]);
      expect(prompts.map((p) => p.name)).toEqual([long, '1st']);
    });

    it('rejects a key that collides case-insensitively and keeps the first', () => {
      const { prompts, issues } = extractBoth({
        Review: { description: 'D', user: 'U' },
        review: { description: 'D', user: 'U' },
      });

      expect(prompts.map((p) => p.name)).toEqual(['Review']);
      expect(issues[0]!.message).toContain('collides with "Review"');
    });
  });

  describe('entry', () => {
    it.each<[string, Record<string, Value>, string]>([
      ['a missing description', { description: undefined as never }, 'description is required'],
      ['a blank description', { description: '  ' }, 'description is required'],
      [
        'no messages',
        { system: undefined as never, user: undefined as never },
        'needs a system or a user',
      ],
      ['blank messages', { system: ' ', user: '' }, 'needs a system or a user'],
      ['a numeric system message', { system: 3 }, 'system must be a string'],
      ['a list user message', { user: ['a'] }, 'user must be a string'],
      ['an unknown key', { sistem: 'x' }, 'unknown key "sistem"'],
    ])('reports %s', (_title, entry, fragment) => {
      const cleaned = Object.fromEntries(
        Object.entries(entry).filter(([, value]) => value !== undefined)
      );
      const base = { ...valid };
      for (const [key, value] of Object.entries(entry)) {
        if (value === undefined) delete base[key];
      }

      const messages = extractBoth({ review: { ...base, ...cleaned } }, [
        'identity',
        'restrictions',
      ]).issues.map((i) => i.message);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain(fragment);
      expect(messages[0]).toContain('Prompt "review"');
    });

    it('suggests the closest entry key', () => {
      const { issues } = extractBoth({ review: { ...valid, sistem: 'x' } }, [
        'identity',
        'restrictions',
      ]);

      expect(issues[0]!.suggestion).toBe('Did you mean "system"?');
    });

    it('lists the valid keys when nothing is close', () => {
      const { issues } = extractBoth({ review: { ...valid, zzzzzzzzzz: 1 } }, [
        'identity',
        'restrictions',
      ]);

      expect(issues[0]!.suggestion).toContain('Use one of: description');
    });

    it.each([
      ['a string', 'text'],
      ['a number', 4],
      ['a list', ['a']],
    ])('rejects an entry that is %s', (_title, value) => {
      const { prompts, issues } = extractBoth({ review: value as Value });

      expect(prompts).toEqual([]);
      expect(issues[0]!.message).toContain('the entry must be an object');
    });

    it('accepts a system-only entry', () => {
      const { prompts, issues } = extractBoth({ review: { description: 'D', system: 'S' } });

      expect(issues).toEqual([]);
      expect(prompts[0]).toMatchObject({ system: 'S', compose: [], inputs: {} });
      expect(prompts[0]?.user).toBeUndefined();
    });
  });

  describe('compose', () => {
    it.each<[string, Value, string[], string]>([
      [
        'a name outside the six blocks',
        ['guards'],
        ['identity'],
        '"guards", which cannot be composed',
      ],
      [
        'a block the program lacks',
        ['identity', 'knowledge'],
        ['identity'],
        '@knowledge, which the resolved program does not have',
      ],
      ['a non-list', 'identity', ['identity'], 'compose must be a list'],
      ['a list with a number', [1], ['identity'], 'compose must be a list'],
    ])('reports %s', (_title, compose, blocks, fragment) => {
      const messages = issuesFor({ compose }, blocks);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain(fragment);
    });

    it('drops repeated names', () => {
      const { prompts } = extractBoth({ review: { ...valid, compose: ['identity', 'identity'] } }, [
        'identity',
      ]);

      expect(prompts[0]!.compose).toEqual(['identity']);
    });
  });

  describe('model', () => {
    it.each<[string, Value, string]>([
      ['a string', 'claude-sonnet-5-5', 'model must be an object'],
      ['a missing ref', { temperature: 1 }, 'model.ref is required'],
      ['a blank ref', { ref: ' ' }, 'model.ref is required'],
      ['an unknown key', { ref: 'x', tempature: 1 }, 'unknown key "tempature"'],
      [
        'a string temperature',
        { ref: 'x', temperature: 'hot' },
        'model.temperature must be a number',
      ],
      ['a string topP', { ref: 'x', topP: '1' }, 'model.topP must be a number'],
      ['a fractional topK', { ref: 'x', topK: 1.5 }, 'model.topK must be an integer'],
      ['a zero topK', { ref: 'x', topK: 0 }, 'model.topK must be an integer'],
      [
        'a fractional maxTokens',
        { ref: 'x', maxTokens: 10.5 },
        'model.maxTokens must be an integer',
      ],
      ['a negative seed', { ref: 'x', seed: -1 }, 'model.seed must be an integer'],
      ['a fractional seed', { ref: 'x', seed: 0.5 }, 'model.seed must be an integer'],
      [
        'a seed above 2^53-1',
        { ref: 'x', seed: 9007199254740992 },
        'model.seed must be an integer',
      ],
      [
        'a stop that is a string',
        { ref: 'x', stop: 'END' },
        'model.stop must be a list of strings',
      ],
      [
        'a stop with a number',
        { ref: 'x', stop: ['a', 1] },
        'model.stop must be a list of strings',
      ],
    ])('reports %s', (_title, model, fragment) => {
      const messages = issuesFor({ model });

      expect(messages.join('\n')).toContain(fragment);
    });

    it('keeps the largest valid seed and a zero seed', () => {
      const big = extractBoth(
        {
          review: { ...valid, model: { ref: 'x', seed: 9007199254740991 } },
        },
        ['identity', 'restrictions']
      );
      const zero = extractBoth(
        {
          review: { ...valid, model: { ref: 'x', seed: 0 } },
        },
        ['identity', 'restrictions']
      );

      expect(big.prompts[0]!.model?.params.seed).toBe(9007199254740991);
      expect(zero.prompts[0]!.model?.params.seed).toBe(0);
    });

    it('omits the model when the ref is invalid', () => {
      const { prompts } = extractBoth({ review: { ...valid, model: { temperature: 1 } } }, [
        'identity',
        'restrictions',
      ]);

      expect(prompts[0]!.model).toBeUndefined();
    });
  });

  describe('inputs', () => {
    it.each<[string, Value, string]>([
      ['a non-object map', 'message', 'inputs must be an object'],
      ['a non-object input', { message: 'text' }, 'input "message" must be an object'],
      ['a missing type', { message: { description: 'D' } }, 'input "message" needs a type'],
      ['an unknown type', { message: { type: 'date', description: 'D' } }, 'unknown type "date"'],
      ['the list type', { message: { type: 'list', description: 'D' } }, 'unknown type "list"'],
      ['a missing description', { message: { type: 'string' } }, 'needs a description'],
      [
        'an enum without options',
        { message: { type: 'enum', description: 'D' } },
        'enum without options',
      ],
      [
        'an enum with empty options',
        { message: { type: 'enum', description: 'D', options: [] } },
        'enum without options',
      ],
      [
        'options that are not strings',
        { message: { type: 'enum', description: 'D', options: [1] } },
        'options must be a list of strings',
      ],
      [
        'repeated options',
        { message: { type: 'enum', description: 'D', options: ['a', 'a'] } },
        'options must be unique',
      ],
      [
        'a number default on a string',
        { message: { type: 'string', description: 'D', default: 1 } },
        'default that does not match its type "string"',
      ],
      [
        'a string default on a number',
        { message: { type: 'number', description: 'D', default: 'x' } },
        'type "number"',
      ],
      [
        'a string default on a boolean',
        { message: { type: 'boolean', description: 'D', default: 'true' } },
        'type "boolean"',
      ],
      [
        'an object default',
        { message: { type: 'string', description: 'D', default: { a: 1 } } },
        'does not match its type',
      ],
      [
        'an enum default outside options',
        { message: { type: 'enum', description: 'D', options: ['a'], default: 'b' } },
        'type "enum" and options',
      ],
      [
        'an unsafe name',
        { constructor: { type: 'string', description: 'D' } },
        'input name "constructor" is reserved',
      ],

      [
        'a name no slot can use',
        { 'my-input': { type: 'string', description: 'D' } },
        'cannot be used in a slot',
      ],
    ])('reports %s', (_title, inputs, fragment) => {
      const messages = issuesFor({ inputs });

      expect(messages.join('\n')).toContain(fragment);
    });

    it('keeps valid defaults of every type', () => {
      const { prompts, issues } = extractBoth(
        {
          review: {
            ...valid,
            inputs: {
              a: { type: 'string', description: 'D', default: 'x' },
              b: { type: 'number', description: 'D', default: 0.5 },
              c: { type: 'boolean', description: 'D', default: false },
              d: { type: 'enum', description: 'D', options: ['p', 'q'], default: 'q' },
            },
          },
        },
        ['identity', 'restrictions']
      );

      expect(issues).toEqual([]);
      expect(prompts[0]!.inputs).toMatchObject({
        a: { default: 'x' },
        b: { default: 0.5 },
        c: { default: false },
        d: { default: 'q', options: ['p', 'q'] },
      });
    });

    it('does not put reserved names on the result', () => {
      const inputs = JSON.parse(
        '{"__proto__": {"type": "string", "description": "D"}, "ok": {"type": "string", "description": "D"}}'
      ) as Value;
      const { prompts } = extractBoth({ review: { ...valid, inputs } }, [
        'identity',
        'restrictions',
      ]);

      expect(Object.keys(prompts[0]!.inputs)).toEqual(['ok']);
      expect(Object.getPrototypeOf(prompts[0]!.inputs)).toBe(Object.prototype);
    });
  });

  describe('output', () => {
    it.each<[string, Value, string]>([
      ['a non-object map', 'x', 'output must be an object'],
      ['a non-object field', { answer: 'x' }, 'output "answer" must be an object'],
      ['an unknown type', { answer: { type: 'map' } }, 'unknown type "map"'],
      ['a missing type', { answer: {} }, 'output "answer" needs a type'],
      [
        'an enum without options',
        { answer: { type: 'enum' } },
        'output "answer" is an enum without options',
      ],
      [
        'a list without items',
        { answer: { type: 'list' } },
        'output "answer" is a list without items',
      ],
      [
        'a list with scalar items',
        { answer: { type: 'list', items: 'string' } },
        'list without items',
      ],
      [
        'list items of an unknown type',
        { answer: { type: 'list', items: { type: 'x' } } },
        'items has unknown type "x"',
      ],
      [
        'list items that are an enum without options',
        { answer: { type: 'list', items: { type: 'enum' } } },
        'items are an enum without options',
      ],
      [
        'an unsafe field name',
        { prototype: { type: 'string' } },
        'output field name "prototype" is reserved',
      ],
    ])('reports %s', (_title, output, fragment) => {
      const messages = issuesFor({ output });

      expect(messages.join('\n')).toContain(fragment);
    });

    it('keeps list items with options', () => {
      const { prompts, issues } = extractBoth(
        {
          review: {
            ...valid,
            output: { tags: { type: 'list', items: { type: 'enum', options: ['a', 'b'] } } },
          },
        },
        ['identity', 'restrictions']
      );

      expect(issues).toEqual([]);
      expect(prompts[0]!.output!.fields['tags']).toMatchObject({
        type: 'list',
        items: { type: 'enum', options: ['a', 'b'] },
      });
    });
  });

  describe('governance', () => {
    it.each<[string, Record<string, Value>, string]>([
      ['an unknown risk', { risk: 'severe' }, 'risk must be one of: low, medium, high, critical'],
      ['a numeric risk', { risk: 2 }, 'risk must be one of'],
      ['a numeric owner', { owner: 4 }, 'owner must be a non-empty string'],
      ['a blank domain', { domain: ' ' }, 'domain must be a non-empty string'],
      [
        'dataClasses that is a string',
        { dataClasses: 'pii' },
        'dataClasses must be a list of strings',
      ],
      ['reviewers with a number', { reviewers: ['a', 1] }, 'reviewers must be a list of strings'],
    ])('reports %s', (_title, entry, fragment) => {
      expect(issuesFor(entry).join('\n')).toContain(fragment);
    });

    it('reads every governance field', () => {
      const { prompts } = extractBoth(
        {
          review: {
            ...valid,
            risk: 'low',
            owner: ' team ',
            domain: 'support',
            dataClasses: ['pii'],
            reviewers: ['a', 'b'],
          },
        },
        ['identity', 'restrictions']
      );

      expect(prompts[0]!.governance).toEqual({
        risk: 'low',
        owner: 'team',
        domain: 'support',
        dataClasses: ['pii'],
        reviewers: ['a', 'b'],
      });
    });
  });

  it('treats template expressions as invalid values', () => {
    const template: Value = { type: 'TemplateExpression', name: 'x', loc } as Value;

    expect(issuesFor({ system: template })).toContain(
      'Prompt "review": system must be a string or a text block'
    );
  });
});

describe('validateGovernanceFields', () => {
  it('reads governance next to a meta field named type', () => {
    const fields = { id: 'x', syntax: '1.6.0', type: 'TemplateExpression', risk: 'huge' };

    expect(validateGovernanceFields(fields)).toEqual([expect.stringContaining('risk')]);
  });

  it('accepts valid and absent fields', () => {
    expect(validateGovernanceFields({ id: 'a', risk: 'low', reviewers: ['x'] })).toEqual([]);
  });

  it('prefixes each problem with @meta', () => {
    expect(validateGovernanceFields({ risk: 'huge', owner: 3 })).toEqual([
      '@meta risk must be one of: low, medium, high, critical',
      '@meta owner must be a non-empty string',
    ]);
  });
});

describe('readMetaGovernance', () => {
  it('reads every governance field and ignores the rest', () => {
    const fields = {
      id: 'a',
      type: 'x',
      risk: 'high',
      owner: 'team',
      domain: 'support',
      dataClasses: ['pii'],
      reviewers: ['ann'],
    };

    expect(readMetaGovernance(fields)).toEqual({
      risk: 'high',
      owner: 'team',
      domain: 'support',
      dataClasses: ['pii'],
      reviewers: ['ann'],
    });
  });

  it('leaves out invalid values instead of failing', () => {
    expect(readMetaGovernance({ risk: 'huge', owner: 3, domain: 'ops' })).toEqual({
      domain: 'ops',
    });
  });
});

describe('effectiveGovernance', () => {
  it('takes scalars from the entry, else from @meta', () => {
    const entry = { risk: 'low' as const };
    const defaults = { risk: 'high' as const, owner: '@acme/support', domain: 'payments' };

    expect(effectiveGovernance(entry, defaults)).toEqual({
      risk: 'low',
      owner: '@acme/support',
      domain: 'payments',
    });
  });

  it('joins data classes and lets entry reviewers replace the default', () => {
    const entry = { dataClasses: ['pii', 'financial'], reviewers: ['@bob', '@ann', '@bob'] };
    const defaults = { dataClasses: ['pii', 'internal'], reviewers: ['@acme/legal'] };

    expect(effectiveGovernance(entry, defaults)).toEqual({
      dataClasses: ['financial', 'internal', 'pii'],
      reviewers: ['@ann', '@bob'],
    });
  });

  it('keeps the default reviewers and leaves out empty lists', () => {
    expect(effectiveGovernance({ dataClasses: [] }, { reviewers: ['@b', '@a'] })).toEqual({
      reviewers: ['@a', '@b'],
    });
    expect(effectiveGovernance({}, {})).toEqual({});
  });
});
