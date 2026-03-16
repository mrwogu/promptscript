import { parseMarkdownSections } from './markdown.js';
import type { FormatParser } from './types.js';
import type { MarkdownSection } from './markdown.js';

const CLAUDE_FILENAMES = ['claude.md', 'claude.local.md'];

export const claudeParser: FormatParser = {
  name: 'claude',

  canParse(filename: string, _content: string): boolean {
    const lower = filename.toLowerCase().split('/').pop() ?? '';
    return CLAUDE_FILENAMES.includes(lower);
  },

  parse(content: string): MarkdownSection[] {
    return parseMarkdownSections(content);
  },
};
