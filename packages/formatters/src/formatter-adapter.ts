import {
  deepClone,
  isCanonicalProgram,
  normalizeProgram,
  toLegacyProgram,
  type ProgramInput,
} from '@promptscript/core';
import { resolveOutputPathTokens } from './path-tokens.js';
import { appendResourceCapabilityWarnings } from './resource-capability-warnings.js';
import { appendSkillContractWarnings } from './skill-contract-warnings.js';
import type {
  CanonicalFormatter,
  Formatter,
  FormatterOutput,
  FormatOptions,
  LegacyFormatter,
} from './types.js';

export function isCanonicalFormatter(formatter: Formatter): formatter is CanonicalFormatter {
  return (
    'formatCanonical' in formatter &&
    typeof (formatter as Partial<CanonicalFormatter>).formatCanonical === 'function'
  );
}

export function isLegacyFormatter(formatter: Formatter): formatter is LegacyFormatter {
  return 'format' in formatter && typeof formatter.format === 'function';
}

/**
 * Format a program, resolve `{{prs.*}}` path tokens for the target, and
 * report authored resource blocks and skill contracts the target drops.
 */
export function formatProgram(
  formatter: Formatter,
  ast: ProgramInput,
  options?: FormatOptions
): FormatterOutput {
  const output = resolveOutputPathTokens(runFormatter(formatter, ast, options), formatter, options);
  const program = isCanonicalProgram(ast) ? toLegacyProgram(ast) : ast;
  const withResourceWarnings = appendResourceCapabilityWarnings(
    output,
    program,
    formatter.name,
    options?.version
  );
  return appendSkillContractWarnings(
    withResourceWarnings,
    program,
    formatter.name,
    options?.version
  );
}

/**
 * Route canonical AST only to explicit consumers and isolate legacy formatters.
 */
function runFormatter(
  formatter: Formatter,
  ast: ProgramInput,
  options?: FormatOptions
): FormatterOutput {
  if (isCanonicalFormatter(formatter)) {
    const canonical = isCanonicalProgram(ast) ? ast : normalizeProgram(ast);
    return formatter.formatCanonical(canonical, options);
  }
  if (!isLegacyFormatter(formatter)) {
    throw new Error('Formatter does not implement a supported AST contract');
  }
  if (ast.type === 'Program') {
    return formatter.format(deepClone(ast), options);
  }
  const canonical = ast;
  /**
   * Explicit compatibility boundary for unmigrated formatters. The projection
   * is detached so legacy formatters cannot mutate the canonical pipeline.
   */
  return formatter.format(toLegacyProgram(canonical, { preserveCanonicalBody: true }), options);
}
