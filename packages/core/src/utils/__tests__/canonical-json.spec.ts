import { describe, expect, it } from 'vitest';
import { PSError } from '../../errors/base.js';
import { canonicalizeJson } from '../canonical-json.js';

function doubleFromBits(hex: string): number {
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, BigInt(`0x${hex}`));
  return view.getFloat64(0);
}

describe('canonicalizeJson', () => {
  it('matches the RFC 8785 section 3.2 example', () => {
    const input = String.raw`{"numbers":[333333333.33333329,1E30,4.50,2e-3,0.000000000000000000000000001],"string":"\u20ac$\u000F\u000aA'\u0042\u0022\u005c\\\"\/","literals":[null,true,false]}`;
    const expected = String.raw`{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"€$\u000f\nA'B\"\\\\\"/"}`;

    expect(canonicalizeJson(JSON.parse(input))).toBe(expected);
  });

  it.each([
    ['0000000000000000', '0'],
    ['8000000000000000', '0'],
    ['0000000000000001', '5e-324'],
    ['8000000000000001', '-5e-324'],
    ['7fefffffffffffff', '1.7976931348623157e+308'],
    ['ffefffffffffffff', '-1.7976931348623157e+308'],
    ['4340000000000000', '9007199254740992'],
    ['c340000000000000', '-9007199254740992'],
    ['4430000000000000', '295147905179352830000'],
    ['44b52d02c7e14af5', '9.999999999999997e+22'],
    ['44b52d02c7e14af6', '1e+23'],
    ['44b52d02c7e14af7', '1.0000000000000001e+23'],
    ['444b1ae4d6e2ef4e', '999999999999999700000'],
    ['444b1ae4d6e2ef4f', '999999999999999900000'],
    ['444b1ae4d6e2ef50', '1e+21'],
    ['3eb0c6f7a0b5ed8c', '9.999999999999997e-7'],
    ['3eb0c6f7a0b5ed8d', '0.000001'],
    ['41b3de4355555553', '333333333.3333332'],
    ['41b3de4355555554', '333333333.33333325'],
    ['41b3de4355555555', '333333333.3333333'],
    ['41b3de4355555556', '333333333.3333334'],
    ['41b3de4355555557', '333333333.33333343'],
    ['becbf647612f3696', '-0.0000033333333333333333'],
    ['43143ff3c1cb0959', '1424953923781206.2'],
  ])('serializes the RFC 8785 appendix B number %s as %s', (bits, expected) => {
    expect(canonicalizeJson(doubleFromBits(bits))).toBe(expected);
  });

  it('orders the RFC 8785 section 3.2.3 sorting sample by UTF-16 code units', () => {
    const sample = JSON.parse(
      String.raw`{"\u20ac":"Euro Sign","\r":"Carriage Return","\ufb33":"Hebrew Letter Dalet With Dagesh","1":"One","\ud83d\ude00":"Emoji: Grinning Face","\u0080":"Control","\u00f6":"Latin Small Letter O With Diaeresis"}`
    ) as Record<string, string>;

    const values = [...canonicalizeJson(sample).matchAll(/:"([^"]+)"/g)].map((m) => m[1]);

    expect(values).toEqual([
      'Carriage Return',
      'One',
      'Control',
      'Latin Small Letter O With Diaeresis',
      'Euro Sign',
      'Emoji: Grinning Face',
      'Hebrew Letter Dalet With Dagesh',
    ]);
  });

  it('sorts keys by UTF-16 code units at every depth', () => {
    const value = { '€': 1, '\u{1F600}': 2, b: { z: 1, a: [{ y: 1, x: 2 }] }, a: 0, é: 3 };

    expect(canonicalizeJson(value)).toBe(
      '{"a":0,"b":{"a":[{"x":2,"y":1}],"z":1},"é":3,"€":1,"\u{1F600}":2}'
    );
  });

  it('keeps array order and skips undefined properties', () => {
    expect(canonicalizeJson({ b: [3, 1, 2], a: undefined, c: null })).toBe(
      '{"b":[3,1,2],"c":null}'
    );
  });

  it('serializes primitives at the root', () => {
    expect([canonicalizeJson('a"b'), canonicalizeJson(true), canonicalizeJson(null)]).toEqual([
      '"a\\"b"',
      'true',
      'null',
    ]);
  });

  it.each([
    ['NaN', { model: { params: { temperature: NaN } } }, 'model.params.temperature'],
    ['Infinity', { list: [1, Infinity] }, 'list[1]'],
    ['bigint', { n: 1n }, 'n'],
    ['function', { fn: () => 1 }, 'fn'],
    ['symbol', { s: Symbol('x') }, 's'],
    ['undefined in an array', [undefined], '[0]'],
    ['undefined at the root', undefined, '<root>'],
    ['an array hole', [1, , 3], '[1]'], // eslint-disable-line no-sparse-arrays
    ['an unfilled array', { list: new Array(2) }, 'list[0]'],
    ['a lone high surrogate', { s: 'a\uD800b' }, 's'],
    ['a lone low surrogate', ['\uDC00'], '[0]'],
    ['a lone surrogate in a key', { 'k\uD800': 1 }, 'k\uD800'],
    ['a Date', { d: new Date(0) }, 'd'],
    ['a Map', { m: new Map([['a', 1]]) }, 'm'],
    ['a String object', { s: new String('ab') }, 's'], // eslint-disable-line no-new-wrappers
  ])('throws a PSError naming the path for %s', (_name, value, path) => {
    const act = (): string => canonicalizeJson(value);

    expect(act).toThrow(PSError);
    expect(act).toThrow(path);
  });

  it('names the path of a circular reference', () => {
    const loop: Record<string, unknown> = { name: 'loop' };
    loop['self'] = { again: [loop] };

    expect(() => canonicalizeJson(loop)).toThrow(PSError);
    expect(() => canonicalizeJson(loop)).toThrow('self.again[0]');
  });

  it('accepts a repeated object that is not a cycle', () => {
    const shared = { a: 1 };

    expect(canonicalizeJson({ x: shared, y: [shared] })).toBe('{"x":{"a":1},"y":[{"a":1}]}');
  });

  it('serializes a null-prototype object and an own __proto__ key', () => {
    const bare = Object.assign(Object.create(null) as object, { b: 1, a: 2 });
    const parsed: unknown = JSON.parse('{"__proto__":{"x":1},"k":2}');

    expect([canonicalizeJson(bare), canonicalizeJson(parsed)]).toEqual([
      '{"a":2,"b":1}',
      '{"__proto__":{"x":1},"k":2}',
    ]);
  });

  it('keeps a valid surrogate pair', () => {
    expect(canonicalizeJson({ s: '\u{1F600}' })).toBe('{"s":"\u{1F600}"}');
  });
});
