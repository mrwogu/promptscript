import { describe, expect, it } from 'vitest';
import { makeBundle, makeFullBundle, type Json } from './__tests__/fixture.js';
import { PromptLoadError } from './errors.js';
import { loadPrompt } from './load.js';

const input = (spec: Json): Json => ({ inputs: { x: spec } });
const output = (fields: Json): Json => ({
  output: {
    type: 'object',
    properties: { a: { type: 'string' } },
    required: ['a'],
    additionalProperties: false,
    ...fields,
  },
});
const model = (fields: Json, params: Json = {}): Json => ({
  model: { ref: 'm', provider: 'anthropic', apiId: 'm', params, ...fields },
});

function codeOf(bundle: unknown): string | undefined {
  try {
    loadPrompt(bundle);
    return undefined;
  } catch (error) {
    if (error instanceof PromptLoadError) return error.code;
    throw error;
  }
}

/** [description, fields that replace top-level fields before hashing] */
const INVALID: [string, Json][] = [
  ['an id without a slash', { id: 'refund-reply' }],
  ['an id whose key starts with a dash', { id: 'acme/-x' }],
  ['an id that is not a string', { id: 7 }],
  ['a missing description', { description: undefined }],
  ['no messages', { messages: [] }],
  ['three messages', { messages: [1, 2, 3].map(() => ({ role: 'user', content: 'x' })) }],
  [
    'the user message first',
    {
      messages: [
        { role: 'user', content: 'x' },
        { role: 'system', content: 'y' },
      ],
    },
  ],
  [
    'two user messages',
    {
      messages: [
        { role: 'user', content: 'x' },
        { role: 'user', content: 'y' },
      ],
    },
  ],
  ['an assistant message', { messages: [{ role: 'assistant', content: 'x' }] }],
  ['message content that is not a string', { messages: [{ role: 'user', content: 1 }] }],
  ['a message that is not an object', { messages: ['x'] }],
  ['inputs as an array', { inputs: [] }],
  [
    'an input name with a dash',
    { inputs: { 'a-b': { type: 'string', description: 'd', required: true } } },
  ],
  [
    'an input named like a prototype member',
    { inputs: { constructor: { type: 'string', description: 'd', required: true } } },
  ],
  ['an input that is not an object', input(null as unknown as Json)],
  ['an unknown input type', input({ type: 'date', description: 'd', required: true })],
  ['an input without a description', input({ type: 'string', required: true })],
  [
    'options on a string input',
    input({ type: 'string', description: 'd', options: ['a'], required: true }),
  ],
  ['an enum without options', input({ type: 'enum', description: 'd', required: true })],
  [
    'an enum with empty options',
    input({ type: 'enum', description: 'd', options: [], required: true }),
  ],
  [
    'duplicate options',
    input({ type: 'enum', description: 'd', options: ['a', 'a'], required: true }),
  ],
  [
    'a default of the wrong type',
    input({ type: 'number', description: 'd', default: 'ten', required: false }),
  ],
  [
    'a boolean default for a string',
    input({ type: 'string', description: 'd', default: true, required: false }),
  ],
  [
    'an enum default outside the options',
    input({ type: 'enum', description: 'd', options: ['a'], default: 'b', required: false }),
  ],
  [
    'required true with a default',
    input({ type: 'string', description: 'd', default: 'a', required: true }),
  ],
  [
    'required false without a default',
    input({ type: 'string', description: 'd', required: false }),
  ],
  ['an output of type array', output({ type: 'array' })],
  ['output properties as an array', output({ properties: [], required: [] })],
  [
    'an output property name with a dash',
    output({ properties: { 'a-b': { type: 'string' } }, required: ['a-b'] }),
  ],
  [
    'an output property named __proto__',
    {
      output: JSON.parse(
        '{"type":"object","properties":{"__proto__":{"type":"string"}},"required":["__proto__"],"additionalProperties":false}'
      ),
    },
  ],
  ['an output property of type object', output({ properties: { a: { type: 'object' } } })],
  [
    'an output property description that is a number',
    output({ properties: { a: { type: 'string', description: 1 } } }),
  ],
  ['an output enum with a number', output({ properties: { a: { type: 'string', enum: [1] } } })],
  [
    'output items of type array',
    output({ properties: { a: { type: 'array', items: { type: 'array' } } } }),
  ],
  [
    'unsorted output required',
    output({ properties: { a: { type: 'string' }, b: { type: 'string' } }, required: ['b', 'a'] }),
  ],
  [
    'output required that misses a name',
    output({ properties: { a: { type: 'string' }, b: { type: 'string' } }, required: ['a'] }),
  ],
  ['output additionalProperties true', output({ additionalProperties: true })],
  ['a model without ref', model({ ref: undefined })],
  ['a model provider that is a number', model({ provider: 1 })],
  ['a model profile that is a number', model({ profile: 1 })],
  ['a model without params', model({ params: undefined })],
  ['a string temperature', model({}, { temperature: '0.2' })],
  ['topK zero', model({}, { topK: 0 })],
  ['a fractional maxTokens', model({}, { maxTokens: 1.5 })],
  ['a negative seed', model({}, { seed: -1 })],
  ['stop that is not a list', model({}, { stop: 'END' })],
  ['no governance', { governance: undefined }],
  ['an unknown risk', { governance: { risk: 'extreme' } }],
  ['data classes that are not strings', { governance: { dataClasses: [1] } }],
];

describe('loadPrompt', () => {
  it('loads a valid bundle', () => {
    // Arrange
    const bundle = makeFullBundle();

    // Act
    const prompt = loadPrompt(bundle);

    // Assert
    expect(prompt.id).toBe('acme-support/refund-reply');
    expect(prompt.contentHash).toBe(bundle['contentHash']);
    expect(prompt.inputs['message']).toEqual({
      type: 'string',
      description: 'Customer message',
      required: true,
    });
    expect(prompt.model?.params).toEqual({
      temperature: 0.2,
      topP: 0.9,
      topK: 40,
      maxTokens: 800,
      stop: ['END'],
      seed: 7,
    });
    expect(prompt.meta).toMatchObject({ source: 'inline', stale: false });
    expect(new Date(prompt.meta.loadedAt).toISOString()).toBe(prompt.meta.loadedAt);
  });

  it.each(INVALID)('rejects %s with invalid-bundle', (_name, fields) => {
    expect(codeOf(makeBundle(fields))).toBe('invalid-bundle');
  });

  it('rejects a contentHash that is not a sha256 hash', () => {
    expect(codeOf({ ...makeBundle(), contentHash: 'md5-abc' })).toBe('invalid-bundle');
  });

  it.each([null, [], 'bundle', 7])('rejects %j, which is not an object', (value) => {
    expect(codeOf(value)).toBe('invalid-bundle');
  });

  it('rejects another $schema or none with unsupported-schema', () => {
    const v2 = 'https://getpromptscript.dev/schema/prompt-bundle/v2.json';

    expect(codeOf(makeBundle({ $schema: v2 }))).toBe('unsupported-schema');
    expect(codeOf(makeBundle({ $schema: undefined }))).toBe('unsupported-schema');
  });

  it('rejects a bundle whose content changed after hashing', () => {
    const bundle = { ...makeBundle(), description: 'Changed' };

    expect(codeOf(bundle)).toBe('hash-mismatch');
  });

  it('turns a lone surrogate into invalid-bundle', () => {
    expect(codeOf({ ...makeBundle(), extra: '\uD800' })).toBe('invalid-bundle');
  });

  it('rejects a non-finite default', () => {
    const inputs = {
      x: { type: 'number', description: 'd', default: Number.NaN, required: false },
    };

    expect(codeOf({ ...makeBundle(), inputs })).toBe('invalid-bundle');
  });

  it('turns very deep nesting into invalid-bundle', () => {
    // Arrange
    let deep: Json = {};
    for (let i = 0; i < 100_000; i++) deep = { deep };
    const bundle = { ...makeBundle(), extra: deep };

    // Act and assert
    expect(codeOf(bundle)).toBe('invalid-bundle');
  });

  it('names the bad field and never its value', () => {
    const bundle = makeBundle(
      input({ type: 'number', description: 'd', default: 'secret-value', required: false })
    );

    expect(() => loadPrompt(bundle)).toThrow(/field inputs\.x\.default is invalid/);
    expect(() => loadPrompt(bundle)).not.toThrow(/secret-value/);
  });

  it('does not repeat an invalid input name', () => {
    const inputs = { 'evil\nname': { type: 'string', description: 'd', required: true } };

    expect(() => loadPrompt(makeBundle({ inputs }))).toThrow(/field inputs \(a name\) is invalid/);
    expect(() => loadPrompt(makeBundle({ inputs }))).not.toThrow(/evil/);
  });

  it('accepts unknown properties at every level and keeps them out of the prompt', () => {
    // Arrange
    const bundle = makeFullBundle({ future: 1, params: { maxTokens: 5, future: true } });
    const withInputs = makeBundle({
      later: { any: 'thing' },
      inputs: { message: { type: 'string', description: 'd', required: true, future: 1 } },
    });

    // Act
    const prompt = loadPrompt(bundle);
    const other = loadPrompt(withInputs);

    // Assert
    expect(prompt.model).toEqual({
      ref: 'claude-sonnet-5-5',
      profile: 'claude-sonnet-5-5',
      provider: 'anthropic',
      apiId: 'claude-sonnet-5-5',
      params: { maxTokens: 5 },
    });
    expect(other.inputs['message']).not.toHaveProperty('future');
    expect(other).not.toHaveProperty('later');
  });

  it('copies every governance field it knows', () => {
    const governance = {
      risk: 'high',
      owner: 'team-support',
      domain: 'billing',
      dataClasses: ['pii'],
      reviewers: ['legal'],
    };

    expect(loadPrompt(makeBundle({ governance })).governance).toEqual(governance);
  });

  it('neither checks nor exposes provenance', () => {
    const prompt = loadPrompt(makeBundle({ provenance: 'anything' }));

    expect(prompt).not.toHaveProperty('provenance');
  });

  it('passes the output schema on whole', () => {
    const bundle = makeBundle(output({ properties: { a: { type: 'string', format: 'email' } } }));

    expect(loadPrompt(bundle).output?.properties['a']).toEqual({ type: 'string', format: 'email' });
  });

  it('freezes the prompt and everything in it', () => {
    // Arrange
    const prompt = loadPrompt(makeFullBundle());

    // Act and assert
    expect(Object.isFrozen(prompt)).toBe(true);
    expect(Object.isFrozen(prompt.meta)).toBe(true);
    expect(Object.isFrozen(prompt.inputs['message'])).toBe(true);
    expect(Object.isFrozen(prompt.model?.params.stop)).toBe(true);
    expect(Object.isFrozen(prompt.output?.properties['tags']?.items)).toBe(true);
    expect(Object.isFrozen(prompt.governance)).toBe(true);
    expect(() => {
      (prompt.inputs as Json)['message'] = {};
    }).toThrow(TypeError);
  });

  it('leaves the caller object alone', () => {
    const bundle = makeFullBundle();

    loadPrompt(bundle);

    expect(Object.isFrozen(bundle)).toBe(false);
    expect(Object.isFrozen(bundle['model'])).toBe(false);
  });

  it('accepts a single system message', () => {
    const prompt = loadPrompt(
      makeBundle({ messages: [{ role: 'system', content: 'Hi' }], inputs: {} })
    );

    expect(prompt.render().messages).toEqual([{ role: 'system', content: 'Hi' }]);
  });
});
