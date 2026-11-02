/**
 * Runs the built runtime package under Deno: every render case of the prompt bundle
 * conformance vectors, the prod label of the Node example read through the node entry, and a
 * traced call through the telemetry entry, from the dist files a consumer installs.
 *
 * Usage (after `pnpm nx build runtime`):
 *   deno run --allow-read scripts/runtime-deno-smoke.mjs
 *
 * It needs read access only: no environment and no network permission. The telemetry entry
 * gets a fake API, so no OpenTelemetry package is needed.
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  createPromptClient,
  loadPrompt,
  toAnthropicMessages,
} from '../dist/packages/runtime/src/index.js';
import { directorySource } from '../dist/packages/runtime/src/node.js';
import {
  anthropicResult,
  createPromptTelemetry,
  readPricing,
} from '../dist/packages/runtime/src/otel.js';

const vectors = new URL('../conformance/prompt-bundle/v1/', import.meta.url);
const names = (await readdir(vectors)).filter((name) => /^\d{3}-.*\.json$/.test(name)).sort();
let cases = 0;

function outcome(prompt, inputs) {
  try {
    const rendered = prompt.render(inputs);
    return {
      messages: rendered.messages,
      warnings: [...new Set(rendered.meta.warnings.map((w) => w.code))],
    };
  } catch (error) {
    return { error: error.code };
  }
}

const files = await Promise.all(names.map((name) => readFile(new URL(name, vectors), 'utf8')));

for (const [i, name] of names.entries()) {
  const vector = JSON.parse(files[i]);
  if (vector.error) {
    let code;
    try {
      loadPrompt(vector.bundle);
    } catch (error) {
      code = error.code;
    }
    if (code !== vector.error) throw new Error(`${name}: expected ${vector.error}, got ${code}`);
    continue;
  }
  const prompt = loadPrompt(vector.bundle);
  for (const renderCase of vector.render === undefined ? [] : [vector.render].flat()) {
    const expected = renderCase.error
      ? { error: renderCase.error }
      : { messages: renderCase.messages, warnings: renderCase.warnings ?? [] };
    const actual = outcome(prompt, renderCase.inputs);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
    cases++;
  }
}

// The node entry reads the example release through node:fs/promises, which Deno provides
const example = new URL('../examples/runtime-node/', import.meta.url);
const client = createPromptClient({
  source: directorySource(fileURLToPath(new URL('.promptscript/releases/', example))),
  label: 'prod',
});
const prompt = await client.get('acme-support/refund-reply');
// The same inputs as examples/runtime-node/index.mjs
const rendered = prompt.render({
  order_total: 42.5,
  days_since_delivery: 12,
  message: 'The kettle arrived broken. Can I get my money back?',
});
const expected = await readFile(new URL('expected-output.json', example), 'utf8');
if (`${JSON.stringify(toAnthropicMessages(rendered), null, 2)}\n` !== expected) {
  throw new Error(
    'The example prod label does not render as examples/runtime-node/expected-output.json'
  );
}
// The telemetry entry imports nothing, so a small fake of the OpenTelemetry API is enough
const recorded = {};
const span = {
  spanContext: () => ({ traceId: '1'.repeat(32), spanId: '2'.repeat(16), traceFlags: 1 }),
  setAttribute: (key, value) => {
    recorded[key] = value;
  },
  setStatus: () => undefined,
  addEvent: () => undefined,
  end: () => undefined,
};
const fakeApi = {
  trace: {
    getTracer: () => ({
      startSpan: (_name, options) => {
        Object.assign(recorded, options.attributes);
        return span;
      },
    }),
    wrapSpanContext: () => span,
    setSpan: () => undefined,
  },
  context: { active: () => undefined, with: (_context, fn) => fn() },
  SpanKind: { CLIENT: 2, INTERNAL: 0 },
  SpanStatusCode: { ERROR: 2 },
};
const pricing = readPricing(
  await readFile(new URL('.promptscript/releases/pricing.json', example), 'utf8')
);
const telemetry = createPromptTelemetry(fakeApi, { pricing });
await telemetry.trace(
  rendered,
  async () => ({ usage: { input_tokens: 1000, output_tokens: 500 } }),
  anthropicResult
);
if (
  recorded['promptscript.prompt.content_hash'] !== rendered.meta.contentHash ||
  typeof recorded['promptscript.usage.cost_usd'] !== 'number'
) {
  throw new Error('The telemetry entry did not record the prompt hash and the cost');
}
console.log(
  `runtime: ${names.length} vectors, ${cases} render cases, the example prod label and a traced call pass`
);
