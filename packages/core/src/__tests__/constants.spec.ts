import { describe, it, expect } from 'vitest';
import { BLOCK_TYPES, RESERVED_WORDS, isReservedWord, isBlockType } from '../types/constants.js';

describe('BLOCK_TYPES', () => {
  it('should contain all known block types', () => {
    expect(BLOCK_TYPES).toContain('identity');
    expect(BLOCK_TYPES).toContain('context');
    expect(BLOCK_TYPES).toContain('standards');
    expect(BLOCK_TYPES).toContain('restrictions');
    expect(BLOCK_TYPES).toContain('knowledge');
    expect(BLOCK_TYPES).toContain('shortcuts');
    expect(BLOCK_TYPES).toContain('guards');
    expect(BLOCK_TYPES).toContain('params');
    expect(BLOCK_TYPES).toContain('skills');
    expect(BLOCK_TYPES).toContain('local');
    expect(BLOCK_TYPES).toContain('agents');
    expect(BLOCK_TYPES).toContain('workflows');
    expect(BLOCK_TYPES).toContain('prompts');
  });

  it('should be a readonly array', () => {
    expect(Array.isArray(BLOCK_TYPES)).toBe(true);
    expect(BLOCK_TYPES.length).toBeGreaterThan(0);
  });
});

describe('RESERVED_WORDS', () => {
  it('should contain all directives', () => {
    expect(RESERVED_WORDS).toContain('meta');
    expect(RESERVED_WORDS).toContain('inherit');
    expect(RESERVED_WORDS).toContain('use');
    expect(RESERVED_WORDS).toContain('extend');
  });

  it('should contain all block types', () => {
    BLOCK_TYPES.forEach((blockType) => {
      expect(RESERVED_WORDS).toContain(blockType);
    });
  });

  it('should contain keywords', () => {
    expect(RESERVED_WORDS).toContain('as');
    expect(RESERVED_WORDS).toContain('true');
    expect(RESERVED_WORDS).toContain('false');
    expect(RESERVED_WORDS).toContain('null');
  });

  it('should contain type keywords', () => {
    expect(RESERVED_WORDS).toContain('string');
    expect(RESERVED_WORDS).toContain('number');
    expect(RESERVED_WORDS).toContain('boolean');
    expect(RESERVED_WORDS).toContain('list');
    expect(RESERVED_WORDS).toContain('range');
    expect(RESERVED_WORDS).toContain('enum');
  });
});

describe('isReservedWord', () => {
  it('should return true for reserved words', () => {
    expect(isReservedWord('meta')).toBe(true);
    expect(isReservedWord('identity')).toBe(true);
    expect(isReservedWord('true')).toBe(true);
    expect(isReservedWord('string')).toBe(true);
  });

  it('should return false for non-reserved words', () => {
    expect(isReservedWord('myVariable')).toBe(false);
    expect(isReservedWord('customBlock')).toBe(false);
    expect(isReservedWord('')).toBe(false);
  });
});

describe('isBlockType', () => {
  it('should return true for known block types', () => {
    expect(isBlockType('identity')).toBe(true);
    expect(isBlockType('context')).toBe(true);
    expect(isBlockType('standards')).toBe(true);
    expect(isBlockType('skills')).toBe(true);
    expect(isBlockType('local')).toBe(true);
  });

  it('should return false for non-block types', () => {
    expect(isBlockType('meta')).toBe(false);
    expect(isBlockType('inherit')).toBe(false);
    expect(isBlockType('customBlock')).toBe(false);
    expect(isBlockType('')).toBe(false);
  });
});
