import { describe, expect, it } from 'vitest';
import type { SourceLocation } from '@promptscript/core';
import { GlobCategorizer, CATEGORY_GLOB_HINTS } from '../glob-categorizer.js';
import { StandardsExtractor } from '../standards-extractor.js';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

function makeStandardsContent(categories: Record<string, Record<string, string>>) {
  return {
    type: 'ObjectContent' as const,
    properties: categories,
    loc: createLoc(),
  };
}

describe('GlobCategorizer', () => {
  const extractor = new StandardsExtractor();
  const categorizer = new GlobCategorizer(extractor);

  describe('basic categorization', () => {
    it('should assign .ts glob to typescript category', () => {
      const content = makeStandardsContent({ typescript: { strictMode: 'true' } });
      const result = categorizer.categorize(['**/*.ts'], content);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('typescript');
      expect(result[0]!.patterns).toEqual(['**/*.ts']);
      expect(result[0]!.content).toContain('strictMode');
    });

    it('should assign .py glob to python category', () => {
      const content = makeStandardsContent({ python: { style: 'PEP 8' } });
      const result = categorizer.categorize(['**/*.py'], content);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('python');
    });

    it('should assign spec glob to testing category', () => {
      const content = makeStandardsContent({ testing: { pattern: 'AAA' } });
      const result = categorizer.categorize(['**/*.spec.ts'], content);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('testing');
    });

    it('should not match glob when category has no @standards entry', () => {
      const content = makeStandardsContent({ typescript: { strictMode: 'true' } });
      const result = categorizer.categorize(['**/*.py'], content);
      expect(result).toHaveLength(0);
    });
  });

  describe('boundary detection', () => {
    it('should NOT match .c hint against .cpp glob', () => {
      const content = makeStandardsContent({ c: { style: 'K&R' } });
      const result = categorizer.categorize(['**/*.cpp'], content);
      expect(result).toHaveLength(0);
    });

    it('should match .cs to csharp, not c or css', () => {
      const content = makeStandardsContent({
        c: { style: 'K&R' },
        csharp: { style: 'Microsoft' },
        css: { style: 'BEM' },
      });
      const result = categorizer.categorize(['**/*.cs'], content);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('csharp');
    });

    it('should NOT match testing hint in "attest"', () => {
      const content = makeStandardsContent({ testing: { pattern: 'AAA' } });
      const result = categorizer.categorize(['**/attest.ts'], content);
      expect(result).toHaveLength(0);
    });

    it('should NOT match testing hint in "contest"', () => {
      const content = makeStandardsContent({ testing: { pattern: 'AAA' } });
      const result = categorizer.categorize(['**/contest/**'], content);
      expect(result).toHaveLength(0);
    });

    it('should match __tests__ with path boundaries', () => {
      const content = makeStandardsContent({ testing: { pattern: 'AAA' } });
      const result = categorizer.categorize(['**/__tests__/**'], content);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('testing');
    });
  });

  describe('longest match wins', () => {
    it('should prefer angular (.component.ts) over typescript (.ts)', () => {
      const content = makeStandardsContent({
        angular: { changeDetection: 'OnPush' },
        typescript: { strictMode: 'true' },
      });
      const result = categorizer.categorize(['**/*.component.ts'], content);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('angular');
    });
  });

  describe('pattern-based tiebreaker', () => {
    it('should prefer testing (test) over typescript (.tsx) on equal length', () => {
      const content = makeStandardsContent({
        testing: { pattern: 'AAA' },
        typescript: { strictMode: 'true' },
      });
      const result = categorizer.categorize(['**/*.test.tsx'], content);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('testing');
    });
  });

  describe('multiple globs across categories', () => {
    it('should split globs into separate categories', () => {
      const content = makeStandardsContent({
        typescript: { strictMode: 'true' },
        python: { style: 'PEP 8' },
      });
      const result = categorizer.categorize(['**/*.ts', '**/*.py'], content);
      expect(result).toHaveLength(2);
      const ts = result.find((r) => r.name === 'typescript');
      const py = result.find((r) => r.name === 'python');
      expect(ts?.patterns).toEqual(['**/*.ts']);
      expect(py?.patterns).toEqual(['**/*.py']);
    });

    it('should group multiple globs into the same category', () => {
      const content = makeStandardsContent({ typescript: { strictMode: 'true' } });
      const result = categorizer.categorize(['**/*.ts', '**/*.tsx'], content);
      expect(result).toHaveLength(1);
      expect(result[0]!.patterns).toEqual(['**/*.ts', '**/*.tsx']);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty globs', () => {
      const content = makeStandardsContent({ typescript: { strictMode: 'true' } });
      const result = categorizer.categorize([], content);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for null standardsContent', () => {
      const result = categorizer.categorize(['**/*.ts'], null);
      expect(result).toHaveLength(0);
    });

    it('should not treat empty @standards category as existing', () => {
      const content = makeStandardsContent({ testing: {} });
      const result = categorizer.categorize(['**/*.spec.ts'], content);
      expect(result).toHaveLength(0);
    });
  });

  describe('content generation', () => {
    it('should format items as bullet list', () => {
      const content = makeStandardsContent({
        typescript: { strictMode: 'true', exports: 'named only' },
      });
      const result = categorizer.categorize(['**/*.ts'], content);
      expect(result).toHaveLength(1);
      expect(result[0]!.content).toContain('- strictMode');
      expect(result[0]!.content).toContain('- exports: named only');
    });

    it('should generate description from section title', () => {
      const content = makeStandardsContent({ typescript: { strictMode: 'true' } });
      const result = categorizer.categorize(['**/*.ts'], content);
      expect(result[0]!.description).toBe('TypeScript-specific rules');
    });
  });

  describe('CATEGORY_GLOB_HINTS', () => {
    it('should be a non-empty record', () => {
      expect(Object.keys(CATEGORY_GLOB_HINTS).length).toBeGreaterThan(50);
    });

    it('should have testing category with pattern-based hints', () => {
      expect(CATEGORY_GLOB_HINTS['testing']).toContain('test');
      expect(CATEGORY_GLOB_HINTS['testing']).toContain('spec');
      expect(CATEGORY_GLOB_HINTS['testing']).toContain('__tests__');
    });
  });
});
