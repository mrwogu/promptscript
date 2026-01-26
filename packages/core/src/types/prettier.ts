/**
 * Prettier markdown formatting options.
 * These options control how markdown output is formatted.
 */
export interface PrettierMarkdownOptions {
  /**
   * How to wrap prose.
   * - 'always': Wrap prose at printWidth
   * - 'never': Do not wrap prose
   * - 'preserve': Preserve original wrapping
   * @default 'preserve'
   */
  proseWrap?: 'always' | 'never' | 'preserve';

  /**
   * Number of spaces per indentation level.
   * @default 2
   */
  tabWidth?: number;

  /**
   * Maximum line width for prose wrapping.
   * @default 80
   */
  printWidth?: number;
}

/**
 * Default Prettier markdown options.
 */
export const DEFAULT_PRETTIER_OPTIONS: Required<PrettierMarkdownOptions> = {
  proseWrap: 'preserve',
  tabWidth: 2,
  printWidth: 80,
};
