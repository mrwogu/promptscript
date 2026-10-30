import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import { describe, expect, it } from 'vitest';
import { parseSample } from './sample.js';

const HASH = `sha256-${'a'.repeat(64)}`;
const schema = new Ajv({ strict: true, allowUnionTypes: true }).compile(
  JSON.parse(
    readFileSync(new URL('../../../../schema/eval-sample-v1.json', import.meta.url), 'utf8')
  ) as object
);

const GOOD = [
  ['the smallest sample', { prompt: 'acme/refund', inputs: {} }],
  [
    'every field',
    {
      prompt: 'acme/refund',
      contentHash: HASH,
      variant: 'warm',
      inputs: { message: 'hi', total: 120, vip: true },
      output: 'ok',
      feedback: { name: 'user.thumbs', score: 0, label: 'negative' },
    },
  ],
  ['feedback with a name only', { prompt: 'a/b', inputs: {}, feedback: { name: 'user.thumbs' } }],
  [
    'feedback with a score only',
    { prompt: 'a/b', inputs: {}, feedback: { name: 'user.thumbs', score: 1 } },
  ],
  [
    'feedback with a label only',
    { prompt: 'a/b', inputs: {}, feedback: { name: 'user.thumbs', label: 'positive' } },
  ],
  ['the control arm', { prompt: 'acme/refund', variant: 'control', inputs: {} }],
] as const;

const BAD = [
  ['a comment in the feedback', { feedback: { name: 'user.thumbs', comment: 'call me' } }],
  ['a top-level user id', { userId: 'u-1' }],
  ['a session id', { sessionId: 's-1' }],
  ['a trace id', { traceId: 't-1' }],
  ['an assignment key', { assignmentKey: 'k' }],
  ['a bad variant', { variant: 'Warm Arm' }],
  ['a short hash', { contentHash: 'sha256-abc' }],
  ['a nested input', { inputs: { message: { text: 'hi' } } }],
  ['a list input', { inputs: { message: ['hi'] } }],
  ['a null input', { inputs: { message: null } }],
  ['an input name with a dot', { inputs: { 'a.b': 'x' } }],
  ['an input named constructor', { inputs: { constructor: 'x' } }],
  ['an infinite score', { feedback: { name: 'user.thumbs', score: Number.POSITIVE_INFINITY } }],
  ['a score that is a string', { feedback: { name: 'user.thumbs', score: 'high' } }],
  ['a feedback name in capitals', { feedback: { name: 'User' } }],
  ['a number output', { output: 5 }],
  ['an empty prompt', { prompt: '' }],
  ['a string over 64 KiB', { inputs: { message: 'x'.repeat(64 * 1024 + 1) } }],
] as const;

describe('parseSample', () => {
  it.each(GOOD)('accepts %s, as the schema does', (_name, value) => {
    expect(schema(value), JSON.stringify(schema.errors)).toBe(true);
    expect(parseSample(value)).toEqual(value);
  });

  it.each(BAD)('refuses %s', (_name, patch) => {
    const value = { prompt: 'acme/refund', inputs: { message: 'hi' }, ...patch };

    expect(parseSample(value)).toBeUndefined();
  });

  it.each(BAD.filter(([name]) => !name.includes('64 KiB')))(
    'refuses %s in the schema too',
    (_name, patch) => {
      const value = { prompt: 'acme/refund', inputs: { message: 'hi' }, ...patch };

      expect(schema(value)).toBe(false);
    }
  );

  it.each([
    ['null', null],
    ['a list', []],
    ['a string', 'text'],
    ['no prompt', { inputs: {} }],
    ['no inputs', { prompt: 'a/b' }],
  ])('refuses %s', (_name, value) => {
    expect(parseSample(value)).toBeUndefined();
  });

  it('refuses a class instance and an own symbol key', () => {
    class Sample {
      prompt = 'a/b';
      inputs = {};
    }

    expect(parseSample(new Sample())).toBeUndefined();
    expect(parseSample({ prompt: 'a/b', inputs: {}, [Symbol('x')]: 1 })).toBeUndefined();
  });

  it('never calls a getter, and refuses an accessor property', () => {
    let called = false;
    const value = {
      prompt: 'a/b',
      get inputs() {
        called = true;
        return {};
      },
    };

    expect(parseSample(value)).toBeUndefined();
    expect(called).toBe(false);
  });

  it('refuses a __proto__ key that JSON.parse makes an own property', () => {
    const value = JSON.parse('{"prompt":"a/b","inputs":{},"__proto__":{"x":1}}') as unknown;
    const nested = JSON.parse('{"prompt":"a/b","inputs":{"__proto__":"x"}}') as unknown;

    expect(parseSample(value)).toBeUndefined();
    expect(parseSample(nested)).toBeUndefined();
  });

  it('builds inputs on a null prototype', () => {
    const sample = parseSample({ prompt: 'a/b', inputs: { message: 'hi' } });

    expect(Object.getPrototypeOf(sample?.inputs)).toBeNull();
  });
});
