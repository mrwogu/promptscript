import { describe, expect, it } from 'vitest';
import { parseDocumentText } from './parse-document.js';

describe('parseDocumentText', () => {
  it('parses YAML and finds the line of a nested value', () => {
    const parsed = parseDocumentText(
      'prompt: a\nassertions:\n  - id: x\n    kind: equals\n',
      false
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toEqual({ prompt: 'a', assertions: [{ id: 'x', kind: 'equals' }] });
    expect(parsed.line(['assertions', 0, 'kind'])).toBe(4);
  });

  it('falls back to the nearest parent line for a missing key', () => {
    const parsed = parseDocumentText('prompt: a\nassertions:\n  - id: x\n', false);

    expect(parsed.ok && parsed.line(['assertions', 0, 'kind'])).toBe(3);
  });

  it('reports a syntax error by position only', () => {
    const parsed = parseDocumentText('a: [1, 2\nb: secret-value\n', false);

    expect(parsed).toEqual({ ok: false, problem: 'is not valid YAML', line: 2, column: 1 });
  });

  it.each([
    ['a duplicate key', 'a: 1\na: 2\n'],
    ['two documents', 'a: 1\n---\nb: 2\n'],
  ])('refuses %s', (_name, text) => {
    expect(parseDocumentText(text, false).ok).toBe(false);
  });

  it.each([
    ['a binary tag', 'a: !!binary aGk=\n'],
    ['a string tag', 'a: !!str 1\n'],
  ])('refuses %s', (_name, text) => {
    const parsed = parseDocumentText(text, false);

    expect(parsed).toMatchObject({
      ok: false,
      problem: 'uses a YAML tag, and tags are not supported',
      line: 1,
    });
  });

  it('refuses a custom tag', () => {
    expect(parseDocumentText('a: !secret value\n', false)).toMatchObject({ ok: false, line: 1 });
  });

  it('refuses an alias bomb', () => {
    const bomb = [
      'a: &a [x, x, x, x, x, x, x, x, x]',
      'b: &b [*a, *a, *a, *a, *a, *a, *a, *a, *a]',
      'c: &c [*b, *b, *b, *b, *b, *b, *b, *b, *b]',
      'd: [*c, *c, *c, *c, *c, *c, *c, *c, *c]',
    ].join('\n');

    expect(parseDocumentText(bomb, false)).toEqual({
      ok: false,
      problem: 'expands more than 20 aliases',
    });
  });

  it('does not merge << keys', () => {
    const parsed = parseDocumentText('base: &b {x: 1}\nc:\n  <<: *b\n', false);

    expect(parsed.ok && parsed.value).toEqual({ base: { x: 1 }, c: { '<<': { x: 1 } } });
  });

  it('keeps ${VAR} text literal', () => {
    const parsed = parseDocumentText('path: ${HOME}/rows.jsonl\n', false);

    expect(parsed.ok && parsed.value).toEqual({ path: '${HOME}/rows.jsonl' });
  });

  it('parses JSON, tab indentation included', () => {
    const parsed = parseDocumentText('{\n\t"prompt": "a",\n\t"n": [1, true, null]\n}\n', true);

    expect(parsed.ok && parsed.value).toEqual({ prompt: 'a', n: [1, true, null] });
  });

  it.each([
    ['a comment', '{\n  // note\n  "a": 1\n}'],
    ['single quotes', "{'a': 1}"],
    ['a trailing comma', '{"a": 1,}'],
  ])('refuses %s in JSON', (_name, text) => {
    expect(parseDocumentText(text, true)).toMatchObject({
      ok: false,
      problem: 'is not valid JSON',
    });
  });

  it('refuses a repeated key in JSON, which JSON.parse would accept', () => {
    const parsed = parseDocumentText(
      '{\n  "dataset": { "path": "a.jsonl" },\n  "dataset": "b.jsonl"\n}\n',
      true
    );

    expect(parsed).toEqual({ ok: false, problem: 'repeats a key', line: 3, column: 3 });
  });

  it('refuses a repeated key deeper in JSON', () => {
    expect(parseDocumentText('{"a": {"b": 1, "b": 2}}', true)).toMatchObject({
      ok: false,
      problem: 'repeats a key',
      line: 1,
    });
  });

  it('reports a JSON error by position only', () => {
    const parsed = parseDocumentText('{\n  "prompt": "secret-value",\n}\n', true);

    expect(parsed).toEqual({ ok: false, problem: 'is not valid JSON', line: 3, column: 1 });
  });

  it('finds the line of a value in JSON', () => {
    const parsed = parseDocumentText(
      '{\n  "prompt": "a",\n  "assertions": [\n    {"id": "x"}\n  ]\n}\n',
      true
    );

    expect(parsed.ok && parsed.line(['assertions', 0, 'id'])).toBe(4);
  });

  it('refuses YAML plain scalars in JSON', () => {
    expect(parseDocumentText('prompt: a\n', true)).toMatchObject({
      ok: false,
      problem: 'is not valid JSON',
    });
  });
});
