import type {
  EvalAssertion,
  EvalExpectedValue,
  PromptBundleOutput,
  PromptBundleOutputProperty,
  PromptBundleV1,
} from '@promptscript/core';
import { EVAL_CODES, type EvalCode, type EvalFinding } from '../errors.js';
import type { DatasetRecord } from './read.js';

/** What a dataset row is checked against. */
export interface DatasetCheckContext {
  /** Dataset path relative to the project root */
  file: string;
  /** Contract of the prompt under test */
  bundle: Pick<PromptBundleV1, 'inputs' | 'output'>;
  /** Assertions of the suite */
  assertions: readonly EvalAssertion[];
}

function fits(value: EvalExpectedValue, property: PromptBundleOutputProperty): boolean {
  if (property.type === 'array') {
    const items = property.items;
    return (
      Array.isArray(value) &&
      items?.type === 'string' &&
      value.every((item) => items.enum === undefined || items.enum.includes(item))
    );
  }
  if (property.type === 'string') {
    return (
      typeof value === 'string' && (property.enum === undefined || property.enum.includes(value))
    );
  }
  return typeof value === property.type;
}

function expectedProblems(
  expected: DatasetRecord['row']['expected'],
  output: PromptBundleOutput | undefined
): string[] {
  if (expected === undefined || typeof expected === 'string') return [];
  if (output === undefined) {
    return ['expected is an object, but the prompt has no output contract; use a string'];
  }
  return Object.entries(expected).flatMap(([key, value]) => {
    const property = Object.hasOwn(output.properties, key) ? output.properties[key] : undefined;
    const name = key.slice(0, 64);
    if (property === undefined) return [`expected.${name} is not an output property`];
    if (!fits(value, property)) return [`expected.${name} does not match the output property type`];
    return [];
  });
}

function hasExpected(
  expected: DatasetRecord['row']['expected'],
  field: string | undefined
): boolean {
  if (field === undefined) return typeof expected === 'string';
  return typeof expected === 'object' && Object.hasOwn(expected, field);
}

/**
 * Check one dataset row against the prompt contract and the suite: no
 * undeclared inputs, an `expected` value that fits the output contract, and
 * an expected value for every `equals` assertion without its own value.
 * Messages name the row id and keys, never values.
 *
 * @param record - Row read by `readDataset`
 * @param context - Dataset path, prompt contract and suite assertions
 * @returns Error findings; empty when the row is fine
 */
export function checkDatasetRow(
  record: DatasetRecord,
  context: DatasetCheckContext
): EvalFinding[] {
  const { row, line } = record;
  const findings: EvalFinding[] = [];
  const add = (code: EvalCode, message: string): void => {
    findings.push({
      code,
      severity: 'error',
      message: `Row "${row.id}": ${message}.`,
      file: context.file,
      line,
    });
  };

  const unknown = Object.keys(row.inputs)
    .filter((key) => !Object.hasOwn(context.bundle.inputs, key))
    .map((key) => key.slice(0, 64));
  if (unknown.length > 0) {
    add(
      EVAL_CODES.ROW_CONTRACT,
      `the prompt declares no input ${unknown.join(', ')}; fix the input name`
    );
  }
  for (const problem of expectedProblems(row.expected, context.bundle.output)) {
    add(EVAL_CODES.ROW_CONTRACT, problem);
  }
  for (const assertion of context.assertions) {
    if (assertion.kind !== 'equals' || assertion.value !== undefined) continue;
    if (hasExpected(row.expected, assertion.field)) continue;
    const target = assertion.field === undefined ? 'expected' : `expected.${assertion.field}`;
    add(
      EVAL_CODES.ROW_NO_EXPECTED,
      `equals assertion "${assertion.id}" needs ${target} in the row or value in the assertion`
    );
  }
  return findings;
}
