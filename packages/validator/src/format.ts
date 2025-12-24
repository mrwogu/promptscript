import type { ValidationMessage, ValidationResult, Severity } from './types';

/**
 * Options for formatting validation messages.
 */
export interface FormatValidationOptions {
  /** Include color codes (ANSI) */
  color?: boolean;
  /** Include rule ID in output */
  includeRuleId?: boolean;
  /** Include suggestions */
  includeSuggestions?: boolean;
}

/**
 * ANSI color codes for terminal output.
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
} as const;

/**
 * Get color for severity level.
 */
function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'error':
      return COLORS.red;
    case 'warning':
      return COLORS.yellow;
    case 'info':
      return COLORS.blue;
  }
}

/**
 * Get severity symbol.
 */
function getSeveritySymbol(severity: Severity): string {
  switch (severity) {
    case 'error':
      return '✖';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
  }
}

/**
 * Format a single validation message for display.
 *
 * @param message - Validation message to format
 * @param options - Formatting options
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * const message = {
 *   ruleId: 'PS001',
 *   ruleName: 'required-meta-id',
 *   severity: 'error',
 *   message: 'Missing required @meta.id field',
 *   location: { file: 'project.prs', line: 1, column: 1 }
 * };
 *
 * formatValidationMessage(message)
 * // 'project.prs:1:1 - error: Missing required @meta.id field'
 *
 * formatValidationMessage(message, { includeRuleId: true })
 * // 'project.prs:1:1 - error [PS001]: Missing required @meta.id field'
 * ```
 */
export function formatValidationMessage(
  message: ValidationMessage,
  options: FormatValidationOptions = {}
): string {
  const { color = false, includeRuleId = false, includeSuggestions = true } = options;

  const parts: string[] = [];

  // Location prefix
  if (message.location) {
    const { file, line, column } = message.location;
    parts.push(`${file}:${line}:${column}`);
  }

  // Severity with symbol
  let severityPart = color
    ? `${getSeverityColor(message.severity)}${getSeveritySymbol(message.severity)} ${message.severity}${COLORS.reset}`
    : `${getSeveritySymbol(message.severity)} ${message.severity}`;

  // Add rule ID if requested
  if (includeRuleId) {
    severityPart += color
      ? ` ${COLORS.dim}[${message.ruleId}]${COLORS.reset}`
      : ` [${message.ruleId}]`;
  }

  // Main message
  let result: string;
  if (parts.length > 0) {
    result = `${parts.join('')} - ${severityPart}: ${message.message}`;
  } else {
    result = `${severityPart}: ${message.message}`;
  }

  // Suggestion
  if (includeSuggestions && message.suggestion) {
    result += color
      ? `\n    ${COLORS.dim}Suggestion: ${message.suggestion}${COLORS.reset}`
      : `\n    Suggestion: ${message.suggestion}`;
  }

  return result;
}

/**
 * Format multiple validation messages for display.
 *
 * @param messages - Array of validation messages
 * @param options - Formatting options
 * @returns Formatted string with newlines between messages
 */
export function formatValidationMessages(
  messages: ValidationMessage[],
  options: FormatValidationOptions = {}
): string {
  return messages.map((m) => formatValidationMessage(m, options)).join('\n');
}

/**
 * Alias for formatValidationMessage (for consistency with docs).
 */
export const formatDiagnostic = formatValidationMessage;

/**
 * Alias for formatValidationMessages (for consistency with docs).
 */
export const formatDiagnostics = formatValidationMessages;

/**
 * Format a complete validation result for display.
 *
 * @param result - Validation result to format
 * @param options - Formatting options
 * @returns Formatted string with summary
 *
 * @example
 * ```typescript
 * const result = validator.validate(ast);
 * console.log(formatValidationResult(result, { color: true }));
 * // ✖ 2 errors, ⚠ 1 warning
 * // project.prs:1:1 - error: Missing required @meta.id field
 * // ...
 * ```
 */
export function formatValidationResult(
  result: ValidationResult,
  options: FormatValidationOptions = {}
): string {
  const { color = false } = options;
  const lines: string[] = [];

  // Summary line
  const summaryParts: string[] = [];
  if (result.errors.length > 0) {
    const errorText = `${getSeveritySymbol('error')} ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`;
    summaryParts.push(color ? `${COLORS.red}${errorText}${COLORS.reset}` : errorText);
  }
  if (result.warnings.length > 0) {
    const warnText = `${getSeveritySymbol('warning')} ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`;
    summaryParts.push(color ? `${COLORS.yellow}${warnText}${COLORS.reset}` : warnText);
  }
  if (result.infos.length > 0) {
    const infoText = `${getSeveritySymbol('info')} ${result.infos.length} info`;
    summaryParts.push(color ? `${COLORS.blue}${infoText}${COLORS.reset}` : infoText);
  }

  if (summaryParts.length > 0) {
    lines.push(summaryParts.join(', '));
    lines.push('');
  }

  // All messages
  if (result.all.length > 0) {
    lines.push(formatValidationMessages(result.all, options));
  } else {
    const successText = '✓ No issues found';
    lines.push(color ? `\x1b[32m${successText}${COLORS.reset}` : successText);
  }

  return lines.join('\n');
}
