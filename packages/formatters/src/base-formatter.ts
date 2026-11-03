import { posix } from 'node:path';
import type {
  Block,
  BlockContent,
  CanonicalProgram,
  PrettierMarkdownOptions,
  Program,
  Value,
} from '@promptscript/core';
import {
  createNativeAgentNameMap,
  DEFAULT_PRETTIER_OPTIONS,
  isPortablePathSegment,
  reconcileBlockBody,
  toNativeAgentName,
  toLegacyProgram,
  valueNodeToValue,
} from '@promptscript/core';
import { ConventionRenderer } from './convention-renderer.js';
import { StandardsExtractor } from './extractors/index.js';
import { resolveSourceSectionTitle } from './section-title-resolver.js';
import type { FormatOptions, Formatter, FormatterOutput, SkillFileConfig } from './types.js';

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
   * Canonical entry point for legacy implementations.
   *
   * Subclasses can override this method to consume ordered canonical entries
   * directly. Until then, keep the compatibility projection isolated here.
   */
  formatCanonical(ast: CanonicalProgram, options?: FormatOptions): FormatterOutput {
    return this.format(toLegacyProgram(ast, { preserveCanonicalBody: true }), options);
  }

  /**
   * Shared standards extractor for consistent extraction across all formatters.
   */
  protected readonly standardsExtractor = new StandardsExtractor();

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
    if (content.type === 'ObjectContent' || content.type === 'MixedContent') {
      const fieldItems = content.properties['items'];
      const textItems =
        content.type === 'MixedContent' && content.text
          ? content.text.value
              .trim()
              .split('\n')
              .map((line) => line.trim().replace(/^-\s*/, ''))
              .filter((line) => line.length > 0)
          : [];
      return [
        ...textItems,
        ...(Array.isArray(fieldItems) ? fieldItems : []),
        ...(content.listItems ?? []),
      ];
    }
    return [];
  }

  protected getBlockArrayElements(block: Block): Value[] {
    if (!block.canonicalBody) return this.getArrayElements(block.content);

    const body = reconcileBlockBody(block.canonicalBody, block.content);
    const result: Value[] = [];
    for (const entry of body.entries) {
      if (entry.type === 'TextEntry') {
        result.push(
          ...entry.text
            .trim()
            .split('\n')
            .map((line) => line.trim().replace(/^-\s*/, ''))
            .filter((line) => line.length > 0)
        );
      } else if (entry.type === 'ListEntry') {
        result.push(valueNodeToValue(entry.value));
      } else if (entry.type === 'FieldEntry' && entry.name === 'items') {
        const value = valueNodeToValue(entry.value);
        if (Array.isArray(value)) result.push(...value);
      }
    }
    return result;
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
   * Extract a stable one-line summary from any supported shortcut value.
   */
  protected shortcutSummary(value: Value, fallback = ''): string {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !('type' in value && value.type === 'TextContent')
    ) {
      const shortcut = value as Record<string, Value>;
      for (const candidate of [shortcut['description'], shortcut['content']]) {
        if (candidate === undefined) continue;
        const summary = this.valueToString(candidate).split('\n')[0]?.trim() ?? '';
        if (summary.length > 0) return summary;
      }
      return fallback;
    }

    return this.valueToString(value).split('\n')[0] ?? fallback;
  }

  /**
   * Whether the `@context` block's text is consumed by the project/intro
   * fallback. Must mirror the project() and intro() consumption conditions
   * exactly, otherwise the context section would either duplicate the text
   * (predicate too narrow) or drop it entirely (predicate too wide).
   */
  protected contextTextConsumedByProject(ast: Program): boolean {
    const identity = this.findBlock(ast, 'identity');
    if (identity) return false;
    const context = this.findBlock(ast, 'context');
    if (!context) return false;
    if (resolveSourceSectionTitle(ast, 'context')) return false;
    const projectTitle = resolveSourceSectionTitle(ast, 'project');
    return context.content.type === 'MixedContent' || projectTitle !== undefined;
  }

  /**
   * `@context` keys that already have a dedicated rendering path. Anything
   * outside this set is generic and must be surfaced by the context section.
   */
  protected static readonly CONTEXT_RENDERED_KEYS: ReadonlySet<string> = new Set([
    'languages',
    'runtime',
    'techStack',
    'tech-stack',
    'architecture',
  ]);

  /**
   * Escape a value for use inside a double-quoted YAML scalar.
   */
  protected yamlQuoted(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  /**
   * Read the `architecture` property of `@context`. Used as a fallback for
   * sources that declare architecture as a property rather than as an
   * `## Architecture` heading inside the block text.
   */
  protected contextArchitectureProperty(ast: Program): string | null {
    const context = this.findBlock(ast, 'context');
    if (!context) return null;
    const value = this.getProp(context.content, 'architecture');
    if (value === undefined) return null;
    const rendered = this.standardsExtractor.stringify(value);
    return rendered.length > 0 ? rendered : null;
  }

  /**
   * Render `@context` properties that no dedicated section consumes as
   * `Label: value` items, so structured context is never silently dropped.
   */
  protected contextPropertyItems(ast: Program, alsoRenderedKeys: readonly string[] = []): string[] {
    const context = this.findBlock(ast, 'context');
    if (!context) return [];

    const items: string[] = [];
    for (const [key, value] of Object.entries(this.getProps(context.content))) {
      if (BaseFormatter.CONTEXT_RENDERED_KEYS.has(key)) continue;
      if (alsoRenderedKeys.includes(key)) continue;
      // Only an object-shaped `monorepo` reaches the tech-stack subsection; a
      // scalar has no dedicated surface and would otherwise be dropped.
      if (
        key === 'monorepo' &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      )
        continue;
      if (value === null || value === undefined || value === false) continue;
      if (value === true) {
        items.push(this.humanizeLabel(key));
        continue;
      }
      const rendered = this.standardsExtractor.stringify(value);
      if (rendered) items.push(`${this.humanizeLabel(key)}: ${rendered}`);
    }
    return items;
  }

  /**
   * Collect `@context` tech-stack entries from every supported shape:
   * an explicit `techStack` list plus the `languages`/`runtime`/`monorepo`
   * properties.
   */
  protected extractContextTechStackItems(props: Record<string, Value>): string[] {
    const items: string[] = [];

    const techStack = props['techStack'];
    if (techStack) {
      items.push(
        ...(Array.isArray(techStack) ? techStack : [techStack])
          .map((entry) => this.valueToString(entry))
          .filter((entry) => entry.length > 0)
      );
    }

    const languages = props['languages'];
    if (languages) {
      items.push(...(Array.isArray(languages) ? languages : [languages]).map(String));
    }

    const runtime = props['runtime'];
    if (runtime) items.push(this.valueToString(runtime));

    const monorepo = props['monorepo'];
    if (monorepo && typeof monorepo === 'object' && !Array.isArray(monorepo)) {
      const mr = monorepo as Record<string, Value>;
      if (mr['tool'] && mr['packageManager']) {
        items.push(
          `${this.valueToString(mr['tool'])} + ${this.valueToString(mr['packageManager'])}`
        );
      }
    }

    return items;
  }

  /**
   * Resolve a documentation-standard entry that accepts either a boolean flag
   * or author-supplied prose. A string value is authoritative and replaces the
   * target's default phrasing, so authored text is never silently discarded.
   */
  protected documentationItem(value: Value | undefined, defaultText: string): string | null {
    if (value === undefined || value === null || value === false) return null;
    if (typeof value === 'string' || (typeof value === 'object' && 'type' in value)) {
      const authored = this.valueToString(value).trim();
      return authored.length > 0 ? authored : null;
    }
    return value ? defaultText : null;
  }

  /**
   * Append generic `Label: value` items for standards keys not handled by
   * the known-key rendering in a section method. Keeps custom @standards
   * keys (git/config/documentation/diagrams) visible in monolith output.
   * Skips null/undefined/false; renders bare labels for true.
   */
  protected appendGenericStandardItems(
    items: string[],
    props: Record<string, Value>,
    knownKeys: ReadonlySet<string>
  ): void {
    for (const [key, value] of Object.entries(props)) {
      if (knownKeys.has(key)) continue;
      if (value === null || value === undefined || value === false) continue;
      if (value === true) {
        items.push(this.humanizeLabel(key));
        continue;
      }
      const rendered = this.standardsExtractor.stringify(value);
      if (rendered) items.push(`${this.humanizeLabel(key)}: ${rendered}`);
    }
  }

  /**
   * Convert a camelCase/kebab-case key into a human-readable label.
   */
  protected humanizeLabel(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
   * - Adds blank lines before code blocks when preceded by text
   * - Escapes markdown special characters in paths
   *
   * The result must keep the meaning of the input: table cells, code spans
   * and list nesting (including tight lists) are never changed.
   */
  protected normalizeMarkdownForPrettier(content: string): string {
    const lines = content.split('\n');

    // Find common leading indentation (minimum non-empty line indent)
    // Include code block markers in calculation to handle content that's mainly code blocks
    let minIndent = Infinity;
    let inCodeBlock = false;
    for (const line of lines) {
      const trimmed = line.trimEnd();
      // Check for code block markers (need trimStart to handle indented markers)
      if (trimmed.trimStart().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        // Include code block markers in minIndent calculation
        if (trimmed.length > 0) {
          const match = line.match(/^(\s*)/);
          const leadingSpaces = match?.[1]?.length ?? 0;
          minIndent = Math.min(minIndent, leadingSpaces);
        }
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
    let tableLines: string[] = [];
    // True while the current block belongs to a list (items, continuation
    // lines, nested content). No blank lines go in there, so tight lists
    // stay tight.
    let inList = false;
    inCodeBlock = false;

    const flushTable = (): void => {
      if (tableLines.length === 0) return;
      result.push(...this.formatMarkdownTable(tableLines));
      tableLines = [];
    };

    for (const line of lines) {
      const trimmedLine = line.trimEnd();

      // Strip common indentation from all lines
      const unindentedLine = minIndent > 0 ? trimmedLine.slice(minIndent) : trimmedLine;

      // Check for code block start BEFORE toggling inCodeBlock
      const isCodeBlockMarker = trimmedLine.trimStart().startsWith('```');
      const isCodeBlockStart = isCodeBlockMarker && !inCodeBlock;

      // Toggle code block state
      if (isCodeBlockMarker) {
        inCodeBlock = !inCodeBlock;
      }

      // Inside code blocks, just use unindented line
      if (inCodeBlock || unindentedLine.startsWith('```')) {
        flushTable();
        // Add blank line before code block if previous line is non-empty text
        if (isCodeBlockStart) {
          const prevLine = result.length > 0 ? (result[result.length - 1] ?? '') : '';
          // An indented fence inside a list belongs to the item, a fence at
          // column 0 ends the list
          const fenceInList = inList && /^\s/.test(unindentedLine);
          if (!fenceInList) inList = false;
          if (prevLine.trim() && !prevLine.startsWith('#') && !fenceInList) {
            result.push('');
          }
        }
        result.push(unindentedLine);
        continue;
      }

      let processedLine = unindentedLine;

      // Escape markdown special characters in path-like content, outside code spans
      processedLine = this.mapOutsideCodeSpans(processedLine, (part) =>
        // __name__ -> \_\_name\_\_ (prevents bold)
        part.replace(/__([^_]+)__/g, '\\_\\_$1\\_\\_')
      );
      // Escape * in glob patterns (like packages/* or .cursor/rules/*.md) outside backticks
      processedLine = this.escapeGlobAsteriskOutsideBackticks(processedLine);

      // Check for blank line after headers BEFORE table detection
      const prevLine = result.length > 0 ? result[result.length - 1] : '';
      const isHeader = prevLine?.trimStart().startsWith('#');

      // Add blank line after header if content follows
      if (isHeader && processedLine.trim()) {
        result.push('');
      }

      // Detect table rows (lines starting with |)
      if (processedLine.trimStart().startsWith('|') && processedLine.trimEnd().endsWith('|')) {
        tableLines.push(processedLine);
        continue;
      }
      flushTable();

      const trimmedStart = processedLine.trimStart();
      const isListItem = /^[-*+]\s/.test(trimmedStart) || /^\d+[.)]\s/.test(trimmedStart);
      const isIndented = processedLine.length > trimmedStart.length;
      const prevIsBlank = !prevLine?.trim();

      if (!trimmedStart) {
        result.push(processedLine);
        continue;
      }

      if (!isIndented && /^#{1,6}(\s|$)/.test(trimmedStart)) {
        inList = false;
      } else if (!isListItem && !isIndented && prevIsBlank) {
        // A paragraph at column 0 after a blank line ends the list
        inList = false;
      }

      // Add a blank line before a list that follows a paragraph. Inside a
      // list nothing is added, so items, continuation lines and nested
      // content keep their tight layout.
      if (isListItem && !inList && prevLine && !prevIsBlank && !isHeader) {
        result.push('');
      }
      if (isListItem) inList = true;

      result.push(processedLine);
    }

    // Handle table at end of content
    flushTable();

    return result.join('\n');
  }

  /**
   * Apply `transform` to the parts of a line that are outside inline code
   * spans. Code spans open and close with backtick runs of the same length.
   */
  private mapOutsideCodeSpans(line: string, transform: (part: string) => string): string {
    if (!line.includes('`')) return transform(line);
    let output = '';
    let index = 0;
    let textStart = 0;
    while (index < line.length) {
      if (line[index] !== '`') {
        index++;
        continue;
      }
      let runEnd = index;
      while (line[runEnd] === '`') runEnd++;
      const fence = line.slice(index, runEnd);
      const close = this.findClosingBacktickRun(line, runEnd, fence.length);
      if (close === -1) {
        index = runEnd;
        continue;
      }
      output += transform(line.slice(textStart, index)) + line.slice(index, close + fence.length);
      index = close + fence.length;
      textStart = index;
    }
    return output + transform(line.slice(textStart));
  }

  private findClosingBacktickRun(line: string, from: number, length: number): number {
    let index = from;
    while (index < line.length) {
      if (line[index] !== '`') {
        index++;
        continue;
      }
      let runEnd = index;
      while (line[runEnd] === '`') runEnd++;
      if (runEnd - index === length) return index;
      index = runEnd;
    }
    return -1;
  }

  /**
   * Escape glob asterisks (like packages/* or .cursor/rules/*.md) outside of backticks.
   * Prettier escapes these to prevent them from being interpreted as emphasis markers.
   */
  private escapeGlobAsteriskOutsideBackticks(line: string): string {
    // Escape * when preceded by / (glob patterns like packages/* or .cursor/rules/*.md)
    return this.mapOutsideCodeSpans(line, (part) => part.replace(/\/\*/g, '/\\*'));
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
          const prevLine = result.length > 0 ? (result[result.length - 1] ?? '') : '';
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
      stripped = stripped.replace(/__/g, '\\_\\_');
      // Escape * in glob patterns outside backticks
      stripped = this.escapeGlobAsteriskOutsideBackticks(stripped);

      // Add blank line before list item if previous line was non-empty and not a list
      const prevLine = result.length > 0 ? (result[result.length - 1] ?? '') : '';
      const isListItem = stripped.startsWith('- ') || /^\d+\.\s/.test(stripped);
      const isPrevList = prevLine.startsWith('- ') || /^\d+\.\s/.test(prevLine);
      const prevEndsWithColon = prevLine.trimEnd().endsWith(':');
      if (isListItem && prevLine && !isPrevList) {
        result.push('');
      } else if (isListItem && prevEndsWithColon) {
        result.push('');
      }

      result.push(stripped);
    }

    return result.join('\n');
  }

  /**
   * Format a markdown table to match Prettier output.
   * Prettier removes trailing whitespace from cells. Only a real table (a
   * header row followed by a delimiter row) is touched; anything else is
   * kept as written. The table keeps its indentation, so a table inside a
   * list item stays there.
   */
  private formatMarkdownTable(tableLines: string[]): string[] {
    if (tableLines.length === 0) return [];

    const indent = /^\s*/.exec(tableLines[0] ?? '')?.[0] ?? '';
    const rows = tableLines.map((line) => this.splitTableRow(line.trim()));
    const colCount = rows[0]?.length ?? 0;
    const delimiter = rows[1];
    const isDelimiterRow =
      delimiter !== undefined &&
      delimiter.length === colCount &&
      delimiter.every((cell) => /^:?-+:?$/.test(cell));
    if (!isDelimiterRow || rows.some((row) => row.length !== colCount)) {
      return tableLines;
    }

    // Calculate column widths (minimum width for content)
    const colWidths: number[] = new Array(colCount).fill(0);
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, i) => {
        // The delimiter row needs at least 3 characters (---)
        const width = rowIndex === 1 ? 3 : cell.length;
        colWidths[i] = Math.max(colWidths[i] ?? 0, width);
      });
    });

    // Rebuild table with proper formatting
    return rows.map((row, rowIndex) => {
      const cells = row.map((cell, colIndex) => {
        const width = colWidths[colIndex] ?? 0;
        if (rowIndex === 1) return this.formatDelimiterCell(cell, width);
        return cell.padEnd(width);
      });
      return indent + '| ' + cells.join(' | ') + ' |';
    });
  }

  /**
   * Split a table row into trimmed cells. A pipe escaped with a backslash
   * (also inside a code span, as GFM requires) does not split cells.
   */
  private splitTableRow(row: string): string[] {
    const cells: string[] = [];
    let current = '';
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '\\' && i + 1 < row.length) {
        current += char + row[i + 1];
        i++;
        continue;
      }
      if (char === '|') {
        cells.push(current);
        current = '';
        continue;
      }
      current += char;
    }
    cells.push(current);
    // Drop the empty parts before the leading and after the trailing pipe
    return cells.slice(1, -1).map((cell) => cell.trim());
  }

  private formatDelimiterCell(cell: string, width: number): string {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    const dashes = Math.max(1, width - (left ? 1 : 0) - (right ? 1 : 0));
    return (left ? ':' : '') + '-'.repeat(dashes) + (right ? ':' : '');
  }

  /**
   * Shift all ATX headings by the same amount so the shallowest heading lands
   * at targetLevel. Levels clamp to h1-h6 and fenced code blocks are ignored.
   */
  protected shiftHeadingsToMinLevel(text: string, targetLevel: number): string {
    const headingPattern = /^(\s*)(#{1,6}) /;
    let minLevel = Infinity;
    this.mapHeadingsOutsideCodeFences(text, (line) => {
      const match = line.match(headingPattern);
      if (match?.[2]) minLevel = Math.min(minLevel, match[2].length);
      return line;
    });
    if (minLevel === Infinity) return text;
    const delta = targetLevel - minLevel;
    if (delta === 0) return text;
    return this.mapHeadingsOutsideCodeFences(text, (line) => {
      return line.replace(headingPattern, (_match, indent: string, hashes: string) => {
        const level = Math.max(1, Math.min(6, hashes.length + delta));
        return `${indent}${'#'.repeat(level)} `;
      });
    });
  }

  private mapHeadingsOutsideCodeFences(text: string, mapLine: (line: string) => string): string {
    let inFence = false;
    return text
      .split('\n')
      .map((line) => {
        if (/^\s*(`{3,}|~{3,})/.test(line)) {
          inFence = !inFence;
          return line;
        }
        return inFence ? line : mapLine(line);
      })
      .join('\n');
  }

  /**
   * Shift @context headings so none of them reaches the formatter's own h1
   * and h2 levels. All headings move by the same amount, so their relative
   * levels stay as written. Text that already starts at h3 or deeper is
   * kept as is.
   */
  protected shiftContextHeadings(text: string): string {
    const levels: number[] = [];
    this.mapHeadingsOutsideCodeFences(text, (line) => {
      const match = /^(\s*)(#{1,6}) /.exec(line);
      if (match?.[2]) levels.push(match[2].length);
      return line;
    });
    if (levels.length === 0 || Math.min(...levels) >= 3) return text;
    return this.shiftHeadingsToMinLevel(text, 3);
  }

  /**
   * Remove common leading whitespace from all lines (dedent).
   * Handles the case where trim() was already called, causing the first line
   * to lose its indentation while subsequent lines retain theirs.
   * Calculates minimum indent from lines 2+ only.
   */
  protected dedent(text: string): string {
    const lines = text.split('\n');
    if (lines.length <= 1) return text.trim();

    // Calculate minimum indent from lines 2+ only
    const minIndent = lines
      .slice(1)
      .filter((line) => line.trim().length > 0)
      .reduce((min, line) => {
        const match = line.match(/^(\s*)/);
        const indent = match?.[1]?.length ?? 0;
        return Math.min(min, indent);
      }, Infinity);

    if (minIndent === 0 || minIndent === Infinity) {
      return text.trim();
    }

    const firstLine = lines[0] ?? '';
    return [
      firstLine.trim(),
      ...lines.slice(1).map((line) => (line.trim().length > 0 ? line.slice(minIndent) : '')),
    ]
      .join('\n')
      .trim();
  }

  /**
   * Normalize a user-provided output directory (from `@use ... into "<path>"`
   * or `skillTargets` config) to a safe forward-slash relative path. Rejects
   * `..`, `.` and leading slashes so the result can be appended to a target's
   * dot-directory without escaping it.
   */
  protected normalizeOutputDir(dir: string): string {
    let normalized = dir.replace(/\\/g, '/');
    // Strip leading slashes (avoid regex for CodeQL ReDoS false positive)
    while (normalized.startsWith('/')) {
      normalized = normalized.slice(1);
    }
    // Strip trailing slashes
    while (normalized.endsWith('/') && normalized.length > 0) {
      normalized = normalized.slice(0, -1);
    }
    return normalized
      .split('/')
      .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
      .join('/');
  }

  /**
   * Return true when the target configuration allows emitting the given skill.
   */
  protected shouldIncludeSkill(name: string, options?: FormatOptions): boolean {
    const includeSkills = options?.targetConfig?.includeSkills;
    if (includeSkills === false) return false;
    if (Array.isArray(includeSkills)) return includeSkills.includes(name);
    return true;
  }

  /**
   * Resolve the directory for a generated skill, respecting per-target skill
   * base overrides while preserving existing `@use ... into` behavior.
   */
  protected resolveSkillDir(
    defaultSkillBasePath: string,
    skillName: string,
    outputDir?: string,
    options?: FormatOptions
  ): string {
    const configuredBaseDir = options?.targetConfig?.skillBaseDir;
    const skillBasePath = configuredBaseDir
      ? this.normalizeOutputDir(configuredBaseDir)
      : defaultSkillBasePath;

    if (!outputDir) {
      return `${skillBasePath}/${skillName}`;
    }

    const normalizedOutputDir = this.normalizeOutputDir(outputDir);
    if (!normalizedOutputDir) {
      return `${skillBasePath}/${skillName}`;
    }

    if (!configuredBaseDir) {
      const targetRoot = defaultSkillBasePath.replace(/(?:^|\/)skills$/, '');
      return targetRoot ? `${targetRoot}/${normalizedOutputDir}` : normalizedOutputDir;
    }

    const outputSegments = normalizedOutputDir.split('/').filter((segment) => segment.length > 0);
    const relativeOutputDir =
      outputSegments[0] === 'skills' ? outputSegments.slice(1).join('/') : outputSegments.join('/');

    return relativeOutputDir
      ? `${skillBasePath}/${relativeOutputDir}`
      : `${skillBasePath}/${skillName}`;
  }

  /**
   * Normalize a resource path to a safe, portable relative path.
   */
  protected normalizeResourcePath(relativePath: string): string | null {
    const portablePath = relativePath.replace(/\\/g, '/');
    if (portablePath.startsWith('/')) return null;

    const sourceSegments = portablePath.split('/');
    if (sourceSegments.some((segment) => segment === '..')) return null;

    const normalized = posix.normalize(portablePath);
    if (normalized === '.' || normalized.startsWith('../')) return null;

    const normalizedSegments = normalized.split('/');
    if (normalizedSegments.some((segment) => !isPortablePathSegment(segment))) return null;

    return normalized;
  }

  /**
   * Filter resource files to only include safe canonical paths.
   */
  protected sanitizeResourceFiles(
    resources: Array<{ relativePath: string; content: string; executable?: boolean }> | undefined,
    targetDir: string
  ): FormatterOutput[] {
    if (!resources || resources.length === 0) return [];

    const outputs = new Map<string, FormatterOutput>();
    for (const resource of resources) {
      const relativePath = this.normalizeResourcePath(resource.relativePath);
      if (!relativePath) continue;

      const outputPath = `${targetDir}/${relativePath}`;
      if (outputs.has(outputPath)) continue;

      outputs.set(outputPath, {
        path: outputPath,
        content: resource.content,
        mode: resource.executable === undefined ? undefined : resource.executable ? 0o755 : 0o644,
      });
    }

    return [...outputs.values()];
  }

  /**
   * Extract example entries from a properties object.
   * Shared iteration logic used by both extractExamples and extractSkillExamples.
   */
  private extractExamplesFromProps(
    props: Record<string, Value>
  ): Array<{ name: string; input: string; output: string; description?: string }> {
    const examples: Array<{ name: string; input: string; output: string; description?: string }> =
      [];

    for (const [name, value] of Object.entries(props)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;

      const obj = value as Record<string, Value>;
      const input = obj['input'] ? this.valueToString(obj['input']) : '';
      const output = obj['output'] ? this.valueToString(obj['output']) : '';

      if (!input || !output) continue;

      const description = obj['description'] ? this.valueToString(obj['description']) : undefined;
      examples.push({ name, input, output, description });
    }

    return examples;
  }

  /**
   * Extract examples from the @examples block.
   * Returns an array of example definitions with name, input, output, and optional description.
   */
  protected extractExamples(
    ast: Program
  ): Array<{ name: string; input: string; output: string; description?: string }> {
    const block = this.findBlock(ast, 'examples');
    if (!block) return [];

    return this.extractExamplesFromProps(this.getProps(block.content));
  }

  /**
   * Extract examples from a skill's nested examples property.
   * Returns the same shape as extractExamples.
   */
  protected extractSkillExamples(
    skillProps: Record<string, Value>
  ): Array<{ name: string; input: string; output: string; description?: string }> {
    const examplesValue = skillProps['examples'];
    if (!examplesValue || typeof examplesValue !== 'object' || Array.isArray(examplesValue))
      return [];

    return this.extractExamplesFromProps(examplesValue as Record<string, Value>);
  }

  /**
   * Render an examples section from the @examples block.
   * Shared rendering logic used by Claude, GitHub, and MarkdownInstructionFormatter.
   *
   * @param sectionName - Custom section heading name (default: 'Examples')
   */
  protected renderExamplesSection(
    ast: Program,
    renderer: ConventionRenderer,
    sectionName = 'Examples'
  ): string | null {
    const examples = this.extractExamples(ast);
    if (examples.length === 0) return null;

    const parts: string[] = [];

    for (const example of examples) {
      parts.push(`### Example: ${example.name}`);
      if (example.description) {
        const safeDescription = example.description.replace(/[\r\n]+/g, ' ').trim();
        parts.push('');
        parts.push(safeDescription);
      }
      parts.push('');
      parts.push('**Input:**');
      parts.push('');
      parts.push(this.renderCodeFence(this.dedent(example.input)));
      parts.push('');
      parts.push('**Output:**');
      parts.push('');
      parts.push(this.renderCodeFence(this.dedent(example.output)));
    }

    const content = parts.join('\n');
    return renderer.renderSection(sectionName, content) + '\n';
  }

  /** Base path for skills, or null if formatter has no skill support. */
  getSkillBasePath(): string | null {
    return null;
  }

  /** Skill file name, or null if formatter has no skill support. */
  getSkillFileName(): string | null {
    return null;
  }

  /**
   * Dot directory of the target, by default the parent of a `<dir>/skills`
   * skill base path, or null when there is none.
   */
  getDotDir(): string | null {
    const skillBasePath = this.getSkillBasePath();
    if (!skillBasePath?.endsWith('/skills')) return null;
    return skillBasePath.slice(0, -'/skills'.length);
  }

  /**
   * How this formatter handles skill references.
   * - 'directory': emit as separate files in references/ subdirectory
   * - 'inline': append as sections in the main output file
   * - 'none': references not supported
   */
  referencesMode(): 'directory' | 'inline' | 'none' {
    return 'none';
  }

  /**
   * Default pass-through for injected skill content. Formatters whose target
   * tools restrict skill frontmatter (e.g. Factory AI) override this hook to
   * filter unsupported fields before the compiler writes the file.
   */
  transformInjectedSkillContent(content: string): string {
    return content;
  }

  /**
   * Generate a provenance comment for a reference file.
   */
  protected referenceProvenance(sourcePath: string): string {
    return `<!-- from: ${sourcePath} -->`;
  }

  /**
   * Check if a name is safe for use in file paths.
   * Rejects path traversal sequences and path separators.
   */
  protected isSafeName(name: string): boolean {
    return (
      !name.includes('..') &&
      !name.includes('/') &&
      !name.includes('\\') &&
      !name.includes('\u007f') &&
      isPortablePathSegment(name)
    );
  }

  /**
   * Check if a skill name is safe for use in file paths.
   */
  protected isSafeSkillName(name: string): boolean {
    return this.isSafeName(name);
  }

  /**
   * Check if an agent name is safe for use in file paths.
   */
  protected isSafeAgentName(name: string): boolean {
    return this.isSafeName(name);
  }

  /**
   * Map all agent names consistently for a target's native files.
   */
  protected getNativeAgentNameMap(ast: Program): ReadonlyMap<string, string> {
    const agentsBlock = this.findBlock(ast, 'agents');
    return createNativeAgentNameMap(
      agentsBlock ? Object.keys(this.getProps(agentsBlock.content)) : []
    );
  }

  /**
   * Return the deterministic native identifier for one agent.
   */
  protected getNativeAgentName(ast: Program, name: string): string {
    const nameMap = this.getNativeAgentNameMap(ast);
    const mappedName = nameMap.get(name);
    if (mappedName !== undefined) return mappedName;

    const baseName = toNativeAgentName(name);
    const usedNames = new Set(nameMap.values());
    let nativeName = baseName;
    let suffix = 2;
    while (usedNames.has(nativeName)) {
      nativeName = `${baseName}-${suffix}`;
      suffix += 1;
    }
    return nativeName;
  }

  /**
   * Serialize a string as a YAML scalar, quoting only when required.
   */
  protected yamlString(value: string): string {
    const needsQuoting =
      value === '' ||
      value.trim() !== value ||
      /[\r\n\t]/.test(value) ||
      /^[,:[\]{}#&*!|>'"%@`?+-]/.test(value) ||
      value.includes("'") ||
      value.includes('"') ||
      value.includes(':') ||
      value.includes(' #') ||
      /^(?:~|null|true|false|yes|no|on|off)$/i.test(value) ||
      /^\.(?:inf|nan)$/i.test(value) ||
      /^[-+]?(?:\d|\.\d)/.test(value) ||
      value === '---' ||
      value === '...';

    if (!needsQuoting) {
      return value;
    }

    if (/[\r\n\t]/.test(value) || value.includes("'")) {
      return JSON.stringify(value);
    }
    return `'${value}'`;
  }

  /**
   * Remove top-level keys (with their nested lines) from raw SKILL.md
   * frontmatter. Used for PromptScript-only keys such as `params`, which are
   * resolved at compile time and mean nothing to the target tool.
   */
  protected removeRawFrontmatterKeys(rawFrontmatter: string, keys: ReadonlySet<string>): string {
    const lines = rawFrontmatter.split('\n');
    const kept: string[] = [];
    let skipping = false;
    for (const line of lines) {
      const isTopLevel = line.length > 0 && !/^[ \t]/.test(line);
      if (skipping && !isTopLevel) continue;
      skipping = false;
      if (isTopLevel) {
        const key = /^(['"]?)([^'":#]+)\1\s*:/.exec(line)?.[2]?.trim();
        if (key !== undefined && keys.has(key)) {
          skipping = true;
          continue;
        }
      }
      kept.push(line);
    }
    return kept.join('\n');
  }

  /**
   * Preserve raw skill frontmatter while supplying mandatory skill fields.
   */
  protected mergeRequiredSkillFrontmatter(
    rawFrontmatter: string,
    name: string,
    description: string
  ): string {
    const hasTopLevelKey = (key: string): boolean =>
      rawFrontmatter.split(/\r?\n/).some((line) => {
        if (/^[ \t]/.test(line)) return false;
        const separatorIndex = line.indexOf(':');
        if (separatorIndex < 0) return false;
        const rawKey = line
          .slice(0, separatorIndex)
          .trim()
          .replace(/^\uFEFF/, '');
        return rawKey === key || rawKey === `'${key}'` || rawKey === `"${key}"`;
      });

    const generatedFields: string[] = [];
    if (!hasTopLevelKey('name')) {
      generatedFields.push(`name: ${this.yamlString(name)}`);
    }
    if (!hasTopLevelKey('description')) {
      generatedFields.push(`description: ${this.yamlString(description)}`);
    }

    return [...generatedFields, rawFrontmatter].filter((entry) => entry.length > 0).join('\n');
  }

  /**
   * Extract skills from the @skills block, skipping unsafe names and skills
   * excluded by the target's skill filter.
   */
  protected extractSkills(ast: Program, options?: FormatOptions): SkillFileConfig[] {
    const skillsBlock = this.findBlock(ast, 'skills');
    if (!skillsBlock) return [];

    const skills: SkillFileConfig[] = [];
    const props = this.getProps(skillsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!this.isSafeSkillName(name)) continue;
        if (!this.shouldIncludeSkill(name, options)) continue;
        const obj = value as Record<string, Value>;
        skills.push({
          name,
          description: obj['description'] ? this.valueToString(obj['description']) : name,
          argumentHint: obj['argumentHint'] ? this.valueToString(obj['argumentHint']) : undefined,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
          resources:
            obj['resources'] && Array.isArray(obj['resources'])
              ? (obj['resources'] as Array<Record<string, Value>>).map((r) => ({
                  relativePath: r['relativePath'] as string,
                  content: r['content'] as string,
                  executable: typeof r['executable'] === 'boolean' ? r['executable'] : undefined,
                }))
              : undefined,
          rawFrontmatter:
            typeof obj['__rawFrontmatter'] === 'string' ? obj['__rawFrontmatter'] : undefined,
          examples: this.extractSkillExamples(obj),
          outputDir: typeof obj['__outputDir'] === 'string' ? obj['__outputDir'] : undefined,
        });
      }
    }

    return skills;
  }

  /**
   * Render a skill file at the target's skill base path.
   * Returns null when the target declares no skill support.
   */
  protected generateSkillFile(
    config: SkillFileConfig,
    options?: FormatOptions
  ): FormatterOutput | null {
    const skillBasePath = this.getSkillBasePath();
    const skillFileName = this.getSkillFileName();
    if (!skillBasePath || !skillFileName) return null;

    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    if (config.rawFrontmatter) {
      lines.push(
        this.mergeRequiredSkillFrontmatter(config.rawFrontmatter, config.name, config.description)
      );
    } else {
      lines.push(`name: ${this.yamlString(config.name)}`);
      lines.push(`description: ${this.yamlString(config.description)}`);
      if (config.argumentHint) {
        lines.push(`argument-hint: ${this.yamlString(config.argumentHint)}`);
      }
    }
    lines.push('---');
    lines.push('');

    if (config.content) {
      lines.push(this.dedent(config.content));
    }

    // Append examples section if the skill has examples
    if (config.examples && config.examples.length > 0) {
      lines.push('');
      lines.push('## Examples');
      for (const example of config.examples) {
        lines.push('');
        lines.push(`### Example: ${example.name}`);
        if (example.description) {
          const safeDescription = example.description.replace(/[\r\n]+/g, ' ').trim();
          lines.push('');
          lines.push(safeDescription);
        }
        lines.push('');
        lines.push('**Input:**');
        lines.push('');
        lines.push(this.renderCodeFence(this.dedent(example.input)));
        lines.push('');
        lines.push('**Output:**');
        lines.push('');
        lines.push(this.renderCodeFence(this.dedent(example.output)));
      }
    }

    const skillDirPath = this.resolveSkillDir(
      skillBasePath,
      config.name,
      config.outputDir,
      options
    );
    const resourceFiles = this.sanitizeResourceFiles(config.resources, skillDirPath);

    return {
      path: `${skillDirPath}/${skillFileName}`,
      content: lines.join('\n') + '\n',
      additionalFiles: resourceFiles.length > 0 ? resourceFiles : undefined,
    };
  }

  /**
   * Render content inside a code fence, using a longer fence if the content
   * itself contains triple backticks (prevents code fence injection).
   */
  protected renderCodeFence(content: string, lang = ''): string {
    const fence = content.includes('```') ? '````' : '```';
    return `${fence}${lang}\n${content}\n${fence}`;
  }
}
