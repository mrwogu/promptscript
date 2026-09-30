import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import { decodeState, filesForTarget } from './live-compile';

function playgroundUrl(state: unknown): string {
  return `https://getpromptscript.dev/playground/?s=${LZString.compressToEncodedURIComponent(JSON.stringify(state))}`;
}

describe('decodeState', () => {
  it('reads files and entry from a playground link', () => {
    const files = [
      { path: 'example.prs', content: '@meta { id: "x" syntax: "1.6.0" }' },
      { path: 'base.prs', content: '@identity { "Base" }' },
    ];

    const state = decodeState(playgroundUrl({ files, entry: 'example.prs', version: '1' }));

    expect(state).toEqual({ files, entry: 'example.prs' });
  });

  it('falls back to the first file when entry is missing', () => {
    const state = decodeState(playgroundUrl({ files: [{ path: 'a.prs', content: '' }] }));

    expect(state?.entry).toBe('a.prs');
  });

  it('rejects links without a valid state', () => {
    expect(decodeState('https://getpromptscript.dev/playground/')).toBeUndefined();
    expect(decodeState('https://getpromptscript.dev/playground/?s=garbage')).toBeUndefined();
    expect(decodeState(playgroundUrl({ files: [] }))).toBeUndefined();
    expect(decodeState(playgroundUrl({ files: [{ path: 1 }] }))).toBeUndefined();
  });
});

describe('filesForTarget', () => {
  it('keeps one target and puts the main file first', () => {
    const outputs = [
      { path: '.claude/skills/review/SKILL.md', content: '', target: 'claude' },
      { path: '.github/copilot-instructions.md', content: '', target: 'github' },
      { path: 'CLAUDE.md', content: '', target: 'claude' },
    ];

    const files = filesForTarget(outputs, 'claude').map((file) => file.path);

    expect(files).toEqual(['CLAUDE.md', '.claude/skills/review/SKILL.md']);
  });
});
