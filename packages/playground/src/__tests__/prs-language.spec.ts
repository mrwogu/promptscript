import { describe, it, expect } from 'vitest';
import {
  PRS_LANGUAGE_ID,
  prsLanguageDefinition,
  prsLanguageConfiguration,
  prsThemeRules,
} from '../utils/prs-language';

describe('prs-language', () => {
  describe('PRS_LANGUAGE_ID', () => {
    it('should be "promptscript"', () => {
      expect(PRS_LANGUAGE_ID).toBe('promptscript');
    });
  });

  describe('prsLanguageDefinition', () => {
    it('should have correct token postfix', () => {
      expect(prsLanguageDefinition.tokenPostfix).toBe('.prs');
    });

    it('should define all directives', () => {
      const directives = prsLanguageDefinition.directives as string[];
      expect(directives).toContain('@meta');
      expect(directives).toContain('@inherit');
      expect(directives).toContain('@identity');
      expect(directives).toContain('@context');
      expect(directives).toContain('@standards');
      expect(directives).toContain('@restrictions');
      expect(directives).toContain('@shortcuts');
      expect(directives).toContain('@tools');
      expect(directives).toContain('@skills');
      expect(directives).toContain('@examples');
    });

    it('should have root tokenizer rules', () => {
      const tokenizer = prsLanguageDefinition.tokenizer;
      expect(tokenizer).toBeDefined();
      expect(tokenizer.root).toBeDefined();
      expect(Array.isArray(tokenizer.root)).toBe(true);
    });

    it('should have string tokenizer rules', () => {
      const tokenizer = prsLanguageDefinition.tokenizer;
      expect(tokenizer.string).toBeDefined();
      expect(Array.isArray(tokenizer.string)).toBe(true);
    });

    it('should have multilineString tokenizer rules', () => {
      const tokenizer = prsLanguageDefinition.tokenizer;
      expect(tokenizer.multilineString).toBeDefined();
      expect(Array.isArray(tokenizer.multilineString)).toBe(true);
    });

    it('should have whitespace tokenizer rules', () => {
      const tokenizer = prsLanguageDefinition.tokenizer;
      expect(tokenizer.whitespace).toBeDefined();
      expect(Array.isArray(tokenizer.whitespace)).toBe(true);
    });

    it('should define keywords', () => {
      const keywords = prsLanguageDefinition.keywords as string[];
      expect(keywords).toContain('true');
      expect(keywords).toContain('false');
      expect(keywords).toContain('null');
    });
  });

  describe('prsLanguageConfiguration', () => {
    it('should define line comment', () => {
      expect(prsLanguageConfiguration.comments?.lineComment).toBe('#');
    });

    it('should define brackets', () => {
      const brackets = prsLanguageConfiguration.brackets;
      expect(brackets).toContainEqual(['{', '}']);
      expect(brackets).toContainEqual(['[', ']']);
      expect(brackets).toContainEqual(['(', ')']);
    });

    it('should define auto-closing pairs', () => {
      const pairs = prsLanguageConfiguration.autoClosingPairs;
      expect(pairs).toBeDefined();
      expect(pairs?.length).toBeGreaterThan(0);

      const braces = pairs?.find((p) => p.open === '{');
      expect(braces?.close).toBe('}');

      const quotes = pairs?.find((p) => p.open === '"');
      expect(quotes?.close).toBe('"');
      expect(quotes?.notIn).toContain('string');
    });

    it('should define surrounding pairs', () => {
      const pairs = prsLanguageConfiguration.surroundingPairs;
      expect(pairs).toBeDefined();
      expect(pairs?.length).toBeGreaterThan(0);
    });

    it('should define folding markers', () => {
      const folding = prsLanguageConfiguration.folding;
      expect(folding?.markers).toBeDefined();
      expect(folding?.markers?.start).toBeInstanceOf(RegExp);
      expect(folding?.markers?.end).toBeInstanceOf(RegExp);
    });
  });

  describe('prsThemeRules', () => {
    it('should define directive token style', () => {
      const directiveRule = prsThemeRules.find((r) => r.token === 'keyword.directive');
      expect(directiveRule).toBeDefined();
      expect(directiveRule?.fontStyle).toBe('bold');
    });

    it('should define string token style', () => {
      const stringRule = prsThemeRules.find((r) => r.token === 'string');
      expect(stringRule).toBeDefined();
      expect(stringRule?.foreground).toBeDefined();
    });

    it('should define comment token style', () => {
      const commentRule = prsThemeRules.find((r) => r.token === 'comment');
      expect(commentRule).toBeDefined();
      expect(commentRule?.fontStyle).toBe('italic');
    });

    it('should define number token style', () => {
      const numberRule = prsThemeRules.find((r) => r.token === 'number');
      expect(numberRule).toBeDefined();
    });

    it('should define all essential tokens', () => {
      const tokens = prsThemeRules.map((r) => r.token);
      expect(tokens).toContain('keyword.directive');
      expect(tokens).toContain('keyword');
      expect(tokens).toContain('string');
      expect(tokens).toContain('comment');
      expect(tokens).toContain('number');
      expect(tokens).toContain('identifier');
      expect(tokens).toContain('delimiter');
    });
  });
});
