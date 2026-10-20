import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

/** Tracked fixtures that are deliberately not valid syntax; they are error tests, not round-trip inputs. */
const INVALID_FIXTURES = new Set<string>([
  'packages/resolver/src/__tests__/__fixtures__/invalid-syntax.prs',
]);

/** Tracked files only, so untracked WIP and other worktrees never change the suite. */
function loadFixtures(): { name: string; source: string }[] {
  const listed = execFileSync('git', ['ls-files', '*.prs'], { cwd: repoRoot, encoding: 'utf-8' });
  return listed
    .split('\n')
    .filter((name) => name !== '' && !INVALID_FIXTURES.has(name))
    .map((name) => ({ name, source: readFileSync(join(repoRoot, name), 'utf-8') }));
}

/**
 * Fixtures whose round trip is known to differ, with the reason. Each one is
 * skipped so the sizing stays visible instead of being silently dropped.
 */
const KNOWN_FAILURES: Record<string, string> = {};

/** Edge cases whose round trip is known to differ, skipped with the reason kept visible. */
const KNOWN_EDGE_FAILURES: Record<string, string> = {
  'bare and quoted env references together':
    'the AST records one env-var-value usage per bare occurrence, so the usage count changes; feature set and validity are unchanged',
};

describe('printProgram round trip', () => {
  const fixtures = loadFixtures();

  it('finds the tracked fixture corpus', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(56);
  });

  it.each(fixtures.map(({ name, source }) => [name, source] as const))(
    'parses without errors: %s',
    (_name, source) => {
      const result = parse(source);

      expect(result.errors).toEqual([]);
      expect(result.ast).not.toBeNull();
    }
  );

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
  'quoted env reference without the feature': '@identity { token: "${HOME}" list: ["${A}", 1] }',
  'bare env reference with the feature': '@identity { token: ${HOME} other: ${B:-x} }',
  'quoted env reference in list item': '@restrictions { - "${HOME}" }',
  'quoted env reference in meta, use arg and typed default':
    '@meta { id: "a" syntax: "1.0.0" params: { p: string = "${X}" } }\n@use ./f(a: "${B}")',
  'small fraction': '@context { a: 0.0000001 b: -0.00000000000012345 }',
  'large integer': '@context { a: 1000000000000000000000 b: 123456789012345678901234 }',
  'bare and quoted env references together': '@identity { a: ${X} b: "${Y}" }',
  'env-looking enum option': '@params { mode: enum("${X}", "b") }\n@identity { other: ${HOME} }',
  'range with extreme bounds':
    '@params { a: range(1..1000000000000000000000) b: range(0.0000001..1) }',
  'negative zero': '@context { a: -0 }',
  'user object that looks like a node':
    '@meta { id: "a" x: { type: "TypeExpression" kind: "foo" } y: { type: "TextContent" value: "hi" } }',
  'whitespace-only lines in text': '@knowledge { """\n  a\n     \n  b\n""" }',
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
      expect(stripPositions(reparsed.ast?.syntaxFeatures)).toEqual(
        stripPositions(parsed.ast?.syntaxFeatures)
      );
    });
  }
});

describe('printProgram value formatting', () => {
  it('rejects non-finite numbers instead of printing a string', () => {
    const ast = parse('@context { a: 1 }').ast!;
    const block = ast.blocks[0]!;
    const entry = block.canonicalBody!.entries[0] as { value: { value: number } };
    const broken = {
      ...ast,
      blocks: [
        {
          ...block,
          canonicalBody: {
            ...block.canonicalBody!,
            entries: [{ ...entry, value: { ...entry.value, value: Infinity } }],
          },
        },
      ],
    } as unknown as typeof ast;

    expect(() => printProgram(broken)).toThrow('non-finite');
  });

  it('prints numbers without exponent notation', () => {
    const ast = parse('@context { a: 0.0000001 b: 1000000000000000000000 }').ast!;

    const printed = printProgram(ast);

    expect(printed).toContain('a: 0.0000001');
    expect(printed).toContain('b: 1000000000000000000000');
  });

  it('keeps whitespace-only lines inside text values', () => {
    const ast = parse('@knowledge { """\n  a\n     \n  b\n""" }').ast!;

    const reparsed = parse(printProgram(ast)).ast!;

    expect(JSON.stringify(stripPositions(reparsed.blocks[0]?.content))).toContain('a\\n   \\nb');
  });

  it('quotes env references unless the source used the env-var-value feature', () => {
    const quoted = parse('@identity { a: "${HOME}" }').ast!;
    const bare = parse('@identity { a: ${HOME} }').ast!;

    expect(printProgram(quoted)).toContain('a: "${HOME}"');
    expect(printProgram(bare)).toContain('a: ${HOME}');
  });
});
