import { parseMarkdownSections } from './markdown.js';
import type { FormatParser } from './types.js';
import type { MarkdownSection } from './markdown.js';

const GITHUB_PATHS = ['copilot-instructions.md', '.github/copilot-instructions.md'];

export const githubParser: FormatParser = {
  name: 'github',

  canParse(filename: string, _content: string): boolean {
    const normalized = filename.replace(/\\/g, '/').toLowerCase();
    return GITHUB_PATHS.some((p) => normalized.endsWith(p));
  },

  parse(content: string): MarkdownSection[] {
    return parseMarkdownSections(content);
  },
};
