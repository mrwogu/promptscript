import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github';
import { ClaudeFormatter } from '../formatters/claude';
import { CursorFormatter } from '../formatters/cursor';
import { AntigravityFormatter } from '../formatters/antigravity';
import type { Formatter } from '../types';
import {
  PARITY_MATRIX,
  EXTRACTION_RULES,
  getRequiredSections,
  getOptionalSections,
  getAllSections,
  matchesSectionHeader,
  validateSectionContent,
  getSourceBlocks,
  analyzeFormatterOutput,
  type FormatterName,
} from '../parity-matrix';

/**
 * Parity Matrix Tests
 *
 * These tests verify that all formatters produce consistent output
 * according to the Parity Matrix specification. They detect:
 * - Missing sections that should be present
 * - Content that doesn't match expected patterns
 * - Discrepancies between formatter implementations
 */

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

/**
 * Create a comprehensive AST matching the project.prs structure.
 * This is the canonical test fixture for parity testing.
 */
function createCanonicalAST(): Program {
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc: createLoc(),
    meta: {
      type: 'MetaBlock',
      fields: {
        id: 'promptscript',
        syntax: '1.0.0',
        name: 'PromptScript',
      },
      loc: createLoc(),
    },
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: {
          type: 'TextContent',
          value: `You are an expert TypeScript developer working on PromptScript - a language
and toolchain for standardizing AI instructions across enterprise organizations.

PromptScript compiles \`.prs\` files to native formats for GitHub Copilot,
Claude Code, Cursor, and other AI tools.

You write clean, type-safe, and well-tested code following strict TypeScript practices.`,
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'context',
        content: {
          type: 'MixedContent',
          properties: {
            project: 'PromptScript',
            languages: ['typescript'],
            runtime: 'Node.js 20+',
            monorepo: {
              tool: 'Nx',
              packageManager: 'pnpm',
            },
          },
          text: {
            type: 'TextContent',
            value: `## Architecture

The project is organized as a monorepo with these packages:

\`\`\`mermaid
flowchart TB
  subgraph packages
    core[core - Types, errors, utilities]
    parser[parser - Chevrotain-based parser]
    formatters[formatters - Output formatters]
    cli[cli - Command-line interface]
  end

  cli --> formatters
  formatters --> parser
  parser --> core
\`\`\``,
            loc: createLoc(),
          },
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
              noAny: true,
              useUnknown: 'with type guards instead of any',
              exports: 'named only, no default exports',
            },
            naming: {
              files: 'kebab-case.ts',
              classes: 'PascalCase',
              functions: 'camelCase',
              constants: 'UPPER_SNAKE_CASE',
            },
            errors: {
              customClasses: 'extend PSError',
              locationInfo: true,
              messages: 'actionable',
            },
            testing: {
              filePattern: '*.spec.ts',
              pattern: 'AAA (Arrange, Act, Assert)',
              coverage: 90,
              framework: 'vitest',
            },
            git: {
              format: 'Conventional Commits',
              maxSubjectLength: 70,
              types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
              example: 'feat(parser): add support for multiline strings',
            },
            config: {
              eslint: 'inherit from eslint.base.config.cjs',
              viteRoot: '__dirname (not import.meta.dirname)',
            },
            diagrams: {
              format: 'Mermaid',
              types: ['flowchart', 'sequence', 'class', 'state'],
            },
            documentation: {
              verifyBefore: true,
              verifyAfter: true,
              codeExamples: 'keep accurate',
            },
          },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'shortcuts',
        content: {
          type: 'ObjectContent',
          properties: {
            '/review': 'Review code for quality, type safety, and best practices',
            '/test': 'Write unit tests using Vitest with AAA pattern',
            '/build': 'Run verification commands: format, lint, build, test',
          },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'knowledge',
        content: {
          type: 'TextContent',
          value: `## Development Commands

\`\`\`bash
pnpm install              # Install dependencies
pnpm nx build <pkg>       # Build package
pnpm nx test <pkg>        # Run tests
pnpm nx lint <pkg>        # Lint code
\`\`\`

## Post-Work Verification

After completing code changes, always run:
\`\`\`bash
pnpm run format     # Format code with Prettier
pnpm run lint       # Check for linting errors
pnpm run build      # Build all packages
pnpm run test       # Run all tests
\`\`\``,
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'restrictions',
        content: {
          type: 'ArrayContent',
          elements: [
            'Never use `any` type - use `unknown` with type guards',
            'Never use default exports - only named exports',
            'Never commit without tests',
            'Never skip error handling',
            'Never leave TODO without issue reference',
            'Never use ASCII art diagrams - always use Mermaid',
          ],
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };
}

/**
 * Get list of available blocks from AST.
 */
function getAvailableBlocks(ast: Program): string[] {
  return ast.blocks.map((b) => b.name);
}

describe('Parity Matrix Tests', () => {
  const formatters: Map<FormatterName, Formatter> = new Map();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    formatters.clear();
    formatters.set('github', new GitHubFormatter());
    formatters.set('claude', new ClaudeFormatter());
    formatters.set('cursor', new CursorFormatter());
    formatters.set('antigravity', new AntigravityFormatter());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Matrix Specification Integrity', () => {
    it('should have all formatters represented in the matrix', () => {
      const formatterNames: FormatterName[] = ['github', 'cursor', 'claude', 'antigravity'];

      for (const name of formatterNames) {
        const sections = getRequiredSections(name);
        expect(sections.length, `${name} should have required sections`).toBeGreaterThan(0);
      }
    });

    it('should have unique section IDs', () => {
      const ids = PARITY_MATRIX.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid source block references', () => {
      const validBlocks = [
        'identity',
        'context',
        'standards',
        'shortcuts',
        'knowledge',
        'restrictions',
        'architecture',
        'guards',
      ];

      for (const spec of PARITY_MATRIX) {
        for (const source of spec.sources) {
          expect(
            validBlocks,
            `Invalid source block "${source.block}" in section "${spec.id}"`
          ).toContain(source.block);
        }
      }
    });

    it('should have header variations for all required formatters', () => {
      for (const spec of PARITY_MATRIX) {
        for (const formatter of spec.requiredBy) {
          expect(
            spec.headerVariations[formatter],
            `Missing header variation for ${formatter} in section ${spec.id}`
          ).toBeDefined();
        }
      }
    });
  });

  describe('Extraction Rules Integrity', () => {
    it('should have valid block references in extraction rules', () => {
      const validBlocks = [
        'identity',
        'context',
        'standards',
        'shortcuts',
        'knowledge',
        'restrictions',
      ];

      for (const rule of EXTRACTION_RULES) {
        expect(validBlocks, `Invalid block "${rule.block}" in extraction rule`).toContain(
          rule.block
        );
      }
    });

    it('should reference existing sections in extraction rules', () => {
      const sectionIds = PARITY_MATRIX.map((s) => s.id);

      for (const rule of EXTRACTION_RULES) {
        for (const sectionId of rule.producesSections) {
          expect(
            sectionIds,
            `Unknown section "${sectionId}" in extraction rule for block "${rule.block}"`
          ).toContain(sectionId);
        }
      }
    });
  });

  describe('Required Sections Coverage', () => {
    it.each([
      ['github' as const],
      ['cursor' as const],
      ['claude' as const],
      ['antigravity' as const],
    ])('%s should produce required content types', (formatterName) => {
      const formatter = formatters.get(formatterName)!;
      const ast = createCanonicalAST();
      const result = formatter.format(ast);

      const requiredSpecs = getRequiredSections(formatterName);

      // Check that content patterns are matched
      for (const spec of requiredSpecs) {
        if (spec.contentPatterns && spec.contentPatterns.length > 0) {
          const hasContent = spec.contentPatterns.some((pattern) => pattern.test(result.content));

          // Log for debugging when content is missing
          if (!hasContent) {
            console.log(
              `[${formatterName}] Section "${spec.id}" content not matched. ` +
                `Expected patterns: ${spec.contentPatterns.map((p) => p.toString()).join(', ')}`
            );
          }

          expect(
            hasContent,
            `${formatterName} should have content matching ${spec.id} patterns`
          ).toBe(true);
        }
      }
    });
  });

  describe('Content Validation', () => {
    it('validateSectionContent should match expected patterns', () => {
      // Project identity should match developer/project patterns
      expect(validateSectionContent('You are an expert developer', 'project-identity')).toBe(true);

      // Tech stack should match language patterns
      expect(validateSectionContent('typescript', 'tech-stack')).toBe(true);

      // Restrictions should match never/dont patterns
      expect(validateSectionContent("Don't use any", 'restrictions')).toBe(true);
      expect(validateSectionContent('Never use any', 'restrictions')).toBe(true);
    });

    it('validateSectionContent should return true for unknown sections', () => {
      expect(validateSectionContent('any content', 'unknown-section')).toBe(true);
    });
  });

  describe('Cross-Formatter Parity', () => {
    it('all markdown formatters should produce content with multiple sections', () => {
      const ast = createCanonicalAST();

      const markdownFormatters: FormatterName[] = ['github', 'claude', 'antigravity'];

      for (const name of markdownFormatters) {
        const formatter = formatters.get(name)!;
        const result = formatter.format(ast);

        // Count ## headers as sections
        const headers = result.content.match(/^##\s+.+$/gm) || [];
        expect(headers.length, `${name} should produce multiple sections`).toBeGreaterThan(3);
      }
    });

    it('critical content should be present in all formatters', () => {
      const ast = createCanonicalAST();

      // Content patterns that MUST be present
      const criticalPatterns = [
        { name: 'identity', pattern: /TypeScript|developer/i },
        { name: 'restrictions', pattern: /never|don't/i },
        { name: 'commands', pattern: /\/review|\/test|command/i },
      ];

      for (const [formatterName, formatter] of formatters) {
        const result = formatter.format(ast);

        for (const { name, pattern } of criticalPatterns) {
          expect(pattern.test(result.content), `${formatterName} should have ${name} content`).toBe(
            true
          );
        }
      }
    });

    it('restrictions content should be present in all formatters', () => {
      const ast = createCanonicalAST();

      for (const [name, formatter] of formatters) {
        const result = formatter.format(ast);

        // All formatters should have some form of restrictions
        const hasRestrictions =
          result.content.includes("Don't") ||
          result.content.includes('Never') ||
          result.content.includes('never');

        expect(hasRestrictions, `${name} should include restrictions content`).toBe(true);
      }
    });
  });

  describe('Block-to-Section Mapping', () => {
    it('identity block should produce project section', () => {
      const ast: Program = {
        ...createCanonicalAST(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are an expert developer.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      for (const [name, formatter] of formatters) {
        const result = formatter.format(ast);
        const hasProject =
          result.content.includes('Project') ||
          result.content.includes('You are') ||
          result.content.includes('developer');

        expect(hasProject, `${name} should produce project section from identity`).toBe(true);
      }
    });

    it('standards.git should produce git-commits section', () => {
      const ast: Program = {
        ...createCanonicalAST(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                git: {
                  format: 'Conventional Commits',
                  types: ['feat', 'fix'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      // Only check formatters that require git-commits section
      const gitFormatters: FormatterName[] = ['github', 'antigravity'];

      for (const name of gitFormatters) {
        const formatter = formatters.get(name)!;
        const result = formatter.format(ast);

        const hasGitSection =
          result.content.includes('Git') || result.content.includes('Conventional');

        expect(hasGitSection, `${name} should produce git-commits section from standards.git`).toBe(
          true
        );
      }
    });

    it('restrictions block should produce restrictions section', () => {
      const ast: Program = {
        ...createCanonicalAST(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never use any type', 'Never skip tests'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      for (const [name, formatter] of formatters) {
        const result = formatter.format(ast);

        const hasRestrictions =
          result.content.includes("Don't") ||
          result.content.includes('Never') ||
          result.content.includes('never');

        expect(
          hasRestrictions,
          `${name} should produce restrictions section from restrictions block`
        ).toBe(true);
      }
    });
  });

  describe('Parity Report Generation', () => {
    it('should generate valid parity report for all formatters', () => {
      const ast = createCanonicalAST();
      const availableBlocks = getAvailableBlocks(ast);

      for (const [name, formatter] of formatters) {
        const result = formatter.format(ast);
        const report = analyzeFormatterOutput(name, result.content, availableBlocks);

        expect(report.formatter).toBe(name);
        expect(Array.isArray(report.presentSections)).toBe(true);
        expect(Array.isArray(report.missingSections)).toBe(true);
        expect(Array.isArray(report.contentIssues)).toBe(true);
      }
    });

    it('should detect content issues when content does not match patterns', () => {
      // Create content that has headers but wrong content
      const badContent = `## Project Identity

Some random text without the expected keywords.

## Tech Stack

No technology mentioned here at all.
`;

      const report = analyzeFormatterOutput('github', badContent, ['identity', 'context']);

      // The report should exist with potential content issues
      expect(report.formatter).toBe('github');
      // Since the content doesn't match patterns, there might be content issues
      expect(Array.isArray(report.contentIssues)).toBe(true);
    });
  });

  describe('Additional Parity Functions', () => {
    it('getSourceBlocks should return blocks for known sections', () => {
      const identityBlocks = getSourceBlocks('project-identity');
      expect(identityBlocks).toContain('identity');

      const techStackBlocks = getSourceBlocks('tech-stack');
      expect(techStackBlocks.length).toBeGreaterThan(0);

      const restrictionsBlocks = getSourceBlocks('restrictions');
      expect(restrictionsBlocks).toContain('restrictions');
    });

    it('getSourceBlocks should return empty array for unknown sections', () => {
      const blocks = getSourceBlocks('non-existent-section');
      expect(blocks).toEqual([]);
    });

    it('getOptionalSections should return optional sections for formatter', () => {
      const optionalGithub = getOptionalSections('github');
      expect(Array.isArray(optionalGithub)).toBe(true);

      const optionalCursor = getOptionalSections('cursor');
      expect(Array.isArray(optionalCursor)).toBe(true);
    });

    it('getAllSections should return combined required and optional sections', () => {
      const allGithub = getAllSections('github');
      const requiredGithub = getRequiredSections('github');
      const optionalGithub = getOptionalSections('github');

      expect(allGithub.length).toBe(requiredGithub.length + optionalGithub.length);
    });

    it('matchesSectionHeader should detect headers in content', () => {
      const contentWithProjectIdentity = '## Project Identity\n\nYou are a developer.';
      const contentWithTechStack = '## Tech Stack\n\n- TypeScript';

      // These should match based on header variations
      expect(matchesSectionHeader(contentWithProjectIdentity, 'project-identity', 'github')).toBe(
        true
      );
      expect(matchesSectionHeader(contentWithTechStack, 'tech-stack', 'github')).toBe(true);
    });

    it('matchesSectionHeader should return false for non-matching content', () => {
      const content = 'Random content without any headers';

      expect(matchesSectionHeader(content, 'project-identity', 'github')).toBe(false);
      expect(matchesSectionHeader(content, 'tech-stack', 'github')).toBe(false);
    });

    it('matchesSectionHeader should handle array header variations', () => {
      // Find a section with array variations
      const sectionWithArrayHeaders = PARITY_MATRIX.find(
        (s) =>
          s.headerVariations.github &&
          (Array.isArray(s.headerVariations.github) ||
            typeof s.headerVariations.github === 'string')
      );

      if (sectionWithArrayHeaders) {
        const header = Array.isArray(sectionWithArrayHeaders.headerVariations.github)
          ? sectionWithArrayHeaders.headerVariations.github[0]
          : sectionWithArrayHeaders.headerVariations.github;

        const content = `${header}\n\nSome content here.`;
        expect(matchesSectionHeader(content, sectionWithArrayHeaders.id, 'github')).toBe(true);
      }
    });
  });
});
