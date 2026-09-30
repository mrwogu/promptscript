import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { pageMarkdown } from '../../llms';

// /<page>/index.md next to every HTML page, the URLs the old site's llms.txt used.
export const getStaticPaths: GetStaticPaths = async () =>
  (await getCollection('docs')).map((entry) => ({
    params: { slug: entry.id === 'index' ? undefined : entry.id },
    props: { entry },
  }));

export const GET: APIRoute<{ entry: CollectionEntry<'docs'> }> = ({ props }) =>
  new Response(pageMarkdown(props.entry), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
