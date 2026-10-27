import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { labelOf, makeBundle } from './__tests__/fixture.js';
import { createPromptClient } from './client.js';
import { PromptLoadError } from './errors.js';
import { directorySource } from './node.js';

const base = realpathSync(mkdtempSync(join(tmpdir(), 'prs-runtime-')));
const root = join(base, 'releases');
const outside = join(base, 'outside');
mkdirSync(join(root, 'bundles'), { recursive: true });
mkdirSync(outside);
mkdirSync(join(root, 'folder.json'));
writeFileSync(join(root, 'ok.json'), '{"a":1}');
writeFileSync(join(root, 'big.json'), 'x'.repeat(100));
writeFileSync(join(root, 'broken.json'), new Uint8Array([0x7b, 0xff, 0x7d]));
writeFileSync(join(outside, 'secret.json'), '{}');
symlinkSync(join(outside, 'secret.json'), join(root, 'escape.json'));
symlinkSync(join(root, 'ok.json'), join(root, 'inside.json'));
writeFileSync(join(root, 'bundles', 'x.json'), '{"b":2}');
symlinkSync(join(root, 'bundles'), join(root, 'linked'));
// A deployment often points a "current" link at the release it serves
symlinkSync(root, join(base, 'current'));
writeFileSync(join(root, 'locked.json'), '{}');
chmodSync(join(root, 'locked.json'), 0o000);

afterAll(() => rmSync(base, { recursive: true, force: true }));

async function codeOf(path: string, maxBytes?: number): Promise<string> {
  try {
    await directorySource(root, { maxBytes }).read(path);
    return 'ok';
  } catch (error) {
    if (error instanceof PromptLoadError) return error.code;
    throw error;
  }
}

describe('directorySource', () => {
  it('reads a file below the root and names the root', async () => {
    const source = directorySource(root);

    expect(source.name).toBe(root);
    expect(await source.read('ok.json')).toEqual({ text: '{"a":1}' });
  });

  it('refuses a link below the root, also one that stays inside', async () => {
    expect(await codeOf('inside.json')).toBe('source-error');
    expect(await codeOf('linked/x.json')).toBe('source-error');
    // The link wins over a missing file behind it
    expect(await codeOf('linked/missing.json')).toBe('source-error');
    expect(await codeOf('bundles/missing.json')).toBe('not-found');
    expect(await codeOf('bundles/x.json')).toBe('ok');
  });

  it('reads below a root that is a link itself', async () => {
    expect(await directorySource(join(base, 'current')).read('bundles/x.json')).toEqual({
      text: '{"b":2}',
    });
  });

  it.each([
    ['label', 'invalid-index'],
    ['bundle', 'invalid-bundle'],
  ])('refuses a %s that starts with a byte order mark, as the CLI does', async (file, code) => {
    // Arrange
    const bundle = makeBundle();
    const bomRoot = join(base, `bom-${file}`);
    const mark = (name: string): string => (name === file ? '\uFEFF' : '');
    mkdirSync(join(bomRoot, 'bundles'), { recursive: true });
    writeFileSync(join(bomRoot, 'prod.json'), `${mark('label')}${labelOf('prod', [bundle])}`);
    writeFileSync(
      join(bomRoot, 'bundles', `${bundle['contentHash']}.json`),
      `${mark('bundle')}${JSON.stringify(bundle)}`
    );
    const client = createPromptClient({ source: directorySource(bomRoot), label: 'prod' });

    // Act
    const error = await client.get('acme-support/refund-reply').catch((caught: unknown) => caught);

    // Assert
    expect(error).toMatchObject({ code });
  });

  it.each([
    ['missing.json', 'not-found'],
    ['folder.json', 'not-found'],
    ['escape.json', 'source-error'],
    ['broken.json', 'source-error'],
    ['../outside/secret.json', 'invalid-index'],
  ])('refuses %s with %s', async (path, code) => {
    expect(await codeOf(path)).toBe(code);
  });

  it('reports a file it may not open as source-error', async () => {
    // Root may open any file, so the read only fails for other users
    const expected = process.getuid?.() === 0 ? 'ok' : 'source-error';

    expect(await codeOf('locked.json')).toBe(expected);
  });

  it.skipIf(process.platform === 'win32')(
    'refuses a FIFO without waiting for a writer',
    async () => {
      execFileSync('mkfifo', [join(root, 'pipe.json')]);

      expect(await codeOf('pipe.json')).toBe('not-found');
    }
  );

  it.each([NaN, -1, Infinity, 1.5, 0])('refuses %s as maxBytes', (value) => {
    expect(() => directorySource(root, { maxBytes: value })).toThrow(
      expect.objectContaining({
        name: 'RangeError',
        message: 'maxBytes must be a whole number of 1 or more.',
      })
    );
  });

  it('refuses a file above maxBytes', async () => {
    expect(await codeOf('big.json', 50)).toBe('too-large');
    expect(await codeOf('big.json', 100)).toBe('ok');
  });

  it('serves a release label through a client', async () => {
    // Arrange
    const bundle = makeBundle();
    writeFileSync(join(root, 'prod.json'), labelOf('prod', [bundle]));
    writeFileSync(
      join(root, 'bundles', `${bundle['contentHash']}.json`),
      JSON.stringify(bundle, null, 2)
    );
    const client = createPromptClient({ source: directorySource(root), label: 'prod' });

    // Act
    const prompt = await client.get('acme-support/refund-reply');

    // Assert
    expect(prompt.meta).toMatchObject({ label: 'prod', source: root, stale: false });
    expect(prompt.render({ message: 'Hi' }).messages[1]?.content).toBe('Customer wrote: Hi');
  });
});
