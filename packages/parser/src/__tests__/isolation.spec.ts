import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import {
  createParser,
  createVisitor,
  parse,
  parseCanonical,
  parseCanonicalFile,
  parseFile,
  PSLexer,
} from '../index.js';
import {
  acquireParser,
  clearParserPool,
  pooledParserCount,
  releaseParser,
} from '../grammar/parser-pool.js';
import type { CanonicalParseResult } from '../index.js';

function readCanonicalField(result: CanonicalParseResult, name: string): string {
  const block = result.ast?.blocks[0];
  const entry = block?.body.entries.find(
    (candidate) => candidate.type === 'FieldEntry' && candidate.name === name
  );
  if (!entry || entry.type !== 'FieldEntry' || entry.value.type !== 'ScalarValueNode') {
    throw new Error(`Expected scalar field ${name}`);
  }
  if (typeof entry.value.value !== 'string') {
    throw new Error(`Expected string field ${name}`);
  }
  return entry.value.value;
}

describe('parser request isolation', () => {
  it('creates independent parser and visitor instances', () => {
    expect(createParser()).not.toBe(createParser());
    expect(createVisitor()).not.toBe(createVisitor());
  });

  it('isolates reentrant providers and diagnostics', () => {
    let nestedResult: CanonicalParseResult | undefined;
    const outerResult = parseCanonical(
      '@context { invalid!: "outer" = "default" first: "${OUTER}" second: "${OUTER_SECOND}" }',
      {
        filename: 'outer.prs',
        recovery: true,
        interpolateEnv: true,
        envProvider: (name) => {
          if (name === 'OUTER') {
            nestedResult = parseCanonical(
              '@context { invalid!: "${INNER}" = "default" value: "${INNER_VALUE}" }',
              {
                filename: 'inner.prs',
                recovery: true,
                interpolateEnv: true,
                envProvider: () => 'inner',
              }
            );
          }
          return 'outer';
        },
      }
    );

    expect(nestedResult).toBeDefined();
    expect(readCanonicalField(outerResult, 'first')).toBe('outer');
    expect(readCanonicalField(outerResult, 'second')).toBe('outer');
    expect(outerResult.errors).toHaveLength(1);
    expect(outerResult.errors[0]?.location).toMatchObject({ file: 'outer.prs' });
    expect(readCanonicalField(nestedResult!, 'value')).toBe('inner');
    expect(nestedResult?.errors).toHaveLength(1);
    expect(nestedResult?.errors[0]?.location).toMatchObject({ file: 'inner.prs' });
  });

  it('isolates concurrent source and file helper calls', async () => {
    const fixturePath = fileURLToPath(new URL('./__fixtures__/minimal.prs', import.meta.url));
    const [legacy, canonical, legacyFile, canonicalFile] = await Promise.all([
      Promise.resolve().then(() =>
        parse('@context { value: "${SOURCE_A}" }', {
          interpolateEnv: true,
          envProvider: () => 'source-a',
        })
      ),
      Promise.resolve().then(() =>
        parseCanonical('@context { value: "${SOURCE_B}" }', {
          interpolateEnv: true,
          envProvider: () => 'source-b',
        })
      ),
      Promise.resolve().then(() =>
        parseFile(fixturePath, {
          interpolateEnv: true,
          envProvider: () => 'file-a',
        })
      ),
      Promise.resolve().then(() =>
        parseCanonicalFile(fixturePath, {
          interpolateEnv: true,
          envProvider: () => 'file-b',
        })
      ),
    ]);

    expect(legacy.errors).toEqual([]);
    expect(legacy.ast?.blocks[0]?.content).toMatchObject({
      properties: { value: 'source-a' },
    });
    expect(canonical.errors).toEqual([]);
    expect(readCanonicalField(canonical, 'value')).toBe('source-b');
    expect(legacyFile.errors).toEqual([]);
    expect(canonicalFile.errors).toEqual([]);
  });

  it('does not leak parser errors between pooled requests', () => {
    const failing = parseCanonical('@context { value: }', { filename: 'broken.prs' });
    expect(failing.errors.length).toBeGreaterThan(0);

    const succeeding = parseCanonical('@context { value: "ok" }', { filename: 'clean.prs' });
    expect(succeeding.errors).toEqual([]);
    expect(readCanonicalField(succeeding, 'value')).toBe('ok');
  });

  it('hands out distinct instances while a parse is in flight', () => {
    clearParserPool();
    const inFlight = acquireParser();
    const nested = acquireParser();

    expect(nested).not.toBe(inFlight);

    releaseParser(nested);
    releaseParser(inFlight);
    expect(pooledParserCount()).toBe(2);
  });

  it('reuses released instances instead of rebuilding the grammar', () => {
    clearParserPool();
    const first = acquireParser();
    releaseParser(first);

    expect(acquireParser()).toBe(first);
  });

  it('caps the pool so a burst of parses cannot retain instances forever', () => {
    clearParserPool();
    const burst = Array.from({ length: 12 }, () => acquireParser());
    for (const instance of burst) {
      releaseParser(instance);
    }

    expect(pooledParserCount()).toBe(8);
  });

  it('clears request state when an instance returns to the pool', () => {
    clearParserPool();
    const instance = acquireParser();
    instance.input = PSLexer.tokenize('@context { value: }').tokens;
    instance.program();
    expect(instance.errors.length).toBeGreaterThan(0);

    releaseParser(instance);

    const reused = acquireParser();
    expect(reused).toBe(instance);
    expect(reused.errors).toEqual([]);
    expect(reused.input).toEqual([]);
  });

  it('keeps nested parses independent while the outer parser is checked out', () => {
    clearParserPool();
    let nested: CanonicalParseResult | undefined;
    const outer = parseCanonical('@context { value: "${OUTER}" }', {
      filename: 'outer.prs',
      interpolateEnv: true,
      envProvider: () => {
        nested ??= parseCanonical('@context { value: }', { filename: 'nested.prs' });
        return 'outer-value';
      },
    });

    expect(nested?.errors.length).toBeGreaterThan(0);
    expect(nested?.errors[0]?.location).toMatchObject({ file: 'nested.prs' });
    expect(outer.errors).toEqual([]);
    expect(readCanonicalField(outer, 'value')).toBe('outer-value');
  });
});
