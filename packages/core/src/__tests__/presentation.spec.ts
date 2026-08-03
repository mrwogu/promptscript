import { describe, expect, it } from 'vitest';
import type { BlockEntry, SourceLocation } from '../types/index.js';
import { normalizeLegacyHeadingEntries } from '../presentation.js';

const LOC: SourceLocation = { file: 'presentation.prs', line: 3, column: 3, offset: 42 };

describe('presentation metadata', () => {
  it('preserves legacy headings before syntax 1.5.0', () => {
    const entries: BlockEntry[] = [
      {
        type: 'TextEntry',
        text: '## Project Rules\nKeep the body.',
        loc: LOC,
      },
    ];

    expect(normalizeLegacyHeadingEntries('identity', entries, '1.4.0')).toBe(entries);
  });

  it('ignores blocks without text entries', () => {
    const entries: BlockEntry[] = [];

    expect(normalizeLegacyHeadingEntries('identity', entries, '1.5.0')).toBe(entries);
  });

  it.each(['Plain body text.', '##Missing separator'])('ignores non-heading text: %s', (text) => {
    const entries: BlockEntry[] = [{ type: 'TextEntry', text, loc: LOC }];

    expect(normalizeLegacyHeadingEntries('identity', entries, '1.5.0')).toBe(entries);
  });

  it('normalizes tab-separated legacy headings with CRLF endings', () => {
    const entries: BlockEntry[] = [
      {
        type: 'TextEntry',
        text: '##\tProject Rules\r\nKeep the body.',
        loc: LOC,
      },
    ];

    const normalized = normalizeLegacyHeadingEntries('identity', entries, '1.5.0');

    expect(normalized).toMatchObject([
      {
        type: 'PresentationEntry',
        title: 'Project Rules',
        source: 'legacy',
      },
      {
        type: 'TextEntry',
        text: 'Keep the body.',
      },
    ]);
  });

  it('ignores whitespace-only headings in linear time', () => {
    const entries: BlockEntry[] = [
      {
        type: 'TextEntry',
        text: `##\t${'\t\t'.repeat(10_000)}`,
        loc: LOC,
      },
    ];

    expect(normalizeLegacyHeadingEntries('identity', entries, '1.5.0')).toBe(entries);
  });
});
