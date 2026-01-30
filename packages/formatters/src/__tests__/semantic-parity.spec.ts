import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github.js';
import { ClaudeFormatter } from '../formatters/claude.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { AntigravityFormatter } from '../formatters/antigravity.js';
import type { Formatter } from '../types.js';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

/**
 * Create an AST with arbitrary @standards keys (not just the traditional 4).
 * This tests that all formatters handle custom keys like security, performance, etc.
 */
function createASTWithArbitraryStandards(): Program {
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc: createLoc(),
    meta: {
      type: 'MetaBlock',
      fields: {
        id: 'test-project',
        syntax: '1.0.0',
      },
      loc: createLoc(),
    },
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: {
          type: 'TextContent',
          value: 'You are a developer.',
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'standards',
        content: {
          type: 'ObjectContent',
          properties: {
            // Traditional keys
            typescript: ['Strict mode enabled', 'No any type'],
            errors: ['Use custom error classes', 'Include location info'],
            // Arbitrary keys (the main test subjects)
            security: ['Validate all inputs', 'Never expose secrets'],
            performance: ['Optimize loops', 'Use lazy loading'],
            accessibility: ['Use semantic HTML', 'Provide alt text'],
            // Non-code keys (should NOT appear in code standards)
            git: {
              format: 'Conventional Commits',
            },
          },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };
}

/**
 * Create an AST with object-format standards (typescript: { strictMode: true }).
 */
function createASTWithObjectStandards(): Program {
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc: createLoc(),
    meta: {
      type: 'MetaBlock',
      fields: {
        id: 'test-project',
        syntax: '1.0.0',
      },
      loc: createLoc(),
    },
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: {
          type: 'TextContent',
          value: 'You are a developer.',
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'standards',
        content: {
          type: 'ObjectContent',
          properties: {
            typescript: {
              strictMode: true,
              exports: 'named',
            },
            naming: {
              files: 'kebab-case',
            },
            testing: {
              framework: 'vitest',
              coverage: 80,
            },
          },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };
}

describe('Semantic Parity: @standards key handling', () => {
  let formatters: Formatter[];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    formatters = [
      new GitHubFormatter(),
      new ClaudeFormatter(),
      new CursorFormatter(),
      new AntigravityFormatter(),
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Arbitrary @standards keys', () => {
    it('all formatters include custom keys like security, performance, accessibility', () => {
      const ast = createASTWithArbitraryStandards();

      for (const formatter of formatters) {
        const result = formatter.format(ast);
        const content = result.content.toLowerCase();

        // Should include custom key content
        expect(
          content.includes('validate all inputs') || content.includes('security'),
          `${formatter.name} should include security standards`
        ).toBe(true);

        expect(
          content.includes('optimize loops') || content.includes('performance'),
          `${formatter.name} should include performance standards`
        ).toBe(true);

        expect(
          content.includes('semantic html') || content.includes('accessibility'),
          `${formatter.name} should include accessibility standards`
        ).toBe(true);
      }
    });

    it('all formatters map errors key to error-handling consistently', () => {
      const ast = createASTWithArbitraryStandards();

      for (const formatter of formatters) {
        const result = formatter.format(ast);
        const content = result.content.toLowerCase();

        // Should include error-related content
        expect(
          content.includes('custom error classes') || content.includes('error'),
          `${formatter.name} should include error handling standards`
        ).toBe(true);
      }
    });

    it('all formatters exclude non-code keys from code standards section', () => {
      const ast = createASTWithArbitraryStandards();

      for (const formatter of formatters) {
        const result = formatter.format(ast);

        // Git standards should not appear mixed with code standards
        // They should either be in their own section or formatted separately
        // Check that 'Conventional Commits' is not in the code style/standards list items
        const codeStyleMatch = result.content.match(/code\s*(style|standards)[\s\S]*?(?=##|$)/i);

        if (codeStyleMatch) {
          const codeStyleSection = codeStyleMatch[0];
          // Git format shouldn't be in code style section as a list item
          // It's OK if it appears elsewhere (like a dedicated Git section)
          expect(
            !codeStyleSection.includes('- Conventional Commits'),
            `${formatter.name} should not mix git standards with code standards`
          ).toBe(true);
        }
      }
    });
  });

  describe('Object format standards', () => {
    it('all formatters handle object format (typescript: { strictMode: true })', () => {
      const ast = createASTWithObjectStandards();

      for (const formatter of formatters) {
        const result = formatter.format(ast);
        const content = result.content.toLowerCase();

        // Should extract meaningful content from object format
        const hasTypeScriptContent =
          content.includes('strict') || content.includes('typescript') || content.includes('any');

        expect(
          hasTypeScriptContent,
          `${formatter.name} should extract TypeScript standards from object format`
        ).toBe(true);
      }
    });

    it('all formatters handle testing object format', () => {
      const ast = createASTWithObjectStandards();

      for (const formatter of formatters) {
        const result = formatter.format(ast);
        const content = result.content.toLowerCase();

        // Should extract testing-related content
        const hasTestingContent =
          content.includes('vitest') || content.includes('coverage') || content.includes('testing');

        expect(
          hasTestingContent,
          `${formatter.name} should extract testing standards from object format`
        ).toBe(true);
      }
    });
  });

  describe('Standards content completeness', () => {
    it('traditional keys (typescript, errors) are preserved', () => {
      const ast = createASTWithArbitraryStandards();

      for (const formatter of formatters) {
        const result = formatter.format(ast);
        const content = result.content.toLowerCase();

        // TypeScript standards
        expect(
          content.includes('strict mode'),
          `${formatter.name} should include TypeScript strict mode`
        ).toBe(true);

        // Error standards
        expect(
          content.includes('custom error') || content.includes('location info'),
          `${formatter.name} should include error standards`
        ).toBe(true);
      }
    });
  });
});
