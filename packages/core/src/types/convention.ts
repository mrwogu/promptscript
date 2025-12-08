/**
 * Output conventions for formatting PromptScript blocks.
 *
 * Conventions define how sections are rendered in the output:
 * - XML: Uses tags like <section>, <subsection>
 * - Markdown: Uses headers like ## Section, ### Subsection
 * - Custom: User-defined patterns
 */

/**
 * Built-in convention names.
 */
export type BuiltInConventionName = 'xml' | 'markdown';

/**
 * Convention name (built-in or custom).
 */
export type ConventionName = BuiltInConventionName | string;

/**
 * Section rendering configuration.
 */
export interface SectionRenderer {
  /**
   * Template for section start.
   * Variables: {{name}}, {{level}}, {{content}}
   *
   * @example XML: "<{{name}}>"
   * @example Markdown: "{{#repeat level}}#{{/repeat}} {{name}}"
   */
  start: string;

  /**
   * Template for section end (optional, for paired tags).
   * Variables: {{name}}
   *
   * @example XML: "</{{name}}>"
   * @example Markdown: "" (empty - no closing tag)
   */
  end?: string;

  /**
   * Whether to convert section names.
   * @default 'kebab-case'
   */
  nameTransform?: 'kebab-case' | 'camelCase' | 'PascalCase' | 'none';

  /**
   * Indentation per level.
   * @default '  ' (2 spaces)
   */
  indent?: string;
}

/**
 * Output convention definition.
 */
export interface OutputConvention {
  /**
   * Convention identifier.
   */
  name: ConventionName;

  /**
   * Human-readable description.
   */
  description?: string;

  /**
   * Section rendering configuration.
   */
  section: SectionRenderer;

  /**
   * Subsection rendering (defaults to section config if not specified).
   */
  subsection?: SectionRenderer;

  /**
   * How to render lists.
   * @default 'dash' (- item)
   */
  listStyle?: 'dash' | 'asterisk' | 'bullet' | 'numbered';

  /**
   * Code block delimiter.
   * @default '```'
   */
  codeBlockDelimiter?: string;

  /**
   * Whether to wrap content in a root element.
   */
  rootWrapper?: {
    start: string;
    end: string;
  };
}

/**
 * Built-in XML convention.
 * Uses XML-style tags: <section>, </section>
 */
export const XML_CONVENTION: OutputConvention = {
  name: 'xml',
  description: 'XML-style tags for section structure',
  section: {
    start: '<{{name}}>',
    end: '</{{name}}>',
    nameTransform: 'kebab-case',
    indent: '  ',
  },
  subsection: {
    start: '  <{{name}}>',
    end: '  </{{name}}>',
    nameTransform: 'kebab-case',
    indent: '  ',
  },
  listStyle: 'dash',
  codeBlockDelimiter: '```',
};

/**
 * Built-in Markdown convention.
 * Uses Markdown headers: ## Section, ### Subsection
 */
export const MARKDOWN_CONVENTION: OutputConvention = {
  name: 'markdown',
  description: 'Markdown headers for section structure',
  section: {
    start: '## {{name}}',
    end: '',
    nameTransform: 'none',
    indent: '',
  },
  subsection: {
    start: '### {{name}}',
    end: '',
    nameTransform: 'none',
    indent: '',
  },
  listStyle: 'dash',
  codeBlockDelimiter: '```',
};

/**
 * Registry of built-in conventions.
 */
export const BUILT_IN_CONVENTIONS: Record<BuiltInConventionName, OutputConvention> = {
  xml: XML_CONVENTION,
  markdown: MARKDOWN_CONVENTION,
};

/**
 * Get a built-in convention by name.
 */
export function getBuiltInConvention(name: BuiltInConventionName): OutputConvention {
  return BUILT_IN_CONVENTIONS[name];
}

/**
 * Check if a convention name is built-in.
 */
export function isBuiltInConvention(name: string): name is BuiltInConventionName {
  return name in BUILT_IN_CONVENTIONS;
}
