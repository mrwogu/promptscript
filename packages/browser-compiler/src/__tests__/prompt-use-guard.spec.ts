import { describe, expect, it } from 'vitest';
import { BrowserResolver } from '../resolver.js';
import { VirtualFileSystem } from '../virtual-fs.js';

const entry = (user: string): string => `@meta { id: "pack" syntax: "1.6.0" }
@prompts { review: { description: "Review a change" user: "${user}" } }
`;

async function resolveWith(
  local: string
): Promise<Awaited<ReturnType<BrowserResolver['resolve']>>> {
  const resolver = new BrowserResolver({
    fs: new VirtualFileSystem({
      'project.prs': `${local}@use ./shared\n`,
      'shared.prs': entry('Review this change.'),
    }),
  });
  return resolver.resolve('project.prs');
}

describe('@use of prompt entries in the browser resolver', () => {
  it('reports a same-key entry with different content', async () => {
    const result = await resolveWith(entry('Review it twice.'));

    expect(result.errors).toEqual([
      expect.objectContaining({ message: expect.stringContaining('Duplicate prompt name(s)') }),
    ]);
  });

  it('accepts a same-key entry with identical content', async () => {
    const result = await resolveWith(entry('Review this change.'));

    expect(result.errors).toEqual([]);
  });
});
