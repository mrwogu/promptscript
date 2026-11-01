import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CODE_LIBRARIES,
  LIBRARIES,
  pinInternalDependencies,
  wiringFailures,
} from './library-packages.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

describe('pinInternalDependencies', () => {
  it('pins workspace:* to the exact version and keeps other dependencies', () => {
    const manifest = {
      dependencies: { '@promptscript/core': 'workspace:*', chevrotain: '^13.2.0' },
    };

    const result = pinInternalDependencies(manifest, '1.2.3');

    expect(result.dependencies).toEqual({ '@promptscript/core': '1.2.3', chevrotain: '^13.2.0' });
  });

  it('is idempotent', () => {
    const manifest = { dependencies: { '@promptscript/core': 'workspace:*' } };

    pinInternalDependencies(manifest, '1.2.3');
    pinInternalDependencies(manifest, '1.2.3');

    expect(manifest.dependencies['@promptscript/core']).toBe('1.2.3');
  });

  it('throws on any other spec of an internal package', () => {
    const manifest = { dependencies: { '@promptscript/core': 'workspace:^' } };

    expect(() => pinInternalDependencies(manifest, '1.2.3')).toThrow(/@promptscript\/core/);
  });

  it('accepts a manifest without dependencies', () => {
    expect(pinInternalDependencies({}, '1.2.3')).toEqual({});
  });
});

describe('library lists', () => {
  it('keeps schemas out of the code libraries', () => {
    expect(LIBRARIES).toContain('schemas');
    expect(CODE_LIBRARIES).not.toContain('schemas');
    expect(CODE_LIBRARIES).toHaveLength(LIBRARIES.length - 1);
  });
});

describe('wiringFailures', () => {
  it('finds no problem in this repository', () => {
    expect(wiringFailures(repoRoot)).toEqual([]);
  });

  it('reports a library without the nx-release-publish target', () => {
    const copy = mkdtempSync(join(tmpdir(), 'prs-wiring-'));
    try {
      for (const file of [
        'nx.json',
        'release-please-config.json',
        '.release-please-manifest.json',
      ]) {
        cpSync(join(repoRoot, file), join(copy, file));
      }
      for (const name of [...LIBRARIES, 'cli']) {
        cpSync(join(repoRoot, 'packages', name), join(copy, 'packages', name), {
          recursive: true,
          filter: (source) => /(package|project)\.json$|packages\/[^/]+$/.test(source),
        });
      }
      const path = join(copy, 'packages/core/project.json');
      const project = JSON.parse(readFileSync(path, 'utf8')) as {
        targets: Record<string, unknown>;
      };
      delete project.targets['nx-release-publish'];
      writeFileSync(path, JSON.stringify(project));

      expect(wiringFailures(copy)).toEqual([
        'packages/core/project.json: nx-release-publish.options.packageRoot must be dist/{projectRoot}',
      ]);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
  });
});
