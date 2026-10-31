/* global process, console */
// Sends one traced model call and one feedback per session to an OTLP endpoint.
// The model call is a fake with fixed usage. No API key, no network call except OTLP.
import * as otel from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, TracerProvider } from '@opentelemetry/sdk-trace';
import { createPromptClient, toAnthropicMessages } from '@promptscript/runtime';
import { directorySource } from '@promptscript/runtime/node';
import { anthropicResult, createPromptTelemetry, readPricing } from '@promptscript/runtime/otel';
import { readFile } from 'node:fs/promises';
import { fakeAnthropic } from './fake-model.mjs';
import {
  FEEDBACK_NAME,
  INPUTS,
  KEYS,
  LABEL,
  PROMPT_ID,
  RELEASES,
  feedbackFor,
} from './scenario.mjs';

// Without this the exporter would fall back to its default host
if (!process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
  console.error(
    'Set OTEL_EXPORTER_OTLP_TRACES_ENDPOINT, for example http://localhost:6006/v1/traces'
  );
  process.exit(2);
}

// Shows export failures in the log
otel.diag.setLogger(new otel.DiagConsoleLogger(), otel.DiagLogLevel.WARN);

// The context manager and the provider come first, so the telemetry finds them
otel.context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
const provider = new TracerProvider({
  resource: resourceFromAttributes({ 'service.name': 'runtime-otel-example' }),
  spanProcessors: [new BatchSpanProcessor({ exporter: new OTLPTraceExporter() })],
});
otel.trace.setGlobalTracerProvider(provider);

const failures = [];
const client = createPromptClient({ source: directorySource(RELEASES), label: LABEL });
const pricing = readPricing(await readFile(`${RELEASES}pricing.json`, 'utf8'));
const telemetry = createPromptTelemetry(otel, {
  pricing,
  onError: (error) => failures.push(error.code),
});

async function callModel(key) {
  const prompt = await client.get(PROMPT_ID, { key });
  const rendered = prompt.render(INPUTS);
  let span;
  await telemetry.trace(
    rendered,
    (ref) => {
      span = ref;
      return fakeAnthropic(toAnthropicMessages(rendered));
    },
    anthropicResult
  );
  return { span, meta: rendered.meta };
}

// The app keeps the span ref of each session, as the runtime README asks
const calls = new Map(await Promise.all(KEYS.map(async (key) => [key, await callModel(key)])));

KEYS.forEach((key, index) => {
  const { span, meta } = calls.get(key);
  telemetry.feedback({ span, name: FEEDBACK_NAME, ...feedbackFor(index), prompt: meta });
});

// Flushes the batch
await provider.shutdown();

const variants = {};
for (const { meta } of calls.values()) variants[meta.variant] = (variants[meta.variant] ?? 0) + 1;
const counted = Object.values(variants).reduce((sum, count) => sum + count, 0);
const run = {
  calls: calls.size,
  feedback: KEYS.length,
  variants,
  telemetryFailures: failures.length,
};
console.log(JSON.stringify(run, null, 2));
if (failures.length > 0 || counted !== KEYS.length) process.exit(1);
