import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../parse.js';
import { printProgram } from '../printer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..', '..', '..');

/** Source-position metadata, which a printer cannot and should not preserve. */
const POSITION_KEYS = new Set(['loc', 'titleLoc', 'sectionLoc', 'location']);

function stripPositions(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripPositions);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !POSITION_KEYS.has(key))
        .map(([key, entry]) => [key, stripPositions(entry)])
    );
  }
  return value;
}

function findPrsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (['node_modules', 'dist', '.git', '.nx', 'coverage'].includes(name)) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return findPrsFiles(path);
    return name.endsWith('.prs') ? [path] : [];
  });
}

/** Files that parse cleanly; invalid-syntax fixtures are error tests, not round-trip inputs. */
function loadFixtures(): { name: string; source: string }[] {
  return findPrsFiles(repoRoot)
    .map((path) => ({ name: relative(repoRoot, path), source: readFileSync(path, 'utf-8') }))
    .filter(({ source }) => {
      const result = parse(source);
      return result.ast !== null && result.errors.length === 0;
    });
}

/**
 * Fixtures whose round trip is known to differ, with the reason. Each one is
 * skipped so the sizing stays visible instead of being silently dropped.
 */
const KNOWN_FAILURES: Record<string, string> = {};

const KNOWN_EDGE_FAILURES: Record<string, string> = {};

describe('printProgram round trip', () => {
  const fixtures = loadFixtures();

  it('finds fixtures to round trip', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const { name, source } of fixtures) {
    const reason = KNOWN_FAILURES[name];
    const test = reason ? it.skip : it;
    test(`reparses its own output: ${name}${reason ? ` (${reason})` : ''}`, () => {
      // Arrange
      const original = parse(source).ast!;

      // Act
      const printed = printProgram(original);
      const reparsed = parse(printed);

      // Assert
      expect(reparsed.errors).toEqual([]);
      expect(stripPositions(reparsed.ast)).toEqual(stripPositions(original));
    });
  }
});

/** Syntax that no fixture file exercises, so the printer is checked against it directly. */
const EDGE_CASES: Record<string, string> = {
  'string escapes':
    '@meta { id: "a" syntax: "1.0.0" }\n@identity { note: "q\\"uote\\ttab\\nline" }',
  'backslash before n': '@identity { path: "C:\\\\new" }',
  'env var': '@identity { token: ${API_TOKEN} other: ${HOME:-/tmp} }',
  'keyword keys': '@identity { "use": 1 "true": 2 string: "x" }',
  'nested values': '@context { a: { b: [1, 2, { c: null }] d: [] e: {} } }',
  'typed fields':
    '@params { name: string mode?: enum("a", "b") size: range(1..5) flag: boolean = true }',
  'template expr': '@context { name: {{projectName}} }',
  'inherit with params': '@inherit @stacks/ts@1.2.0(projectName: "x", strict: true)',
  'use alias and into': '@use ./frag(a: 1) as frag into "skills/seo"',
  'extend replace modifier': '@extend standards { testing!: ["Use Vitest"] other: 1 }',
  'extend dotted path': '@extend standards.code { frameworks: [react] }',
  'override block and value': '@override identity { "x" }\n@override standards.code { a: 1 }',
  'header directive': '@meta { id: "a" syntax: "1.5.0" }\n@identity { @header "Who" """text""" }',
  'legacy heading': '@meta { id: "a" syntax: "1.5.0" }\n@knowledge { """\n## Who\n\nbody\n""" }',
  'legacy heading without body': '@meta { id: "a" syntax: "1.5.0" }\n@knowledge { """## Who""" }',
  'dash list': '@restrictions { - "never lie" - "be kind" }',
  'mixed text and fields': '@knowledge { """\n  indented\n    deeper\n""" key: """\n  a\n""" }',
  'meta params':
    '@meta { id: "a" params: { projectName: string strict?: boolean = true mode: enum("dev", "prod") } }',
  'inline use in block': '@skills { @use ./sub as phase review: { description: "d" } }',
  'negative and float numbers': '@context { a: -1 b: 2.5 c: -0.5 }',
};

describe('printProgram edge cases', () => {
  for (const [name, source] of Object.entries(EDGE_CASES)) {
    const reason = KNOWN_EDGE_FAILURES[name];
    const test = reason ? it.skip : it;
    test(`reparses its own output: ${name}${reason ? ` (${reason})` : ''}`, () => {
      // Arrange
      const parsed = parse(source);
      expect(parsed.errors).toEqual([]);

      // Act
      const reparsed = parse(printProgram(parsed.ast!));

      // Assert
      expect(reparsed.errors).toEqual([]);
      expect(stripPositions(reparsed.ast)).toEqual(stripPositions(parsed.ast));
    });
  }
});
