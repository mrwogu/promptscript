import { parseMarkdownSections } from './markdown.js';
import type { FormatParser } from './types.js';
import type { MarkdownSection } from './markdown.js';

const CURSOR_FILENAMES = ['.cursorrules', 'rules.md', '.cursor/rules.md'];

export const cursorParser: FormatParser = {
  name: 'cursor',

  canParse(filename: string, _content: string): boolean {
    const normalized = filename.replace(/\\/g, '/').toLowerCase();
    return CURSOR_FILENAMES.some((p) => normalized.endsWith(p));
  },

  parse(content: string): MarkdownSection[] {
    return parseMarkdownSections(content);
  },
};
