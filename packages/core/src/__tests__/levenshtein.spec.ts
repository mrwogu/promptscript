import { describe, it, expect } from 'vitest';
import { levenshteinDistance, findClosestMatch } from '../utils/levenshtein.js';

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('agents', 'agents')).toBe(0);
  });

  it('should return string length for empty comparison', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('should calculate single character difference', () => {
    expect(levenshteinDistance('agents', 'agenst')).toBe(2);
  });

  it('should calculate insertion', () => {
    expect(levenshteinDistance('agent', 'agents')).toBe(1);
  });

  it('should calculate deletion', () => {
    expect(levenshteinDistance('agents', 'agent')).toBe(1);
  });

  it('should calculate substitution', () => {
    expect(levenshteinDistance('agents', 'agentx')).toBe(1);
  });

  it('should handle completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
  });
});

describe('findClosestMatch', () => {
  const candidates = ['identity', 'context', 'standards', 'restrictions', 'agents', 'skills'];

  it('should find exact match with distance 0', () => {
    expect(findClosestMatch('agents', candidates)).toEqual({ match: 'agents', distance: 0 });
  });

  it('should find close match within threshold', () => {
    const result = findClosestMatch('agenst', candidates, 2);
    expect(result).toEqual({ match: 'agents', distance: 2 });
  });

  it('should return undefined when no match within threshold', () => {
    expect(findClosestMatch('foobar', candidates, 2)).toBeUndefined();
  });

  it('should use default threshold of 2', () => {
    expect(findClosestMatch('agent', candidates)).toEqual({ match: 'agents', distance: 1 });
  });

  it('should return closest when multiple matches', () => {
    expect(findClosestMatch('skill', candidates)).toEqual({ match: 'skills', distance: 1 });
  });
});
