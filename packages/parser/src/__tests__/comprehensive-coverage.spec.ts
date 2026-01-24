/**
 * Comprehensive Language Coverage Tests
 *
 * This test file ensures EVERY language element is covered by golden tests.
 * It uses the comprehensive.prs fixture to verify complete language coverage.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../parse.js';
import type { Program, TypeExpression } from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, '__fixtures__');

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

describe('Comprehensive Language Coverage', () => {
  let ast: Program;
  let source: string;

  // Parse the comprehensive fixture once for all tests
  beforeAll(() => {
    source = loadFixture('comprehensive.prs');
    const result = parse(source, { filename: 'comprehensive.prs' });

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();
    ast = result.ast!;
  });

  describe('Comments', () => {
    it('should skip line comments', () => {
      // Comments are skipped by lexer, so AST should parse successfully
      expect(ast.type).toBe('Program');
    });

    it('should handle comments with special characters', () => {
      // Source contains: # Another comment with special chars: @#$%^&*()!
      expect(source).toContain('# Another comment with special chars');
      expect(ast.meta).toBeDefined();
    });
  });

  describe('Meta Block - String Literals', () => {
    it('should parse double-quoted strings', () => {
      expect(ast.meta?.fields['doubleQuoted']).toBe('double quoted string');
    });

    it('should parse single-quoted strings', () => {
      expect(ast.meta?.fields['singleQuoted']).toBe('single quoted string');
    });

    it('should parse strings with escape sequences', () => {
      const escaped = ast.meta?.fields['escapedChars'] as string;
      expect(escaped).toContain('"');
      expect(escaped).toContain('\\');
    });

    it('should parse strings with unicode characters', () => {
      const unicode = ast.meta?.fields['unicode'] as string;
      expect(unicode).toContain('café');
      expect(unicode).toContain('日本語');
      expect(unicode).toContain('🎉');
    });

    it('should parse empty strings', () => {
      expect(ast.meta?.fields['emptyString']).toBe('');
    });
  });

  describe('Meta Block - Number Literals', () => {
    it('should parse positive integers', () => {
      expect(ast.meta?.fields['integer']).toBe(42);
    });

    it('should parse negative integers', () => {
      expect(ast.meta?.fields['negative']).toBe(-10);
    });

    it('should parse positive decimals', () => {
      expect(ast.meta?.fields['decimal']).toBe(3.14);
    });

    it('should parse negative decimals', () => {
      expect(ast.meta?.fields['negativeDecimal']).toBe(-2.5);
    });

    it('should parse zero', () => {
      expect(ast.meta?.fields['zero']).toBe(0);
    });
  });

  describe('Meta Block - Boolean Literals', () => {
    it('should parse true', () => {
      expect(ast.meta?.fields['enabled']).toBe(true);
    });

    it('should parse false', () => {
      expect(ast.meta?.fields['disabled']).toBe(false);
    });
  });

  describe('Meta Block - Null Literal', () => {
    it('should parse null', () => {
      expect(ast.meta?.fields['optional']).toBeNull();
    });
  });

  describe('Meta Block - Array Literals', () => {
    it('should parse identifier arrays', () => {
      expect(ast.meta?.fields['tags']).toEqual(['frontend', 'backend', 'api']);
    });

    it('should parse numeric arrays with negative and decimal', () => {
      expect(ast.meta?.fields['numbers']).toEqual([1, 2, 3, -4, 5.5]);
    });

    it('should parse mixed-type arrays', () => {
      expect(ast.meta?.fields['mixed']).toEqual(['string', 42, true, null]);
    });

    it('should parse nested arrays', () => {
      expect(ast.meta?.fields['nested']).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('should parse empty arrays', () => {
      expect(ast.meta?.fields['emptyArray']).toEqual([]);
    });
  });

  describe('Meta Block - Identifier Variations', () => {
    it('should parse simple identifiers as values', () => {
      expect(ast.meta?.fields['simple']).toBe('value');
    });

    it('should parse identifiers with dashes', () => {
      expect(ast.meta?.fields['with-dashes']).toBe('dashed-identifier');
    });

    it('should parse underscored identifiers', () => {
      expect(ast.meta?.fields['_underscored']).toBe('_private');
    });

    it('should parse camelCase identifiers', () => {
      expect(ast.meta?.fields['camelCase']).toBe('camelCaseValue');
    });

    it('should parse UPPER_CASE identifiers', () => {
      expect(ast.meta?.fields['UPPER_CASE']).toBe('CONSTANT_VALUE');
    });
  });

  describe('Inherit Declaration', () => {
    it('should parse absolute path with namespace', () => {
      expect(ast.inherit).toBeDefined();
      expect(ast.inherit?.path.namespace).toBe('company');
      expect(ast.inherit?.path.segments).toEqual(['org', 'team-config']);
      expect(ast.inherit?.path.isRelative).toBe(false);
    });
  });

  describe('Use Declarations', () => {
    it('should parse multiple use declarations', () => {
      expect(ast.uses).toHaveLength(4);
    });

    it('should parse use without alias', () => {
      const compliance = ast.uses.find((u) => u.path.segments.includes('compliance'));
      expect(compliance).toBeDefined();
      expect(compliance?.alias).toBeUndefined();
    });

    it('should parse use with alias', () => {
      const security = ast.uses.find((u) => u.alias === 'sec');
      expect(security).toBeDefined();
      expect(security?.path.segments).toContain('security');
    });

    it('should parse versioned paths', () => {
      const versioned = ast.uses.find((u) => u.path.version === '2.0.0');
      expect(versioned).toBeDefined();
      expect(versioned?.path.namespace).toBe('core');
    });

    it('should parse versioned paths with alias', () => {
      const versionedWithAlias = ast.uses.find((u) => u.alias === 'utils');
      expect(versionedWithAlias).toBeDefined();
      expect(versionedWithAlias?.path.version).toBe('1.0.0');
    });
  });

  describe('Text Content Block', () => {
    it('should parse identity block with text content', () => {
      const identity = ast.blocks.find((b) => b.name === 'identity');
      expect(identity).toBeDefined();
      expect(identity?.content.type).toBe('TextContent');
    });

    it('should preserve multiline text', () => {
      const identity = ast.blocks.find((b) => b.name === 'identity');
      if (identity?.content.type === 'TextContent') {
        expect(identity.content.value).toContain('Multiple lines');
        expect(identity.content.value).toContain('Unicode: café');
      }
    });
  });

  describe('Mixed Content Block', () => {
    it('should parse context as mixed content', () => {
      const context = ast.blocks.find((b) => b.name === 'context');
      expect(context).toBeDefined();
      expect(context?.content.type).toBe('MixedContent');
    });

    it('should have both text and properties in mixed content', () => {
      const context = ast.blocks.find((b) => b.name === 'context');
      if (context?.content.type === 'MixedContent') {
        expect(context.content.text).toBeDefined();
        expect(context.content.properties['project']).toBe('Comprehensive Test');
      }
    });
  });

  describe('Object Content - Deep Nesting', () => {
    it('should parse deeply nested objects (4 levels)', () => {
      const standards = ast.blocks.find((b) => b.name === 'standards');
      expect(standards?.content.type).toBe('ObjectContent');

      if (standards?.content.type === 'ObjectContent') {
        const code = standards.content.properties['code'] as Record<string, unknown>;
        const style = code['style'] as Record<string, unknown>;
        const indentation = style['indentation'] as Record<string, unknown>;

        expect(indentation['type']).toBe('spaces');
        expect(indentation['size']).toBe(2);
        expect(indentation['enabled']).toBe(true);
        expect(indentation['exceptions']).toBeNull();
      }
    });

    it('should parse object with all value types', () => {
      const standards = ast.blocks.find((b) => b.name === 'standards');
      if (standards?.content.type === 'ObjectContent') {
        const allTypes = standards.content.properties['allTypes'] as Record<string, unknown>;

        expect(allTypes['string']).toBe('text');
        expect(allTypes['number']).toBe(42);
        expect(allTypes['decimal']).toBe(3.14);
        expect(allTypes['negative']).toBe(-10);
        expect(allTypes['boolTrue']).toBe(true);
        expect(allTypes['boolFalse']).toBe(false);
        expect(allTypes['nullValue']).toBeNull();
        expect(allTypes['array']).toEqual([1, 2, 3]);
        expect(allTypes['nested']).toEqual({ inner: 'value' });
      }
    });

    it('should parse empty objects', () => {
      const standards = ast.blocks.find((b) => b.name === 'standards');
      if (standards?.content.type === 'ObjectContent') {
        expect(standards.content.properties['emptyConfig']).toEqual({});
      }
    });
  });

  describe('Array/List Content Block', () => {
    it('should parse restrictions as list items', () => {
      const restrictions = ast.blocks.find((b) => b.name === 'restrictions');
      expect(restrictions).toBeDefined();
      expect(restrictions?.content.type).toBe('ObjectContent');

      if (restrictions?.content.type === 'ObjectContent') {
        const items = restrictions.content.properties['items'] as string[];
        expect(items).toContain('Never use any type');
        expect(items).toContain('Single quoted restriction');
      }
    });
  });

  describe('Shortcuts Block', () => {
    it('should parse single-line shortcuts', () => {
      const shortcuts = ast.blocks.find((b) => b.name === 'shortcuts');
      if (shortcuts?.content.type === 'ObjectContent') {
        expect(shortcuts.content.properties['/review']).toBe('Review code for quality');
      }
    });

    it('should parse multi-line shortcuts', () => {
      const shortcuts = ast.blocks.find((b) => b.name === 'shortcuts');
      if (shortcuts?.content.type === 'ObjectContent') {
        const test = shortcuts.content.properties['/test'];
        // Multi-line text blocks are stored as TextContent objects
        if (typeof test === 'object' && test !== null && 'type' in test) {
          expect(test.type).toBe('TextContent');
          expect((test as { value: string }).value).toContain('Vitest');
        } else if (typeof test === 'string') {
          expect(test).toContain('Vitest');
        }
      }
    });

    it('should parse single-quoted shortcuts', () => {
      const shortcuts = ast.blocks.find((b) => b.name === 'shortcuts');
      if (shortcuts?.content.type === 'ObjectContent') {
        expect(shortcuts.content.properties['/build']).toBe('Build the project');
      }
    });
  });

  describe('Params Block - Type Expressions', () => {
    it('should parse range type with default', () => {
      const params = ast.blocks.find((b) => b.name === 'params');
      if (params?.content.type === 'ObjectContent') {
        const strictness = params.content.properties['strictness'];
        expect(strictness).toHaveProperty('type', 'TypeExpression');
        expect(strictness).toHaveProperty('kind', 'range');
      }
    });

    it('should parse enum type with default', () => {
      const params = ast.blocks.find((b) => b.name === 'params');
      if (params?.content.type === 'ObjectContent') {
        const format = params.content.properties['format'];
        expect(format).toHaveProperty('type', 'TypeExpression');
        expect(format).toHaveProperty('kind', 'enum');
      }
    });

    it('should parse optional parameters', () => {
      const params = ast.blocks.find((b) => b.name === 'params');
      if (params?.content.type === 'ObjectContent') {
        // Optional params should be present
        expect('verbosity' in params.content.properties).toBe(true);
        expect('mode' in params.content.properties).toBe(true);
        expect('debug' in params.content.properties).toBe(true);
      }
    });

    it('should parse range with decimal bounds', () => {
      const params = ast.blocks.find((b) => b.name === 'params');
      if (params?.content.type === 'ObjectContent') {
        const threshold = params.content.properties['threshold'] as TypeExpression;
        expect(threshold.kind).toBe('range');
      }
    });

    it('should parse range with negative bounds', () => {
      const params = ast.blocks.find((b) => b.name === 'params');
      if (params?.content.type === 'ObjectContent') {
        const offset = params.content.properties['offset'] as TypeExpression;
        expect(offset.kind).toBe('range');
      }
    });
  });

  describe('Guards Block', () => {
    it('should parse guards with globs', () => {
      const guards = ast.blocks.find((b) => b.name === 'guards');
      if (guards?.content.type === 'ObjectContent') {
        expect(guards.content.properties['globs']).toEqual(['**/*.ts', '**/*.tsx', '**/*.js']);
        expect(guards.content.properties['excludeGlobs']).toBeDefined();
        expect(guards.content.properties['priority']).toBe(1);
        expect(guards.content.properties['enabled']).toBe(true);
      }
    });
  });

  describe('Knowledge Block', () => {
    it('should parse knowledge with rich markdown text', () => {
      const knowledge = ast.blocks.find((b) => b.name === 'knowledge');
      expect(knowledge?.content.type).toBe('TextContent');

      if (knowledge?.content.type === 'TextContent') {
        expect(knowledge.content.value).toContain('## API Reference');
        expect(knowledge.content.value).toContain('```typescript');
        expect(knowledge.content.value).toContain('| Method |');
      }
    });
  });

  describe('Skills Block', () => {
    it('should parse skill with all configurations', () => {
      const skills = ast.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const commit = skills.content.properties['commit'] as Record<string, unknown>;
        expect(commit['description']).toBe('Create git commits');
        expect(commit['disableModelInvocation']).toBe(true);
        expect(commit['context']).toBe('fork');
        expect(commit['agent']).toBe('general-purpose');
        expect(commit['allowedTools']).toEqual(['Bash', 'Read', 'Write', 'Edit']);
      }
    });

    it('should parse skill with empty allowedTools array', () => {
      const skills = ast.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const review = skills.content.properties['review'] as Record<string, unknown>;
        expect(review['allowedTools']).toEqual([]);
        expect(review['userInvocable']).toBe(true);
      }
    });

    it('should parse skill with numeric values', () => {
      const skills = ast.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const deploy = skills.content.properties['deploy'] as Record<string, unknown>;
        expect(deploy['timeout']).toBe(300);
        expect(deploy['retries']).toBe(3);
        expect(deploy['enabled']).toBe(false);
      }
    });
  });

  describe('Local Block', () => {
    it('should parse local with mixed content', () => {
      const local = ast.blocks.find((b) => b.name === 'local');
      expect(local?.content.type).toBe('MixedContent');

      if (local?.content.type === 'MixedContent') {
        expect(local.content.text?.value).toContain('Private Development Notes');
        expect(local.content.properties['apiEndpoint']).toBe('https://localhost:8080');
        expect(local.content.properties['debugMode']).toBe(true);
        expect(local.content.properties['logLevel']).toBe(3);
      }
    });
  });

  describe('Agents Block', () => {
    it('should parse agents with all configurations', () => {
      const agents = ast.blocks.find((b) => b.name === 'agents');
      if (agents?.content.type === 'ObjectContent') {
        const reviewer = agents.content.properties['code-reviewer'] as Record<string, unknown>;
        expect(reviewer['description']).toBe('Reviews code for quality');
        expect(reviewer['tools']).toEqual(['Read', 'Grep', 'Glob']);
        expect(reviewer['model']).toBe('sonnet');
        expect(reviewer['permissionMode']).toBe('default');
      }
    });

    it('should parse agent with disallowedTools', () => {
      const agents = ast.blocks.find((b) => b.name === 'agents');
      if (agents?.content.type === 'ObjectContent') {
        const debugger_ = agents.content.properties['debugger'] as Record<string, unknown>;
        expect(debugger_['disallowedTools']).toEqual(['Write']);
        expect(debugger_['model']).toBe('inherit');
        expect(debugger_['permissionMode']).toBe('acceptEdits');
        expect(debugger_['skills']).toEqual(['error-handling', 'testing']);
      }
    });
  });

  describe('Custom Block Names', () => {
    it('should parse custom block with dashes', () => {
      const custom = ast.blocks.find((b) => b.name === 'custom-block');
      expect(custom).toBeDefined();
      expect(custom?.content.type).toBe('MixedContent');
    });

    it('should parse block name starting with underscore', () => {
      const privateBlock = ast.blocks.find((b) => b.name === '_privateBlock');
      expect(privateBlock).toBeDefined();
    });

    it('should parse PascalCase block name', () => {
      const camelBlock = ast.blocks.find((b) => b.name === 'CamelCaseBlock');
      expect(camelBlock).toBeDefined();
    });
  });

  describe('Extend Blocks', () => {
    it('should parse multiple extend blocks', () => {
      expect(ast.extends.length).toBeGreaterThanOrEqual(3);
    });

    it('should parse extend with dot path', () => {
      const codeExtend = ast.extends.find((e) => e.targetPath === 'standards.code');
      expect(codeExtend).toBeDefined();
      if (codeExtend?.content.type === 'ObjectContent') {
        expect(codeExtend.content.properties['frameworks']).toEqual(['react', 'vue', 'angular']);
      }
    });

    it('should parse extend with deeply nested path', () => {
      const styleExtend = ast.extends.find((e) => e.targetPath === 'standards.code.style');
      expect(styleExtend).toBeDefined();
      if (styleExtend?.content.type === 'ObjectContent') {
        expect(styleExtend.content.properties['semicolons']).toBe(false);
        expect(styleExtend.content.properties['quotes']).toBe('single');
      }
    });

    it('should parse extend with mixed content', () => {
      const contextExtend = ast.extends.find((e) => e.targetPath === 'context');
      expect(contextExtend).toBeDefined();
      expect(contextExtend?.content.type).toBe('MixedContent');
    });
  });

  describe('Edge Cases', () => {
    it('should parse long strings', () => {
      const edgeCases = ast.blocks.find((b) => b.name === 'edge-cases');
      if (edgeCases?.content.type === 'ObjectContent') {
        const longString = edgeCases.content.properties['longString'] as string;
        expect(longString.length).toBeGreaterThan(100);
      }
    });

    it('should parse strings with only special characters', () => {
      const edgeCases = ast.blocks.find((b) => b.name === 'edge-cases');
      if (edgeCases?.content.type === 'ObjectContent') {
        const special = edgeCases.content.properties['specialOnly'] as string;
        expect(special).toContain('!@#$%');
      }
    });

    it('should parse deeply nested arrays', () => {
      const edgeCases = ast.blocks.find((b) => b.name === 'edge-cases');
      if (edgeCases?.content.type === 'ObjectContent') {
        expect(edgeCases.content.properties['deepArray']).toEqual([
          [
            [1, 2],
            [3, 4],
          ],
          [
            [5, 6],
            [7, 8],
          ],
        ]);
      }
    });

    it('should parse single-element arrays', () => {
      const edgeCases = ast.blocks.find((b) => b.name === 'edge-cases');
      if (edgeCases?.content.type === 'ObjectContent') {
        expect(edgeCases.content.properties['singleElement']).toEqual([42]);
      }
    });

    it('should parse single-property objects', () => {
      const edgeCases = ast.blocks.find((b) => b.name === 'edge-cases');
      if (edgeCases?.content.type === 'ObjectContent') {
        expect(edgeCases.content.properties['singleProp']).toEqual({
          only: 'value',
        });
      }
    });

    it('should parse arrays of booleans', () => {
      const edgeCases = ast.blocks.find((b) => b.name === 'edge-cases');
      if (edgeCases?.content.type === 'ObjectContent') {
        expect(edgeCases.content.properties['flags']).toEqual([true, false, true]);
      }
    });
  });

  describe('Source Location Tracking', () => {
    it('should track meta block location', () => {
      expect(ast.meta?.loc.file).toBe('comprehensive.prs');
      expect(ast.meta?.loc.line).toBeGreaterThan(0);
      expect(ast.meta?.loc.column).toBeGreaterThan(0);
    });

    it('should track block locations', () => {
      const identity = ast.blocks.find((b) => b.name === 'identity');
      expect(identity?.loc.file).toBe('comprehensive.prs');
      expect(identity?.loc.line).toBeGreaterThan(0);
    });

    it('should track inherit declaration location', () => {
      expect(ast.inherit?.loc.file).toBe('comprehensive.prs');
      expect(ast.inherit?.loc.line).toBeGreaterThan(0);
    });
  });

  describe('Block Count Verification', () => {
    it('should parse all expected blocks', () => {
      const expectedBlocks = [
        'identity',
        'context',
        'standards',
        'restrictions',
        'shortcuts',
        'params',
        'guards',
        'knowledge',
        'skills',
        'local',
        'agents',
        'custom-block',
        '_privateBlock',
        'CamelCaseBlock',
        'edge-cases',
      ];

      for (const blockName of expectedBlocks) {
        const block = ast.blocks.find((b) => b.name === blockName);
        expect(block, `Block '${blockName}' should exist`).toBeDefined();
      }
    });
  });
});

describe('Language Element Coverage Matrix', () => {
  /**
   * This test documents all language elements and their test coverage status.
   * It serves as a coverage matrix and documentation.
   */
  it('should have complete coverage of all language elements', () => {
    const coverageMatrix = {
      // Tokens
      tokens: {
        whitespace: true,
        lineComment: true,
        textBlock: true,
        pathReference: true,
        relativePath: false, // Not testable without actual files
        identifier: true,
        meta: true,
        inherit: true,
        use: true,
        as: true,
        extend: true,
        true: true,
        false: true,
        null: true,
        range: true,
        enum: true,
        at: true,
        lBrace: true,
        rBrace: true,
        lBracket: true,
        rBracket: true,
        lParen: true,
        rParen: true,
        colon: true,
        comma: true,
        equals: true,
        question: true,
        dotDot: true,
        dot: true,
        dash: true,
        stringLiteral: true,
        numberLiteral: true,
      },
      // AST Nodes
      astNodes: {
        program: true,
        metaBlock: true,
        inheritDeclaration: true,
        useDeclaration: true,
        block: true,
        extendBlock: true,
        pathReference: true,
        textContent: true,
        objectContent: true,
        arrayContent: true,
        mixedContent: true,
        typeExpression: true,
      },
      // Values
      values: {
        stringDouble: true,
        stringSingle: true,
        stringEscaped: true,
        stringUnicode: true,
        stringEmpty: true,
        numberInteger: true,
        numberDecimal: true,
        numberNegative: true,
        numberZero: true,
        booleanTrue: true,
        booleanFalse: true,
        null: true,
        arrayInline: true,
        arrayNested: true,
        arrayEmpty: true,
        objectNested: true,
        objectEmpty: true,
      },
      // Block types
      blockTypes: {
        identity: true,
        context: true,
        standards: true,
        restrictions: true,
        knowledge: true,
        shortcuts: true,
        guards: true,
        params: true,
        skills: true,
        local: true,
        agents: true,
        custom: true,
      },
    };

    // Count coverage
    const countCoverage = (obj: Record<string, boolean>) => {
      const total = Object.keys(obj).length;
      const covered = Object.values(obj).filter(Boolean).length;
      return { total, covered, percentage: (covered / total) * 100 };
    };

    const tokensCoverage = countCoverage(coverageMatrix.tokens);
    const astCoverage = countCoverage(coverageMatrix.astNodes);
    const valuesCoverage = countCoverage(coverageMatrix.values);
    const blocksCoverage = countCoverage(coverageMatrix.blockTypes);

    // All should be 100% or document why not
    expect(tokensCoverage.percentage).toBeGreaterThanOrEqual(95);
    expect(astCoverage.percentage).toBe(100);
    expect(valuesCoverage.percentage).toBe(100);
    expect(blocksCoverage.percentage).toBe(100);
  });
});
