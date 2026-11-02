import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  isMarkedBreaking,
  publicReportLines,
  removedReportLines,
  schemaBreaks,
} from './api-breaking.mjs';

function report(...lines: string[]): string {
  return ['## API Report', '', '```ts', '', ...lines, '', '```', ''].join('\n');
}

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('isMarkedBreaking', () => {
  it('checks the commit subject when there is one commit', () => {
    expect(isMarkedBreaking('fix(cli): x', ['feat(core)!: drop it'])).toBe(true);
    expect(isMarkedBreaking('feat(core)!: x', ['fix(cli): small'])).toBe(false);
  });

  it('checks the pull request title when there are more commits', () => {
    const messages = ['feat(core)!: drop it', 'fix(cli): small'];
    expect(isMarkedBreaking('fix(cli): x', messages)).toBe(false);
    expect(isMarkedBreaking('feat(core)!: x', messages)).toBe(true);
    expect(isMarkedBreaking('feat!: x', messages)).toBe(true);
  });

  it('does not mark a title with ! somewhere else', () => {
    expect(isMarkedBreaking('fix(cli): handle ! in names', ['a', 'b'])).toBe(false);
  });

  it('marks a BREAKING CHANGE line in any commit message', () => {
    const body = 'fix(cli): x\n\nBREAKING CHANGE: x';
    expect(isMarkedBreaking('fix(cli): x', [body])).toBe(true);
    expect(isMarkedBreaking('fix(cli): x', ['a', 'b\n\nBREAKING-CHANGE: x'])).toBe(true);
  });

  it('does not mark BREAKING CHANGE in the middle of a line', () => {
    expect(isMarkedBreaking('fix(cli): x', ['a\n\nthis is a BREAKING CHANGE: x'])).toBe(false);
  });

  it('does not mark an empty title and no commits', () => {
    expect(isMarkedBreaking('', [])).toBe(false);
  });
});

describe('removedReportLines', () => {
  const user = ['// @public', 'export interface User {', '    name: string;', '}'];

  it('gives nothing for identical reports', () => {
    expect(removedReportLines(report(...user), report(...user))).toEqual([]);
  });

  it('passes an added declaration', () => {
    const added = ['// @public', 'export interface Team {', '    id: string;', '}'];
    expect(removedReportLines(report(...user), report(...user, '', ...added))).toEqual([]);
  });

  it('lists a removed public declaration', () => {
    const removed = removedReportLines(report(...user), report());
    expect(removed).toContain('export interface User {');
    expect(removed).toContain('name: string; (in export interface User {)');
  });

  it('lists the old line of a changed signature', () => {
    const changed = ['// @public', 'export interface User {', '    name: number;', '}'];
    expect(removedReportLines(report(...user), report(...changed))).toEqual([
      'name: string; (in export interface User {)',
    ]);
  });

  it('passes a removed @internal declaration', () => {
    const internal = ['// @internal', 'export interface Secret {', '    id: string;', '}'];
    expect(removedReportLines(report(...internal), report())).toEqual([]);
  });

  it('lists a declaration that goes from public to @internal', () => {
    const internal = ['// @internal', 'export interface User {', '    name: string;', '}'];
    expect(removedReportLines(report(...user), report(...internal))).toContain(
      'name: string; (in export interface User {)'
    );
  });

  it('passes a removed @internal (undocumented) declaration', () => {
    const hidden = ['// @internal (undocumented)', 'export function parse(): string;'];
    expect(removedReportLines(report(...hidden), report())).toEqual([]);
  });

  it('lists a public declaration that becomes @internal (undocumented)', () => {
    const pub = ['// @public', 'export function parse(): string;'];
    const hidden = ['// @internal (undocumented)', 'export function parse(): string;'];
    expect(removedReportLines(report(...pub), report(...hidden))).toHaveLength(1);
  });

  it('passes comment only edits and removed imports', () => {
    const base = report(
      "import { A } from 'a';",
      '',
      '// @public',
      'export interface User {',
      '    // (undocumented)',
      '    name: string;',
      '}',
      '',
      '// Warning: something',
      '// (No @packageDocumentation comment for this package)'
    );
    const head = report(...user, '', '// @public @deprecated');
    expect(removedReportLines(base, head)).toEqual([]);
  });

  it('lists a line that stays in another declaration only', () => {
    const base = report(
      '// @public',
      'export interface A {',
      '    id: string;',
      '}',
      '',
      '// @public',
      'export interface B {',
      '    id: string;',
      '}'
    );
    const head = report(
      '// @public',
      'export interface A {',
      '}',
      '',
      '// @public',
      'export interface B {',
      '    id: string;',
      '}'
    );
    expect(removedReportLines(base, head)).toEqual(['id: string; (in export interface A {)']);
  });

  it('lists one of two identical lines that is removed', () => {
    const base = report(
      '// @public',
      'export interface A {',
      '    id: string;',
      '    id: string;',
      '}'
    );
    const head = report('// @public', 'export interface A {', '    id: string;', '}');
    expect(removedReportLines(base, head)).toEqual(['id: string; (in export interface A {)']);
  });

  it('treats CRLF and LF reports as equal', () => {
    const lf = report(...user);
    expect(removedReportLines(lf, lf.replaceAll('\n', '\r\n'))).toEqual([]);
  });

  it('lists every public line when the head report is missing', () => {
    expect(removedReportLines(report(...user), undefined)).toHaveLength(3);
  });

  it('reads the real core report', () => {
    const core = readRepoFile('packages/core/api/core.api.md');
    expect(publicReportLines(core).size).toBeGreaterThan(100);
    expect(removedReportLines(core, core)).toEqual([]);
  });
});

describe('schemaBreaks', () => {
  const base = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
      name: { type: ['string', 'boolean'] },
      mode: { enum: ['a', 'b'] },
      count: { type: 'number' },
    },
  };

  function withProperties(properties: Record<string, unknown>): unknown {
    return { ...base, properties: { ...base.properties, ...properties } };
  }

  it('gives nothing for identical schemas', () => {
    expect(schemaBreaks(base, structuredClone(base))).toEqual([]);
  });

  it('passes a new optional property', () => {
    expect(schemaBreaks(base, withProperties({ extra: { type: 'string' } }))).toEqual([]);
  });

  it('detects a removed property', () => {
    const { count, ...rest } = base.properties;
    expect(count).toBeDefined();
    expect(schemaBreaks(base, { ...base, properties: rest })).toEqual(['count: property removed']);
  });

  it('detects a new required entry', () => {
    const head = { ...base, required: ['name', 'mode'] };
    expect(schemaBreaks(base, head)).toEqual([': mode is now required']);
  });

  it('detects a narrowed type', () => {
    expect(schemaBreaks(base, withProperties({ name: { type: 'string' } }))).toEqual([
      'name: type narrowed',
    ]);
  });

  it('detects number to integer but not integer to number', () => {
    expect(schemaBreaks(base, withProperties({ count: { type: 'integer' } }))).toHaveLength(1);
    const integerBase = withProperties({ count: { type: 'integer' } });
    expect(schemaBreaks(integerBase, base)).toEqual([]);
  });

  it('detects a removed enum value but not an added one', () => {
    expect(schemaBreaks(base, withProperties({ mode: { enum: ['a'] } }))).toEqual([
      'mode: enum value removed',
    ]);
    expect(schemaBreaks(base, withProperties({ mode: { enum: ['a', 'b', 'c'] } }))).toEqual([]);
  });

  it('detects additionalProperties set to false but not the other way round', () => {
    const open = { type: 'object', additionalProperties: { type: 'string' } };
    const closed = { type: 'object', additionalProperties: false };
    expect(schemaBreaks(open, closed)).toEqual([': additionalProperties is now false']);
    expect(schemaBreaks(closed, open)).toEqual([]);
  });

  it('detects a changed const', () => {
    const before = { properties: { version: { const: 1 } } };
    const after = { properties: { version: { const: 2 } } };
    expect(schemaBreaks(before, after)).toEqual(['version: const changed']);
  });

  it('detects a change inside a $ref definition with its path', () => {
    const before = {
      properties: { item: { $ref: '#/definitions/Item' } },
      definitions: { Item: { properties: { id: { type: 'string' } } } },
    };
    const after = {
      properties: { item: { $ref: '#/definitions/Item' } },
      definitions: { Item: { properties: {} } },
    };
    expect(schemaBreaks(before, after)).toEqual(['item.id: property removed']);
  });

  it('passes a definition renamed with the same shape', () => {
    const shape = { properties: { id: { type: 'string' } } };
    const before = {
      properties: { item: { $ref: '#/definitions/Old' } },
      definitions: { Old: shape },
    };
    const after = {
      properties: { item: { $ref: '#/definitions/New' } },
      definitions: { New: shape },
    };
    expect(schemaBreaks(before, after)).toEqual([]);
  });

  it('ends on a self recursive definition', () => {
    const tree = {
      $ref: '#/definitions/Node',
      definitions: {
        Node: { properties: { child: { $ref: '#/definitions/Node' }, id: { type: 'string' } } },
      },
    };
    expect(schemaBreaks(tree, structuredClone(tree))).toEqual([]);
  });

  it('detects a removed union branch but not an added one', () => {
    const two = { anyOf: [{ type: 'string' }, { type: 'number' }] };
    const three = { anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] };
    expect(schemaBreaks(three, two)).toEqual([
      ': union branch 2 removed or narrowed',
      ': type narrowed',
    ]);
    expect(schemaBreaks(two, three)).toEqual([]);
  });

  it('passes a branch inserted in the middle or a reordered union', () => {
    const before = { oneOf: [{ type: 'string' }, { type: 'number' }] };
    const inserted = { oneOf: [{ type: 'string' }, { type: 'boolean' }, { type: 'number' }] };
    const reordered = { oneOf: [{ type: 'number' }, { type: 'string' }] };
    expect(schemaBreaks(before, inserted)).toEqual([]);
    expect(schemaBreaks(before, reordered)).toEqual([]);
  });

  it('detects a union collapsed to one type', () => {
    const before = { anyOf: [{ type: 'string' }, { type: 'number' }] };
    expect(schemaBreaks(before, { type: 'string' })).toEqual([
      ': union branch 1 removed or narrowed',
      ': type narrowed',
    ]);
  });

  it('treats anyOf and oneOf as one union', () => {
    const before = { anyOf: [{ type: 'string' }, { type: 'number' }] };
    const after = { oneOf: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }] };
    expect(schemaBreaks(before, after)).toEqual([]);
  });

  it('passes a plain type that becomes a union containing it', () => {
    const after = { anyOf: [{ type: 'string' }, { type: 'number' }] };
    expect(schemaBreaks({ type: 'string' }, after)).toEqual([]);
  });

  it('compares a local ref against an inline copy and ends', () => {
    const shape = { properties: { id: { type: 'string' } } };
    const before = {
      properties: { child: { $ref: '#/definitions/A' } },
      definitions: { A: shape },
    };
    const after = { properties: { child: shape }, definitions: { A: shape } };
    expect(schemaBreaks(before, after)).toEqual([]);
    const recursive = {
      $ref: '#/definitions/Node',
      definitions: { Node: { properties: { child: { $ref: '#/definitions/Node' } } } },
    };
    expect(schemaBreaks(recursive, { properties: { child: {} } })).toEqual([
      'child.child: property removed',
    ]);
  });

  it('follows a ref that points to another ref', () => {
    const before = {
      properties: { item: { $ref: '#/definitions/Alias' } },
      definitions: {
        Alias: { $ref: '#/definitions/Item' },
        Item: { properties: { id: { type: 'string' } } },
      },
    };
    const after = structuredClone(before);
    after.definitions.Item.properties = {} as never;
    expect(schemaBreaks(before, after)).toEqual(['item.id: property removed']);
  });

  it('ends on refs that point to each other', () => {
    const loop = {
      properties: { item: { $ref: '#/definitions/A' } },
      definitions: { A: { $ref: '#/definitions/B' }, B: { $ref: '#/definitions/A' } },
    };
    expect(schemaBreaks(loop, structuredClone(loop))).toEqual([]);
  });

  it('decodes ~1 and ~0 in a ref', () => {
    const make = (type: string): unknown => ({
      properties: { item: { $ref: '#/definitions/a~1b~0c' } },
      definitions: { 'a/b~c': { properties: { id: { type } } } },
    });
    expect(schemaBreaks(make('string'), make('string'))).toEqual([]);
    expect(schemaBreaks(make('string'), make('number'))).toEqual(['item.id: type narrowed']);
  });

  it('reports an empty head union', () => {
    const before = { anyOf: [{ type: 'string' }] };
    expect(schemaBreaks(before, { anyOf: [] })).toEqual([': union is empty']);
  });

  it('tries the branch with the same index first and shows its breaks', () => {
    const before = { anyOf: [{ properties: { a: {} } }, { properties: { b: {} } }] };
    const after = { anyOf: [{ properties: { a: {} } }, { properties: {} }] };
    expect(schemaBreaks(before, after)).toEqual([
      ': union branch 1 removed or narrowed',
      'b: property removed',
    ]);
  });

  it('compares a plain base against a union in the head', () => {
    const before = { type: 'object', properties: { a: { type: 'string' } } };
    const wider = { anyOf: [before, { type: 'string' }] };
    expect(schemaBreaks(before, wider)).toEqual([]);
    const narrower = { type: ['string', 'number'] };
    expect(schemaBreaks(narrower, { anyOf: [{ type: 'string' }] })).toHaveLength(2);
  });

  it('adds the head keywords next to a union to each branch', () => {
    const before = { properties: { a: {} } };
    const after = { properties: { a: {} }, anyOf: [{ type: 'object' }, { type: 'string' }] };
    expect(schemaBreaks(before, after)).toEqual([]);
  });

  it('reports a type added only to a base with annotations', () => {
    const typed = { type: 'string' };
    expect(schemaBreaks({}, typed)).toEqual([': type added']);
    expect(schemaBreaks({ description: 'x' }, typed)).toEqual([': type added']);
    expect(schemaBreaks({ enum: ['a'] }, typed)).toEqual([]);
    expect(schemaBreaks({ const: 'x' }, typed)).toEqual([]);
    expect(schemaBreaks({ properties: {} }, { properties: {}, type: 'object' })).toEqual([]);
  });

  it('matches allOf entries like union branches', () => {
    const before = { allOf: [{ properties: { a: {} } }, { properties: { b: {} } }] };
    const inserted = {
      allOf: [{ properties: { a: {} } }, { required: ['c'] }, { properties: { b: {} } }],
    };
    expect(schemaBreaks(before, inserted)).toEqual([]);
    expect(schemaBreaks(before, { allOf: [] })).toEqual([': allOf is empty']);
  });

  it('does not check a new allOf entry or a new then', () => {
    const after = { allOf: [{ required: ['a'] }], then: { required: ['a'] } };
    expect(schemaBreaks({}, after)).toEqual([]);
  });

  it('does not throw on a malformed escape in a ref', () => {
    const before = { properties: { a: { $ref: '#/definitions/100%' } }, definitions: {} };
    expect(schemaBreaks(before, structuredClone(before))).toEqual([]);
  });

  it('detects a change inside allOf and then or else', () => {
    const before = { allOf: [{ properties: { a: {} } }], then: { properties: { b: {} } } };
    const after = { allOf: [{ properties: {} }], then: { properties: {} } };
    expect(schemaBreaks(before, after)).toEqual([
      ': allOf entry 0 removed or narrowed',
      'a: property removed',
      '(then).b: property removed',
    ]);
  });

  it('passes an allOf or then that is dropped', () => {
    const before = { allOf: [{ properties: { a: {} } }], else: { required: ['a'] } };
    expect(schemaBreaks(before, {})).toEqual([]);
  });

  it('detects a type added to an untyped property', () => {
    expect(
      schemaBreaks({ properties: { a: {} } }, { properties: { a: { type: 'string' } } })
    ).toEqual(['a: type added']);
  });

  it('detects additionalProperties narrowed to a schema', () => {
    const narrowed = { additionalProperties: { type: 'string' } };
    expect(schemaBreaks({}, narrowed)).toEqual([': additionalProperties narrowed']);
    expect(schemaBreaks({ additionalProperties: true }, narrowed)).toHaveLength(1);
    expect(schemaBreaks({ additionalProperties: false }, narrowed)).toEqual([]);
  });

  it('treats a const as a one value enum', () => {
    const before = { properties: { a: { const: 'a' } } };
    const widened = { properties: { a: { enum: ['a', 'b'] } } };
    expect(schemaBreaks(before, widened)).toEqual([]);
    expect(schemaBreaks(widened, before)).toEqual(['a: const changed']);
  });

  it('flips the required rule for output schemas', () => {
    const before = { required: ['a', 'b'], properties: { a: {}, b: {}, c: {} } };
    const added = { required: ['a', 'b', 'c'], properties: { a: {}, b: {}, c: {} } };
    const removed = { required: ['a'], properties: { a: {}, b: {}, c: {} } };
    expect(schemaBreaks(before, added, true)).toEqual([]);
    expect(schemaBreaks(before, removed, true)).toEqual([': b is no longer required']);
    expect(schemaBreaks(before, added)).toEqual([': c is now required']);
    expect(schemaBreaks(before, removed)).toEqual([]);
  });

  it('detects a property removed inside items', () => {
    const before = { properties: { x: { type: 'array', items: { properties: { id: {} } } } } };
    const after = { properties: { x: { type: 'array', items: { properties: {} } } } };
    expect(schemaBreaks(before, after)).toEqual(['x[].id: property removed']);
  });

  it('detects an external $ref that changed', () => {
    const before = { properties: { record: { $ref: 'a/v1.json' } } };
    const after = { properties: { record: { $ref: 'b/v1.json' } } };
    expect(schemaBreaks(before, after)).toEqual(['record: $ref changed']);
  });

  it('passes description, examples and default edits', () => {
    const before = { properties: { a: { type: 'string', description: 'x', default: 'a' } } };
    const after = {
      properties: { a: { type: 'string', description: 'y', default: 'b', examples: ['c'] } },
    };
    expect(schemaBreaks(before, after)).toEqual([]);
  });

  it('reports a missing head schema as removed', () => {
    expect(schemaBreaks(base, undefined)).toEqual(['schema removed']);
  });

  it('reads the real config schema', () => {
    const config = JSON.parse(readRepoFile('schema/config.json')) as Record<string, unknown>;
    expect(schemaBreaks(config, structuredClone(config))).toEqual([]);
    const head = structuredClone(config) as { properties: Record<string, unknown> };
    delete head.properties[Object.keys(head.properties)[0] ?? ''];
    expect(schemaBreaks(config, head)).toHaveLength(1);
  });
});
