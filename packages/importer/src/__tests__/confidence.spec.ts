import { describe, it, expect } from 'vitest';
import { ConfidenceLevel, classifyConfidence, type ScoredSection } from '../confidence.js';

describe('confidence', () => {
  describe('classifyConfidence', () => {
    it('returns HIGH for scores above 0.8', () => {
      expect(classifyConfidence(0.9)).toBe(ConfidenceLevel.HIGH);
      expect(classifyConfidence(0.81)).toBe(ConfidenceLevel.HIGH);
      expect(classifyConfidence(1.0)).toBe(ConfidenceLevel.HIGH);
    });

    it('returns MEDIUM for scores between 0.5 and 0.8', () => {
      expect(classifyConfidence(0.7)).toBe(ConfidenceLevel.MEDIUM);
      expect(classifyConfidence(0.5)).toBe(ConfidenceLevel.MEDIUM);
      expect(classifyConfidence(0.8)).toBe(ConfidenceLevel.MEDIUM);
    });

    it('returns LOW for scores below 0.5', () => {
      expect(classifyConfidence(0.3)).toBe(ConfidenceLevel.LOW);
      expect(classifyConfidence(0.49)).toBe(ConfidenceLevel.LOW);
      expect(classifyConfidence(0)).toBe(ConfidenceLevel.LOW);
    });
  });

  describe('ScoredSection type', () => {
    it('can construct a scored section', () => {
      const section: ScoredSection = {
        heading: 'Code Style',
        content: 'Use strict mode',
        targetBlock: 'standards',
        confidence: 0.85,
        level: ConfidenceLevel.HIGH,
      };
      expect(section.heading).toBe('Code Style');
      expect(section.targetBlock).toBe('standards');
      expect(section.level).toBe(ConfidenceLevel.HIGH);
    });
  });
});
