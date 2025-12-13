import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github';
import { ClaudeFormatter } from '../formatters/claude';
import { CursorFormatter } from '../formatters/cursor';
import { AntigravityFormatter } from '../formatters/antigravity';
import type { Formatter } from '../types';

/**
 * Golden Files Tests
 *
 * These tests compare formatter output against reference "golden" files.
 * When formatter output changes, the test fails, alerting developers to
 * review the change.
 *
 * To update golden files after intentional changes:
 *   UPDATE_GOLDEN=true pnpm nx test formatters
 */

const GOLDEN_DIR = join(__dirname, '__golden__');
const UPDATE_GOLDEN = process.env['UPDATE_GOLDEN'] === 'true';

const createLoc = (): SourceLocation => ({
  file: 'project.prs',
  line: 1,
  column: 1,
});

/**
 * Create the canonical AST matching .promptscript/project.prs
 * This is the single source of truth for golden file generation.
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
        org: 'PromptScript',
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
    resolver[resolver - Inheritance & import resolution]
    validator[validator - AST validation rules]
    compiler[compiler - Pipeline orchestration]
    formatters[formatters - Output formatters]
    cli[cli - Command-line interface]
  end

  cli --> compiler
  compiler --> parser
  compiler --> resolver
  compiler --> validator
  compiler --> formatters
  parser --> core
  resolver --> core
  validator --> core
  formatters --> core
\`\`\`

## Key Libraries

- Parser: Chevrotain
- CLI: Commander.js
- Testing: Vitest
- Linting: ESLint + Prettier`,
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
              interfaces: 'for object shapes',
              types: 'for unions and intersections',
              exports: 'named only, no default exports',
              returnTypes: 'explicit on public functions',
            },
            naming: {
              files: 'kebab-case.ts',
              classes: 'PascalCase',
              interfaces: 'PascalCase',
              functions: 'camelCase',
              variables: 'camelCase',
              constants: 'UPPER_SNAKE_CASE',
            },
            errors: {
              customClasses: 'extend PSError',
              locationInfo: true,
              messages: 'actionable',
            },
            testing: {
              filePattern: '*.spec.ts next to source',
              pattern: 'AAA (Arrange, Act, Assert)',
              coverage: 90,
              fixtures: 'for parser tests',
              framework: 'vitest',
            },
            git: {
              format: 'Conventional Commits',
              reference: 'https://www.conventionalcommits.org/',
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
              types: ['flowchart', 'sequence', 'class', 'state', 'ER', 'gantt', 'pie'],
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
            '/test': `Write unit tests using:
- Vitest as the test runner
- AAA pattern (Arrange, Act, Assert)
- Fixtures for parser tests
- Target >90% coverage`,
            '/build': `Run verification commands:
- pnpm run format (Prettier)
- pnpm run lint (ESLint)
- pnpm run build (all packages)
- pnpm run typecheck (TypeScript)
- pnpm run test (all tests)`,
            '/newpkg':
              'Generate new package with Nx: pnpm nx g @nx/js:lib <name> --directory=packages/<name>',
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
pnpm nx run-many -t test  # Test all packages
pnpm nx graph             # View dependency graph
\`\`\`

## Post-Work Verification

After completing code changes, always run:
\`\`\`bash
pnpm run format     # Format code with Prettier
pnpm run lint       # Check for linting errors
pnpm run build      # Build all packages
pnpm run typecheck  # Verify TypeScript types
pnpm run test       # Run all tests
\`\`\`

## Configuration Notes

### ESLint
- All package configs inherit from \`eslint.base.config.cjs\`
- Use \`createBaseConfig(__dirname)\` from base config
- Modify base config instead of duplicating rules

### Vite/Vitest
- Use \`__dirname\` for root option
- Do NOT use \`import.meta.dirname\` (causes TS errors)`,
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
            'Never create packages manually - use Nx generators (nx g @nx/js:lib)',
            'Never create custom ESLint rules in package configs - extend base config',
            'Never use `import.meta.dirname` in vite/vitest configs - use `__dirname`',
            'Never use ASCII art diagrams - always use Mermaid',
            'Never reference line numbers in test names or comments',
            'Never make code changes without verifying documentation consistency',
          ],
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };
}

/**
 * Formatter configuration for golden file tests.
 */
interface FormatterConfig {
  name: string;
  formatter: Formatter;
  goldenFile: string;
  extension: string;
}

/**
 * Normalize content for comparison.
 * Removes dynamic content like timestamps.
 */
function normalizeContent(content: string): string {
  return (
    content
      // Remove generated timestamps
      .replace(/Generated: \d{4}-\d{2}-\d{2}T[\d:.]+Z/g, 'Generated: [TIMESTAMP]')
      // Remove date-based patterns
      .replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Trim trailing whitespace on each line
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      // Trim file
      .trim()
  );
}

/**
 * Read golden file content or return null if not exists.
 */
function readGoldenFile(filename: string): string | null {
  const path = join(GOLDEN_DIR, filename);
  if (!existsSync(path)) {
    return null;
  }
  return readFileSync(path, 'utf-8');
}

/**
 * Write golden file content.
 */
function writeGoldenFile(filename: string, content: string): void {
  const path = join(GOLDEN_DIR, filename);
  writeFileSync(path, content, 'utf-8');
}

/**
 * Compare content and generate diff summary.
 */
function generateDiffSummary(expected: string, actual: string): string {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');

  const diffs: string[] = [];
  const maxLines = Math.max(expectedLines.length, actualLines.length);

  for (let i = 0; i < maxLines && diffs.length < 10; i++) {
    const exp = expectedLines[i] ?? '<missing>';
    const act = actualLines[i] ?? '<missing>';

    if (exp !== act) {
      diffs.push(`Line ${i + 1}:`);
      diffs.push(`  - ${exp.slice(0, 80)}`);
      diffs.push(`  + ${act.slice(0, 80)}`);
    }
  }

  if (diffs.length === 0) {
    return 'No differences found';
  }

  return diffs.join('\n');
}

describe('Golden Files Tests', () => {
  const formatterConfigs: FormatterConfig[] = [
    {
      name: 'github',
      formatter: new GitHubFormatter(),
      goldenFile: 'github.md',
      extension: 'md',
    },
    {
      name: 'cursor',
      formatter: new CursorFormatter(),
      goldenFile: 'cursor.mdc',
      extension: 'mdc',
    },
    {
      name: 'claude',
      formatter: new ClaudeFormatter(),
      goldenFile: 'claude.md',
      extension: 'md',
    },
    {
      name: 'antigravity',
      formatter: new AntigravityFormatter(),
      goldenFile: 'antigravity.md',
      extension: 'md',
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Golden File Generation', () => {
    it.each(formatterConfigs)(
      '$name formatter output should match golden file',
      ({ name, formatter, goldenFile }) => {
        const ast = createCanonicalAST();
        const result = formatter.format(ast);
        const actualContent = normalizeContent(result.content);

        const goldenContent = readGoldenFile(goldenFile);

        if (goldenContent === null) {
          if (UPDATE_GOLDEN) {
            writeGoldenFile(goldenFile, actualContent);
            console.log(`Created golden file: ${goldenFile}`);
            return;
          }

          // First run - create the golden file
          writeGoldenFile(goldenFile, actualContent);
          console.log(`Created initial golden file: ${goldenFile}`);
          return;
        }

        const normalizedGolden = normalizeContent(goldenContent);

        if (UPDATE_GOLDEN && actualContent !== normalizedGolden) {
          writeGoldenFile(goldenFile, actualContent);
          console.log(`Updated golden file: ${goldenFile}`);
          return;
        }

        if (actualContent !== normalizedGolden) {
          const diff = generateDiffSummary(normalizedGolden, actualContent);
          throw new Error(
            `${name} formatter output differs from golden file.\n` +
              `Run with UPDATE_GOLDEN=true to update.\n\n` +
              `Diff:\n${diff}`
          );
        }
      }
    );
  });

  describe('Golden File Content Validation', () => {
    it.each(formatterConfigs)('$name golden file should contain identity', ({ goldenFile }) => {
      const content = readGoldenFile(goldenFile);
      if (!content) return; // Skip if not yet generated

      expect(
        content.includes('TypeScript') || content.includes('typescript'),
        `${goldenFile} should mention TypeScript`
      ).toBe(true);
    });

    it.each(formatterConfigs)('$name golden file should contain restrictions', ({ goldenFile }) => {
      const content = readGoldenFile(goldenFile);
      if (!content) return; // Skip if not yet generated

      const hasRestrictions =
        content.includes("Don't") || content.includes('Never') || content.includes('never');

      expect(hasRestrictions, `${goldenFile} should have restrictions`).toBe(true);
    });

    it.each(formatterConfigs)('$name golden file should contain commands', ({ goldenFile }) => {
      const content = readGoldenFile(goldenFile);
      if (!content) return; // Skip if not yet generated

      const hasCommands =
        content.includes('/review') ||
        content.includes('/test') ||
        content.includes('Commands') ||
        content.includes('command');

      expect(hasCommands, `${goldenFile} should have commands`).toBe(true);
    });
  });

  describe('Cross-Formatter Consistency', () => {
    it('all golden files should have similar content coverage', () => {
      const contentChecks = [
        { name: 'identity', pattern: /TypeScript|developer/i },
        { name: 'restrictions', pattern: /never|don't/i },
        { name: 'commands', pattern: /\/review|\/test|command/i },
      ];

      for (const config of formatterConfigs) {
        const content = readGoldenFile(config.goldenFile);
        if (!content) continue;

        for (const check of contentChecks) {
          const hasContent = check.pattern.test(content);
          expect(hasContent, `${config.name} should have ${check.name} content`).toBe(true);
        }
      }
    });
  });

  describe('Structural Validation', () => {
    it.each(formatterConfigs)(
      '$name output should have proper markdown structure',
      ({ name, formatter, extension }) => {
        // Skip non-markdown formatters
        if (extension !== 'md') return;

        const ast = createCanonicalAST();
        const result = formatter.format(ast);

        // Check for proper header hierarchy
        const headers = result.content.match(/^#{1,3}\s+.+$/gm) || [];
        expect(headers.length, `${name} should have multiple headers`).toBeGreaterThan(1);

        // Check for no unclosed code blocks
        const codeBlocks = result.content.match(/```/g) || [];
        expect(codeBlocks.length % 2, `${name} should have balanced code blocks`).toBe(0);
      }
    );
  });
});
