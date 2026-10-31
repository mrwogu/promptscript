/* global process, console, fetch, AbortSignal, URLSearchParams, Buffer */
// Reads the observations that index.mjs sent to Langfuse and runs the checks in ../checks.mjs.
// Usage: node langfuse/check.mjs [--url <langfuse>] [--run <index.mjs output>] [--out <report dir>]
import {
  fetchAll,
  flatten,
  isCall,
  isFeedback,
  loadSpans,
  readArgs,
  verify,
  waitHealthy,
} from '../checks.mjs';

const BACKEND = 'Langfuse';
// The throwaway project keys of compose.yaml
const PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY ?? 'pk-lf-promptscript-example';
const SECRET_KEY = process.env.LANGFUSE_SECRET_KEY ?? 'sk-lf-promptscript-example';
const token = Buffer.from([PUBLIC_KEY, SECRET_KEY].join(':')).toString('base64');
const HEADERS = { authorization: `Basic ${token}` };
const FIELDS = 'core,basic,io,metadata,model,usage';
const METADATA_PREFIX = 'attributes.';
const args = readArgs(process.argv.slice(2), process.env.LANGFUSE_URL ?? 'http://localhost:3000');
const since = new Date(Date.now() - 3_600_000).toISOString();
const fromInput = new Set();

async function fetchPage(cursor) {
  const query = new URLSearchParams({ fields: FIELDS, limit: '1000', fromStartTime: since });
  if (cursor) query.set('cursor', cursor);
  const response = await fetch(`${args.url}/api/public/v2/observations?${query}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Langfuse answered ${response.status} for the observations`);
  const body = await response.json();
  return { items: body.data, next: body.meta?.cursor };
}

// The input is a JSON string. Anything that is not an object is no input of ours
function inputOf(observation) {
  try {
    const input = JSON.parse(observation.input);
    return input !== null && typeof input === 'object' ? input : {};
  } catch {
    return {};
  }
}

// Langfuse keeps our attributes as metadata and turns gen_ai.prompt.* into the input
function attributesOf(observation) {
  const attrs = {};
  for (const [key, value] of Object.entries(flatten(observation.metadata))) {
    attrs[key.startsWith(METADATA_PREFIX) ? key.slice(METADATA_PREFIX.length) : key] = value;
  }
  for (const [key, value] of Object.entries(inputOf(observation))) {
    const name = `gen_ai.prompt.${key}`;
    if (name in attrs) continue;
    attrs[name] = value;
    fromInput.add(name);
  }
  return attrs;
}

function normalize(observation) {
  return {
    name: observation.name,
    kind: observation.type,
    status: observation.level,
    traceId: String(observation.traceId).toLowerCase(),
    spanId: String(observation.id).toLowerCase(),
    parentId: observation.parentObservationId
      ? String(observation.parentObservationId).toLowerCase()
      : null,
    raw: observation,
    attrs: attributesOf(observation),
    events: [], // Langfuse keeps no span events
  };
}

// How Langfuse's own fields relate to our attributes: observed facts for the mapping
function langfuseFields(spans) {
  const calls = spans.filter(isCall);
  const keys = (pick) => [...new Set(calls.flatMap((span) => Object.keys(pick(span.raw) ?? {})))];
  const sorted = (list) => list.sort((a, b) => (a < b ? -1 : 1));
  return {
    keysReadFromInput: sorted([...fromInput]),
    metadataKeyPrefix: METADATA_PREFIX,
    modelIsRequestModel: calls.every(
      (span) => span.raw.model === span.attrs['gen_ai.request.model']
    ),
    usageDetailsKeys: sorted(keys((raw) => raw.usageDetails)),
    usageIsTokenCounts: calls.every(
      (span) =>
        span.raw.usageDetails?.input === span.attrs['gen_ai.usage.input_tokens'] &&
        span.raw.usageDetails?.output === span.attrs['gen_ai.usage.output_tokens']
    ),
    costDetailsKeys: sorted(keys((raw) => raw.costDetails)),
    callsWithTotalCost: calls.filter((span) => span.raw.totalCost !== null).length,
    feedbackEventInObservation: spans
      .filter(isFeedback)
      .some((span) => JSON.stringify(span.raw).includes('gen_ai.evaluation')),
  };
}

try {
  await waitHealthy(`${args.url}/api/public/health`, BACKEND, 240_000);
  const spans = await loadSpans(
    async () => (await fetchAll(fetchPage)).map(normalize),
    BACKEND,
    180_000
  );
  const extra = langfuseFields(spans);
  // The event checks are off only because Langfuse drops span events. If it starts to keep them, turn them on.
  if (extra.feedbackEventInObservation) {
    throw new Error(
      'Langfuse now keeps the feedback event: read the events in normalize() and drop keepsEvents: false'
    );
  }
  await verify({
    backend: BACKEND,
    spans,
    ...args,
    keepsEvents: false,
    extra,
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
