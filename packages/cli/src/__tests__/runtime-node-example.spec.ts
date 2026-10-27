import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createPromptClient, type PromptSource } from '@promptscript/runtime';
import { directorySource } from '@promptscript/runtime/node';
import { validateBundle, validateIndex, validateLabel } from './prompt-bundle-validators.js';

const EXAMPLE = fileURLToPath(new URL('../../../../examples/runtime-node/', import.meta.url));
const FIXTURE = fileURLToPath(
  new URL('./__fixtures__/application-prompts/support-refund-reply/.promptscript/', import.meta.url)
);
const LABEL_SCHEMA = fileURLToPath(
  new URL('../../../../schema/prompt-release-label-v1.json', import.meta.url)
);
const RELEASES = join(EXAMPLE, '.promptscript', 'releases');
const ID = 'acme-support/refund-reply';

interface Label {
  $schema: string;
  prompts: { id: string; contentHash: string }[];
}

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const prsFiles = (directory: string): string[] =>
  readdirSync(directory)
    .filter((name) => name.endsWith('.prs'))
    .sort();

describe('the runtime Node example', () => {
  it('keeps its PromptScript source equal to the CLI fixture', () => {
    // Arrange
    const source = join(EXAMPLE, '.promptscript');

    // Act
    const names = prsFiles(source);

    // Assert
    expect(names).toEqual(prsFiles(FIXTURE));
    for (const name of names) {
      expect(readFileSync(join(source, name), 'utf8'), name).toBe(
        readFileSync(join(FIXTURE, name), 'utf8')
      );
    }
  });

  it('commits release files that match the published schemas', () => {
    // Arrange
    const manifest = readJson<{ prompts: { file: string }[] }>(join(RELEASES, 'manifest.json'));

    // Act and assert
    expect(validateIndex(manifest), JSON.stringify(validateIndex.errors)).toBe(true);
    for (const { file } of manifest.prompts) {
      const bundle = readJson<unknown>(join(RELEASES, file));
      expect(validateBundle(bundle), `${file} ${JSON.stringify(validateBundle.errors)}`).toBe(true);
    }
    for (const environment of ['staging', 'prod']) {
      const label = readJson<unknown>(join(RELEASES, `${environment}.json`));
      expect(validateLabel(label), `${environment} ${JSON.stringify(validateLabel.errors)}`).toBe(
        true
      );
    }
  });

  it('serves the prod label with the label schema URL the schema publishes', async () => {
    // Arrange
    const schema = readJson<{ $id: string }>(LABEL_SCHEMA);
    const label = readJson<Label>(join(RELEASES, 'prod.json'));
    const releases = directorySource(RELEASES);
    const otherUrl: PromptSource = {
      name: releases.name,
      read: async (path, etag) =>
        path === 'prod.json'
          ? { text: JSON.stringify({ ...label, $schema: `${schema.$id}.old` }) }
          : releases.read(path, etag),
    };

    // Act
    const prompt = await createPromptClient({ source: releases, label: 'prod' }).get(ID);
    const refused = createPromptClient({ source: otherUrl, label: 'prod' }).get(ID);

    // Assert
    expect(label.$schema).toBe(schema.$id);
    expect(prompt.meta).toMatchObject({
      label: 'prod',
      contentHash: label.prompts[0]?.contentHash,
      stale: false,
    });
    await expect(refused).rejects.toMatchObject({ code: 'invalid-index' });
  });
});
