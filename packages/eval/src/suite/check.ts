import {
  compareCodeUnits,
  levenshteinDistance,
  type EvalAssertion,
  type EvalSuiteV1,
  type ModelCatalog,
  type ModelProfile,
  type PromptBundleModel,
  type PromptBundleV1,
} from '@promptscript/core';
import { compileJsonSchema } from '../assertions.js';
import { EVAL_CODES, type EvalCode, type EvalFinding } from '../errors.js';
import type { LoadedSuite } from './load.js';

/** What suites are checked against. */
export interface CheckContext {
  /** Prompt bundles the project compiles */
  bundles: readonly PromptBundleV1[];
  /** Model catalog with the project's profiles */
  catalog: ModelCatalog;
}

type Add = (code: EvalCode, message: string, severity?: 'error' | 'warning') => void;

const QUANTIFIERS = new Set(['*', '+', '{']);

// The pattern with escapes and character classes replaced by `x`, so only
// groups and quantifiers keep their meaning.
function skeleton(pattern: string): string {
  let out = '';
  let inClass = false;
  let index = 0;
  while (index < pattern.length) {
    const char = pattern.charAt(index);
    index += char === '\\' ? 2 : 1;
    if (char === '\\') {
      if (!inClass) out += 'x';
    } else if (inClass) {
      inClass = char !== ']';
    } else if (char === '[') {
      inClass = true;
      out += 'x';
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * True when a group that holds a quantifier is itself repeated, such as
 * `(a+)+` or `(\w+\s?)*`, the usual shape of catastrophic backtracking.
 * A heuristic over the pattern text, not a proof either way.
 */
function hasNestedQuantifier(pattern: string): boolean {
  const groups: boolean[] = [];
  let closedQuantified = false;
  for (const char of skeleton(pattern)) {
    if (QUANTIFIERS.has(char) && closedQuantified) return true;
    closedQuantified = false;
    if (char === '(') {
      groups.push(false);
    } else if (char === ')') {
      closedQuantified = groups.pop() === true;
      if (closedQuantified && groups.length > 0) groups[groups.length - 1] = true;
    } else if (QUANTIFIERS.has(char) && groups.length > 0) {
      groups[groups.length - 1] = true;
    }
  }
  return false;
}

function nearestIds(id: string, bundles: readonly PromptBundleV1[]): string[] {
  // A suite can hold a huge prompt string; the distance matrix grows with it
  const probe = id.slice(0, 200);
  return bundles
    .map((bundle) => ({ id: bundle.id, distance: levenshteinDistance(probe, bundle.id) }))
    .sort((a, b) => a.distance - b.distance || compareCodeUnits(a.id, b.id))
    .slice(0, 5)
    .map((entry) => entry.id);
}

function checkAssertions(
  assertions: readonly EvalAssertion[],
  bundle: PromptBundleV1,
  add: Add
): void {
  const properties = bundle.output?.properties ?? {};
  for (const assertion of assertions) {
    if (assertion.field !== undefined && bundle.output === undefined) {
      add(
        EVAL_CODES.UNKNOWN_FIELD,
        `assertion "${assertion.id}" reads field "${assertion.field}", but prompt "${bundle.id}" has no output contract`
      );
    } else if (assertion.field !== undefined && !Object.hasOwn(properties, assertion.field)) {
      add(
        EVAL_CODES.UNKNOWN_FIELD,
        `assertion "${assertion.id}" reads field "${assertion.field}", which is not an output property of "${bundle.id}" (${Object.keys(properties).join(', ')})`
      );
    }
    if (assertion.kind !== 'json-schema') continue;
    if (assertion.schema === undefined && bundle.output === undefined) {
      add(
        EVAL_CODES.NO_SCHEMA,
        `assertion "${assertion.id}" has no schema and prompt "${bundle.id}" has no output contract; add schema to the assertion`
      );
    }
  }
}

// Inline schemas and regexes need no bundle, so they are checked for every suite.
function checkAuthoredPatterns(assertions: readonly EvalAssertion[], add: Add): void {
  for (const assertion of assertions) {
    if (assertion.kind === 'json-schema' && assertion.schema !== undefined) {
      try {
        compileJsonSchema(assertion.schema);
      } catch (error) {
        const reason = error instanceof Error ? error.message.slice(0, 120) : 'unknown error';
        add(
          EVAL_CODES.NO_SCHEMA,
          `assertion "${assertion.id}" has a schema Ajv cannot compile: ${reason}`
        );
      }
    }
    if (assertion.kind === 'regex' && hasNestedQuantifier(assertion.pattern)) {
      add(
        EVAL_CODES.REGEX_RISK,
        `regex of assertion "${assertion.id}" repeats a group that holds a quantifier, which can backtrack for a very long time; rewrite it without the nesting`,
        'warning'
      );
    }
  }
}

function resolveModel(ref: string, catalog: ModelCatalog, add: Add): ModelProfile | undefined {
  const resolution = catalog.resolve(ref);
  if (resolution === undefined || resolution.kind === 'inherit') {
    add(
      EVAL_CODES.MODEL_REF,
      `model "${ref}" is not in the model catalog; use a profile id, alias or API id, or add it under models.profiles in promptscript.yaml`
    );
    return undefined;
  }
  const { profile } = resolution;
  if (profile.status === 'retired' || profile.status === 'deprecated') {
    const replacement = catalog.getReplacement(profile.id);
    const advice = replacement === undefined ? '' : `; use ${replacement.id}`;
    add(
      EVAL_CODES.MODEL_REF,
      `model "${ref}" is ${profile.status}${advice}`,
      profile.status === 'retired' ? 'error' : 'warning'
    );
  }
  return profile;
}

function ownProfile(model: PromptBundleModel, catalog: ModelCatalog): ModelProfile | undefined {
  const resolution = catalog.resolve(model.profile ?? model.ref);
  return resolution === undefined || resolution.kind === 'inherit' ? undefined : resolution.profile;
}

function checkModels(
  suite: EvalSuiteV1,
  bundle: PromptBundleV1,
  catalog: ModelCatalog,
  add: Add
): void {
  const refs = (suite.models ?? []).map((entry) => (typeof entry === 'string' ? entry : entry.ref));
  const own = bundle.model;
  if (refs.length === 0 && own === undefined) {
    add(
      EVAL_CODES.MODEL_REF,
      `prompt "${bundle.id}" has no model and the suite lists none; add models to the suite`
    );
    return;
  }
  const listed = refs.map((ref) => ({ ref, profile: resolveModel(ref, catalog, add) }));
  const thresholds = suite.thresholds;
  if (thresholds?.maxCostUsd === undefined && thresholds?.maxCostPerCaseUsd === undefined) return;

  // A listed model that does not resolve already has a finding; one is enough
  const used =
    own !== undefined && refs.length === 0
      ? [{ ref: own.ref, profile: ownProfile(own, catalog) }]
      : listed.filter((entry) => entry.profile !== undefined);
  for (const { ref, profile } of used) {
    if (profile?.pricing !== undefined) continue;
    add(
      EVAL_CODES.PRICING_MISSING,
      `the suite has a cost threshold, but model "${ref}" has no price; add pricing under models.profiles.${profile?.id ?? ref} in promptscript.yaml`
    );
  }
}

function checkSuite(loaded: LoadedSuite, context: CheckContext): EvalFinding[] {
  const { suite, file } = loaded;
  const findings: EvalFinding[] = [];
  const add: Add = (code, message, severity = 'error') => {
    findings.push({ code, severity, message: `Suite ${file}: ${message}.`, file });
  };

  checkAuthoredPatterns(suite.assertions, add);
  const allow = typeof suite.dataset === 'string' ? [] : (suite.dataset.allow ?? []);
  if (allow.length > 0 && suite.assertions.every((assertion) => assertion.kind === 'llm-judge')) {
    add(
      EVAL_CODES.ALLOW_WITHOUT_ASSERTION,
      'the dataset allows scan findings, so the suite needs at least one equals, contains, regex or json-schema assertion'
    );
  }

  const bundle = context.bundles.find((candidate) => candidate.id === suite.prompt);
  if (bundle === undefined) {
    const nearest = nearestIds(suite.prompt, context.bundles);
    const hint =
      nearest.length > 0 ? `nearest ids: ${nearest.join(', ')}` : 'the project compiles no prompts';
    add(
      EVAL_CODES.UNKNOWN_PROMPT,
      `prompt "${suite.prompt.slice(0, 200)}" is not compiled by this project; ${hint}`
    );
    return findings;
  }
  checkAssertions(suite.assertions, bundle, add);
  checkModels(suite, bundle, context.catalog, add);
  return findings;
}

/**
 * Check loaded suites against the compiled prompts and the model catalog:
 * the prompt exists (else the five nearest ids), fields are declared output
 * properties, `json-schema` has a schema that compiles, every model in
 * `models` resolves and is not retired, cost thresholds have a price for
 * every model the suite runs, regexes do not nest quantifiers, and a dataset
 * `allow` comes with a deterministic assertion. Judge models are not checked:
 * `llm-judge` assertions get only the structure and field checks.
 *
 * @param suites - Suites from `loadSuites`
 * @param context - Compiled bundles and the model catalog
 * @returns Findings of every suite; errors stop a run before any call
 */
export function checkSuites(suites: readonly LoadedSuite[], context: CheckContext): EvalFinding[] {
  return suites.flatMap((suite) => checkSuite(suite, context));
}
