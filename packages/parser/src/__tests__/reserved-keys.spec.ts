import { describe, expect, it } from 'vitest';
import { parse } from '../parse.js';

const META = '@meta { id: "x" syntax: "1.6.0" }\n';

describe('reserved field names', () => {
  it.each([
    ['a prompt key', `${META}@prompts { "__proto__": { user: "hi" } }`],
    [
      'an input name',
      `${META}@prompts { review: { user: "hi" inputs: { "__proto__": { type: "string" } } } }`,
    ],
    [
      'an output name',
      `${META}@prompts { review: { user: "hi" output: { type: "object" properties: { "__proto__": { type: "string" } } } } }`,
    ],
    ['a meta field', '@meta { id: "x" "__proto__": "y" }'],
    ['an unquoted field', `${META}@standards { __proto__: "y" }`],
  ])('rejects "__proto__" as %s with a location', (_label, source) => {
    const result = parse(source, { filename: 'reserved.prs' });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toContain('"__proto__" is reserved');
    const lines = source.split('\n');
    const line = lines.findIndex((text) => text.includes('__proto__'));
    expect(result.errors[0]!.location).toMatchObject({
      file: 'reserved.prs',
      line: line + 1,
      column:
        lines[line]!.indexOf('__proto__') + 1 - (lines[line]!.includes('"__proto__"') ? 1 : 0),
    });
  });

  it('keeps accepting ordinary names', () => {
    const result = parse(`${META}@prompts { review: { user: "hi" } }`);

    expect(result.errors).toHaveLength(0);
  });
});
