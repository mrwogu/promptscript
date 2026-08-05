import { describe, expect, it, vi } from 'vitest';
import { parse, parseCanonical, parseCanonicalOrThrow, parseOrThrow } from '../index.js';

describe('canonical AST', () => {
  it('preserves top-level declaration order', () => {
    const ast = parseCanonicalOrThrow(
      `
      @use ./shared
      @identity { """Local identity""" }
      @extend identity { """Extended identity""" }
      @context { runtime: "node" }
      `,
      { filename: 'ordered.prs' }
    );

    expect(ast.operations.map((operation) => operation.type)).toEqual([
      'UseOperation',
      'BlockOperation',
      'ExtendOperation',
      'BlockOperation',
    ]);
    expect(ast.uses).toHaveLength(1);
    expect(ast.blocks.map((block) => block.name)).toEqual(['identity', 'context']);
    expect(ast.extends).toHaveLength(1);
  });

  it('preserves explicit overrides in declaration order and legacy projections', () => {
    const source = `
      @meta { id: "override-order" syntax: "1.5.0" }
      @standards { testing: ["Old"] }
      @override standards.testing { ["Use Vitest"] }
      @extend standards.testing { - "Require coverage" }
    `;
    const canonical = parseCanonicalOrThrow(source, { filename: 'override.prs' });
    const legacy = parseOrThrow(source, { filename: 'override.prs' });

    expect(canonical.operations.map((operation) => operation.type)).toEqual([
      'BlockOperation',
      'OverrideOperation',
      'ExtendOperation',
    ]);
    expect(canonical.overrides).toHaveLength(1);
    expect(canonical.overrides?.[0]?.replacement.type).toBe('ValueReplacement');
    expect(legacy.overrides).toHaveLength(1);
    expect(legacy.overrides?.[0]?.targetPath).toBe('standards.testing');
  });

  it('parses regular block bodies and standalone override values', () => {
    const ast = parseCanonicalOrThrow(`
      @meta { id: "override-values" syntax: "1.5.0" }
      @standards { testing: ["Old"] }
      @override standards { testing: ["New"] }
      @override standards.testing { { runner: "vitest" } }
      @override standards.testing.runner { "node" }
      @override standards.testing.enabled { true }
      @override standards.testing.retries { 3 }
      @override standards.testing.optional { null }
    `);

    expect(ast.overrides?.map((operation) => operation.replacement.type)).toEqual([
      'BlockReplacement',
      'ValueReplacement',
      'ValueReplacement',
      'ValueReplacement',
      'ValueReplacement',
      'ValueReplacement',
    ]);
  });

  it('keeps @override without a target as a custom block', () => {
    const ast = parseCanonicalOrThrow(`
      @meta { id: "custom-override" syntax: "1.0.0" }
      @override { mode: "custom" }
    `);

    expect(ast.blocks.map((block) => block.name)).toEqual(['override']);
    expect(ast.overrides).toEqual([]);
    expect(ast.syntaxFeatures).toEqual([]);
  });

  it('keeps override legal in fields, aliases, parameters, and path segments', () => {
    const ast = parseCanonicalOrThrow(`
      @meta { id: "override-identifiers" syntax: "1.5.0" }
      @params { override: "default" }
      @use ./shared as override
      @standards { override: true }
      @override standards.override { false }
    `);

    expect(ast.uses[0]?.alias).toBe('override');
    expect(ast.blocks.map((block) => block.name)).toEqual(['params', 'standards']);
    expect(ast.overrides?.[0]?.targetPath).toBe('standards.override');
  });

  it('reports an empty explicit override body', () => {
    const result = parse('@override standards {}', {
      recovery: true,
      filename: 'empty-override.prs',
    });

    expect(result.ast?.overrides).toHaveLength(1);
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: '@override requires a non-empty replacement body.',
      }),
    ]);
  });

  it('reports redundant replace modifiers inside explicit overrides', () => {
    const result = parse('@override standards { testing!: ["Use Vitest"] }', {
      recovery: true,
      filename: 'replace-modifier.prs',
    });

    expect(result.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(
          "The '!' replace modifier is unnecessary inside @override"
        ),
      }),
    ]);
  });

  it('uses one ordered body for text, fields, lists, and inline imports', () => {
    const ast = parseCanonicalOrThrow(
      `
      @standards {
        first: "one"
        @use ./shared
        """Keep this text."""
        - "Keep this item"
        second: { nested: [1, { enabled: true }] }
      }
      `,
      { filename: 'body.prs' }
    );
    const block = ast.blocks[0]!;

    expect(block.body.shape).toBe('mixed');
    expect(block.body.entries.map((entry) => entry.type)).toEqual([
      'FieldEntry',
      'InlineUseEntry',
      'TextEntry',
      'ListEntry',
      'FieldEntry',
    ]);
    expect(block.content.type).toBe('MixedContent');
  });

  it('retains exact locations for nested values', () => {
    const ast = parseCanonicalOrThrow(
      `
      @context {
        config: {
          values: [1, { enabled: true }]
        }
      }
      `,
      { filename: 'locations.prs' }
    );
    const block = ast.blocks[0]!;
    const field = block.body.entries[0]!;
    expect(field.type).toBe('FieldEntry');
    if (field.type !== 'FieldEntry' || field.value.type !== 'ObjectValueNode') {
      throw new Error('Expected canonical object field');
    }
    const values = field.value.fields[0]!;
    expect(values.loc.line).toBe(4);
    expect(values.value.type).toBe('ArrayValueNode');
    if (values.value.type !== 'ArrayValueNode') {
      throw new Error('Expected canonical array value');
    }
    const nested = values.value.elements[1]!;
    expect(nested.loc.line).toBe(4);
    expect(nested.value.type).toBe('ObjectValueNode');
    if (nested.value.type !== 'ObjectValueNode') {
      throw new Error('Expected nested canonical object');
    }
    expect(nested.value.fields[0]!.loc.line).toBe(4);
  });

  it('deep-freezes canonical output', () => {
    const ast = parseCanonicalOrThrow('@identity { """Immutable""" }');

    expect(Object.isFrozen(ast)).toBe(true);
    expect(Object.isFrozen(ast.operations)).toBe(true);
    expect(Object.isFrozen(ast.blocks[0]!.body.entries)).toBe(true);
  });

  it('keeps the legacy parser API mutable and detached', () => {
    const source = '@identity { """Legacy""" }';
    const canonical = parseCanonicalOrThrow(source);
    const legacy = parseOrThrow(source);

    legacy.blocks[0]!.name = 'changed';

    expect(legacy.blocks[0]!.name).toBe('changed');
    expect(canonical.blocks[0]!.name).toBe('identity');
    expect(parse(source).errors).toEqual([]);
  });

  it('reports duplicate inherit declarations without discarding a recovered AST', () => {
    const result = parse(
      `
      @inherit ./first
      @identity { """Local""" }
      @inherit ./second
      `,
      { recovery: true, filename: 'duplicate-inherit.prs' }
    );

    expect(result.ast).not.toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toContain('Only one @inherit');
    expect(result.errors[0]!.location?.line).toBe(4);
  });

  it('reports replace modifiers at their location while preserving recovery output', () => {
    const result = parseCanonical('@context { runtime!: "node" }', {
      recovery: true,
      filename: 'replace.prs',
    });

    expect(result.ast).not.toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.location).toMatchObject({
      file: 'replace.prs',
      line: 1,
      column: 19,
    });
  });

  it('tracks body, list marker, and list value locations separately', () => {
    const ast = parseCanonicalOrThrow('@context { - "item" }', {
      filename: 'list.prs',
    });
    const block = ast.blocks[0]!;
    const item = block.body.entries[0]!;

    expect(block.body.loc.column).toBe(10);
    expect(item.loc.column).toBe(12);
    expect(item.type).toBe('ListEntry');
    if (item.type !== 'ListEntry') {
      throw new Error('Expected list entry');
    }
    expect(item.value.loc.column).toBe(14);
  });

  it('visits nested values once while building values and location nodes', () => {
    const envProvider = vi.fn(() => 'secret');

    const ast = parseCanonicalOrThrow('@context { config: { token: "${TOKEN}" } }', {
      interpolateEnv: true,
      envProvider,
    });

    expect(ast.blocks[0]).toBeDefined();
    expect(envProvider).toHaveBeenCalledTimes(1);
    expect(envProvider).toHaveBeenCalledWith('TOKEN');
  });

  it('rejects replace modifiers in nested objects and meta fields', () => {
    const nested = parseCanonical('@context { config: { nested!: true } }', {
      recovery: true,
    });
    const meta = parseCanonical('@meta { id!: "test" }', {
      recovery: true,
    });

    expect(nested.ast).not.toBeNull();
    expect(nested.errors[0]?.message).toContain('only valid on direct @extend fields');
    expect(meta.ast).not.toBeNull();
    expect(meta.errors[0]?.message).toContain('only valid on direct @extend fields');
  });
});
