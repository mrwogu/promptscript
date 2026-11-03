import { describe, expect, it } from 'vitest';
import { splitToolList } from '../tool-list.js';

describe('splitToolList', () => {
  it('should split on commas and trim items', () => {
    expect(splitToolList(' Read, Grep ,Execute')).toEqual(['Read', 'Grep', 'Execute']);
  });

  it('should keep commas inside parentheses', () => {
    expect(splitToolList('Read, Bash(git add:*, git commit:*), Grep')).toEqual([
      'Read',
      'Bash(git add:*, git commit:*)',
      'Grep',
    ]);
  });

  it('should drop empty items and ignore a stray closing parenthesis', () => {
    expect(splitToolList('Read, , ), Grep,')).toEqual(['Read', ')', 'Grep']);
  });
});
