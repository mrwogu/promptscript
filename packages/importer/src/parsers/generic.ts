import { parseMarkdownSections } from './markdown.js';
import type { FormatParser } from './types.js';
import type { MarkdownSection } from './markdown.js';

export const genericParser: FormatParser = {
  name: 'generic',

  canParse(_filename: string, _content: string): boolean {
    return true;
  },

  parse(content: string): MarkdownSection[] {
    return parseMarkdownSections(content);
  },
};
