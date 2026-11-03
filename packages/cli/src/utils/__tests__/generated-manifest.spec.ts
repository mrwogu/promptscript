import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildGeneratedManifest,
  findStaleManifestFiles,
  GENERATED_MANIFEST_FILE,
  hashContent,
  isInScope,
  isManifestTracked,
  isOwnedByManifest,
  readGeneratedManifest,
  renderGeneratedManifest,
  type GeneratedManifest,
} from '../generated-manifest.js';

const directories: string[] = [];

async function outputRoot(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-manifest-'));
  directories.push(root);
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), content);
  }
  return root;
}

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('generated files manifest', () => {
  it('renders sorted paths so equal input gives equal bytes', () => {
    const first = renderGeneratedManifest({
      'b.md': { sha256: 'b', target: 'claude' },
      'a.md': { sha256: 'a', target: 'factory', build: 'docs' },
    });
    const second = renderGeneratedManifest({
      'a.md': { build: 'docs', target: 'factory', sha256: 'a' },
      'b.md': { target: 'claude', sha256: 'b' },
    });
    expect(first).toBe(second);
    expect(first.indexOf('a.md')).toBeLessThan(first.indexOf('b.md'));
    expect(first.endsWith('}\n')).toBe(true);
  });

  it('reads what it renders and gives undefined for a broken file', async () => {
    const files = { 'a.md': { sha256: hashContent('a'), target: 'claude' } };
    const good = await outputRoot({ [GENERATED_MANIFEST_FILE]: renderGeneratedManifest(files) });
    expect(await readGeneratedManifest(good)).toEqual({ version: 1, files });

    const broken = await outputRoot({ [GENERATED_MANIFEST_FILE]: '{ not json' });
    expect(await readGeneratedManifest(broken)).toBeUndefined();
    const wrongVersion = await outputRoot({
      [GENERATED_MANIFEST_FILE]: '{"version": 2, "files": {}}',
    });
    expect(await readGeneratedManifest(wrongVersion)).toBeUndefined();
    expect(await readGeneratedManifest(await outputRoot({}))).toBeUndefined();
  });

  it('drops entries without a hash when reading', async () => {
    const root = await outputRoot({
      [GENERATED_MANIFEST_FILE]: '{"version": 1, "files": {"a.md": {}, "b.md": {"sha256": "x"}}}',
    });
    expect(await readGeneratedManifest(root)).toEqual({
      version: 1,
      files: { 'b.md': { sha256: 'x' } },
    });
  });

  it('owns a file only while its content matches the hash', () => {
    const manifest: GeneratedManifest = {
      version: 1,
      files: { 'a.md': { sha256: hashContent('generated') } },
    };
    expect(isOwnedByManifest(manifest, 'a.md', 'generated')).toBe(true);
    expect(isOwnedByManifest(manifest, 'a.md', 'edited')).toBe(false);
    expect(isOwnedByManifest(manifest, 'b.md', 'generated')).toBe(false);
    expect(isOwnedByManifest(undefined, 'a.md', 'generated')).toBe(false);
  });

  it('leaves hook and merged files to the hook ownership rules', () => {
    expect(isManifestTracked({ path: 'CLAUDE.md', content: '' })).toBe(true);
    expect(isManifestTracked({ path: '.claude/settings.json', content: '{}' })).toBe(false);
    expect(
      isManifestTracked({
        path: '.mcp.json',
        content: '{}',
        merge: { format: 'json', ownedPaths: [] } as never,
      })
    ).toBe(false);
  });

  it('scopes entries by build and target', () => {
    const entry = { sha256: 'x', target: 'claude' };
    expect(isInScope(entry, {})).toBe(true);
    expect(isInScope(entry, { targets: new Set(['claude']) })).toBe(true);
    expect(isInScope(entry, { targets: new Set(['factory']) })).toBe(false);
    expect(isInScope(entry, { build: 'docs' })).toBe(false);
    expect(isInScope({ ...entry, build: 'docs' }, { build: 'docs' })).toBe(true);
  });

  it('splits stale files into unchanged and edited ones', async () => {
    const root = await outputRoot({
      'kept.md': 'kept',
      'old.md': 'old',
      'edited.md': 'mine now',
      'other.md': 'other',
    });
    const manifest: GeneratedManifest = {
      version: 1,
      files: {
        'kept.md': { sha256: hashContent('kept'), target: 'claude' },
        'old.md': { sha256: hashContent('old'), target: 'claude' },
        'edited.md': { sha256: hashContent('edited'), target: 'claude' },
        'gone.md': { sha256: hashContent('gone'), target: 'claude' },
        'other.md': { sha256: hashContent('other'), target: 'factory' },
      },
    };

    const stale = await findStaleManifestFiles(manifest, new Set(['kept.md']), root, {
      targets: new Set(['claude']),
    });

    expect(stale).toEqual({ unchanged: ['old.md'], edited: ['edited.md'] });
  });

  it('builds the next manifest from disk and keeps entries of other scopes', async () => {
    const root = await outputRoot({ 'new.md': 'new content', 'edited.md': 'mine' });
    const previous: GeneratedManifest = {
      version: 1,
      files: {
        'old.md': { sha256: 'o', target: 'claude' },
        'edited.md': { sha256: 'e', target: 'claude' },
        'other.md': { sha256: 'x', target: 'factory' },
      },
    };

    const files = await buildGeneratedManifest(
      previous,
      [
        { path: 'new.md', content: 'new content', target: 'claude' },
        { path: 'missing.md', content: 'never written', target: 'claude' },
      ],
      root,
      { targets: new Set(['claude']) },
      ['edited.md']
    );

    expect(files).toEqual({
      'new.md': { sha256: hashContent('new content'), target: 'claude' },
      'edited.md': { sha256: 'e', target: 'claude' },
      'other.md': { sha256: 'x', target: 'factory' },
    });
  });
});
