import type {
  Block,
  BlockContent,
  PrettierMarkdownOptions,
  Program,
  Value,
} from '@promptscript/core';
import { DEFAULT_PRETTIER_OPTIONS } from '@promptscript/core';
import { ConventionRenderer } from './convention-renderer.js';
import type { FormatOptions, Formatter, FormatterOutput } from './types.js';

/**
 * Abstract base formatter with common helper methods.
 * Extend this class to create new formatter implementations.
 */
export abstract class BaseFormatter implements Formatter {
  abstract readonly name: string;
  abstract readonly outputPath: string;
  abstract readonly description: string;
  abstract readonly defaultConvention: string;
  abstract format(ast: Program, options?: FormatOptions): FormatterOutput;

  /**
   * Create a convention renderer for this formatter.
   * Uses the provided convention from options or falls back to the default.
   */
  protected createRenderer(options?: FormatOptions): ConventionRenderer {
    const convention = options?.convention ?? this.defaultConvention;
    return new ConventionRenderer({
      convention,
      prettier: options?.prettier,
    });
  }

  /**
   * Get resolved Prettier options, merging provided options with defaults.
   */
  protected getPrettierOptions(options?: FormatOptions): Required<PrettierMarkdownOptions> {
    return {
      ...DEFAULT_PRETTIER_OPTIONS,
      ...options?.prettier,
    };
  }

  /**
   * Get the output path, respecting options override.
   */
  protected getOutputPath(options?: FormatOptions): string {
    return options?.outputPath ?? this.outputPath;
  }

  /**
   * Find a block by name, ignoring internal blocks (starting with __).
   */
  protected findBlock(ast: Program, name: string): Block | undefined {
    return ast.blocks.find((b) => b.name === name && !b.name.startsWith('__'));
  }

  /**
   * Extract text from block content.
   */
  protected extractText(content: BlockContent): string {
    switch (content.type) {
      case 'TextContent':
        return content.value.trim();
      case 'MixedContent':
        return content.text?.value.trim() ?? '';
      default:
        return '';
    }
  }

  /**
   * Get a specific property from block content.
   */
  protected getProp(content: BlockContent, key: string): Value | undefined {
    switch (content.type) {
      case 'ObjectContent':
        return content.properties[key];
      case 'MixedContent':
        return content.properties[key];
      default:
        return undefined;
    }
  }

  /**
   * Get all properties from block content.
   */
  protected getProps(content: BlockContent): Record<string, Value> {
    switch (content.type) {
      case 'ObjectContent':
        return content.properties;
      case 'MixedContent':
        return content.properties;
      default:
        return {};
    }
  }

  /**
   * Format standards list from array of values (pass-through).
   * Returns array of strings for rendering as bullet list.
   */
  protected formatStandardsList(items: Value): string[] {
    if (!Array.isArray(items)) return [];
    return items.map((item) => this.valueToString(item)).filter((s) => s.length > 0);
  }

  /**
   * Format an array as comma-separated string.
   */
  protected formatArray(arr: unknown[]): string {
    return arr.map(String).join(', ');
  }

  /**
   * Truncate string to max length with ellipsis.
   */
  protected truncate(str: string, max: number): string {
    return str.length > max ? str.substring(0, max - 3) + '...' : str;
  }

  /**
   * Get meta field value as string.
   */
  protected getMetaField(ast: Program, key: string): string | undefined {
    const value = ast.meta?.fields?.[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return undefined;
  }

  /**
   * Extract array elements from block content.
   */
  protected getArrayElements(content: BlockContent): Value[] {
    if (content.type === 'ArrayContent') {
      return content.elements;
    }
    return [];
  }

  /**
   * Convert value to string representation.
   */
  protected valueToString(value: Value): string {
    if (value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.valueToString(v)).join(', ');
    }
    if (typeof value === 'object' && 'type' in value) {
      if (value.type === 'TextContent' && typeof value.value === 'string') {
        return value.value.trim();
      }
    }
    return '';
  }

  /**
   * Safe extraction of a section that contains a header + content + code block + content
   * Avoids ReDoS by using string search instead of backtracking regex.
   * Matches pattern: Header ... ``` ... ```
   */
  protected extractSectionWithCodeBlock(text: string, header: string): string | null {
    const headerIndex = text.indexOf(header);
    if (headerIndex === -1) return null;

    // Start searching after the header
    const offset = headerIndex + header.length;

    const startCodeBlock = text.indexOf('```', offset);
    if (startCodeBlock === -1) return null;

    const endCodeBlock = text.indexOf('```', startCodeBlock + 3);
    if (endCodeBlock === -1) return null;

    // Include the closing backticks (length 3)
    const endPos = endCodeBlock + 3;

    return text.substring(headerIndex, endPos);
  }

  /**
   * Normalize markdown content to match Prettier formatting.
   * - Strips common leading indentation from lines
   * - Trims trailing whitespace from lines
   * - Normalizes markdown table formatting
   * - Adds blank lines before lists when preceded by text
   * - Escapes markdown special characters in paths
   */
  protected normalizeMarkdownForPrettier(content: string): string {
    const lines = content.split('\n');

    // Find common leading indentation (minimum non-empty, non-code-block line indent)
    let minIndent = Infinity;
    let inCodeBlock = false;
    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      if (trimmed.length === 0) continue;
      const match = line.match(/^(\s*)/);
      const leadingSpaces = match?.[1]?.length ?? 0;
      minIndent = Math.min(minIndent, leadingSpaces);
    }
    if (minIndent === Infinity) minIndent = 0;

    // Process lines
    const result: string[] = [];
    let inTable = false;
    let tableLines: string[] = [];
    inCodeBlock = false;

    for (const line of lines) {
      const trimmedLine = line.trimEnd();

      // Track code blocks
      if (trimmedLine.trimStart().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }

      // Strip common indentation from all lines
      const unindentedLine = minIndent > 0 ? trimmedLine.slice(minIndent) : trimmedLine;

      // Inside code blocks, just use unindented line
      if (inCodeBlock || unindentedLine.startsWith('```')) {
        result.push(unindentedLine);
        continue;
      }

      let processedLine = unindentedLine;

      // Escape markdown special characters in path-like content (outside code blocks)
      // Only escape __name__ outside of backticks
      // __name__ → \_\_name\_\_ (prevents bold)
      processedLine = processedLine.replace(/__([^_]+)__/g, '\\_\\_$1\\_\\_');
      // Note: Don't escape /* - Prettier doesn't escape it and it's typically inside backticks

      // Check for blank line after headers BEFORE table detection
      const prevLine = result.length > 0 ? result[result.length - 1] : '';
      const isHeader = prevLine?.trimStart().startsWith('#');

      // Add blank line after header if content follows
      if (isHeader && processedLine.trim()) {
        result.push('');
      }

      // Detect table rows (lines starting with |)
      if (processedLine.trimStart().startsWith('|') && processedLine.trimEnd().endsWith('|')) {
        inTable = true;
        tableLines.push(processedLine.trim());
      } else {
        // If we were in a table, format and flush it
        if (inTable && tableLines.length > 0) {
          result.push(...this.formatMarkdownTable(tableLines));
          tableLines = [];
          inTable = false;
        }

        const isListItem = processedLine.trimStart().startsWith('- ');

        // Add blank line before list item if previous line was non-empty text (not a list item, header, or blank)
        if (isListItem && prevLine && !prevLine.trimStart().startsWith('- ') && !isHeader) {
          result.push('');
        }

        result.push(processedLine);
      }
    }

    // Handle table at end of content
    if (tableLines.length > 0) {
      result.push(...this.formatMarkdownTable(tableLines));
    }

    return result.join('\n');
  }

  /**
   * Strip all leading indentation from markdown content.
   * Used for AGENTS.md where content from multiple sources has inconsistent indentation.
   * Preserves indentation inside code blocks.
   */
  protected stripAllIndent(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      const trimmedEnd = line.trimEnd();

      // Track code blocks
      if (trimmedEnd.trimStart().startsWith('```')) {
        // Add blank line before code block if previous line was non-empty
        if (!inCodeBlock) {
          const prevLine = result.length > 0 ? result[result.length - 1] : '';
          if (prevLine && prevLine.trim()) {
            result.push('');
          }
        }
        inCodeBlock = !inCodeBlock;
        // Strip indent from code block markers too
        result.push(trimmedEnd.trimStart());
        continue;
      }

      // Inside code blocks, preserve relative indentation
      if (inCodeBlock) {
        result.push(trimmedEnd);
        continue;
      }

      // Outside code blocks, strip all leading whitespace
      let stripped = trimmedEnd.trimStart();

      // Escape markdown special characters for Prettier compatibility
      // Escape __ to \_\_ (to avoid emphasis parsing)
      // Note: Don't escape /* - Prettier doesn't escape it
      stripped = stripped.replace(/__/g, '\\_\\_');

      // Add blank line before list item if previous line was non-empty and not a list
      const prevLine = result.length > 0 ? result[result.length - 1] : '';
      if (stripped.startsWith('- ') && prevLine && !prevLine.startsWith('- ')) {
        result.push('');
      }

      result.push(stripped);
    }

    return result.join('\n');
  }

  /**
   * Format a markdown table to match Prettier output.
   * Prettier removes trailing whitespace from cells.
   */
  private formatMarkdownTable(tableLines: string[]): string[] {
    if (tableLines.length === 0) return [];

    // Parse table into cells
    const rows = tableLines.map((line) =>
      line
        .split('|')
        .slice(1, -1) // Remove empty first/last from split
        .map((cell) => cell.trim())
    );

    // Calculate column widths (minimum width for content)
    const colCount = rows[0]?.length ?? 0;
    const colWidths: number[] = new Array(colCount).fill(0);

    for (const row of rows) {
      for (let i = 0; i < row.length; i++) {
        const cell = row[i] ?? '';
        // For separator row, use 3 as minimum (---)
        const width = cell.match(/^-+$/) ? 3 : cell.length;
        colWidths[i] = Math.max(colWidths[i] ?? 0, width);
      }
    }

    // Rebuild table with proper formatting
    return rows.map((row) => {
      const cells = row.map((cell, colIndex) => {
        const width = colWidths[colIndex] ?? 0;
        // Separator row uses dashes
        if (cell.match(/^-+$/)) {
          return '-'.repeat(width);
        }
        // Pad cell content
        return cell.padEnd(width);
      });
      return '| ' + cells.join(' | ') + ' |';
    });
  }
}
