import { describe, expect, it } from 'vitest';
import type { BlockContent, SourceLocation, Value } from '@promptscript/core';
import {
  StandardsExtractor,
  getSectionTitle,
  normalizeSectionName,
  NON_CODE_KEYS,
  DEFAULT_SECTION_TITLES,
} from '../extractors/index.js';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

describe('Extractors public API', () => {
  describe('exports', () => {
    it('should export StandardsExtractor class', () => {
      expect(StandardsExtractor).toBeDefined();
      expect(typeof StandardsExtractor).toBe('function');
    });

    it('should export utility functions', () => {
      expect(getSectionTitle).toBeDefined();
      expect(normalizeSectionName).toBeDefined();
      expect(typeof getSectionTitle).toBe('function');
      expect(typeof normalizeSectionName).toBe('function');
    });

    it('should export constants', () => {
      expect(NON_CODE_KEYS).toBeDefined();
      expect(DEFAULT_SECTION_TITLES).toBeDefined();
      expect(Array.isArray(NON_CODE_KEYS)).toBe(true);
      expect(typeof DEFAULT_SECTION_TITLES).toBe('object');
    });
  });

  describe('getSectionTitle', () => {
    it('should return known titles for common keys', () => {
      expect(getSectionTitle('typescript')).toBe('TypeScript');
      expect(getSectionTitle('naming')).toBe('Naming Conventions');
      expect(getSectionTitle('errors')).toBe('Error Handling');
      expect(getSectionTitle('testing')).toBe('Testing');
      expect(getSectionTitle('security')).toBe('Security');
      expect(getSectionTitle('performance')).toBe('Performance');
    });

    it('should title-case unknown keys', () => {
      expect(getSectionTitle('custom')).toBe('Custom');
      expect(getSectionTitle('my-key')).toBe('My Key');
      expect(getSectionTitle('my_key')).toBe('My Key');
      expect(getSectionTitle('api-design')).toBe('Api Design');
    });
  });

  describe('normalizeSectionName', () => {
    it('should map errors to error-handling', () => {
      expect(normalizeSectionName('errors')).toBe('error-handling');
    });

    it('should pass through other keys unchanged', () => {
      expect(normalizeSectionName('typescript')).toBe('typescript');
      expect(normalizeSectionName('naming')).toBe('naming');
      expect(normalizeSectionName('security')).toBe('security');
    });
  });

  describe('NON_CODE_KEYS', () => {
    it('should contain git, config, documentation, diagrams', () => {
      expect(NON_CODE_KEYS).toContain('git');
      expect(NON_CODE_KEYS).toContain('config');
      expect(NON_CODE_KEYS).toContain('documentation');
      expect(NON_CODE_KEYS).toContain('diagrams');
    });
  });
});

describe('StandardsExtractor', () => {
  describe('extract', () => {
    it('should extract array format standards', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          typescript: ['Strict mode', 'No any type'],
          security: ['Validate inputs', 'Escape output'],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.size).toBe(2);
      expect(result.codeStandards.get('typescript')?.items).toEqual(['Strict mode', 'No any type']);
      expect(result.codeStandards.get('security')?.items).toEqual([
        'Validate inputs',
        'Escape output',
      ]);
    });

    it('should extract object format standards with boolean values', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          typescript: {
            strictMode: true,
            noAny: true,
            exports: 'named only',
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.size).toBe(1);
      const tsItems = result.codeStandards.get('typescript')?.items;
      expect(tsItems).toContain('strictMode');
      expect(tsItems).toContain('noAny');
      expect(tsItems).toContain('exports: named only');
    });

    it('should exclude non-code keys from codeStandards', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          typescript: ['Strict mode'],
          git: { format: 'Conventional Commits' },
          config: { eslint: 'extend base' },
          documentation: ['Keep docs updated'],
          diagrams: { tool: 'Mermaid' },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.size).toBe(1);
      expect(result.codeStandards.has('typescript')).toBe(true);
      expect(result.codeStandards.has('git')).toBe(false);
      expect(result.codeStandards.has('config')).toBe(false);
      expect(result.codeStandards.has('documentation')).toBe(false);
      expect(result.codeStandards.has('diagrams')).toBe(false);

      // But non-code standards should be extracted separately
      expect(result.git?.format).toBe('Conventional Commits');
      expect(result.config?.eslint).toBe('extend base');
      expect(result.documentation?.items).toEqual(['Keep docs updated']);
      expect(result.diagrams?.format).toBe('Mermaid');
    });

    it('should handle legacy code format with style and patterns', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          code: {
            style: ['Use consistent formatting'],
            patterns: ['Prefer composition over inheritance'],
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.size).toBe(1);
      expect(result.codeStandards.get('code')?.items).toEqual([
        'Use consistent formatting',
        'Prefer composition over inheritance',
      ]);
    });

    it('should handle code key as array (non-legacy)', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          code: ['Use functional programming', 'Prefer hooks'],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.size).toBe(1);
      expect(result.codeStandards.get('code')?.items).toEqual([
        'Use functional programming',
        'Prefer hooks',
      ]);
    });

    it('should normalize errors key to error-handling in sectionName', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          errors: ['Use custom error classes'],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('errors')?.sectionName).toBe('error-handling');
      expect(result.codeStandards.get('errors')?.key).toBe('errors');
    });

    it('should extract diagrams with both tool and types', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          diagrams: {
            tool: 'Mermaid',
            types: ['flowchart', 'sequence', 'class'],
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.diagrams?.format).toBe('Mermaid');
      expect(result.diagrams?.types).toEqual(['flowchart', 'sequence', 'class']);
    });

    it('should handle documentation in object format', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          documentation: {
            verifyBefore: true,
            verifyAfter: 'update docs if needed',
            codeExamples: 'keep accurate',
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.documentation?.items).toContain('verifyBefore');
      expect(result.documentation?.items).toContain('verifyAfter: update docs if needed');
      expect(result.documentation?.items).toContain('codeExamples: keep accurate');
    });

    it('should return empty codeStandards for non-object content', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'TextContent',
        value: 'Some text',
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.size).toBe(0);
    });

    it('should handle MixedContent', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'MixedContent',
        properties: {
          typescript: ['Strict mode'],
        },
        text: {
          type: 'TextContent',
          value: 'Some additional text',
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.size).toBe(1);
      expect(result.codeStandards.get('typescript')?.items).toEqual(['Strict mode']);
    });
  });

  describe('extractFromProgram', () => {
    it('should return null when no standards block exists', () => {
      const extractor = new StandardsExtractor();
      const ast = {
        type: 'Program' as const,
        uses: [],
        extends: [],
        loc: createLoc(),
        blocks: [],
      };

      const result = extractor.extractFromProgram(ast);

      expect(result).toBeNull();
    });

    it('should extract from standards block in program', () => {
      const extractor = new StandardsExtractor();
      const ast = {
        type: 'Program' as const,
        uses: [],
        extends: [],
        loc: createLoc(),
        blocks: [
          {
            type: 'Block' as const,
            name: 'standards',
            content: {
              type: 'ObjectContent' as const,
              properties: {
                typescript: ['Strict mode'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = extractor.extractFromProgram(ast);

      expect(result).not.toBeNull();
      expect(result?.codeStandards.get('typescript')?.items).toEqual(['Strict mode']);
    });
  });

  describe('options', () => {
    it('should skip legacy format when supportLegacyFormat is false', () => {
      const extractor = new StandardsExtractor({ supportLegacyFormat: false });
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          code: {
            style: ['Use consistent formatting'],
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      // With legacy disabled, code object should be treated as regular object format
      expect(result.codeStandards.get('code')?.items).toEqual(['style: Use consistent formatting']);
    });

    it('should skip object format when supportObjectFormat is false', () => {
      const extractor = new StandardsExtractor({ supportObjectFormat: false });
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          typescript: {
            strictMode: true,
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      // With object format disabled, object values are not extracted
      expect(result.codeStandards.size).toBe(0);
    });
  });

  describe('edge cases and value handling', () => {
    it('should skip null, undefined, and false values in object format', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          typescript: {
            strictMode: true,
            deprecatedFeature: false,
            nullValue: null,
            undefinedValue: undefined,
            validString: 'use named exports',
          } as unknown as Value,
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      const items = result.codeStandards.get('typescript')?.items;
      expect(items).toContain('strictMode');
      expect(items).toContain('validString: use named exports');
      expect(items).not.toContain('deprecatedFeature');
      expect(items).not.toContain('nullValue');
      expect(items).not.toContain('undefinedValue');
      expect(items?.length).toBe(2);
    });

    it('should extract string format standards', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          typescript: 'Use strict mode everywhere',
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('typescript')?.items).toEqual(['Use strict mode everywhere']);
    });

    it('should handle empty string values', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          typescript: '   ',
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.has('typescript')).toBe(false);
    });

    it('should handle numeric values in arrays', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          limits: [100, 'max connections', true],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('limits')?.items).toEqual(['100', 'max connections', 'true']);
    });

    it('should return null for entry with empty items after filtering', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          empty: [],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.has('empty')).toBe(false);
    });
  });

  describe('git extraction', () => {
    it('should extract git with example field', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          git: {
            format: 'Conventional Commits',
            types: ['feat', 'fix', 'docs'],
            example: 'feat(parser): add multiline support',
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.git?.format).toBe('Conventional Commits');
      expect(result.git?.types).toEqual(['feat', 'fix', 'docs']);
      expect(result.git?.example).toBe('feat(parser): add multiline support');
    });

    it('should return undefined for empty git object', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          git: {},
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.git).toBeUndefined();
    });

    it('should return undefined for non-object git', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          git: ['not an object'],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.git).toBeUndefined();
    });
  });

  describe('config extraction', () => {
    it('should return undefined for empty config object', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          config: {},
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.config).toBeUndefined();
    });

    it('should return undefined for non-object config', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          config: ['not an object'],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.config).toBeUndefined();
    });
  });

  describe('documentation extraction', () => {
    it('should handle documentation as string', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          documentation: 'Keep all docs up to date',
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.documentation?.items).toEqual(['Keep all docs up to date']);
    });

    it('should return undefined for empty documentation string', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          documentation: '   ',
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.documentation).toBeUndefined();
    });

    it('should return undefined for empty documentation array', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          documentation: [],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.documentation).toBeUndefined();
    });
  });

  describe('diagrams extraction', () => {
    it('should prefer format over tool', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          diagrams: {
            format: 'PlantUML',
            tool: 'Mermaid',
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.diagrams?.format).toBe('PlantUML');
    });

    it('should extract diagrams with only types', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          diagrams: {
            types: ['flowchart', 'sequence'],
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.diagrams?.format).toBeUndefined();
      expect(result.diagrams?.types).toEqual(['flowchart', 'sequence']);
    });

    it('should return undefined for empty diagrams object', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          diagrams: {},
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.diagrams).toBeUndefined();
    });

    it('should return undefined for non-object diagrams', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          diagrams: ['not an object'],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.diagrams).toBeUndefined();
    });
  });

  describe('valueToString edge cases', () => {
    it('should handle TextContent type', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          typescript: [
            {
              type: 'TextContent',
              value: '  Strict mode enabled  ',
              loc: createLoc(),
            },
          ],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('typescript')?.items).toEqual(['Strict mode enabled']);
    });

    it('should handle TypeExpression with params', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          validation: [
            {
              type: 'TypeExpression',
              kind: 'range',
              params: [1, 100],
            },
          ],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('validation')?.items).toEqual(['range(1, 100)']);
    });

    it('should handle TypeExpression without params', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          types: [
            {
              type: 'TypeExpression',
              kind: 'any',
            },
          ],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('types')?.items).toEqual(['any']);
    });

    it('should handle plain objects as values', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          nested: [{ key1: 'value1', key2: 'value2' }],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('nested')?.items).toEqual(['key1: value1, key2: value2']);
    });

    it('should handle empty plain objects', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          emptyObj: [{}],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      // Empty object converts to empty string, which is filtered out
      expect(result.codeStandards.has('emptyObj')).toBe(false);
    });

    it('should handle arrays in valueToString', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          typescript: {
            allowedTypes: ['string', 'number', 'boolean'],
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('typescript')?.items).toContain(
        'allowedTypes: string, number, boolean'
      );
    });
  });

  describe('legacy format edge cases', () => {
    it('should handle legacy code with only style', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          code: {
            style: ['Consistent formatting'],
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('code')?.items).toEqual(['Consistent formatting']);
    });

    it('should handle legacy code with only patterns', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          code: {
            patterns: ['Composition over inheritance'],
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      expect(result.codeStandards.get('code')?.items).toEqual(['Composition over inheritance']);
    });

    it('should handle code object without style or patterns as regular object', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          code: {
            quality: true,
            coverage: '80%',
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      // Without style/patterns, treated as regular object format
      const items = result.codeStandards.get('code')?.items;
      expect(items).toContain('quality');
      expect(items).toContain('coverage: 80%');
    });
  });

  describe('extractFromProgram edge cases', () => {
    it('should skip blocks starting with __', () => {
      const extractor = new StandardsExtractor();
      const ast = {
        type: 'Program' as const,
        uses: [],
        extends: [],
        loc: createLoc(),
        blocks: [
          {
            type: 'Block' as const,
            name: '__standards',
            content: {
              type: 'ObjectContent' as const,
              properties: {
                typescript: ['Should be ignored'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = extractor.extractFromProgram(ast);

      expect(result).toBeNull();
    });
  });

  describe('addArrayItems edge cases', () => {
    it('should filter out empty strings and null from array items', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          code: {
            style: ['Valid item', '', null, 'Another valid'],
          },
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      // Empty string and null are filtered (valueToString returns '' for both)
      expect(result.codeStandards.get('code')?.items).toEqual(['Valid item', 'Another valid']);
    });
  });

  describe('valueToString null/undefined handling', () => {
    it('should return empty string for null values', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          test: [null],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      // Null converts to empty string, which is filtered out
      expect(result.codeStandards.has('test')).toBe(false);
    });

    it('should return empty string for undefined values', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          test: [undefined] as unknown as Value,
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      // Undefined converts to empty string, which is filtered out
      expect(result.codeStandards.has('test')).toBe(false);
    });

    it('should handle object with type that is not TextContent or TypeExpression', () => {
      const extractor = new StandardsExtractor();
      const content: BlockContent = {
        type: 'ObjectContent',
        properties: {
          test: [
            {
              type: 'SomeOtherType',
              someValue: 'test',
            },
          ],
        },
        loc: createLoc(),
      };

      const result = extractor.extract(content);

      // Unknown type with 'type' property should fall through to plain object handling
      expect(result.codeStandards.get('test')?.items).toEqual([
        'type: SomeOtherType, someValue: test',
      ]);
    });
  });
});
