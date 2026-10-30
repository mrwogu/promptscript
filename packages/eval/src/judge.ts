import { Buffer } from 'node:buffer';
import {
  canonicalizeJson,
  findRuntimeSlots,
  sha256Hex,
  type EvalAssertionResultV1,
  type EvalJudgeRuns,
  type EvalLlmJudgeAssertion,
  type EvalVerdict,
  type PromptBundleV1,
} from '@promptscript/core';
import type { Prompt } from '@promptscript/runtime';
import { parseResponse, targetOf } from './assertions.js';
import { cacheKey, inputsHash } from './cache.js';
import { obtain, type Failure, type RunContext } from './calls.js';
import { callCost, roundUsd, worstCaseCost } from './cost.js';
import type { DatasetRecord } from './dataset/read.js';
import { EVAL_CODES, type EvalCode } from './errors.js';
import { effectiveInputs } from './inputs.js';
import type { CallPlan, ModelPlan } from './report.js';

/** Longest text a judge reads, in UTF-8 bytes. */
export const MAX_JUDGED_BYTES = 64 * 1024;

const MAX_REASON = 160;
const MAX_QUOTE = 60;
const BOUNDARY_LENGTH = 16;
// A rough size of a token in bytes, for estimates only
const BYTES_PER_TOKEN = 4;

/** One llm-judge assertion of a suite, ready to run. */
export interface JudgePlan {
  assertion: EvalLlmJudgeAssertion;
  rubric: PromptBundleV1;
  prompt: Prompt;
  model: ModelPlan;
  runs: EvalJudgeRuns;
}

/** What one judge assertion does on one case. */
export type JudgeSetup =
  | { kind: 'calls'; plan: JudgePlan; calls: CallPlan[] }
  | { kind: 'skipped'; plan: JudgePlan; reason: string }
  | { kind: 'refused'; plan: JudgePlan; code: EvalCode; message: string };

/** The consumed call of a judge run, for the case totals and the digest. */
export interface JudgeUse {
  key: string;
  bytes: Buffer;
  live: boolean;
  usage: { inputTokens: number; outputTokens: number };
  costUsd?: number;
}

/** What the judge assertions of one case gave. */
export interface JudgedCase {
  /** Finished judge assertions, in suite order */
  results: EvalAssertionResultV1[];
  /** Every call the judges consumed, in call order */
  uses: JudgeUse[];
  /** Why a judge assertion could not finish; later ones did not run */
  failure?: Failure;
}

/** One valid verdict of a judge run. */
export interface JudgeVerdict {
  verdict: EvalVerdict;
  reason: string;
}

/**
 * The verdict of one judge run: the response must be a JSON object with
 * exactly `verdict` (`pass` or `fail`) and `reason` (a string), after the same
 * trim and fence unwrap the assertions use. Anything else, such as the word
 * "pass" in free text, is no verdict.
 */
export function readVerdict(text: string): JudgeVerdict | undefined {
  const object = parseResponse(text);
  if (object === undefined) return undefined;
  const keys = Object.keys(object).sort();
  if (keys.length !== 2 || keys[0] !== 'reason' || keys[1] !== 'verdict') return undefined;
  const { verdict, reason } = object;
  if ((verdict !== 'pass' && verdict !== 'fail') || typeof reason !== 'string') return undefined;
  return { verdict, reason };
}

function quote(text: string): string {
  return JSON.stringify(text.length > MAX_QUOTE ? `${text.slice(0, MAX_QUOTE)}...` : text);
}

/**
 * The majority of the runs: the assertion passes when more than half of the
 * runs made said pass. When more than half gave no valid verdict there is no
 * result, and the case is an error.
 */
export function decide(
  runs: number,
  verdicts: ReadonlyArray<JudgeVerdict | undefined>,
  id: string,
  costUsd?: number
): EvalAssertionResultV1 | Failure {
  const valid = verdicts.filter((entry): entry is JudgeVerdict => entry !== undefined);
  if ((runs - valid.length) * 2 > runs) {
    return {
      code: EVAL_CODES.JUDGE_UNPARSABLE,
      message: `More than half of the ${runs} judge runs of assertion "${id}" gave no valid verdict; check that the rubric makes the model answer with a verdict and a reason.`,
    };
  }
  const passes = valid.filter((entry) => entry.verdict === 'pass').length;
  const passed = passes * 2 > runs;
  // The first failing run explains the failure; its reason is model text, so only a short quote of it
  const quoted = valid
    .filter((entry) => entry.verdict === 'fail')
    .map((entry) => quote(entry.reason));
  const reason = `${passes} of ${runs} runs said pass`;
  const detail = passed
    ? ''
    : quoted
        .slice(0, 1)
        .map((text) => `: ${text}`)
        .join('');
  return {
    id,
    kind: 'llm-judge',
    passed,
    reason: `${reason}${detail}`.slice(0, MAX_REASON),
    judge: {
      verdicts: valid.map((entry) => entry.verdict),
      runs,
      ...(costUsd === undefined ? {} : { costUsd: roundUsd(costUsd) }),
    },
  };
}

function declared(rubric: PromptBundleV1, values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).filter(([name]) => Object.hasOwn(rubric.inputs, name))
  );
}

function boundaryOf(target: string): string {
  return sha256Hex(target).slice(0, BOUNDARY_LENGTH);
}

/**
 * The inputs a rubric gets, only the ones it declares: `response` (the judged
 * text), `case_inputs` and `expected` as canonical JSON, `criteria`, and
 * `boundary`, the first 16 hex characters of the SHA-256 of the response.
 */
export function judgeInputs(
  plan: JudgePlan,
  bundle: PromptBundleV1,
  row: DatasetRecord['row'],
  target: string
): Record<string, string> {
  return declared(plan.rubric, {
    response: target,
    case_inputs: canonicalizeJson(effectiveInputs(bundle, row.inputs)),
    expected: row.expected === undefined ? '' : canonicalizeJson(row.expected),
    criteria: plan.assertion.criteria ?? '',
    boundary: boundaryOf(target),
  });
}

/**
 * The calls of a judge assertion on one response, one per run, with samples
 * from 1. The boundary is not in the cache key: it comes from the response,
 * which the key covers already.
 */
export function judgeCallPlans(
  plan: JudgePlan,
  bundle: PromptBundleV1,
  row: DatasetRecord['row'],
  target: string
): CallPlan[] {
  const values = judgeInputs(plan, bundle, row, target);
  const keyed = Object.fromEntries(Object.entries(values).filter(([name]) => name !== 'boundary'));
  const { rubric, model } = plan;
  const messages = plan.prompt.render(values).messages;
  const inputs = inputsHash(keyed);
  const worstCaseUsd =
    model.pricing === undefined
      ? 0
      : worstCaseCost(messages, rubric.output, model.maxOutputTokens, model.pricing);
  return Array.from({ length: plan.runs }, (_unused, index): CallPlan => {
    const cacheRequest = {
      contentHash: rubric.contentHash,
      inputsHash: inputs,
      modelRef: model.ref,
      provider: model.provider,
      apiId: model.apiId,
      params: model.params,
      sample: index + 1,
    };
    return {
      model,
      request: {
        promptId: rubric.id,
        provider: model.provider,
        apiId: model.apiId,
        modelRef: model.ref,
        messages,
        params: model.params,
        ...(rubric.output === undefined ? {} : { output: rubric.output }),
        maxOutputTokens: model.maxOutputTokens,
      },
      cacheRequest,
      key: cacheKey(cacheRequest),
      worstCaseUsd,
    };
  });
}

function setupOf(
  plan: JudgePlan,
  bundle: PromptBundleV1,
  row: DatasetRecord['row'],
  text: string
): JudgeSetup {
  const target = targetOf(plan.assertion.field, text);
  if (!target.ok) return { kind: 'skipped', plan, reason: target.reason };
  const judged =
    typeof target.value === 'string' ? target.value : (JSON.stringify(target.value) ?? '');
  if (Buffer.byteLength(judged, 'utf8') > MAX_JUDGED_BYTES) {
    return {
      kind: 'refused',
      plan,
      code: EVAL_CODES.JUDGE_TARGET_TOO_LONG,
      message: `The text for judge assertion "${plan.assertion.id}" is longer than ${MAX_JUDGED_BYTES} bytes, so it was not judged; shorten the output or judge a smaller field.`,
    };
  }
  return { kind: 'calls', plan, calls: judgeCallPlans(plan, bundle, row, judged) };
}

/**
 * What every judge assertion does on a response: calls, a failed assertion
 * with no call (no target), or a refusal (text too long).
 *
 * @throws Error when the rubric cannot render or a value cannot be hashed
 */
export function judgeSetups(
  judges: readonly JudgePlan[],
  bundle: PromptBundleV1,
  row: DatasetRecord['row'],
  text: string
): JudgeSetup[] {
  return judges.map((plan) => setupOf(plan, bundle, row, text));
}

/** The calls of the setups that have any. */
export function setupCalls(setups: readonly JudgeSetup[]): CallPlan[] {
  return setups.flatMap((setup) => (setup.kind === 'calls' ? setup.calls : []));
}

/**
 * Worst-case cost and number of the judge calls of a case whose response is not
 * known yet. The response is guessed at 4 bytes per output token of the model
 * under test, at most 64 KiB: an estimate, not a bound. The real reservation
 * of each call uses its actual bytes.
 */
export function judgeEstimate(
  judges: readonly JudgePlan[],
  bundle: PromptBundleV1,
  row: DatasetRecord['row'],
  caseModel: ModelPlan
): { usd: number; calls: number } {
  let usd = 0;
  let calls = 0;
  for (const plan of judges) {
    calls += plan.runs;
    const { pricing } = plan.model;
    if (pricing === undefined) continue;
    const values = { ...judgeInputs(plan, bundle, row, ''), boundary: '0'.repeat(BOUNDARY_LENGTH) };
    const messages = plan.prompt.render(declared(plan.rubric, values)).messages;
    const slots = plan.rubric.messages.reduce(
      (sum, message) =>
        sum + findRuntimeSlots(message.content).filter((slot) => slot.name === 'response').length,
      0
    );
    const guess = Math.min(MAX_JUDGED_BYTES, caseModel.maxOutputTokens * BYTES_PER_TOKEN);
    const fixed = worstCaseCost(messages, plan.rubric.output, plan.model.maxOutputTokens, pricing);
    const response = (slots * guess * pricing.inputUsdPerMillion) / 1_000_000;
    usd += (fixed + response) * plan.runs;
  }
  return { usd, calls };
}

async function runJudge(
  setup: Extract<JudgeSetup, { kind: 'calls' }>,
  caseId: string,
  context: RunContext,
  uses: JudgeUse[]
): Promise<EvalAssertionResultV1 | Failure> {
  const verdicts: Array<JudgeVerdict | undefined> = [];
  let costUsd: number | undefined;
  for (const call of setup.calls) {
    if (context.options.signal?.aborted) {
      return {
        code: EVAL_CODES.RUN_STOPPED,
        message: 'The run stopped before the next judge call.',
      };
    }
    // One run after the other: the budget reservations and the cache keys keep their order
    const got = await obtain(call, caseId, context);
    if ('code' in got) return got;
    const cost =
      call.model.pricing === undefined
        ? undefined
        : callCost(got.response.usage, call.model.pricing);
    if (cost !== undefined) costUsd = (costUsd ?? 0) + cost;
    uses.push({
      key: call.key,
      bytes: got.bytes,
      live: got.live,
      usage: got.response.usage,
      ...(cost === undefined ? {} : { costUsd: cost }),
    });
    verdicts.push(readVerdict(got.response.text));
  }
  return decide(setup.plan.runs, verdicts, setup.plan.assertion.id, costUsd);
}

/**
 * Run the judge assertions of one case, one after the other, and their runs in
 * order. A text over the cap stops the case before any call. A judge failure
 * stops the rest and comes back with what finished.
 */
export async function judgeCase(
  setups: readonly JudgeSetup[],
  caseId: string,
  context: RunContext
): Promise<JudgedCase> {
  const done: JudgedCase = { results: [], uses: [] };
  const refused = setups.find((setup) => setup.kind === 'refused');
  if (refused?.kind === 'refused') {
    return { ...done, failure: { code: refused.code, message: refused.message } };
  }
  for (const setup of setups) {
    if (setup.kind === 'skipped') {
      done.results.push({
        id: setup.plan.assertion.id,
        kind: 'llm-judge',
        passed: false,
        reason: setup.reason,
      });
    } else if (setup.kind === 'calls') {
      const result = await runJudge(setup, caseId, context, done.uses);
      if ('code' in result) return { ...done, failure: result };
      done.results.push(result);
    }
  }
  return done;
}
