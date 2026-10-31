/* global process, console, fetch, AbortSignal, URLSearchParams */
// Reads the spans that index.mjs sent to Phoenix and runs the checks in ../checks.mjs.
// Usage: node phoenix/check.mjs [--url <phoenix>] [--run <index.mjs output>] [--out <report dir>]
import { fetchAll, flatten, loadSpans, readArgs, verify, waitHealthy } from '../checks.mjs';

const BACKEND = 'Phoenix';
const args = readArgs(process.argv.slice(2), process.env.PHOENIX_URL ?? 'http://localhost:6006');

async function fetchPage(cursor) {
  const query = new URLSearchParams({ limit: '1000' });
  if (cursor) query.set('cursor', cursor);
  const response = await fetch(`${args.url}/v1/projects/default/spans?${query}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Phoenix answered ${response.status} for the spans`);
  const page = await response.json();
  return { items: page.data, next: page.next_cursor || undefined };
}

function normalize(span) {
  return {
    name: span.name,
    kind: span.span_kind,
    status: span.status_code,
    traceId: String(span.context.trace_id).toLowerCase(),
    spanId: String(span.context.span_id).toLowerCase(),
    parentId: span.parent_id ? String(span.parent_id).toLowerCase() : null,
    raw: span,
    attrs: flatten(span.attributes),
    events: (span.events ?? []).map((event) => ({
      name: event.name,
      attrs: flatten(event.attributes),
    })),
  };
}

try {
  await waitHealthy(`${args.url}/healthz`, BACKEND);
  const spans = await loadSpans(async () => (await fetchAll(fetchPage)).map(normalize), BACKEND);
  await verify({ backend: BACKEND, spans, ...args });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
