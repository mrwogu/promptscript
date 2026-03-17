import type { MarkdownSection } from './markdown.js';

export interface FormatParser {
  name: string;
  canParse(filename: string, content: string): boolean;
  parse(content: string): MarkdownSection[];
}
