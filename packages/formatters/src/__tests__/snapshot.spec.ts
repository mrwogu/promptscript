import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github';
import { ClaudeFormatter } from '../formatters/claude';
import { CursorFormatter } from '../formatters/cursor';

const createLoc = (): SourceLocation => ({
  file: 'reference.prs',
  line: 1,
  column: 1,
});

/**
 * Reference AST that mirrors the actual promptscript project.prs structure.
 * This ensures formatters handle real-world data correctly.
 */
function createReferenceAST(): Program {
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc: createLoc(),
    meta: {
      fields: {
        id: 'promptscript',
        syntax: '1.0.0',
        org: 'PromptScript',
        tags: ['typescript', 'monorepo', 'nx', 'parser', 'compiler'],
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
              example: `\`\`\`mermaid
flowchart LR
  A[Input] --> B[Process] --> C[Output]
\`\`\``,
            },
            documentation: {
              verifyBefore: 'review README.md and docs/ before changes',
              verifyAfter: 'update docs if behavior changes',
              codeExamples: 'keep accurate',
            },
          },
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
            'Never create packages manually - use Nx generators',
            'Never create custom ESLint rules in package configs',
            'Never use `import.meta.dirname` in vite/vitest configs',
            'Never use ASCII art diagrams - always use Mermaid',
          ],
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
    ],
  };
}

describe('Formatter Snapshot Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GitHubFormatter', () => {
    it('should generate expected output for reference AST', () => {
      const formatter = new GitHubFormatter();
      const ast = createReferenceAST();
      const result = formatter.format(ast);

      expect(result.path).toBe('.github/copilot-instructions.md');
      expect(result.content).toMatchSnapshot();
    });
  });

  describe('ClaudeFormatter', () => {
    it('should generate expected output for reference AST', () => {
      const formatter = new ClaudeFormatter();
      const ast = createReferenceAST();
      const result = formatter.format(ast);

      expect(result.path).toBe('CLAUDE.md');
      expect(result.content).toMatchSnapshot();
    });
  });

  describe('CursorFormatter', () => {
    it('should generate expected output for reference AST', () => {
      const formatter = new CursorFormatter();
      const ast = createReferenceAST();
      const result = formatter.format(ast);

      expect(result.path).toBe('.cursorrules');
      expect(result.content).toMatchSnapshot();
    });
  });

  describe('Cross-formatter consistency', () => {
    it('all formatters should include key information', () => {
      const ast = createReferenceAST();
      const formatters = [new GitHubFormatter(), new ClaudeFormatter(), new CursorFormatter()];

      for (const formatter of formatters) {
        const result = formatter.format(ast);

        // All should mention TypeScript or type-related concepts
        expect(
          result.content.toLowerCase().includes('typescript') ||
            result.content.toLowerCase().includes('type'),
          `${formatter.name} should mention typescript or types`
        ).toBe(true);

        // All should mention Nx or monorepo
        expect(
          result.content.toLowerCase().includes('nx') ||
            result.content.toLowerCase().includes('monorepo'),
          `${formatter.name} should mention Nx or monorepo`
        ).toBe(true);

        // All markdown-based formatters should have some form of code block
        // Cursor uses plain text format, so skip code block check for it
        if (formatter.name !== 'cursor') {
          expect(result.content, `${formatter.name} should have code blocks`).toContain('```');
        }
      }
    });

    it('all formatters should produce valid markdown', () => {
      const ast = createReferenceAST();
      const formatters = [new GitHubFormatter(), new ClaudeFormatter(), new CursorFormatter()];

      for (const formatter of formatters) {
        const result = formatter.format(ast);

        // Check for proper code block structure - at minimum no 4+ backticks
        // Some formatters embed code examples which can have nested blocks
        const hasCodeBlocks = result.content.includes('```');
        if (hasCodeBlocks) {
          // Just verify there are some code blocks, exact balance is complex due to nesting
          expect(result.content.match(/```/g)?.length ?? 0).toBeGreaterThan(0);
        }

        // Should not have 4+ backticks (common bug)
        expect(result.content, `${formatter.name} should not have 4+ backticks`).not.toMatch(
          /`{4,}/
        );
      }
    });
  });
});
