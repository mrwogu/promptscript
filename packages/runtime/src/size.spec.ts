import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

const here = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// What a Node application bundles: the main entry plus the node entry
const BOTH = "export * from './index.ts'; export * from './node.ts';";
// The main entry with the telemetry entry, which imports nothing
const WITH_OTEL = "export * from './index.ts'; export * from './otel.ts';";
const ALL = `${BOTH} export * from './otel.ts';`;

/** Bundle entry code from source the way a consumer bundles the dist. */
async function bundle(contents: string, platform: 'neutral' | 'node') {
  const result = await build({
    stdin: { contents, resolveDir: here('.'), loader: 'ts' },
    bundle: true,
    minify: true,
    format: 'esm',
    platform,
    target: 'es2022',
    write: false,
    metafile: true,
    logLevel: 'silent',
    ...(platform === 'node' && { external: ['node:*'] }),
  });
  const code = result.outputFiles[0]?.text ?? '';
  const imports = Object.values(result.metafile.outputs).flatMap((output) =>
    output.imports.map((item) => item.path)
  );
  return { code, imports, gzipped: gzipSync(code).byteLength };
}

describe('package size and surface', () => {
  it('keeps the main entry within 12288 bytes, min+gzip, with no import', async () => {
    const { gzipped, imports } = await bundle("export * from './index.ts';", 'neutral');

    expect(gzipped).toBeLessThanOrEqual(12_288);
    expect(imports).toEqual([]);
  });

  it('keeps the main and telemetry entries within 14336 bytes, min+gzip, with no import', async () => {
    const { gzipped, imports } = await bundle(WITH_OTEL, 'neutral');

    expect(gzipped).toBeLessThanOrEqual(14_336);
    expect(imports).toEqual([]);
  });

  it('keeps both entries within 13312 bytes and imports only fs and path', async () => {
    const { gzipped, imports } = await bundle(BOTH, 'node');

    expect(gzipped).toBeLessThanOrEqual(13_312);
    expect([...new Set(imports)].sort()).toEqual(['node:fs/promises', 'node:path']);
  });

  it('keeps all three entries within 14848 bytes and imports only fs and path', async () => {
    const { gzipped, imports } = await bundle(ALL, 'node');

    expect(gzipped).toBeLessThanOrEqual(14_848);
    expect([...new Set(imports)].sort()).toEqual(['node:fs/promises', 'node:path']);
  });

  it('reads no environment and never logs', async () => {
    const { code } = await bundle(ALL, 'node');

    for (const token of ['process.', 'Buffer', 'console.', 'require(', 'Deno.env']) {
      expect(code).not.toContain(token);
    }
  });

  it('declares no dependency but the optional OpenTelemetry API peer, and every export has a source', () => {
    // Arrange
    const manifest = JSON.parse(readFileSync(here('../package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    const exportsMap = manifest['exports'] as Record<string, string | Record<string, string>>;

    // Act
    const targets = Object.values(exportsMap).flatMap((target) =>
      typeof target === 'string' ? [] : Object.values(target)
    );

    // Assert
    for (const field of ['dependencies', 'optionalDependencies', 'scripts']) {
      expect(manifest).not.toHaveProperty(field);
    }
    expect(manifest['peerDependencies']).toEqual({ '@opentelemetry/api': '>=1.9.0 <2' });
    expect(manifest['peerDependenciesMeta']).toEqual({
      '@opentelemetry/api': { optional: true },
    });
    expect(manifest).toMatchObject({
      type: 'module',
      sideEffects: false,
      engines: { node: '>=22' },
    });
    for (const target of targets) {
      const source = target.replace(/\.d\.ts$|\.js$/, '.ts');
      expect(existsSync(here(`.${source.slice(5)}`)), target).toBe(true);
    }
  });

  it('never imports the OpenTelemetry package, not even for types', () => {
    // Arrange
    const files = [
      here('./otel.ts'),
      ...readdirSync(here('./otel'))
        .filter((name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'))
        .map((name) => here(`./otel/${name}`)),
    ];

    // Act
    const code = files.map((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
        .join('\n')
    );

    // Assert
    expect(files.length).toBeGreaterThan(1);
    for (const text of code) expect(text).not.toContain('@opentelemetry/');
  });
});
