import { describe, expect, it } from 'vitest';
import { normalizeProvenanceFiles } from '../provenance-files.js';
import type {
  ProvenanceEntry,
  ProvenanceLink,
  ProvenanceStep,
  ProvenanceTrace,
  SourceLocation,
} from '../types/index.js';

const at = (file: string): SourceLocation => ({ file, line: 3, column: 2, offset: 40 });

function link(file: string, target: string, reference: string): ProvenanceLink {
  return { operation: 'inherit', source: at(file), target, reference };
}

function step(source: string, extra: Partial<ProvenanceStep> = {}): ProvenanceStep {
  return { operation: 'declaration', action: 'selected', source: at(source), chain: [], ...extra };
}

function entry(path: string, source: string, history: ProvenanceStep[]): ProvenanceEntry {
  return { path, kind: 'block', source: at(source), history };
}

function trace(entryFile: string, entries: ProvenanceEntry[]): ProvenanceTrace {
  return { version: 1, entry: entryFile, entries };
}

/** Every string stored under a `file`, `entry` or `target` key, at any depth. */
function files(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((item) => files(item, found));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if ((key === 'file' || key === 'entry' || key === 'target') && typeof item === 'string') {
        found.push(item);
      } else files(item, found);
    }
  }
  return found;
}

describe('normalizeProvenanceFiles', () => {
  describe('in-root files', () => {
    it('should make POSIX paths relative to the root', () => {
      const input = trace('/work/app/.promptscript/project.prs', [
        entry('identity', '/work/app/.promptscript/base/team.prs', [
          step('/work/app/.promptscript/base/team.prs'),
        ]),
      ]);

      const result = normalizeProvenanceFiles(input, '/work/app');

      expect(result.entry).toBe('.promptscript/project.prs');
      expect(result.entries[0]?.source.file).toBe('.promptscript/base/team.prs');
      expect(result.entries[0]?.history[0]?.source.file).toBe('.promptscript/base/team.prs');
    });

    it('should make Windows paths relative and keep their original case', () => {
      const input = trace('C:\\Users\\Ann\\app\\.promptscript\\Project.prs', [
        entry('identity', 'c:\\users\\ann\\app\\.promptscript\\Base.prs', []),
      ]);

      const result = normalizeProvenanceFiles(input, 'C:\\Users\\Ann\\app');

      expect(result.entry).toBe('.promptscript/Project.prs');
      expect(result.entries[0]?.source.file).toBe('.promptscript/Base.prs');
    });

    it('should resolve symbolic links before comparing to the root', () => {
      const realpath = (path: string): string => path.replace('/link/', '/real/');
      const input = trace('/link/app/project.prs', []);

      const result = normalizeProvenanceFiles(input, '/real/app', { realpath });

      expect(result.entry).toBe('project.prs');
    });

    it('should keep the path when the resolver throws', () => {
      const realpath = (): string => {
        throw new Error('ENOENT');
      };

      const result = normalizeProvenanceFiles(trace('/work/app/a.prs', []), '/work/app', {
        realpath,
      });

      expect(result.entry).toBe('a.prs');
    });

    it('should normalize Unicode to NFC', () => {
      const decomposed = 'caf\u0065\u0301.prs';

      const result = normalizeProvenanceFiles(trace(`/work/app/${decomposed}`, []), '/work/app');

      expect(result.entry).toBe('caf\u00e9.prs');
    });

    it('should accept a root with a trailing separator', () => {
      const result = normalizeProvenanceFiles(trace('/work/app/a.prs', []), '/work/app/');

      expect(result.entry).toBe('a.prs');
    });

    it('should keep a relative path from a virtual file system', () => {
      const result = normalizeProvenanceFiles(trace('./project.prs', []), undefined);

      expect(result.entry).toBe('project.prs');
    });
  });

  describe('registry and vendored packs', () => {
    const cache = '/home/ann/.promptscript/.cache/git/ab12/@acme/tone.prs';
    const root = '/home/ann/work/app';
    const chain = [link(`${root}/.promptscript/project.prs`, cache, '@acme/tone@1.2.0')];

    it('should name a cached pack by its authored reference', () => {
      const input = trace(`${root}/.promptscript/project.prs`, [
        entry('identity', cache, [
          step(`${root}/.promptscript/project.prs`, { target: cache, chain }),
          step(cache, { chain }),
        ]),
      ]);

      const result = normalizeProvenanceFiles(input, root);

      expect(result.entries[0]?.source.file).toBe('@acme/tone@1.2.0');
      expect(result.entries[0]?.history[1]?.source.file).toBe('@acme/tone@1.2.0');
      expect(result.entries[0]?.history[0]?.target).toBe('@acme/tone@1.2.0');
      expect(result.entries[0]?.history[0]?.chain[0]?.target).toBe('@acme/tone@1.2.0');
    });

    it('should give a vendored pack inside the root the same reference', () => {
      const vendored = `${root}/.promptscript/vendor/acme/tone.prs`;
      const input = trace(`${root}/.promptscript/project.prs`, [
        entry('identity', vendored, [
          step(vendored, {
            chain: [link(`${root}/.promptscript/project.prs`, vendored, '@acme/tone@1.2.0')],
          }),
        ]),
      ]);

      const result = normalizeProvenanceFiles(input, root);

      expect(result.entries[0]?.source.file).toBe('@acme/tone@1.2.0');
    });

    it('should learn references from a nested trace', () => {
      const nested = trace(cache, [entry('identity', cache, [step(cache)])]);
      const input = trace(`${root}/.promptscript/project.prs`, [
        entry('identity', `${root}/.promptscript/project.prs`, [
          step(`${root}/.promptscript/project.prs`, { target: cache, chain, trace: nested }),
        ]),
      ]);

      const result = normalizeProvenanceFiles(input, root);

      const inner = result.entries[0]?.history[0]?.trace;
      expect(inner?.entry).toBe('@acme/tone@1.2.0');
      expect(inner?.entries[0]?.source.file).toBe('@acme/tone@1.2.0');
    });

    it('should not turn a relative import into a reference', () => {
      const outside = '/home/ann/shared/base.prs';
      const input = trace(`${root}/.promptscript/project.prs`, [
        entry('identity', outside, [
          step(outside, {
            chain: [link(`${root}/.promptscript/project.prs`, outside, '../../shared/base.prs')],
          }),
        ]),
      ]);

      const result = normalizeProvenanceFiles(input, root);

      expect(result.entries[0]?.source.file).toBe('external:base.prs');
    });
  });

  describe('failing closed', () => {
    it.each([
      ['an entry outside the root', '/home/ann/other/a.prs', 'external:a.prs'],
      ['a sibling with a shared prefix', '/work/app-two/a.prs', 'external:a.prs'],
      ['a path that climbs out of the root', '/work/app/../secret/b.prs', 'external:b.prs'],
      ['a Windows path on another drive', 'D:\\data\\c.prs', 'external:c.prs'],
      ['a UNC path', '\\\\server\\share\\d.prs', 'external:d.prs'],
      ['a relative path that climbs', '../e.prs', 'external:e.prs'],
    ])('should name %s as external', (_name, file, expected) => {
      const result = normalizeProvenanceFiles(trace(file, []), '/work/app');

      expect(result.entry).toBe(expected);
    });

    it('should name every absolute file external without a root', () => {
      const result = normalizeProvenanceFiles(trace('/work/app/a.prs', []), undefined);

      expect(result.entry).toBe('external:a.prs');
    });

    it('should leave no home directory, user name or cache path anywhere', () => {
      const root = '/Users/ann/work/app';
      const cache = '/Users/ann/.promptscript/.cache/git/ab12/@acme/tone.prs';
      const outside = '/Users/ann/Desktop/notes.prs';
      const inner = trace(cache, [entry('identity', cache, [step(cache)])]);
      const input = trace(outside, [
        entry('identity', cache, [
          step(`${root}/p.prs`, {
            target: cache,
            chain: [link(outside, cache, '@acme/tone@1.2.0')],
            trace: inner,
          }),
          step(outside, { target: '/Users/ann/Desktop/x.prs' }),
        ]),
      ]);

      const result = normalizeProvenanceFiles(input, root);

      const text = files(result).join('\n');
      expect(text).not.toContain('/Users');
      expect(text).not.toContain('ann');
      expect(text).not.toContain('.cache');
    });
  });

  it('should keep lines, columns and non-path targets', () => {
    const input = trace('/work/app/a.prs', [
      entry('prompts.reply', '/work/app/a.prs', [
        step('/work/app/a.prs', { operation: 'extend', target: 'prompts.reply', strategy: 'x' }),
      ]),
    ]);

    const result = normalizeProvenanceFiles(input, '/work/app');

    expect(result.entries[0]?.source).toEqual({ file: 'a.prs', line: 3, column: 2, offset: 40 });
    expect(result.entries[0]?.history[0]?.target).toBe('prompts.reply');
    expect(result.entries[0]?.history[0]?.strategy).toBe('x');
  });

  it('should not change its input', () => {
    const input = trace('/work/app/a.prs', [entry('identity', '/work/app/a.prs', [])]);
    const before = JSON.stringify(input);

    normalizeProvenanceFiles(input, '/work/app');

    expect(JSON.stringify(input)).toBe(before);
  });
});
