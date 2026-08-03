import {
  deepClone,
  normalizeProgram,
  toLegacyProgram,
  type CanonicalProgram,
  type ProgramInput,
} from '@promptscript/core';
import type { Formatter, FormatterOutput, FormatOptions } from './types.js';

/**
 * Optional formatter capability for consuming the immutable canonical AST.
 */
export interface CanonicalFormatter {
  formatCanonical(ast: CanonicalProgram, options?: FormatOptions): FormatterOutput;
}

export function isCanonicalFormatter(
  formatter: Formatter
): formatter is Formatter & CanonicalFormatter {
  return (
    'formatCanonical' in formatter &&
    typeof (formatter as Partial<CanonicalFormatter>).formatCanonical === 'function'
  );
}

/**
 * Route canonical AST only to explicit consumers and isolate legacy formatters.
 */
export function formatProgram(
  formatter: Formatter,
  ast: ProgramInput,
  options?: FormatOptions
): FormatterOutput {
  if (!isCanonicalFormatter(formatter) && ast.type === 'Program') {
    return formatter.format(deepClone(ast), options);
  }
  const canonical = normalizeProgram(ast);
  if (isCanonicalFormatter(formatter)) {
    return formatter.formatCanonical(canonical, options);
  }
  return formatter.format(toLegacyProgram(canonical, { preserveCanonicalBody: true }), options);
}
