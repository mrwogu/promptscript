import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import { mkdir, mkdtemp, open, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PROMPT_BUNDLE_INDEX_SCHEMA_URL,
  PROMPT_BUNDLE_SCHEMA_URL,
  hashPromptBundle,
} from '@promptscript/core';
import {
  PROMPT_RELEASE_LABEL_SCHEMA_URL,
  assertExactCase,
  assertRegularPath,
  labelText,
  parseLabel,
  parseManifest,
  readLabel,
  readManifest,
  readRegularFile,
  releasePaths,
  shortHash,
  verifyBundleText,
} from './layout.js';

// readSync passes through to the real one unless a test replaces one call.
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, readSync: vi.fn(actual.readSync) };
});

const HASH = `sha256-${'0123456789abcdef'.repeat(4)}`;
const directories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-release-layout-'));
  directories.push(directory);
  return directory;
}

function bundleText(id = 'acme/refund'): { text: string; contentHash: string } {
  const bundle: Record<string, unknown> = {
    $schema: PROMPT_BUNDLE_SCHEMA_URL,
    id,
    description: 'Refund',
    messages: [{ role: 'system', content: 'You answer refunds.' }],
    inputs: {},
  };
  const contentHash = hashPromptBundle(bundle);
  return { text: JSON.stringify({ ...bundle, contentHash }, null, 2), contentHash };
}

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('releasePaths', () => {
  it('places every release file under .promptscript/releases', () => {
    const paths = releasePaths('/repo');

    expect(paths.relative(paths.manifest)).toBe('.promptscript/releases/manifest.json');
    expect(paths.relative(paths.label('prod'))).toBe('.promptscript/releases/prod.json');
    expect(paths.relative(paths.bundle(HASH))).toBe(`.promptscript/releases/bundles/${HASH}.json`);
    expect(paths.relative(paths.lock)).toBe('.promptscript-release.lock');
  });

  it('shortens a hash to 12 hex digits', () => {
    expect(shortHash(HASH)).toBe('sha256-0123456789ab');
  });
});

describe('labelText', () => {
  it('sorts the prompts by id and drops unknown entry fields', () => {
    const text = labelText({
      $schema: PROMPT_RELEASE_LABEL_SCHEMA_URL,
      environment: 'prod',
      prompts: [
        { id: 'b', contentHash: HASH },
        { id: 'a', contentHash: HASH, extra: true } as { id: string; contentHash: string },
      ],
    });

    expect(JSON.parse(text)).toEqual({
      $schema: PROMPT_RELEASE_LABEL_SCHEMA_URL,
      environment: 'prod',
      prompts: [
        { id: 'a', contentHash: HASH },
        { id: 'b', contentHash: HASH },
      ],
    });
    expect(text.endsWith('}\n')).toBe(true);
  });
});

describe('parseLabel', () => {
  const label = (overrides: Record<string, unknown> = {}): string =>
    JSON.stringify({
      $schema: PROMPT_RELEASE_LABEL_SCHEMA_URL,
      environment: 'prod',
      prompts: [{ id: 'a', contentHash: HASH }],
      ...overrides,
    });

  it('reads a label of the environment', () => {
    expect(parseLabel(label(), 'prod', 'prod.json').prompts).toEqual([
      { id: 'a', contentHash: HASH },
    ]);
  });

  it.each([
    ['invalid JSON', '{'],
    ['another environment', label({ environment: 'staging' })],
    ['another schema', label({ $schema: 'https://example.com/label.json' })],
    ['a short hash', label({ prompts: [{ id: 'a', contentHash: 'sha256-abc' }] })],
    ['an empty id', label({ prompts: [{ id: '', contentHash: HASH }] })],
    ['an array', '[]'],
    [
      'a duplicate id',
      label({
        prompts: [
          { id: 'a', contentHash: HASH },
          { id: 'a', contentHash: HASH },
        ],
      }),
    ],
    [
      'an id with a control character',
      label({ prompts: [{ id: 'a\u001b[2J', contentHash: HASH }] }),
    ],
    [
      'an id with a bidi control',
      label({ prompts: [{ id: 'acme/\u202eylper', contentHash: HASH }] }),
    ],
  ])('rejects %s', (_name, text) => {
    expect(() => parseLabel(text, 'prod', 'prod.json')).toThrow(
      expect.objectContaining({ code: 'PS5004' })
    );
  });
});

describe('parseManifest', () => {
  it('reads an index and rejects anything else', () => {
    const manifest = JSON.stringify({
      $schema: PROMPT_BUNDLE_INDEX_SCHEMA_URL,
      source: 'project.prs',
      prompts: [{ id: 'a', file: `bundles/${HASH}.json`, description: 'A', contentHash: HASH }],
    });

    expect(parseManifest(manifest, 'manifest.json').prompts).toHaveLength(1);
    expect(() => parseManifest('{"prompts":[]}', 'manifest.json')).toThrow(
      expect.objectContaining({ code: 'PS5004' })
    );
  });
});

describe('verifyBundleText', () => {
  it('returns a bundle that recomputes to its hash and carries the id', () => {
    const { text, contentHash } = bundleText();

    expect(verifyBundleText(text, contentHash, 'b.json', 'acme/refund').id).toBe('acme/refund');
  });

  it.each([
    ['another id', (text: string) => text, 'acme/other'],
    ['an edited message', (text: string) => text.replace('refunds', 'returns'), undefined],
    ['another schema', (text: string) => text.replace('prompt-bundle/v1', 'other/v1'), undefined],
    ['invalid JSON', () => '{', undefined],
    [
      'a number JSON cannot hash',
      (text: string) => text.replace('"inputs": {}', '"inputs": {}, "x": 1e400'),
      undefined,
    ],
  ])('rejects %s', (_name, edit, id) => {
    const { text, contentHash } = bundleText();

    expect(() => verifyBundleText(edit(text), contentHash, 'b.json', id)).toThrow(
      expect.objectContaining({ code: 'PS5004' })
    );
  });
});

describe('assertExactCase', () => {
  it('refuses a name that differs from an expected one only in case', async () => {
    const paths = releasePaths(await temporaryDirectory());
    await mkdir(paths.directory, { recursive: true });
    await writeFile(join(paths.directory, 'Prod.json'), '{}');

    await expect(assertExactCase(paths, ['staging', 'prod'])).rejects.toMatchObject({
      code: 'PS5004',
      message: expect.stringContaining('must be named exactly prod.json'),
    });
  });

  it('accepts exact names and other files, and a missing directory', async () => {
    const paths = releasePaths(await temporaryDirectory());

    await expect(assertExactCase(paths, ['prod'])).resolves.toBeUndefined();

    await mkdir(paths.bundles, { recursive: true });
    await writeFile(paths.manifest, '{}');
    await writeFile(join(paths.directory, 'notes.json'), '{}');
    await expect(assertExactCase(paths, ['prod'])).resolves.toBeUndefined();
  });

  it('refuses two names that fold together on a case-sensitive disk', async (context) => {
    const paths = releasePaths(await temporaryDirectory());
    await mkdir(paths.directory, { recursive: true });
    await writeFile(join(paths.directory, 'qa.json'), '{}');
    await writeFile(join(paths.directory, 'QA.json'), '{}');
    if ((await readdir(paths.directory)).length < 2) context.skip();

    await expect(assertExactCase(paths, ['prod'])).rejects.toMatchObject({ code: 'PS5004' });
  });
});

describe('readRegularFile', () => {
  async function file(content: string): Promise<string> {
    const path = join(await temporaryDirectory(), 'record.json');
    await writeFile(path, content);
    return path;
  }

  it('reads on after a short read that is not the end of the file', async () => {
    const path = await file('{"a": "whole file"}\n');
    const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
    const shortRead = (descriptor: number, buffer: NodeJS.ArrayBufferView): number =>
      actual.readSync(descriptor, buffer, 0, 3, 0);
    vi.mocked(fs.readSync).mockImplementationOnce(shortRead as typeof fs.readSync);

    const bytes = readRegularFile(path, 1024);

    expect(bytes?.toString('utf-8')).toBe('{"a": "whole file"}\n');
    expect(vi.mocked(fs.readSync).mock.calls.length).toBeGreaterThan(1);
  });

  it('refuses a file that ends before its size or has more bytes than its size', async () => {
    const path = await file('0123456789');
    vi.mocked(fs.readSync).mockImplementationOnce(() => 0);
    let shrank: unknown;
    try {
      readRegularFile(path, 1024);
    } catch (error) {
      shrank = error;
    }
    const fullBuffer = (_descriptor: number, buffer: NodeJS.ArrayBufferView): number =>
      buffer.byteLength;
    vi.mocked(fs.readSync).mockImplementationOnce(fullBuffer as typeof fs.readSync);

    expect(() => readRegularFile(path, 1024)).toThrow('changed while it was read');
    expect(shrank).toMatchObject({ message: 'changed while it was read' });
  });
});

describe('release file reads', () => {
  it('passes through an lstat error other than a missing file', async () => {
    const root = await temporaryDirectory();
    const file = join(root, 'file.json');
    await writeFile(file, '{}');

    await expect(assertRegularPath(join(file, 'x.json'), 'file')).rejects.toMatchObject({
      code: 'ENOTDIR',
    });
  });

  it('refuses a release file larger than 16 MiB', async () => {
    const paths = releasePaths(await temporaryDirectory());
    await mkdir(paths.directory, { recursive: true });
    const handle = await open(paths.label('prod'), 'w');
    await handle.truncate(17 * 1024 * 1024);
    await handle.close();

    await expect(readLabel(paths, 'prod')).rejects.toMatchObject({ code: 'PS5004' });
  });

  it('returns undefined for a label or manifest that does not exist', async () => {
    const paths = releasePaths(await temporaryDirectory());

    expect(await readLabel(paths, 'prod')).toBeUndefined();
    expect(await readManifest(paths)).toBeUndefined();
  });

  it('refuses a symlinked label and a directory in place of a file', async () => {
    const root = await temporaryDirectory();
    const paths = releasePaths(root);
    await mkdir(paths.directory, { recursive: true });
    const outside = join(root, 'outside.json');
    await writeFile(outside, '{}');
    await symlink(outside, paths.label('prod'));
    await mkdir(paths.label('staging'));

    await expect(readLabel(paths, 'prod')).rejects.toMatchObject({ code: 'PS5004' });
    await expect(assertRegularPath(paths.label('staging'), 'file')).rejects.toMatchObject({
      code: 'PS5004',
    });
  });
});
