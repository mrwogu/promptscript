import type { Program } from '@promptscript/core';
import { FormatterRegistry } from './registry';
import type { Formatter, FormatterFactory, FormatterOutput, FormatOptions } from './types';

/**
 * Options for the standalone format function.
 */
export interface StandaloneFormatOptions extends FormatOptions {
  /**
   * Formatter to use. Can be:
   * - A string name (e.g., 'github', 'claude', 'cursor')
   * - A Formatter instance
   * - A factory function that creates a Formatter
   *
   * If not specified, 'github' is used as default.
   */
  formatter?: string | Formatter | FormatterFactory;
}

/**
 * Format a PromptScript AST using a specified or default formatter.
 *
 * This is a convenience function for one-off formatting without manually
 * creating formatter instances. For repeated formatting operations,
 * consider using the formatter classes directly for better performance.
 *
 * @param ast - The resolved PromptScript AST to format
 * @param options - Format options including which formatter to use
 * @returns The formatter output (path and content)
 * @throws Error if the specified formatter is not found
 *
 * @example
 * ```typescript
 * import { format } from '@promptscript/formatters';
 *
 * // Use default formatter (GitHub)
 * const output = format(ast);
 *
 * // Specify formatter by name
 * const claudeOutput = format(ast, { formatter: 'claude' });
 *
 * // Use custom options
 * const cursorOutput = format(ast, {
 *   formatter: 'cursor',
 *   version: 'legacy',
 * });
 * ```
 */
export function format(ast: Program, options: StandaloneFormatOptions = {}): FormatterOutput {
  const { formatter: formatterOption, ...formatOptions } = options;

  let formatter: Formatter;

  if (!formatterOption || typeof formatterOption === 'string') {
    // Get formatter by name (default to 'github')
    const name = formatterOption ?? 'github';
    const found = FormatterRegistry.get(name);
    if (!found) {
      const available = FormatterRegistry.list().join(', ');
      throw new Error(`Formatter '${name}' not found. Available formatters: ${available}`);
    }
    formatter = found;
  } else if (typeof formatterOption === 'function') {
    // It's a factory function
    formatter = formatterOption();
  } else {
    // It's already a Formatter instance
    formatter = formatterOption;
  }

  return formatter.format(ast, formatOptions);
}

/**
 * Get a formatter instance by name.
 *
 * This is a convenience wrapper around `FormatterRegistry.get()` that throws
 * a descriptive error if the formatter is not found.
 *
 * @param name - Formatter identifier (e.g., 'github', 'claude', 'cursor')
 * @returns Formatter instance
 * @throws Error if the formatter is not registered
 *
 * @example
 * ```typescript
 * import { getFormatter } from '@promptscript/formatters';
 *
 * const github = getFormatter('github');
 * const output = github.format(ast);
 * ```
 */
export function getFormatter(name: string): Formatter {
  const formatter = FormatterRegistry.get(name);
  if (!formatter) {
    const available = FormatterRegistry.list().join(', ');
    throw new Error(`Formatter '${name}' not found. Available formatters: ${available}`);
  }
  return formatter;
}

/**
 * Register a custom formatter.
 *
 * This is a convenience wrapper around `FormatterRegistry.register()`.
 * Use this to add custom formatters that can be referenced by name.
 *
 * @param name - Unique identifier for the formatter
 * @param factory - Factory function that creates formatter instances
 * @throws Error if a formatter with the same name is already registered
 *
 * @example
 * ```typescript
 * import { registerFormatter, BaseFormatter } from '@promptscript/formatters';
 *
 * class MyFormatter extends BaseFormatter {
 *   name = 'my-tool';
 *   outputPath = '.my-tool/config.md';
 *   description = 'My custom formatter';
 *   defaultConvention = 'markdown';
 * }
 *
 * registerFormatter('my-tool', () => new MyFormatter());
 *
 * // Now it can be used by name
 * const formatter = getFormatter('my-tool');
 * ```
 */
export function registerFormatter(name: string, factory: FormatterFactory): void {
  FormatterRegistry.register(name, factory);
}

/**
 * Check if a formatter is registered.
 *
 * @param name - Formatter identifier
 * @returns True if the formatter is registered
 *
 * @example
 * ```typescript
 * import { hasFormatter } from '@promptscript/formatters';
 *
 * if (hasFormatter('my-custom-formatter')) {
 *   const formatter = getFormatter('my-custom-formatter');
 * }
 * ```
 */
export function hasFormatter(name: string): boolean {
  return FormatterRegistry.has(name);
}

/**
 * List all registered formatter names.
 *
 * @returns Array of formatter identifiers
 *
 * @example
 * ```typescript
 * import { listFormatters } from '@promptscript/formatters';
 *
 * console.log(listFormatters()); // ['github', 'claude', 'cursor', 'antigravity']
 * ```
 */
export function listFormatters(): string[] {
  return FormatterRegistry.list();
}

/**
 * Unregister a formatter.
 *
 * Primarily useful for testing to clean up registered formatters.
 *
 * @param name - Formatter identifier to remove
 * @returns True if the formatter was removed, false if not found
 */
export function unregisterFormatter(name: string): boolean {
  return FormatterRegistry.unregister(name);
}
