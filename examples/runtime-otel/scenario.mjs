/* global process, console, URL */
// Facts shared by the app and the backend checks: the sessions, the usage of every call,
// the feedback rule and the numbers a correct run has to produce. Node built-ins only.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PROMPT_ID = 'acme-support/refund-reply';
export const FEEDBACK_NAME = 'user.thumbs';
export const LABEL = 'prod';
export const RELEASES = fileURLToPath(new URL('./.promptscript/releases/', import.meta.url));
export const KEYS = Array.from(
  { length: 200 },
  (_, i) => `session-${String(i + 1).padStart(3, '0')}`
);
export const INPUTS = {
  order_total: 42.5,
  days_since_delivery: 12,
  message: 'The kettle arrived broken. Can I get my money back?',
};
export const USAGE = { input_tokens: 420, output_tokens: 80 };

// Every fourth session gives a thumbs down. Fixed, so the expected score per arm is known.
export function feedbackFor(index) {
  return index % 4 === 0 ? { score: 0, label: 'negative' } : { score: 1, label: 'positive' };
}

// Own copy of the documented bucket rule (releases guide, conformance vectors), not the runtime's code.
export function bucketOf(experiment, id, key) {
  const text = `promptscript-assign-v1\0${experiment}\0${id}\0${key}`;
  const hex = createHash('sha256').update(text, 'utf8').digest('hex');
  return Number.parseInt(hex.slice(0, 8), 16) % 10000;
}

// The first arm whose cumulative weight is above the bucket
export function armOf(arms, bucket) {
  let total = 0;
  for (const arm of arms) {
    total += arm.weight;
    if (bucket < total) return arm.variant;
  }
  return undefined;
}

// Same formula as the runtime uses for the cost estimate
export function callCost(price) {
  return (
    (USAGE.input_tokens * price.inputUsdPerMillion +
      USAGE.output_tokens * price.outputUsdPerMillion) /
    1_000_000
  );
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readArm(releases, arm, pricing) {
  const bundle = await readJson(`${releases}bundles/${arm.contentHash}.json`);
  const { provider, apiId } = bundle.model;
  const price = pricing.models.find(
    (model) => model.provider === provider && model.apiId === apiId
  );
  return {
    variant: arm.variant,
    contentHash: arm.contentHash,
    apiId,
    provider,
    weight: arm.weight,
    costPerCall: callCost(price),
    calls: 0,
    costSum: 0,
    scoreSum: 0,
  };
}

// Reads the label, the bundles and pricing.json in a releases directory and returns, per arm of
// the experiment, what a correct run of the app produces for KEYS.
export async function expected(releases) {
  const label = await readJson(`${releases}${LABEL}.json`);
  const entry = label.prompts.find((prompt) => prompt.id === PROMPT_ID);
  const pricing = await readJson(`${releases}pricing.json`);
  const arms = await Promise.all(
    entry.experiment.arms.map((arm) => readArm(releases, arm, pricing))
  );
  KEYS.forEach((key, index) => {
    const variant = armOf(arms, bucketOf(entry.experiment.name, PROMPT_ID, key));
    const arm = arms.find((candidate) => candidate.variant === variant);
    arm.calls += 1;
    arm.costSum += arm.costPerCall;
    arm.scoreSum += feedbackFor(index).score;
  });
  return { experiment: entry.experiment.name, arms };
}

// Runs every case of the conformance vectors through the two functions above
async function checkVectors(path) {
  const { cases } = await readJson(path);
  const wrong = cases.filter((item) => {
    const bucket = bucketOf(item.experiment, item.id, item.key);
    return bucket !== item.bucket || armOf(item.arms, bucket) !== item.variant;
  });
  for (const item of wrong) console.error(`Vector case failed: ${item.name}`);
  console.log(`${cases.length - wrong.length} of ${cases.length} vector cases agree`);
  return wrong.length === 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const at = process.argv.indexOf('--vectors');
  const path = at === -1 ? undefined : process.argv[at + 1];
  if (!path) {
    console.error('Usage: node scenario.mjs --vectors <path to assignment.json>');
    process.exit(2);
  }
  process.exit((await checkVectors(path)) ? 0 : 1);
}
