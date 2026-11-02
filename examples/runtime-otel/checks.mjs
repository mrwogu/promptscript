/* global process, console, fetch, AbortSignal, setTimeout */
// Checks that every backend runs on the spans the example app sent: the numbers a correct run has
// to produce. A backend adapter fetches its spans, normalizes them and calls verify().
// Normalized span: { name, kind, status, traceId, spanId, parentId, raw, attrs, events: [{ name, attrs }] }
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { FEEDBACK_NAME, INPUTS, KEYS, LABEL, PROMPT_ID, RELEASES, expected } from './scenario.mjs';

const COST_EPSILON = 1e-12;
const SUM_EPSILON = 1e-9;
const BAND = 0.1;
const EVAL_EVENT = 'gen_ai.evaluation.result';
const EVAL_NAME = `evaluate ${FEEDBACK_NAME}`;
// Attribute names the runtime sets on a call span
const OURS = [
  'promptscript.prompt.id',
  'promptscript.prompt.content_hash',
  'promptscript.prompt.label',
  'promptscript.experiment.name',
  'promptscript.experiment.variant',
  'promptscript.usage.cost_usd',
  'gen_ai.operation.name',
  'gen_ai.provider.name',
  'gen_ai.request.model',
  'gen_ai.request.max_tokens',
  'gen_ai.prompt.name',
  'gen_ai.prompt.version',
  'gen_ai.output.type',
  'gen_ai.usage.input_tokens',
  'gen_ai.usage.output_tokens',
  'gen_ai.response.model',
  'gen_ai.response.id',
  'gen_ai.response.finish_reasons',
];

export function readArgs(argv, url) {
  const args = { url };
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i].replace(/^--/, '');
    if (!['url', 'run', 'out'].includes(name) || argv[i + 1] === undefined) {
      throw new Error(`Unknown or incomplete argument: ${argv[i]}`);
    }
    args[name] = argv[i + 1];
  }
  return args;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// url is the full health URL of the backend
export async function waitHealthy(url, backend, waitMs = 60_000) {
  const until = Date.now() + waitMs;
  while (Date.now() < until) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await sleep(1000); // NOSONAR - the poll waits between tries on purpose
  }
  throw new Error(`${backend} did not answer ${url} within ${waitMs / 1000} s`);
}

// fetchPage(cursor) returns { items, next }
export async function fetchAll(fetchPage) {
  const items = [];
  let cursor;
  do {
    const page = await fetchPage(cursor); // NOSONAR - each page needs the cursor of the one before
    items.push(...page.items);
    cursor = page.next;
  } while (cursor);
  return items;
}

// A backend may nest the attributes of a dotted key, so both shapes end up as one flat map
export function flatten(value, prefix = '', out = {}) {
  for (const [key, item] of Object.entries(value ?? {})) {
    const name = prefix ? `${prefix}.${key}` : key;
    const nested = item !== null && typeof item === 'object' && !Array.isArray(item);
    if (nested) flatten(item, name, out);
    else out[name] = item;
  }
  return out;
}

export const isCall = (span) => span.name.startsWith('chat ');
export const isFeedback = (span) => span.name === EVAL_NAME;

// Ingest is async, so poll until every span is there. load() returns the normalized spans.
export async function loadSpans(load, backend, waitMs = 60_000) {
  const until = Date.now() + waitMs;
  let seen = { calls: 0, feedback: 0 };
  while (Date.now() < until) {
    const spans = await load(); // NOSONAR - each try needs the result of the one before
    seen = { calls: spans.filter(isCall).length, feedback: spans.filter(isFeedback).length };
    if (seen.calls >= KEYS.length && seen.feedback >= KEYS.length) return spans;
    await sleep(2000); // NOSONAR - the poll waits between tries on purpose
  }
  throw new Error(
    `${backend} holds ${seen.calls} call spans and ${seen.feedback} feedback spans, wanted ${KEYS.length} each`
  );
}

// Failed checks, by id: how many spans failed and one example. Attribute values of unknown keys are never printed.
const failed = new Map();
function expect(id, ok, detail) {
  if (ok) return;
  const entry = failed.get(id) ?? { count: 0, detail };
  entry.count += 1;
  failed.set(id, entry);
}

const near = (a, b, epsilon) => typeof a === 'number' && Math.abs(a - b) < epsilon;

function checkCall(span, byHash) {
  const { attrs } = span;
  const arm = byHash.get(attrs['promptscript.prompt.content_hash']);
  expect(
    'A1',
    span.parentId === null && span.status !== 'ERROR',
    'a call span is not a root span or has an error status'
  );
  expect('A2', arm !== undefined, 'a call span has a content hash that is not one of the arms');
  if (!arm) return;
  expect(
    'A1',
    span.name === `chat ${arm.apiId}`,
    `a call span is not named after the model of its arm (${arm.variant})`
  );
  expect('A2', attrs['promptscript.prompt.id'] === PROMPT_ID, 'prompt id is wrong');
  expect('A2', attrs['promptscript.prompt.label'] === LABEL, 'label is wrong');
  expect(
    'A2',
    attrs['promptscript.experiment.name'] === arm.experiment,
    'experiment name is wrong'
  );
  expect(
    'A2',
    attrs['promptscript.experiment.variant'] === arm.variant,
    `variant does not match the hash (${arm.variant})`
  );
  expect(
    'A3',
    attrs['gen_ai.request.model'] === arm.apiId,
    `request model is wrong (${arm.variant})`
  );
  expect(
    'A3',
    attrs['gen_ai.prompt.version'] === arm.contentHash,
    'gen_ai.prompt.version is not the hash'
  );
  expect('A3', attrs['gen_ai.provider.name'] === 'anthropic', 'provider is wrong');
  expect('A3', attrs['gen_ai.usage.input_tokens'] === 420, 'input tokens are wrong');
  expect('A3', attrs['gen_ai.usage.output_tokens'] === 80, 'output tokens are wrong');
  expect(
    'A3',
    /^msg_example_\d+$/.test(String(attrs['gen_ai.response.id'])),
    'response id is wrong'
  );
  expect(
    'A4',
    near(attrs['promptscript.usage.cost_usd'], arm.costPerCall, COST_EPSILON),
    `cost is not ${arm.costPerCall} (${arm.variant})`
  );
}

// The whole raw span is searched, so keys, arrays and event data are covered too
function leaksData(span) {
  const text = JSON.stringify(span.raw);
  const secrets = [
    ...Object.values(INPUTS).filter((value) => typeof value === 'string'),
    'session-',
  ];
  return secrets.some((secret) => text.includes(JSON.stringify(secret).slice(1, -1)));
}

function checkPrivacy(span) {
  expect('A5', !leaksData(span), 'a span holds a session key or an input text');
  expect('A5', !('promptscript.prompt.stale' in span.attrs), 'a span is marked stale');
}

function checkArms(calls, expectedRun, run, backend) {
  for (const arm of expectedRun.arms) {
    const seen = calls.filter(
      (span) => span.attrs['promptscript.experiment.variant'] === arm.variant
    ).length;
    expect(
      'B1',
      seen === arm.calls,
      `${arm.variant}: ${backend} holds ${seen} calls, the bucket rule gives ${arm.calls}`
    );
    if (run)
      expect(
        'B1',
        run.variants?.[arm.variant] === seen,
        `${arm.variant}: the app printed ${run.variants?.[arm.variant]}, ${backend} holds ${seen}`
      );
    const share = seen / KEYS.length;
    expect(
      'B2',
      Math.abs(share - arm.weight / 10_000) <= BAND,
      `${arm.variant}: share ${share} is far from its weight`
    );
  }
}

function scoreOf(span) {
  const event = span.events.find((item) => item.name === EVAL_EVENT);
  return event?.attrs['gen_ai.evaluation.score.value'];
}

function checkEvent(span) {
  const events = span.events.filter((item) => item.name === EVAL_EVENT);
  expect('C2', events.length === 1, 'a feedback span has no single evaluation event');
  const [event] = events;
  if (!event) return;
  const { attrs } = event;
  const score = attrs['gen_ai.evaluation.score.value'];
  const label = attrs['gen_ai.evaluation.score.label'];
  expect('C2', attrs['gen_ai.evaluation.name'] === FEEDBACK_NAME, 'evaluation name is wrong');
  expect('C2', score === 0 || score === 1, 'score is not 0 or 1');
  expect('C2', label === (score === 1 ? 'positive' : 'negative'), 'label does not fit the score');
  expect('C2', !('gen_ai.evaluation.explanation' in attrs), 'a feedback event has an explanation');
}

function checkFeedback(span, callsBySpan, seenParents, keepsEvents) {
  const parent = callsBySpan.get(span.parentId);
  expect(
    'C1',
    parent !== undefined && parent.traceId === span.traceId,
    'a feedback span has no call span as parent in its trace'
  );
  seenParents.set(span.parentId, (seenParents.get(span.parentId) ?? 0) + 1);
  if (keepsEvents) checkEvent(span);
  const hash = span.attrs['promptscript.prompt.content_hash'];
  expect(
    'C3',
    parent !== undefined && parent.attrs['promptscript.prompt.content_hash'] === hash,
    'feedback hash differs from its parent'
  );
}

function sumsByHash(calls, feedback) {
  const sums = new Map();
  const entry = (hash) =>
    sums.get(hash) ?? sums.set(hash, { calls: 0, costSum: 0, scoreSum: 0 }).get(hash);
  for (const span of calls) {
    const sum = entry(span.attrs['promptscript.prompt.content_hash']);
    sum.calls += 1;
    sum.costSum += span.attrs['promptscript.usage.cost_usd'] ?? 0;
  }
  for (const span of feedback)
    entry(span.attrs['promptscript.prompt.content_hash']).scoreSum += scoreOf(span) ?? 0;
  return sums;
}

function checkSums(sums, expectedRun, keepsEvents) {
  for (const arm of expectedRun.arms) {
    const sum = sums.get(arm.contentHash);
    expect(
      'D1',
      near(sum?.costSum, arm.costSum, SUM_EPSILON),
      `${arm.variant}: cost sum is ${sum?.costSum}, wanted ${arm.costSum}`
    );
    if (keepsEvents)
      expect(
        'D1',
        sum?.scoreSum === arm.scoreSum,
        `${arm.variant}: score sum is ${sum?.scoreSum}, wanted ${arm.scoreSum}`
      );
  }
}

function runChecks(spans, expectedRun, run, backend, keepsEvents) {
  const calls = spans.filter(isCall);
  const feedback = spans.filter(isFeedback);
  const byHash = new Map(
    expectedRun.arms.map((arm) => [arm.contentHash, { ...arm, experiment: expectedRun.experiment }])
  );
  const callsBySpan = new Map(calls.map((span) => [span.spanId, span]));
  expect('A1', calls.length === KEYS.length, `${calls.length} call spans, wanted ${KEYS.length}`);
  expect(
    'C1',
    feedback.length === KEYS.length,
    `${feedback.length} feedback spans, wanted ${KEYS.length}`
  );
  const seenParents = new Map();
  calls.forEach((span) => checkCall(span, byHash));
  spans.forEach(checkPrivacy);
  feedback.forEach((span) => checkFeedback(span, callsBySpan, seenParents, keepsEvents));
  expect(
    'C1',
    calls.every((span) => seenParents.get(span.spanId) === 1),
    'a call span does not have exactly one feedback span'
  );
  checkArms(calls, expectedRun, run, backend);
  const sums = sumsByHash(calls, feedback);
  checkSums(sums, expectedRun, keepsEvents);
  return { calls, feedback, sums };
}

// The observed mapping of our spans in the backend: facts only, no claim about what the UI shows
function mappingOf({ calls, feedback }, backend) {
  const kinds = (list) => [...new Set(list.map((span) => span.kind))];
  const keysOf = (list) => new Set(list.flatMap((span) => Object.keys(span.attrs)));
  const callKeys = keysOf(calls);
  const everywhere = (key) => calls.every((span) => key in span.attrs);
  return {
    backend,
    callSpanKinds: kinds(calls),
    feedbackSpanKinds: kinds(feedback),
    ourKeysOnEveryCallSpan: OURS.filter(everywhere),
    ourKeysMissingFromSomeCallSpans: OURS.filter((key) => !everywhere(key)),
    keysAddedOnCallSpans: [...callKeys]
      .filter((key) => !OURS.includes(key))
      .sort((a, b) => (a < b ? -1 : 1)),
    feedbackEventPresentOnEverySpan: feedback.every((span) =>
      span.events.some((event) => event.name === EVAL_EVENT)
    ),
    feedbackSpanKeys: [...keysOf(feedback)].sort((a, b) => (a < b ? -1 : 1)),
  };
}

function reportOf(sums, expectedRun, keepsEvents) {
  return expectedRun.arms.map((arm) => {
    const sum = sums.get(arm.contentHash) ?? { calls: 0, costSum: 0, scoreSum: 0 };
    const meanScore = !keepsEvents || sum.calls === 0 ? null : sum.scoreSum / sum.calls;
    return {
      contentHash: arm.contentHash,
      variant: arm.variant,
      model: arm.apiId,
      calls: sum.calls,
      costSumUsd: sum.costSum,
      meanScore,
    };
  });
}

function tableOf(report) {
  const rows = report.map(
    (row) =>
      `| ${row.variant} | ${row.model} | \`${row.contentHash.slice(0, 19)}\` | ${row.calls} | ${row.costSumUsd.toFixed(6)} | ${row.meanScore === null ? '-' : row.meanScore.toFixed(3)} |`
  );
  const head = [
    '| Variant | Model | Content hash | Calls | Cost sum (USD) | Mean thumbs |',
    '| --- | --- | --- | ---: | ---: | ---: |',
  ];
  return [...head, ...rows].join('\n');
}

async function writeReport(out, report, mapping, backend) {
  const table = tableOf(report);
  console.log(table);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `### Prompt versions in ${backend}\n\n${table}\n`
    );
  }
  if (!out) return;
  await mkdir(out, { recursive: true });
  await writeFile(`${out}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(`${out}/mapping.json`, `${JSON.stringify(mapping, null, 2)}\n`);
}

// extra: facts only the adapter can read, added to the end of mapping.json
export async function verify({
  backend,
  spans,
  run: runFile,
  out,
  keepsEvents = true,
  extra = {},
}) {
  const run = runFile ? JSON.parse(await readFile(runFile, 'utf8')) : undefined;
  const expectedRun = await expected(RELEASES);
  if (!keepsEvents)
    console.log(`${backend} keeps no span events, so C2 and the score sums are not checked`);
  const result = runChecks(spans, expectedRun, run, backend, keepsEvents);
  const mapping = { ...mappingOf(result, backend), ...extra };
  await writeReport(out, reportOf(result.sums, expectedRun, keepsEvents), mapping, backend);
  if (failed.size === 0) return console.log('All checks passed');
  for (const [id, { count, detail }] of failed)
    console.error(`${id} failed ${count} time(s): ${detail}`);
  process.exitCode = 1;
}
