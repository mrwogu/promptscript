import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BlockBody, CanonicalProgram, FieldEntry } from '@promptscript/core';
import { parseCanonical } from '../parse.js';
import { printProgram } from '../printer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..', '..', '..');

/** Source-position metadata, which a printer cannot and should not preserve. */
const POSITION_KEYS = new Set(['loc', 'titleLoc', 'sectionLoc', 'location']);

/** The parser's source position shape; user fields that merely share a key name do not match it. */
function isPosition(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'line' in value &&
    typeof value.line === 'number' &&
    'column' in value &&
    typeof value.column === 'number'
  );
}

function stripPositions(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripPositions);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) => !(POSITION_KEYS.has(key) && isPosition(entry)))
        .map(([key, entry]) => [key, stripPositions(entry)])
    );
  }
  return value;
}

/** Blank entries may legitimately vanish on the first print, so only real comments are compared. */
function commentTexts(comments: readonly { kind: string; text: string }[]): string[] {
  return comments.filter((comment) => comment.kind === 'comment').map((comment) => comment.text);
}

function expectNoTrailingWhitespace(printed: string): void {
  expect(printed.split('\n').filter((line) => /[ \t]+$/.test(line))).toEqual([]);
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
      const result = parseCanonical(source);

      expect(result.errors).toEqual([]);
      expect(result.ast).not.toBeNull();
    }
  );

  for (const { name, source } of fixtures) {
    const reason = KNOWN_FAILURES[name];
    const test = reason ? it.skip : it;
    test(`reparses its own output: ${name}${reason ? ` (${reason})` : ''}`, () => {
      // Arrange
      const original = parseCanonical(source);

      // Act
      const printed = printProgram(original.ast!, original.comments);
      const reparsed = parseCanonical(printed);

      // Assert
      expect(reparsed.errors).toEqual([]);
      expect(stripPositions(reparsed.ast)).toEqual(stripPositions(original.ast));
      expect(commentTexts(reparsed.comments)).toEqual(commentTexts(original.comments));
      expect(printProgram(reparsed.ast!, reparsed.comments)).toBe(printed);
    });
  }
});

/**
 * Syntax that no fixture file exercises, so the printer is checked against it directly.
 * The sources live in a fixture so they read as plain `.prs` text. Each case starts with a
 * `### <name>` line; its body runs to the next marker minus the final line break.
 */
function loadEdgeCases(): Record<string, string> {
  const text = readFileSync(join(__dirname, 'fixtures', 'printer-edge-cases.txt'), 'utf-8');
  return Object.fromEntries(
    text
      .split(/^### /m)
      .slice(1)
      .map((chunk) => {
        const newline = chunk.indexOf('\n');
        return [chunk.slice(0, newline), chunk.slice(newline + 1).replace(/\n$/, '')] as const;
      })
  );
}

const EDGE_CASES = loadEdgeCases();

/** Cases whose text content legitimately holds whitespace-only lines. */
const KEEPS_WHITESPACE: Record<string, true> = { 'whitespace-only lines in text': true };

describe('printProgram edge cases', () => {
  for (const [name, source] of Object.entries(EDGE_CASES)) {
    const reason = KNOWN_EDGE_FAILURES[name];
    const test = reason ? it.skip : it;
    test(`reparses its own output: ${name}${reason ? ` (${reason})` : ''}`, () => {
      // Arrange
      const parsed = parseCanonical(source);
      expect(parsed.errors).toEqual([]);

      // Act
      const printed = printProgram(parsed.ast!, parsed.comments);
      const reparsed = parseCanonical(printed);

      // Assert
      expect(reparsed.errors).toEqual([]);
      expect(stripPositions(reparsed.ast)).toEqual(stripPositions(parsed.ast));
      expect(stripPositions(reparsed.ast?.syntaxFeatures)).toEqual(
        stripPositions(parsed.ast?.syntaxFeatures)
      );
      expect(commentTexts(reparsed.comments)).toEqual(commentTexts(parsed.comments));
      expect(printProgram(reparsed.ast!, reparsed.comments)).toBe(printed);
      if (!(name in KEEPS_WHITESPACE)) expectNoTrailingWhitespace(printed);
    });
  }
});

describe('printProgram comments', () => {
  it('keeps source order of declarations instead of grouping by kind', () => {
    const parsed = parseCanonical(
      '@identity { a: 1 }\n@use ./f\n@extend identity { b: 1 }\n@context { c: 1 }'
    );

    const printed = printProgram(parsed.ast!, parsed.comments);

    const order = ['@identity', '@use', '@extend', '@context'].map((name) => printed.indexOf(name));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order).not.toContain(-1);
  });

  it('prints a leading comment directly above the item it described', () => {
    const parsed = parseCanonical('@identity {\n  a: 1\n  # about b\n  b: 2\n}');

    const printed = printProgram(parsed.ast!, parsed.comments);

    expect(printed).toBe('@identity {\n  a: 1\n  # about b\n  b: 2\n}\n');
  });

  it('keeps a trailing comment on the line of its field', () => {
    const parsed = parseCanonical('@identity {\n  a: 1 # one\n  b: 2\n}');

    expect(printProgram(parsed.ast!, parsed.comments)).toContain('  a: 1 # one\n  b: 2');
  });

  it('prints a comment after the last field before the closing brace', () => {
    const parsed = parseCanonical('@identity {\n  a: 1\n  # last\n}\n@context { b: 2 }');

    expect(printProgram(parsed.ast!, parsed.comments)).toContain('  a: 1\n  # last\n}\n@context');
  });

  it('does not treat a hash inside a string as a comment', () => {
    const parsed = parseCanonical('@identity { a: "x # y" }');

    expect(parsed.comments).toEqual([]);
  });

  it('keeps a user field named location through the round trip', () => {
    const parsed = parseCanonical('@context { location: "x" }');

    const reparsed = parseCanonical(printProgram(parsed.ast!, parsed.comments));

    expect(JSON.stringify(stripPositions(reparsed.ast))).toContain('"name":"location"');
    expect(stripPositions(reparsed.ast)).toEqual(stripPositions(parsed.ast));
  });

  it('reports each comment with its text, position and nesting depth', () => {
    const parsed = parseCanonical(
      '# top\n@identity { # open\n  a: 1 # inner\n  b: """\n  x\n  """ # after text\n}'
    );

    expect(parsed.comments.map((c) => [c.text, c.loc.line, c.depth, c.trailing])).toEqual([
      ['# top', 1, 0, false],
      ['# open', 2, 1, true],
      ['# inner', 3, 1, true],
      ['# after text', 6, 1, true],
    ]);
  });
});

describe('printProgram nested comments', () => {
  it('keeps comments inside nested objects at their own level', () => {
    const source = readFileSync(
      join(repoRoot, 'packages/parser/src/__tests__/__fixtures__/comprehensive.prs'),
      'utf-8'
    );
    const parsed = parseCanonical(source);

    const printed = printProgram(parsed.ast!, parsed.comments);

    expect(printed).toContain(
      '  code: {\n    # Level 2\n    style: {\n      # Level 3\n      indentation: {\n        # Level 4\n        type: "spaces"'
    );
  });

  it('puts the comma before a trailing comment in an array', () => {
    const parsed = parseCanonical('@context {\n  a: [\n    1, # first\n    2\n  ]\n}');

    expect(printProgram(parsed.ast!, parsed.comments)).toBe(
      '@context {\n  a: [\n    1, # first\n    2\n  ]\n}\n'
    );
  });

  it('moves comments inside @meta before its closing brace, keeping text and order', () => {
    // Known limit: MetaBlock fields have no positions in core, so they cannot be placed per field. Tracked in #555.
    const parsed = parseCanonical('@meta {\n  # the id\n  id: "a"\n  syntax: "1.0.0"\n}');

    expect(printProgram(parsed.ast!, parsed.comments)).toBe(
      '@meta {\n  id: "a"\n  syntax: "1.0.0"\n  # the id\n}\n'
    );
  });

  it('keeps a comment that follows a stray closing brace in recovery mode', () => {
    const parsed = parseCanonical('@identity { a: 1 }\n}\n# lost\n@context { b: 2 }', {
      recovery: true,
    });

    expect(parsed.comments.map((c) => [c.text, c.depth])).toEqual([['# lost', 0]]);
    expect(printProgram(parsed.ast!, parsed.comments)).toContain('# lost');
  });
});

describe('printProgram value formatting', () => {
  it('rejects non-finite numbers instead of printing a string', () => {
    const parsed = parseCanonical('@context { a: 1 }').ast!;
    const { loc } = parsed;
    const entry: FieldEntry = {
      type: 'FieldEntry',
      name: 'a',
      value: { type: 'ScalarValueNode', value: Infinity, loc },
      loc,
    };
    const body: BlockBody = { type: 'BlockBody', shape: 'object', entries: [entry], loc };
    const operation = parsed.operations[0]!;
    if (operation.type !== 'BlockOperation') throw new Error('expected a block operation');
    const broken: CanonicalProgram = {
      ...parsed,
      operations: [{ ...operation, block: { ...operation.block, body } }],
    };

    expect(() => printProgram(broken)).toThrow('non-finite');
  });

  it('prints numbers without exponent notation', () => {
    const ast = parseCanonical('@context { a: 0.0000001 b: 1000000000000000000000 }').ast!;

    const printed = printProgram(ast);

    expect(printed).toContain('a: 0.0000001');
    expect(printed).toContain('b: 1000000000000000000000');
  });

  it('keeps whitespace-only lines inside text values', () => {
    const ast = parseCanonical('@knowledge { """\n  a\n     \n  b\n""" }').ast!;

    const reparsed = parseCanonical(printProgram(ast)).ast!;

    expect(JSON.stringify(stripPositions(reparsed.blocks[0]?.content))).toContain('a\\n   \\nb');
  });

  it('quotes env references unless the source used the env-var-value feature', () => {
    const quoted = parseCanonical('@identity { a: "${HOME}" }').ast!;
    const bare = parseCanonical('@identity { a: ${HOME} }').ast!;

    expect(printProgram(quoted)).toContain('a: "${HOME}"');
    expect(printProgram(bare)).toContain('a: ${HOME}');
  });
});

describe('printProgram layout', () => {
  const print = (source: string): string => {
    const parsed = parseCanonical(source);
    return printProgram(parsed.ast!, parsed.comments);
  };

  it('records one blank entry per run, never inside a text block', () => {
    const parsed = parseCanonical('@a { x: 1\n\n\n y: """\n p\n\n q\n""" }');

    expect(parsed.comments.map((c) => [c.kind, c.loc.line, c.depth])).toEqual([['blank', 2, 1]]);
  });

  it('keeps all content when a blank line sits between a comment and its block', () => {
    expect(print('# note\n\n@identity { a: 1 }')).toBe('# note\n\n@identity {\n  a: 1\n}\n');
  });

  it('prints no trailing whitespace for a whitespace-only source line', () => {
    expect(print('@identity {\n  a: 1\n   \n  b: 2\n}')).toBe('@identity {\n  a: 1\n\n  b: 2\n}\n');
  });
});
