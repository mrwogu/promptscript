import type { SourceLocation } from '../types';

/**
 * Severity level for diagnostics.
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

/**
 * A diagnostic message with location information.
 */
export interface Diagnostic {
  /** Diagnostic message */
  message: string;
  /** Severity level */
  severity: DiagnosticSeverity;
  /** Source location */
  location?: SourceLocation;
  /** Optional diagnostic code */
  code?: string;
  /** Optional source (e.g., rule name) */
  source?: string;
}

/**
 * Options for formatting diagnostics.
 */
export interface FormatDiagnosticOptions {
  /** Include color codes (ANSI) */
  color?: boolean;
  /** Include source context lines */
  context?: boolean;
  /** Number of context lines to show */
  contextLines?: number;
}

/**
 * ANSI color codes for terminal output.
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
} as const;

/**
 * Get color for severity level.
 */
function getSeverityColor(severity: DiagnosticSeverity): string {
  switch (severity) {
    case 'error':
      return COLORS.red;
    case 'warning':
      return COLORS.yellow;
    case 'info':
      return COLORS.blue;
    case 'hint':
      return COLORS.cyan;
  }
}

/**
 * Format a diagnostic for display.
 *
 * @param diagnostic - Diagnostic to format
 * @param options - Formatting options
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * const diagnostic = {
 *   message: 'Missing required field: id',
 *   severity: 'error',
 *   location: { file: 'project.prs', line: 5, column: 3 },
 *   code: 'E001',
 *   source: 'meta-validator'
 * };
 *
 * formatDiagnostic(diagnostic)
 * // 'project.prs:5:3 - error E001: Missing required field: id'
 *
 * formatDiagnostic(diagnostic, { color: true })
 * // '\x1b[31mproject.prs:5:3 - error E001: Missing required field: id\x1b[0m'
 * ```
 */
export function formatDiagnostic(
  diagnostic: Diagnostic,
  options: FormatDiagnosticOptions = {}
): string {
  const { color = false } = options;

  const parts: string[] = [];

  // Location prefix
  if (diagnostic.location) {
    const { file, line, column } = diagnostic.location;
    parts.push(`${file}:${line}:${column}`);
  }

  // Severity and code
  let severityPart = diagnostic.severity;
  if (diagnostic.code) {
    severityPart += ` ${diagnostic.code}`;
  }

  // Message
  const messagePart = diagnostic.message;

  // Combine parts
  let result: string;
  if (parts.length > 0) {
    result = `${parts.join('')} - ${severityPart}: ${messagePart}`;
  } else {
    result = `${severityPart}: ${messagePart}`;
  }

  // Add source if present
  if (diagnostic.source) {
    result += ` [${diagnostic.source}]`;
  }

  // Apply color if enabled
  if (color) {
    const colorCode = getSeverityColor(diagnostic.severity);
    result = `${colorCode}${result}${COLORS.reset}`;
  }

  return result;
}

/**
 * Format multiple diagnostics for display.
 *
 * @param diagnostics - Array of diagnostics to format
 * @param options - Formatting options
 * @returns Formatted string with newlines between diagnostics
 */
export function formatDiagnostics(
  diagnostics: Diagnostic[],
  options: FormatDiagnosticOptions = {}
): string {
  return diagnostics.map((d) => formatDiagnostic(d, options)).join('\n');
}

/**
 * Create a SourceLocation object.
 *
 * @param file - File path
 * @param line - Line number (1-indexed)
 * @param column - Column number (1-indexed)
 * @param offset - Optional byte offset
 * @returns SourceLocation object
 *
 * @example
 * ```typescript
 * createLocation('project.prs', 10, 5)
 * // { file: 'project.prs', line: 10, column: 5 }
 *
 * createLocation('project.prs', 10, 5, 150)
 * // { file: 'project.prs', line: 10, column: 5, offset: 150 }
 * ```
 */
export function createLocation(
  file: string,
  line: number,
  column: number,
  offset?: number
): SourceLocation {
  const location: SourceLocation = {
    file,
    line,
    column,
  };

  if (offset !== undefined) {
    location.offset = offset;
  }

  return location;
}
