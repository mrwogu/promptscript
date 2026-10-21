import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resolver } from '../resolver.js';

const META = '@meta { id: "pack" syntax: "1.6.0" }';

function prompts(user: string): string {
  return `${META}
@prompts {
  review: {
    description: "Review a change"
    user: """
      ${user}
    """
  }
}
`;
}

describe('@use of prompt entries', () => {
  let dir: string;

  beforeAll(async () => {
    dir = join(tmpdir(), `prs-prompt-use-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'shared.prs'), prompts('Review this change.'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reports a same-key entry with different content at the @use location', async () => {
    await writeFile(join(dir, 'conflict.prs'), `${prompts('Review it twice.')}\n@use ./shared\n`);

    const result = await new Resolver({ localPath: dir, registryPath: dir }).resolve(
      join(dir, 'conflict.prs')
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain('Duplicate prompt name(s)');
    expect(result.errors[0]?.message).toContain('review');
  });

  it('accepts a same-key entry with identical text written in another file', async () => {
    await writeFile(join(dir, 'same.prs'), `${prompts('Review this change.')}\n@use ./shared\n`);

    const result = await new Resolver({ localPath: dir, registryPath: dir }).resolve(
      join(dir, 'same.prs')
    );

    expect(result.errors).toEqual([]);
  });
});
