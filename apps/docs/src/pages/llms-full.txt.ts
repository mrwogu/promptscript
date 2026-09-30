import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { llmsFull, llmsSections } from '../llms';

export const GET: APIRoute = async () =>
  new Response(llmsFull(llmsSections(await getCollection('docs'))), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
