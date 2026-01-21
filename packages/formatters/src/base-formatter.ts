import type { Block, BlockContent, Program, Value } from '@promptscript/core';
import { ConventionRenderer } from './convention-renderer';
import type { FormatOptions, Formatter, FormatterOutput } from './types';

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
    return new ConventionRenderer(convention);
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
}
