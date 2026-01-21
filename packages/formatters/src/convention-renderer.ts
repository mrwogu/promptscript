import type { OutputConvention, SectionRenderer } from '@promptscript/core';
import { BUILT_IN_CONVENTIONS, isBuiltInConvention, XML_CONVENTION } from '@promptscript/core';

/**
 * Convention renderer for applying output conventions to formatted content.
 */
export class ConventionRenderer {
  private convention: OutputConvention;

  constructor(convention: OutputConvention | string = 'xml') {
    if (typeof convention === 'string') {
      if (isBuiltInConvention(convention)) {
        this.convention = BUILT_IN_CONVENTIONS[convention];
      } else {
        throw new Error(
          `Unknown convention: ${convention}. Use a built-in convention ('xml', 'markdown') or provide a custom OutputConvention.`
        );
      }
    } else {
      this.convention = convention;
    }
  }

  /**
   * Get the current convention.
   */
  getConvention(): OutputConvention {
    return this.convention;
  }

  /**
   * Render a section with the convention.
   *
   * @param name - Section name (e.g., 'project', 'tech-stack')
   * @param content - Section content
   * @param level - Nesting level (1 = section, 2+ = subsection)
   */
  renderSection(name: string, content: string, level: number = 1): string {
    const renderer =
      level === 1
        ? this.convention.section
        : (this.convention.subsection ?? this.convention.section);
    const transformedName = this.transformName(name, renderer.nameTransform);

    const start = this.applyTemplate(renderer.start, { name: transformedName, level });
    const end = renderer.end
      ? this.applyTemplate(renderer.end, { name: transformedName, level })
      : '';

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      // Empty section - just opening and closing tags on same line or header only
      return end ? `${start}\n${end}` : start;
    }

    const indentedContent = this.indentContent(trimmedContent, renderer, level);

    if (end) {
      return `${start}\n${indentedContent}\n${end}`;
    }
    return `${start}\n${indentedContent}`;
  }

  /**
   * Render a list of items.
   */
  renderList(items: string[]): string {
    const marker = this.getListMarker();
    return items.map((item) => `${marker} ${item}`).join('\n');
  }

  /**
   * Render a code block.
   */
  renderCodeBlock(code: string, language: string = ''): string {
    const delimiter = this.convention.codeBlockDelimiter ?? '```';
    return `${delimiter}${language}\n${code}\n${delimiter}`;
  }

  /**
   * Wrap content with root wrapper if defined.
   */
  wrapRoot(content: string): string {
    if (!this.convention.rootWrapper) {
      return content;
    }
    return `${this.convention.rootWrapper.start}\n${content}\n${this.convention.rootWrapper.end}`;
  }

  /**
   * Get the section separator based on convention.
   */
  getSectionSeparator(): string {
    // For XML, sections are adjacent; for markdown, we might want extra newline
    return this.convention.name === 'markdown' ? '\n\n' : '\n\n';
  }

  private getListMarker(): string {
    switch (this.convention.listStyle) {
      case 'asterisk':
        return '*';
      case 'bullet':
        return '•';
      case 'numbered':
        return '1.';
      case 'dash':
      default:
        return '-';
    }
  }

  private transformName(name: string, transform?: SectionRenderer['nameTransform']): string {
    switch (transform) {
      case 'kebab-case':
        return this.toKebabCase(name);
      case 'camelCase':
        return this.toCamelCase(name);
      case 'PascalCase':
        return this.toPascalCase(name);
      case 'none':
      default:
        return name;
    }
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toLowerCase());
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toUpperCase());
  }

  private applyTemplate(template: string, variables: { name: string; level: number }): string {
    let result = template;

    // Replace simple variables
    result = result.replace(/\{\{name\}\}/g, variables.name);
    result = result.replace(/\{\{level\}\}/g, String(variables.level));

    // Handle repeat helper: {{#repeat level}}#{{/repeat}}
    const repeatRegex = /\{\{#repeat\s+(\w+)\}\}(.+?)\{\{\/repeat\}\}/;
    const repeatMatch = repeatRegex.exec(result);
    if (repeatMatch) {
      // Non-null assertions safe: regex groups must match for exec to return non-null
      const repeatVar = repeatMatch[1]!;
      const repeatContent = repeatMatch[2]!;
      const count = repeatVar === 'level' ? variables.level : 1;
      const repeated = repeatContent.repeat(count);
      result = result.replace(repeatMatch[0], repeated);
    }

    return result;
  }

  private indentContent(content: string, renderer: SectionRenderer, level: number): string {
    const indent = renderer.indent ?? '';
    if (!indent) {
      return content;
    }

    // For XML convention, indent content inside tags
    if (this.convention.name === 'xml') {
      const baseIndent = indent.repeat(level);
      return content
        .split('\n')
        .map((line) => (line.trim() ? `${baseIndent}${line}` : line))
        .join('\n');
    }

    return content;
  }
}

/**
 * Create a convention renderer from a convention name or definition.
 */
export function createConventionRenderer(
  convention: OutputConvention | string = 'xml'
): ConventionRenderer {
  return new ConventionRenderer(convention);
}

/**
 * Default convention renderers for quick access.
 */
export const conventionRenderers = {
  xml: new ConventionRenderer(XML_CONVENTION),
  markdown: new ConventionRenderer(BUILT_IN_CONVENTIONS.markdown),
} as const;
