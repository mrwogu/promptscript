import { describe, it, expect } from 'vitest';
import { slugify } from '../slugify.js';

describe('utils/slugify', () => {
  it('should convert spaces to hyphens and lowercase', () => {
    expect(slugify('Comarch PromptScript Registry')).toBe('comarch-promptscript-registry');
  });

  it('should trim and deduplicate hyphens', () => {
    expect(slugify('  My--Registry  ')).toBe('my-registry');
  });

  it('should replace non-alphanumeric chars with hyphens', () => {
    expect(slugify('@core/base')).toBe('core-base');
  });

  it('should pass through already-slugified strings', () => {
    expect(slugify('already-slug')).toBe('already-slug');
  });

  it('should handle uppercase input', () => {
    expect(slugify('UPPER CASE')).toBe('upper-case');
  });

  it('should deduplicate mixed separators', () => {
    expect(slugify('a---b___c')).toBe('a-b-c');
  });

  it('should return empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });
});
