import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { ClaudeFormatter } from '../formatters/claude.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { AntigravityFormatter } from '../formatters/antigravity.js';
// Tier 0 additional
import { FactoryFormatter } from '../formatters/factory.js';
import { OpenCodeFormatter } from '../formatters/opencode.js';
import { GeminiFormatter } from '../formatters/gemini.js';
// Tier 1
import { WindsurfFormatter } from '../formatters/windsurf.js';
import { ClineFormatter } from '../formatters/cline.js';
import { RooFormatter } from '../formatters/roo.js';
import { CodexFormatter } from '../formatters/codex.js';
import { ContinueFormatter } from '../formatters/continue.js';
// Tier 2
import { AugmentFormatter } from '../formatters/augment.js';
import { GooseFormatter } from '../formatters/goose.js';
import { KiloFormatter } from '../formatters/kilo.js';
import { AmpFormatter } from '../formatters/amp.js';
import { TraeFormatter } from '../formatters/trae.js';
import { JunieFormatter } from '../formatters/junie.js';
import { KiroFormatter } from '../formatters/kiro.js';
// Tier 3
import { CortexFormatter } from '../formatters/cortex.js';
import { CrushFormatter } from '../formatters/crush.js';
import { CommandCodeFormatter } from '../formatters/command-code.js';
import { KodeFormatter } from '../formatters/kode.js';
import { McpjamFormatter } from '../formatters/mcpjam.js';
import { MistralVibeFormatter } from '../formatters/mistral-vibe.js';
import { MuxFormatter } from '../formatters/mux.js';
import { OpenHandsFormatter } from '../formatters/openhands.js';
import { PiFormatter } from '../formatters/pi.js';
import { QoderFormatter } from '../formatters/qoder.js';
import { QwenCodeFormatter } from '../formatters/qwen-code.js';
import { ZencoderFormatter } from '../formatters/zencoder.js';
import { NeovateFormatter } from '../formatters/neovate.js';
import { PochiFormatter } from '../formatters/pochi.js';
import { AdalFormatter } from '../formatters/adal.js';
import { IflowFormatter } from '../formatters/iflow.js';
import { OpenClawFormatter } from '../formatters/openclaw.js';
import { CodeBuddyFormatter } from '../formatters/codebuddy.js';
import type { Formatter, FormatOptions } from '../types.js';

/**
 * Golden Files Tests
 *
 * These tests compare formatter output against reference "golden" files.
 * When formatter output changes, the test fails, alerting developers to
 * review the change.
 *
 * To update golden files after intentional changes:
 *   UPDATE_GOLDEN=true pnpm nx test formatters
 *
 * Tested versions:
 * - GitHub: simple, multifile, full
 * - Claude: simple, multifile, full
 * - Cursor: modern, multifile, legacy
 * - Antigravity: simple, frontmatter
 * - All 30 additional formatters: simple
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
            typescript: [
              'Strict mode enabled',
              'Never use `any` type - use `unknown` with type guards',
              'Prefer `interface` for object shapes',
              'Use `type` for unions and intersections',
              'Named exports only, no default exports',
              'Explicit return types on public functions',
            ],
            naming: [
              'Files: `kebab-case.ts`',
              'Classes/Interfaces: `PascalCase`',
              'Functions/Variables: `camelCase`',
              'Constants: `UPPER_SNAKE_CASE`',
            ],
            errors: [
              'Use custom error classes extending `PSError`',
              'Always include location information',
              'Provide actionable error messages',
            ],
            testing: [
              'Test files: `*.spec.ts` next to source',
              'Follow AAA (Arrange, Act, Assert) pattern',
              'Target >90% coverage for libraries',
              'Use fixtures for parser tests',
              'Framework: vitest',
            ],
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
      // Guards block for multifile/full modes
      {
        type: 'Block',
        name: 'guards',
        content: {
          type: 'ObjectContent',
          properties: {
            globs: ['**/*.ts', '**/*.tsx'],
            excludeGlobs: ['**/*.spec.ts', '**/*.test.ts'],
          },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      // Skills block for full mode
      {
        type: 'Block',
        name: 'skills',
        content: {
          type: 'ObjectContent',
          properties: {
            commit: {
              description: 'Create git commits following project conventions',
              disableModelInvocation: true,
              context: 'fork',
              agent: 'general-purpose',
              allowedTools: ['Bash', 'Read', 'Write'],
              content: `When creating commits:
1. Use Conventional Commits format: type(scope): description
2. Types: feat, fix, docs, style, refactor, test, chore
3. Include Co-Authored-By trailer for AI assistance
4. Never amend existing commits unless explicitly asked`,
            },
            review: {
              description: 'Review code changes for quality and issues',
              userInvocable: true,
              content: `Perform thorough code review checking:
- Type safety and proper TypeScript usage
- Error handling completeness
- Security vulnerabilities (OWASP top 10)
- Performance issues`,
            },
          },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      // Local block for Claude full mode
      {
        type: 'Block',
        name: 'local',
        content: {
          type: 'TextContent',
          value: `## Local Development Configuration

### API Keys
- Development API key is in .env.local
- Staging endpoint: https://staging-api.example.com

### Personal Preferences
- I prefer verbose logging during development
- Use port 3001 for the dev server

### Team Notes
- Contact @john for database access
- Ask @sarah about the new authentication flow`,
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      // Agents block for Claude full mode
      {
        type: 'Block',
        name: 'agents',
        content: {
          type: 'ObjectContent',
          properties: {
            'code-reviewer': {
              description: 'Reviews code for quality and best practices',
              tools: ['Read', 'Grep', 'Glob', 'Bash'],
              model: 'sonnet',
              content: `You are a senior code reviewer ensuring high standards of code quality.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:
- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling`,
            },
            debugger: {
              description: 'Debugging specialist for errors and test failures',
              tools: ['Read', 'Edit', 'Bash', 'Grep', 'Glob'],
              model: 'inherit',
              permissionMode: 'acceptEdits',
              content: `You are an expert debugger specializing in root cause analysis.

When invoked:
1. Capture error message and stack trace
2. Identify reproduction steps
3. Isolate the failure location
4. Implement minimal fix
5. Verify solution works`,
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
 * Formatter version configuration for golden file tests.
 */
interface VersionedFormatterConfig {
  name: string;
  formatter: Formatter;
  version: string;
  goldenFile: string;
  extension: string;
  options?: FormatOptions;
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
 * Write golden file content (creates directories if needed).
 */
function writeGoldenFile(filename: string, content: string): void {
  const path = join(GOLDEN_DIR, filename);
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
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
  // All formatter versions to test — Tier 0 formatters with multiple versions
  const versionedConfigs: VersionedFormatterConfig[] = [
    // GitHub versions
    {
      name: 'github',
      formatter: new GitHubFormatter(),
      version: 'simple',
      goldenFile: 'github/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'github',
      formatter: new GitHubFormatter(),
      version: 'multifile',
      goldenFile: 'github/multifile.md',
      extension: 'md',
      options: { version: 'multifile' },
    },
    {
      name: 'github',
      formatter: new GitHubFormatter(),
      version: 'full',
      goldenFile: 'github/full.md',
      extension: 'md',
      options: { version: 'full' },
    },
    // Claude versions
    {
      name: 'claude',
      formatter: new ClaudeFormatter(),
      version: 'simple',
      goldenFile: 'claude/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'claude',
      formatter: new ClaudeFormatter(),
      version: 'multifile',
      goldenFile: 'claude/multifile.md',
      extension: 'md',
      options: { version: 'multifile' },
    },
    {
      name: 'claude',
      formatter: new ClaudeFormatter(),
      version: 'full',
      goldenFile: 'claude/full.md',
      extension: 'md',
      options: { version: 'full' },
    },
    // Cursor versions
    {
      name: 'cursor',
      formatter: new CursorFormatter(),
      version: 'modern',
      goldenFile: 'cursor/modern.mdc',
      extension: 'mdc',
      options: { version: 'modern' },
    },
    {
      name: 'cursor',
      formatter: new CursorFormatter(),
      version: 'multifile',
      goldenFile: 'cursor/multifile.mdc',
      extension: 'mdc',
      options: { version: 'multifile' },
    },
    {
      name: 'cursor',
      formatter: new CursorFormatter(),
      version: 'legacy',
      goldenFile: 'cursor/legacy.md',
      extension: 'md',
      options: { version: 'legacy' },
    },
    // Antigravity versions
    {
      name: 'antigravity',
      formatter: new AntigravityFormatter(),
      version: 'simple',
      goldenFile: 'antigravity/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'antigravity',
      formatter: new AntigravityFormatter(),
      version: 'frontmatter',
      goldenFile: 'antigravity/frontmatter.md',
      extension: 'md',
      options: { version: 'frontmatter' },
    },
    // Factory versions
    {
      name: 'factory',
      formatter: new FactoryFormatter(),
      version: 'simple',
      goldenFile: 'factory/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'factory',
      formatter: new FactoryFormatter(),
      version: 'multifile',
      goldenFile: 'factory/multifile.md',
      extension: 'md',
      options: { version: 'multifile' },
    },
    {
      name: 'factory',
      formatter: new FactoryFormatter(),
      version: 'full',
      goldenFile: 'factory/full.md',
      extension: 'md',
      options: { version: 'full' },
    },
    // OpenCode versions
    {
      name: 'opencode',
      formatter: new OpenCodeFormatter(),
      version: 'simple',
      goldenFile: 'opencode/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'opencode',
      formatter: new OpenCodeFormatter(),
      version: 'multifile',
      goldenFile: 'opencode/multifile.md',
      extension: 'md',
      options: { version: 'multifile' },
    },
    {
      name: 'opencode',
      formatter: new OpenCodeFormatter(),
      version: 'full',
      goldenFile: 'opencode/full.md',
      extension: 'md',
      options: { version: 'full' },
    },
    // Gemini versions
    {
      name: 'gemini',
      formatter: new GeminiFormatter(),
      version: 'simple',
      goldenFile: 'gemini/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    // Tier 1 — simple versions
    {
      name: 'windsurf',
      formatter: new WindsurfFormatter(),
      version: 'simple',
      goldenFile: 'windsurf/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'cline',
      formatter: new ClineFormatter(),
      version: 'simple',
      goldenFile: 'cline/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'roo',
      formatter: new RooFormatter(),
      version: 'simple',
      goldenFile: 'roo/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'codex',
      formatter: new CodexFormatter(),
      version: 'simple',
      goldenFile: 'codex/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'continue',
      formatter: new ContinueFormatter(),
      version: 'simple',
      goldenFile: 'continue/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    // Tier 2 — simple versions
    {
      name: 'augment',
      formatter: new AugmentFormatter(),
      version: 'simple',
      goldenFile: 'augment/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'goose',
      formatter: new GooseFormatter(),
      version: 'simple',
      goldenFile: 'goose/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'kilo',
      formatter: new KiloFormatter(),
      version: 'simple',
      goldenFile: 'kilo/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'amp',
      formatter: new AmpFormatter(),
      version: 'simple',
      goldenFile: 'amp/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'trae',
      formatter: new TraeFormatter(),
      version: 'simple',
      goldenFile: 'trae/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'junie',
      formatter: new JunieFormatter(),
      version: 'simple',
      goldenFile: 'junie/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'kiro',
      formatter: new KiroFormatter(),
      version: 'simple',
      goldenFile: 'kiro/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    // Tier 3 — simple versions
    {
      name: 'cortex',
      formatter: new CortexFormatter(),
      version: 'simple',
      goldenFile: 'cortex/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'crush',
      formatter: new CrushFormatter(),
      version: 'simple',
      goldenFile: 'crush/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'command-code',
      formatter: new CommandCodeFormatter(),
      version: 'simple',
      goldenFile: 'command-code/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'kode',
      formatter: new KodeFormatter(),
      version: 'simple',
      goldenFile: 'kode/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'mcpjam',
      formatter: new McpjamFormatter(),
      version: 'simple',
      goldenFile: 'mcpjam/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'mistral-vibe',
      formatter: new MistralVibeFormatter(),
      version: 'simple',
      goldenFile: 'mistral-vibe/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'mux',
      formatter: new MuxFormatter(),
      version: 'simple',
      goldenFile: 'mux/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'openhands',
      formatter: new OpenHandsFormatter(),
      version: 'simple',
      goldenFile: 'openhands/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'pi',
      formatter: new PiFormatter(),
      version: 'simple',
      goldenFile: 'pi/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'qoder',
      formatter: new QoderFormatter(),
      version: 'simple',
      goldenFile: 'qoder/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'qwen-code',
      formatter: new QwenCodeFormatter(),
      version: 'simple',
      goldenFile: 'qwen-code/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'zencoder',
      formatter: new ZencoderFormatter(),
      version: 'simple',
      goldenFile: 'zencoder/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'neovate',
      formatter: new NeovateFormatter(),
      version: 'simple',
      goldenFile: 'neovate/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'pochi',
      formatter: new PochiFormatter(),
      version: 'simple',
      goldenFile: 'pochi/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'adal',
      formatter: new AdalFormatter(),
      version: 'simple',
      goldenFile: 'adal/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'iflow',
      formatter: new IflowFormatter(),
      version: 'simple',
      goldenFile: 'iflow/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'openclaw',
      formatter: new OpenClawFormatter(),
      version: 'simple',
      goldenFile: 'openclaw/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
    {
      name: 'codebuddy',
      formatter: new CodeBuddyFormatter(),
      version: 'simple',
      goldenFile: 'codebuddy/simple.md',
      extension: 'md',
      options: { version: 'simple' },
    },
  ];

  // Legacy configs for backward compatibility tests (Tier 0 only)
  const legacyConfigs = [
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

  describe('Versioned Golden File Generation', () => {
    it.each(versionedConfigs)(
      '$name ($version) formatter output should match golden file',
      ({ name, formatter, version, goldenFile, options }) => {
        const ast = createCanonicalAST();
        const result = formatter.format(ast, options);
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
            `${name} (${version}) formatter output differs from golden file.\n` +
              `Run with UPDATE_GOLDEN=true to update.\n\n` +
              `Diff:\n${diff}`
          );
        }
      }
    );
  });

  describe('Additional Files for Multifile/Full Versions', () => {
    it('github multifile should generate instruction files', () => {
      const ast = createCanonicalAST();
      const formatter = new GitHubFormatter();
      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles?.length).toBeGreaterThan(0);

      // Should have instruction files from guards
      const instructionFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/instructions/')
      );
      expect(instructionFile).toBeDefined();
    });

    it('github full should generate skill files', () => {
      const ast = createCanonicalAST();
      const formatter = new GitHubFormatter();
      const result = formatter.format(ast, { version: 'full' });

      expect(result.additionalFiles).toBeDefined();

      // Should have skill files
      const commitSkill = result.additionalFiles?.find((f) =>
        f.path.includes('.github/skills/commit/SKILL.md')
      );
      expect(commitSkill).toBeDefined();
      expect(commitSkill?.content).toContain('name: commit');

      const reviewSkill = result.additionalFiles?.find((f) =>
        f.path.includes('.github/skills/review/SKILL.md')
      );
      expect(reviewSkill).toBeDefined();
    });

    it('github full should generate custom agent files', () => {
      const ast = createCanonicalAST();
      const formatter = new GitHubFormatter();
      const result = formatter.format(ast, { version: 'full' });

      expect(result.additionalFiles).toBeDefined();

      // Should have custom agent files
      const codeReviewerAgent = result.additionalFiles?.find(
        (f) => f.path === '.github/agents/code-reviewer.md'
      );
      expect(codeReviewerAgent).toBeDefined();
      expect(codeReviewerAgent?.content).toContain('name: code-reviewer');
      expect(codeReviewerAgent?.content).toContain(
        'description: Reviews code for quality and best practices'
      );
      // Tools should be in inline YAML array format with GitHub Copilot canonical names
      expect(codeReviewerAgent?.content).toContain("tools: ['read', 'search', 'execute']");
      // Model should be mapped from 'sonnet' to 'Claude Sonnet 4.5' (latest version)
      expect(codeReviewerAgent?.content).toContain('model: Claude Sonnet 4.5');

      const debuggerAgent = result.additionalFiles?.find(
        (f) => f.path === '.github/agents/debugger.md'
      );
      expect(debuggerAgent).toBeDefined();
    });

    it('claude multifile should generate rule files', () => {
      const ast = createCanonicalAST();
      const formatter = new ClaudeFormatter();
      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles?.length).toBeGreaterThan(0);

      // Should have rule files from guards
      const ruleFile = result.additionalFiles?.find((f) => f.path.includes('.claude/rules/'));
      expect(ruleFile).toBeDefined();
    });

    it('claude full should generate skill and local files', () => {
      const ast = createCanonicalAST();
      const formatter = new ClaudeFormatter();
      const result = formatter.format(ast, { version: 'full' });

      expect(result.additionalFiles).toBeDefined();

      // Should have skill files
      const commitSkill = result.additionalFiles?.find((f) =>
        f.path.includes('.claude/skills/commit/SKILL.md')
      );
      expect(commitSkill).toBeDefined();
      expect(commitSkill?.content).toContain("name: 'commit'");

      // Should have local file
      const localFile = result.additionalFiles?.find((f) => f.path === 'CLAUDE.local.md');
      expect(localFile).toBeDefined();
      expect(localFile?.content).toContain('Local Development Configuration');
    });

    it('claude full should generate agent files', () => {
      const ast = createCanonicalAST();
      const formatter = new ClaudeFormatter();
      const result = formatter.format(ast, { version: 'full' });

      expect(result.additionalFiles).toBeDefined();

      // Should have agent files
      const codeReviewerAgent = result.additionalFiles?.find(
        (f) => f.path === '.claude/agents/code-reviewer.md'
      );
      expect(codeReviewerAgent).toBeDefined();
      expect(codeReviewerAgent?.content).toContain('name: code-reviewer');
      expect(codeReviewerAgent?.content).toContain(
        'description: Reviews code for quality and best practices'
      );
      expect(codeReviewerAgent?.content).toContain("tools: ['Read', 'Grep', 'Glob', 'Bash']");
      expect(codeReviewerAgent?.content).toContain('model: sonnet');

      const debuggerAgent = result.additionalFiles?.find(
        (f) => f.path === '.claude/agents/debugger.md'
      );
      expect(debuggerAgent).toBeDefined();
      expect(debuggerAgent?.content).toContain('model: inherit');
      expect(debuggerAgent?.content).toContain('permissionMode: acceptEdits');
    });

    it('cursor multifile should generate additional rule files', () => {
      const ast = createCanonicalAST();
      const formatter = new CursorFormatter();
      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles?.length).toBeGreaterThan(0);
    });

    it('cursor modern should generate command files for multi-line shortcuts', () => {
      const ast = createCanonicalAST();
      const formatter = new CursorFormatter();
      const result = formatter.format(ast, { version: 'modern' });

      expect(result.additionalFiles).toBeDefined();

      // Multi-line shortcuts should become command files
      const testCommand = result.additionalFiles?.find(
        (f) => f.path === '.cursor/commands/test.md'
      );
      expect(testCommand).toBeDefined();
      expect(testCommand?.content).toContain('Vitest');
      expect(testCommand?.content).toContain('AAA pattern');

      const buildCommand = result.additionalFiles?.find(
        (f) => f.path === '.cursor/commands/build.md'
      );
      expect(buildCommand).toBeDefined();
      expect(buildCommand?.content).toContain('pnpm run format');

      // Single-line shortcut should NOT become a command file
      const reviewCommand = result.additionalFiles?.find(
        (f) => f.path === '.cursor/commands/review.md'
      );
      expect(reviewCommand).toBeUndefined();
    });

    it('cursor multifile should generate command files for multi-line shortcuts', () => {
      const ast = createCanonicalAST();
      const formatter = new CursorFormatter();
      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeDefined();

      // Should have command files
      const commandFiles = result.additionalFiles?.filter((f) =>
        f.path.startsWith('.cursor/commands/')
      );
      expect(commandFiles?.length).toBeGreaterThan(0);

      // Verify test command content
      const testCommand = commandFiles?.find((f) => f.path === '.cursor/commands/test.md');
      expect(testCommand).toBeDefined();
    });

    it('cursor legacy should NOT generate command files', () => {
      const ast = createCanonicalAST();
      const formatter = new CursorFormatter();
      const result = formatter.format(ast, { version: 'legacy' });

      // Legacy format doesn't support commands directory
      expect(result.additionalFiles).toBeUndefined();
    });

    it('antigravity frontmatter should include YAML frontmatter', () => {
      const ast = createCanonicalAST();
      const formatter = new AntigravityFormatter();
      const result = formatter.format(ast, { version: 'frontmatter' });

      // Should have frontmatter
      expect(result.content).toContain('---');
      expect(result.content).toContain('activation:');
    });

    it('opencode full should generate skill files at .opencode/skills/<name>/SKILL.md', () => {
      const ast = createCanonicalAST();
      const formatter = new OpenCodeFormatter();
      const result = formatter.format(ast, { version: 'full' });

      expect(result.additionalFiles).toBeDefined();

      const commitSkill = result.additionalFiles?.find((f) =>
        f.path.includes('.opencode/skills/commit/SKILL.md')
      );
      expect(commitSkill).toBeDefined();
      expect(commitSkill?.content).toContain('name: commit');

      const reviewSkill = result.additionalFiles?.find((f) =>
        f.path.includes('.opencode/skills/review/SKILL.md')
      );
      expect(reviewSkill).toBeDefined();
    });

    it('opencode full should generate agent files at .opencode/agents/<name>.md with mode: subagent', () => {
      const ast = createCanonicalAST();
      const formatter = new OpenCodeFormatter();
      const result = formatter.format(ast, { version: 'full' });

      expect(result.additionalFiles).toBeDefined();

      const codeReviewerAgent = result.additionalFiles?.find(
        (f) => f.path === '.opencode/agents/code-reviewer.md'
      );
      expect(codeReviewerAgent).toBeDefined();
      expect(codeReviewerAgent?.content).toContain(
        'description: Reviews code for quality and best practices'
      );
      expect(codeReviewerAgent?.content).toContain('mode: subagent');
    });

    it('opencode multifile should NOT generate skill files (skills only in full mode)', () => {
      const ast = createCanonicalAST();
      const formatter = new OpenCodeFormatter();
      const result = formatter.format(ast, { version: 'multifile' });

      const skillFiles = result.additionalFiles?.filter((f) =>
        f.path.includes('.opencode/skills/')
      );
      expect(skillFiles?.length ?? 0).toBe(0);
    });

    it('factory multifile should generate skill files (skillsInMultifile: true)', () => {
      const ast = createCanonicalAST();
      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeDefined();

      // Factory sets skillsInMultifile: true so skills are emitted in multifile mode too
      const commitSkill = result.additionalFiles?.find((f) =>
        f.path.includes('.factory/skills/commit/SKILL.md')
      );
      expect(commitSkill).toBeDefined();
      // commit skill has disableModelInvocation: true — must use hyphenated key
      expect(commitSkill?.content).toContain('disable-model-invocation: true');
      expect(commitSkill?.content).not.toContain('disableModelInvocation:');
      // user-invocable is only emitted when false; camelCase must never appear
      expect(commitSkill?.content).not.toContain('userInvocable:');
    });

    it('factory full should generate droid files with correct YAML frontmatter', () => {
      const ast = createCanonicalAST();
      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'full' });

      expect(result.additionalFiles).toBeDefined();

      const codeReviewerDroid = result.additionalFiles?.find(
        (f) => f.path === '.factory/droids/code-reviewer.md'
      );
      expect(codeReviewerDroid).toBeDefined();
      expect(codeReviewerDroid?.content).toContain('name: code-reviewer');
      expect(codeReviewerDroid?.content).toContain(
        'description: Reviews code for quality and best practices'
      );
      expect(codeReviewerDroid?.content).toContain('model: sonnet');

      const debuggerDroid = result.additionalFiles?.find(
        (f) => f.path === '.factory/droids/debugger.md'
      );
      expect(debuggerDroid).toBeDefined();
    });

    it('factory full should emit hyphenated keys in skill YAML', () => {
      const ast = createCanonicalAST();
      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'full' });

      const skillFiles = result.additionalFiles?.filter((f) => f.path.includes('.factory/skills/'));
      expect(skillFiles?.length).toBeGreaterThan(0);

      for (const skillFile of skillFiles ?? []) {
        expect(skillFile.content).not.toContain('userInvocable:');
        expect(skillFile.content).not.toContain('disableModelInvocation:');
      }
    });
  });

  describe('Legacy Golden File Compatibility', () => {
    it.each(legacyConfigs)(
      '$name formatter default output should match legacy golden file',
      ({ name, formatter, goldenFile }) => {
        const ast = createCanonicalAST();
        const result = formatter.format(ast);
        const actualContent = normalizeContent(result.content);

        const goldenContent = readGoldenFile(goldenFile);

        if (goldenContent === null) {
          if (UPDATE_GOLDEN) {
            writeGoldenFile(goldenFile, actualContent);
            console.log(`Created legacy golden file: ${goldenFile}`);
            return;
          }

          // First run - create the golden file
          writeGoldenFile(goldenFile, actualContent);
          console.log(`Created initial legacy golden file: ${goldenFile}`);
          return;
        }

        const normalizedGolden = normalizeContent(goldenContent);

        if (UPDATE_GOLDEN && actualContent !== normalizedGolden) {
          writeGoldenFile(goldenFile, actualContent);
          console.log(`Updated legacy golden file: ${goldenFile}`);
          return;
        }

        if (actualContent !== normalizedGolden) {
          const diff = generateDiffSummary(normalizedGolden, actualContent);
          throw new Error(
            `${name} formatter output differs from legacy golden file.\n` +
              `Run with UPDATE_GOLDEN=true to update.\n\n` +
              `Diff:\n${diff}`
          );
        }
      }
    );
  });

  describe('Golden File Content Validation', () => {
    it.each(versionedConfigs)(
      '$name ($version) golden file should contain identity',
      ({ goldenFile }) => {
        const content = readGoldenFile(goldenFile);
        if (!content) return; // Skip if not yet generated

        expect(
          content.includes('TypeScript') || content.includes('typescript'),
          `${goldenFile} should mention TypeScript`
        ).toBe(true);
      }
    );

    it.each(versionedConfigs)(
      '$name ($version) golden file should contain restrictions',
      ({ goldenFile }) => {
        const content = readGoldenFile(goldenFile);
        if (!content) return; // Skip if not yet generated

        const hasRestrictions =
          content.includes("Don't") || content.includes('Never') || content.includes('never');

        expect(hasRestrictions, `${goldenFile} should have restrictions`).toBe(true);
      }
    );
  });

  describe('Version-Specific Content Validation', () => {
    it('full versions should mention skills in main file or have skill files', () => {
      const fullConfigs = versionedConfigs.filter((c) => c.version === 'full');

      for (const config of fullConfigs) {
        const ast = createCanonicalAST();
        const result = config.formatter.format(ast, config.options);

        // Either main content mentions skills OR there are skill additional files
        const mainHasSkills = result.content.includes('skill') || result.content.includes('Skills');
        const hasSkillFiles = result.additionalFiles?.some((f) => f.path.includes('skills/'));

        expect(
          mainHasSkills || hasSkillFiles,
          `${config.name} full version should have skills`
        ).toBe(true);
      }
    });

    it('claude full version should have local memory file', () => {
      const ast = createCanonicalAST();
      const formatter = new ClaudeFormatter();
      const result = formatter.format(ast, { version: 'full' });

      const localFile = result.additionalFiles?.find((f) => f.path === 'CLAUDE.local.md');
      expect(localFile, 'Claude full should generate CLAUDE.local.md').toBeDefined();
    });

    it('multifile versions should generate additional files', () => {
      // opencode multifile only generates command files when shortcuts use object
      // syntax ({ prompt: true } or { content: ... }); the canonical AST uses plain
      // string shortcuts so no additional files are produced in multifile mode.
      // Skills appear only in full mode for opencode, matching the platform model.
      const skipMultifileAdditional = new Set(['opencode']);
      const multifileConfigs = versionedConfigs.filter(
        (c) => c.version === 'multifile' && !skipMultifileAdditional.has(c.name)
      );

      for (const config of multifileConfigs) {
        const ast = createCanonicalAST();
        const result = config.formatter.format(ast, config.options);

        expect(
          result.additionalFiles?.length,
          `${config.name} multifile should generate additional files`
        ).toBeGreaterThan(0);
      }
    });
  });

  describe('Structural Validation', () => {
    it.each(versionedConfigs)(
      '$name ($version) output should have proper markdown structure',
      ({ name, version, formatter, extension, options }) => {
        // Skip non-markdown formatters
        if (extension !== 'md') return;

        const ast = createCanonicalAST();
        const result = formatter.format(ast, options);

        // Check for proper header hierarchy
        const headers = result.content.match(/^#{1,3}\s+.+$/gm) || [];
        expect(headers.length, `${name} (${version}) should have multiple headers`).toBeGreaterThan(
          1
        );

        // Check for no unclosed code blocks
        const codeBlocks = result.content.match(/```/g) || [];
        expect(codeBlocks.length % 2, `${name} (${version}) should have balanced code blocks`).toBe(
          0
        );
      }
    );

    it('all 37 formatters should produce output with a valid path', () => {
      const ast = createCanonicalAST();

      const allFormatters = [
        new GitHubFormatter(),
        new ClaudeFormatter(),
        new CursorFormatter(),
        new AntigravityFormatter(),
        new FactoryFormatter(),
        new OpenCodeFormatter(),
        new GeminiFormatter(),
        new WindsurfFormatter(),
        new ClineFormatter(),
        new RooFormatter(),
        new CodexFormatter(),
        new ContinueFormatter(),
        new AugmentFormatter(),
        new GooseFormatter(),
        new KiloFormatter(),
        new AmpFormatter(),
        new TraeFormatter(),
        new JunieFormatter(),
        new KiroFormatter(),
        new CortexFormatter(),
        new CrushFormatter(),
        new CommandCodeFormatter(),
        new KodeFormatter(),
        new McpjamFormatter(),
        new MistralVibeFormatter(),
        new MuxFormatter(),
        new OpenHandsFormatter(),
        new PiFormatter(),
        new QoderFormatter(),
        new QwenCodeFormatter(),
        new ZencoderFormatter(),
        new NeovateFormatter(),
        new PochiFormatter(),
        new AdalFormatter(),
        new IflowFormatter(),
        new OpenClawFormatter(),
        new CodeBuddyFormatter(),
      ];

      expect(allFormatters.length).toBe(37);

      for (const formatter of allFormatters) {
        const result = formatter.format(ast);
        expect(result.path, `${formatter.name} should have an output path`).toBeTruthy();
        expect(
          result.content.length,
          `${formatter.name} should have non-empty content`
        ).toBeGreaterThan(50);
      }
    });
  });
});
