import { claudeParser } from './parsers/claude.js';
import { githubParser } from './parsers/github.js';
import { cursorParser } from './parsers/cursor.js';
import { genericParser } from './parsers/generic.js';
import type { FormatParser } from './parsers/types.js';

export type DetectedFormat = 'claude' | 'github' | 'cursor' | 'generic';

const FORMAT_PARSERS: Record<string, FormatParser> = {
  claude: claudeParser,
  github: githubParser,
  cursor: cursorParser,
  generic: genericParser,
};

const ORDERED_PARSERS: FormatParser[] = [claudeParser, githubParser, cursorParser];

export function detectFormat(filepath: string): DetectedFormat {
  for (const parser of ORDERED_PARSERS) {
    if (parser.canParse(filepath, '')) {
      return parser.name as DetectedFormat;
    }
  }
  return 'generic';
}

export function getParser(format: string): FormatParser {
  return FORMAT_PARSERS[format] ?? genericParser;
}
