import { basename } from 'path';
import { parseMarkdownSections } from './markdown.js';
import type { FormatParser } from './types.js';
import type { MarkdownSection } from './markdown.js';

const GITHUB_PATHS = ['copilot-instructions.md', '.github/copilot-instructions.md'];

interface FrontmatterResult {
  applyTo: string[];
  body: string;
}

function parseApplyToFrontmatter(content: string): FrontmatterResult | undefined {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(content);
  if (!match) return undefined;

  const yaml = match[1]!;
  const body = match[2]!;

  // Simple YAML parsing for applyTo array
  const applyToMatch = /applyTo:\s*\n((?:\s+-\s+.*\n?)+)/m.exec(yaml);
  if (!applyToMatch) return undefined;

  const items = applyToMatch[1]!;
  const applyTo: string[] = [];
  for (const line of items.split('\n')) {
    const itemMatch = /^\s+-\s+"?([^"\n]+)"?\s*$/.exec(line);
    if (itemMatch) {
      applyTo.push(itemMatch[1]!.trim());
    }
  }

  if (applyTo.length === 0) return undefined;

  return { applyTo, body };
}

function deriveEntryName(filename: string): string {
  return basename(filename).replace(/\.instructions\.md$/i, '');
}

function extractDescription(body: string, entryName: string): string {
  const headingMatch = /^#\s+(.+)$/m.exec(body);
  return headingMatch ? headingMatch[1]!.trim() : `${entryName} rules`;
}

export const githubParser: FormatParser = {
  name: 'github',

  canParse(filename: string, content: string): boolean {
    const normalized = filename.replace(/\\/g, '/').toLowerCase();
    if (GITHUB_PATHS.some((p) => normalized.endsWith(p))) return true;
    if (normalized.includes('.github/instructions/')) return true;
    if (content && /^---\s*\n[\s\S]*?applyTo:/m.test(content)) return true;
    return false;
  },

  parse(content: string, filename?: string): MarkdownSection[] {
    const frontmatter = parseApplyToFrontmatter(content);

    if (frontmatter && filename) {
      const entryName = deriveEntryName(filename);
      const description = extractDescription(frontmatter.body, entryName);
      const bodyContent = frontmatter.body.trim();

      return [
        {
          heading: entryName,
          level: 1,
          content: bodyContent,
          rawLines: bodyContent.split('\n'),
          metadata: {
            type: 'instruction',
            applyTo: frontmatter.applyTo,
            description,
            entryName,
          },
        },
      ];
    }

    return parseMarkdownSections(content);
  },
};
