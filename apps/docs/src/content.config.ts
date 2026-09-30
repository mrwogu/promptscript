import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { docIdFromEntry } from './plugins/remark-mkdocs-compat.mjs';

// Markdown sources stay in the repo-level docs/ folder. Generators
// (formatters, models, TypeDoc) and doc checks write and read there.
const EXCLUDED = ['design', 'plans', 'superpowers', '__snapshots__'];

export const collections = {
  docs: defineCollection({
    loader: glob({
      base: '../../docs',
      pattern: ['**/*.md', ...EXCLUDED.map((dir) => `!${dir}/**`)],
      generateId: ({ entry }) => docIdFromEntry(entry),
    }),
    schema: docsSchema(),
  }),
};
