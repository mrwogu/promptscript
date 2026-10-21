import { describe, expect, it } from 'vitest';
import { findRuntimeSlots, RUNTIME_SLOT_NAMESPACE } from '../runtime-slots.js';

describe('findRuntimeSlots', () => {
  it('exposes the slot namespace', () => {
    expect(RUNTIME_SLOT_NAMESPACE).toBe('input');
  });

  it('returns nothing for text without brace pairs', () => {
    expect(findRuntimeSlots('plain { text } and }}')).toEqual([]);
  });

  it('finds a slot with its offset and length', () => {
    expect(findRuntimeSlots('Customer wrote: {{input.message}}')).toEqual([
      { kind: 'slot', name: 'message', offset: 16, length: 17 },
    ]);
  });

  it('finds several slots in text order', () => {
    const matches = findRuntimeSlots('{{input.a}} and {{input._b2}}');

    expect(matches.map((m) => [m.name, m.offset])).toEqual([
      ['a', 0],
      ['_b2', 16],
    ]);
  });

  it('treats a backslash and two braces as one escape', () => {
    expect(findRuntimeSlots(String.raw`a \{{input.x}}`)).toEqual([
      { kind: 'escaped', name: null, offset: 2, length: 3 },
    ]);
  });

  it('keeps scanning after an escape', () => {
    expect(findRuntimeSlots(String.raw`\{{ {{input.x}}`).map((m) => m.kind)).toEqual([
      'escaped',
      'slot',
    ]);
  });

  it('reads a doubled backslash as a backslash followed by an escape', () => {
    expect(findRuntimeSlots(String.raw`\\{{input.x}}`)).toEqual([
      { kind: 'escaped', name: null, offset: 1, length: 3 },
    ]);
  });

  it.each([
    ['spaces inside', '{{ input.x }}', 13],
    ['wrong case namespace', '{{Input.x}}', 11],
    ['nested name', '{{input.x.y}}', 13],
    ['bare name', '{{name}}', 8],
    ['empty name', '{{input.}}', 10],
    ['digit first', '{{input.1x}}', 12],
    ['three braces', '{{{input.x}}}', 12],
  ])('flags %s as invalid up to the closing braces', (_name, text, length) => {
    expect(findRuntimeSlots(text)).toEqual([{ kind: 'invalid', name: null, offset: 0, length }]);
  });

  it('flags an unclosed pair as invalid with length 2', () => {
    expect(findRuntimeSlots('say {{input.x and more')).toEqual([
      { kind: 'invalid', name: null, offset: 4, length: 2 },
    ]);
  });

  it('never rescans the text inside an invalid match', () => {
    expect(findRuntimeSlots('{{ a {{input.x}}')).toEqual([
      { kind: 'invalid', name: null, offset: 0, length: 16 },
    ]);
  });
});
