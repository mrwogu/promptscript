import {
  compareCodeUnits,
  findRuntimeSlots,
  type EvalLlmJudgeAssertion,
  type EvalSuiteV1,
  type ModelProfile,
  type PromptBundleMessage,
  type PromptBundleV1,
} from '@promptscript/core';
import { EVAL_CODES } from '../errors.js';
import { nearestIds, ownProfile, resolveModel, type Add, type CheckContext } from './common.js';

/** Rubric inputs the judge call fills; each must be a string input when declared. */
export const RUBRIC_INPUTS = ['response', 'case_inputs', 'expected', 'criteria', 'boundary'];
// What a model under test can write must not reach the rubric's instructions
const UNTRUSTED_INPUTS = new Set(['response', 'case_inputs', 'expected']);
const VERDICTS = ['fail', 'pass'];

/** The model a judge assertion runs on, by the order: assertion, suite, rubric. */
export function judgeModelRef(
  assertion: EvalLlmJudgeAssertion,
  suite: EvalSuiteV1,
  rubric: PromptBundleV1
): { ref: string; fromRubric: boolean } | undefined {
  const written = assertion.model ?? suite.judge?.model;
  if (written !== undefined) return { ref: written, fromRubric: false };
  return rubric.model === undefined ? undefined : { ref: rubric.model.ref, fromRubric: true };
}

interface Slot {
  name: string;
  /** The message the slot is in */
  text: string;
  offset: number;
  length: number;
}

// The slots of the messages of a role, with where they are in their message
function slotsOf(messages: readonly PromptBundleMessage[]): Slot[] {
  return messages.flatMap((message) =>
    findRuntimeSlots(message.content)
      .filter((slot) => slot.kind === 'slot')
      .map((slot) => ({
        name: String(slot.name),
        text: message.content,
        offset: slot.offset,
        length: slot.length,
      }))
  );
}

const OPEN_FENCE = /<([A-Za-z][A-Za-z0-9_-]*)-\{\{input\.boundary\}\}>$/;

// True when a tag named with the boundary stands right before the slot and its closing tag right after
function fenced(slot: Slot): boolean {
  const open = OPEN_FENCE.exec(slot.text.slice(0, slot.offset).trimEnd());
  if (open === null) return false;
  const close = `</${open[1]}-{{input.boundary}}>`;
  return slot.text
    .slice(slot.offset + slot.length)
    .trimStart()
    .startsWith(close);
}

function checkInputs(assertion: EvalLlmJudgeAssertion, rubric: PromptBundleV1, add: Add): void {
  const { id } = assertion;
  for (const [name, spec] of Object.entries(rubric.inputs)) {
    if (RUBRIC_INPUTS.includes(name)) {
      if (spec.type !== 'string') {
        add(
          EVAL_CODES.RUBRIC_INVALID,
          `rubric "${rubric.id}" of assertion "${id}" declares input "${name}" as ${spec.type}; the judge call passes it as a string`
        );
      }
    } else if (spec.default === undefined) {
      add(
        EVAL_CODES.RUBRIC_INVALID,
        `rubric "${rubric.id}" of assertion "${id}" has input "${name}" without a default; the judge call fills only ${RUBRIC_INPUTS.join(', ')}`
      );
    }
  }
  // A slot with no declared input makes the render throw at judge time, so say it now
  const used = new Set(slotsOf(rubric.messages).map((slot) => slot.name));
  for (const name of [...used].sort(compareCodeUnits)) {
    if (name === 'response' || Object.hasOwn(rubric.inputs, name)) continue;
    add(
      EVAL_CODES.RUBRIC_INVALID,
      `rubric "${rubric.id}" of assertion "${id}" uses {{input.${name}}} but does not declare a "${name}" input; declare it or remove the slot`
    );
  }
  if (!Object.hasOwn(rubric.inputs, 'response')) {
    add(
      EVAL_CODES.RUBRIC_INVALID,
      `rubric "${rubric.id}" of assertion "${id}" has no "response" input; declare it and use it in a user message`
    );
  }
  if (assertion.criteria !== undefined && !Object.hasOwn(rubric.inputs, 'criteria')) {
    add(
      EVAL_CODES.RUBRIC_INVALID,
      `assertion "${id}" sets criteria, but rubric "${rubric.id}" has no "criteria" input; add it or remove criteria`
    );
  }
}

function checkSlots(assertion: EvalLlmJudgeAssertion, rubric: PromptBundleV1, add: Add): void {
  const { id } = assertion;
  const system = slotsOf(rubric.messages.filter((message) => message.role === 'system'));
  const user = slotsOf(rubric.messages.filter((message) => message.role === 'user'));
  const refused = new Set(
    system.filter((slot) => UNTRUSTED_INPUTS.has(slot.name)).map((slot) => slot.name)
  );
  for (const name of [...refused].sort(compareCodeUnits)) {
    add(
      EVAL_CODES.RUBRIC_SLOT_IN_SYSTEM,
      `rubric "${rubric.id}" of assertion "${id}" puts "${name}" in a system message, where text under test would read as instructions; move it to a user message`
    );
  }
  if (!refused.has('response') && !user.some((slot) => slot.name === 'response')) {
    add(
      EVAL_CODES.RUBRIC_INVALID,
      `rubric "${rubric.id}" of assertion "${id}" never shows the response to the judge; add {{input.response}} to a user message`
    );
  }
  const loose = [
    ...new Set(
      user
        .filter((slot) => UNTRUSTED_INPUTS.has(slot.name) && !fenced(slot))
        .map((slot) => slot.name)
    ),
  ].sort(compareCodeUnits);
  if (loose.length > 0) {
    add(
      EVAL_CODES.RUBRIC_UNFENCED,
      `rubric "${rubric.id}" of assertion "${id}" shows ${loose.join(', ')} outside a fence; wrap each in <name-{{input.boundary}}> and </name-{{input.boundary}}>, such as <response-{{input.boundary}}>{{input.response}}</response-{{input.boundary}}>`,
      'warning'
    );
  }
}

function hasVerdictContract(rubric: PromptBundleV1): boolean {
  const properties = rubric.output?.properties;
  if (properties === undefined) return false;
  const names = Object.keys(properties).sort(compareCodeUnits);
  const verdict = properties['verdict'];
  const reason = properties['reason'];
  const options = [...(verdict?.enum ?? [])].sort(compareCodeUnits);
  return (
    names.length === 2 &&
    names[0] === 'reason' &&
    names[1] === 'verdict' &&
    verdict?.type === 'string' &&
    options.length === VERDICTS.length &&
    options.every((option, index) => option === VERDICTS[index]) &&
    reason?.type === 'string' &&
    reason.enum === undefined
  );
}

function checkOutput(assertion: EvalLlmJudgeAssertion, rubric: PromptBundleV1, add: Add): void {
  if (hasVerdictContract(rubric)) return;
  add(
    EVAL_CODES.RUBRIC_OUTPUT,
    `rubric "${rubric.id}" of assertion "${assertion.id}" must have an output of exactly verdict (enum pass, fail) and reason (string)`
  );
}

// Profiles of the models under test, as keys, so the judge can be compared with them
function modelsUnderTest(
  suite: EvalSuiteV1,
  bundle: PromptBundleV1,
  context: CheckContext
): string[] {
  const refs = (suite.models ?? []).map((entry) => (typeof entry === 'string' ? entry : entry.ref));
  if (refs.length === 0) {
    const own = bundle.model;
    const profile = own === undefined ? undefined : ownProfile(own, context.catalog);
    return own === undefined ? [] : [profile?.id ?? own.ref];
  }
  return refs.map((ref) => {
    const resolution = context.catalog.resolve(ref);
    return resolution === undefined || resolution.kind === 'inherit' ? ref : resolution.profile.id;
  });
}

function checkJudgeModel(
  assertion: EvalLlmJudgeAssertion,
  suite: EvalSuiteV1,
  rubric: PromptBundleV1,
  tested: readonly string[],
  unpriced: Set<string>,
  context: CheckContext,
  add: Add
): void {
  const { id } = assertion;
  const model = judgeModelRef(assertion, suite, rubric);
  if (model === undefined) {
    add(
      EVAL_CODES.JUDGE_MODEL_MISSING,
      `assertion "${id}" has no judge model; set model on it, judge.model on the suite, or a model on rubric "${rubric.id}"`
    );
    return;
  }
  let profile: ModelProfile | undefined;
  if (model.fromRubric && rubric.model !== undefined) {
    profile = ownProfile(rubric.model, context.catalog);
  } else {
    profile = resolveModel(model.ref, context.catalog, add);
  }
  const limits = suite.thresholds;
  if (
    (limits?.maxCostUsd !== undefined || limits?.maxCostPerCaseUsd !== undefined) &&
    profile?.pricing === undefined &&
    !unpriced.has(model.ref)
  ) {
    unpriced.add(model.ref);
    add(
      EVAL_CODES.PRICING_MISSING,
      `the suite has a cost threshold, but judge model "${model.ref}" of assertion "${id}" has no price; add pricing under models.profiles.${profile?.id ?? model.ref} in promptscript.yaml`
    );
  }
  if (tested.includes(profile?.id ?? model.ref)) {
    add(
      EVAL_CODES.JUDGE_SAME_MODEL,
      `judge model "${model.ref}" of assertion "${id}" is also a model under test, so it may favor its own answers; judge with another model`,
      'warning'
    );
  }
}

/**
 * Check the judge assertions of a suite: the rubric is a compiled prompt other
 * than the one under test, its inputs and slots fit the judge call, its system
 * messages never hold text under test, its output is a verdict and a reason,
 * and a judge model resolves and has a price when the suite needs one.
 */
export function checkJudges(
  suite: EvalSuiteV1,
  bundle: PromptBundleV1,
  context: CheckContext,
  add: Add
): void {
  const tested = modelsUnderTest(suite, bundle, context);
  // One price finding per judge model, however many assertions use it
  const unpriced = new Set<string>();
  for (const assertion of suite.assertions) {
    if (assertion.kind !== 'llm-judge') continue;
    const rubric = context.bundles.find((candidate) => candidate.id === assertion.rubric);
    if (rubric === undefined) {
      const nearest = nearestIds(assertion.rubric, context.bundles);
      const hint =
        nearest.length > 0
          ? `nearest ids: ${nearest.join(', ')}`
          : 'the project compiles no prompts';
      add(
        EVAL_CODES.UNKNOWN_PROMPT,
        `rubric "${assertion.rubric.slice(0, 200)}" of assertion "${assertion.id}" is not compiled by this project; ${hint}`
      );
      continue;
    }
    if (rubric.id === bundle.id) {
      add(
        EVAL_CODES.RUBRIC_INVALID,
        `assertion "${assertion.id}" uses the prompt under test as its rubric; write a separate rubric prompt`
      );
      continue;
    }
    checkInputs(assertion, rubric, add);
    checkSlots(assertion, rubric, add);
    checkOutput(assertion, rubric, add);
    checkJudgeModel(assertion, suite, rubric, tested, unpriced, context, add);
  }
}
