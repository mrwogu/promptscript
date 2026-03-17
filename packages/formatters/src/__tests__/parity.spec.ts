import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github.js';
import { ClaudeFormatter } from '../formatters/claude.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { AntigravityFormatter } from '../formatters/antigravity.js';
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
import {
  extractSectionsFromOutput,
  normalizeSectionName,
  KNOWN_SECTIONS,
} from '../section-registry.js';
import type { Formatter } from '../types.js';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

/**
 * Create a comprehensive test AST that includes all possible sections.
 * This simulates a real-world PRS file with all blocks populated.
 */
function createComprehensiveAST(): Program {
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
          value: 'You are an expert developer.\nYou write clean code.\nYou follow best practices.',
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

The project structure:

\`\`\`mermaid
flowchart TB
  A --> B
  B --> C
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
              exports: 'named only',
            },
            naming: {
              files: 'kebab-case.ts',
              classes: 'PascalCase',
              functions: 'camelCase',
              constants: 'UPPER_SNAKE_CASE',
            },
            errors: {
              customClasses: 'PSError',
              locationInfo: true,
              messages: 'actionable',
            },
            testing: {
              filePattern: '*.spec.ts',
              pattern: 'AAA',
              coverage: 90,
              framework: 'vitest',
            },
            git: {
              format: 'Conventional Commits',
              maxSubjectLength: 70,
              types: ['feat', 'fix', 'docs', 'test'],
              example: 'feat(parser): add support',
            },
            config: {
              eslint: 'inherit from base',
              viteRoot: '__dirname',
            },
            documentation: {
              verifyBefore: true,
              verifyAfter: true,
              codeExamples: 'keep accurate',
            },
            diagrams: {
              format: 'Mermaid',
              types: ['flowchart', 'sequence'],
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
            '/review': 'Review code for quality',
            '/test': 'Write unit tests',
            '/build': 'Run build commands',
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
pnpm install
pnpm build
\`\`\`

## Post-Work Verification

After changes, run:
\`\`\`bash
pnpm test
pnpm lint
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
          elements: ['Never use any type', 'Never skip tests', 'Never commit secrets'],
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };
}

/**
 * Build the full list of all 37 formatters.
 */
function buildAllFormatters(): Formatter[] {
  return [
    // Tier 0 — original formatters
    new GitHubFormatter(),
    new ClaudeFormatter(),
    new CursorFormatter(),
    new AntigravityFormatter(),
    new FactoryFormatter(),
    new OpenCodeFormatter(),
    new GeminiFormatter(),
    // Tier 1
    new WindsurfFormatter(),
    new ClineFormatter(),
    new RooFormatter(),
    new CodexFormatter(),
    new ContinueFormatter(),
    // Tier 2
    new AugmentFormatter(),
    new GooseFormatter(),
    new KiloFormatter(),
    new AmpFormatter(),
    new TraeFormatter(),
    new JunieFormatter(),
    new KiroFormatter(),
    // Tier 3
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
}

describe('Formatter Parity Tests', () => {
  let formatters: Formatter[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    formatters = buildAllFormatters();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Formatter Count', () => {
    it('should have all 37 formatters registered', () => {
      expect(formatters.length).toBe(37);
    });

    it('all formatters should have unique names', () => {
      const names = formatters.map((f) => f.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(formatters.length);
    });
  });

  describe('Section Coverage', () => {
    it('all formatters should generate project section', () => {
      const ast = createComprehensiveAST();

      for (const formatter of formatters) {
        const result = formatter.format(ast);

        // For markdown formatters, check section header
        // For plain text formatters like Cursor, check for project-related content
        if (formatter.name === 'cursor') {
          // Cursor outputs either "working on" or a role statement like "You are"
          const hasProjectInfo =
            result.content.toLowerCase().includes('working on') ||
            result.content.toLowerCase().includes('you are');
          expect(hasProjectInfo, `${formatter.name} should mention the project`).toBe(true);
        } else {
          const sections = extractSectionsFromOutput(result.content).map(normalizeSectionName);
          expect(sections, `${formatter.name} should have project section`).toContain('project');
        }
      }
    });

    it('all formatters should generate restrictions/donts section', () => {
      const ast = createComprehensiveAST();

      for (const formatter of formatters) {
        const result = formatter.format(ast);

        // For Cursor, check for "Never:" label
        // For markdown formatters, check section headers
        if (formatter.name === 'cursor') {
          expect(
            result.content.includes('Never:') || result.content.includes('never'),
            `${formatter.name} should have restrictions`
          ).toBe(true);
        } else {
          const sections = extractSectionsFromOutput(result.content).map(normalizeSectionName);
          expect(
            sections.some((s) => s === 'restrictions' || s === 'donts'),
            `${formatter.name} should have restrictions section, got: ${sections.join(', ')}`
          ).toBe(true);
        }
      }
    });

    it('all formatters should generate commands section when shortcuts exist', () => {
      const ast = createComprehensiveAST();

      for (const formatter of formatters) {
        const result = formatter.format(ast);

        // For Cursor, check for "Commands:" label
        // For markdown formatters, check section headers
        if (formatter.name === 'cursor') {
          expect(
            result.content.includes('Commands:') || result.content.includes('/review'),
            `${formatter.name} should have commands`
          ).toBe(true);
        } else {
          const sections = extractSectionsFromOutput(result.content).map(normalizeSectionName);
          expect(
            sections.some((s) => s.includes('command')),
            `${formatter.name} should have commands section, got: ${sections.join(', ')}`
          ).toBe(true);
        }
      }
    });

    it('markdown formatters should generate tech-stack section when context has tech info', () => {
      const ast = createComprehensiveAST();

      // Only check markdown-based formatters (all except cursor)
      const mdFormatters = formatters.filter((f) => f.name !== 'cursor');

      for (const formatter of mdFormatters) {
        const result = formatter.format(ast);
        const sections = extractSectionsFromOutput(result.content).map(normalizeSectionName);

        expect(
          sections.some((s) => s.includes('tech') || s.includes('stack')),
          `${formatter.name} should have tech-stack section, got: ${sections.join(', ')}`
        ).toBe(true);
      }
    });
  });

  describe('Content Completeness', () => {
    it('project section should include full identity text for verbose formatters', () => {
      const ast = createComprehensiveAST();

      // GitHub and Cursor should include full identity
      for (const formatter of [new GitHubFormatter(), new CursorFormatter()]) {
        const result = formatter.format(ast);
        expect(result.content, `${formatter.name} should include full identity`).toContain(
          'You are an expert developer'
        );
      }
    });

    it('all formatters should preserve mermaid diagrams', () => {
      const ast = createComprehensiveAST();

      for (const formatter of formatters) {
        const result = formatter.format(ast);

        // Check for mermaid code block
        if (result.content.includes('mermaid') || result.content.includes('Architecture')) {
          expect(
            result.content,
            `${formatter.name} should have properly closed mermaid blocks`
          ).not.toMatch(/```mermaid[\s\S]*?````/); // Should not have 4 backticks
        }
      }
    });

    it('restrictions should be formatted appropriately per formatter style', () => {
      const ast = createComprehensiveAST();

      for (const formatter of formatters) {
        const result = formatter.format(ast);

        // Each formatter has its own style:
        // - GitHub/Claude: converts "Never" to "Don't"
        // - Cursor: keeps "Never" format
        const hasRestrictions =
          result.content.includes("Don't") ||
          result.content.includes('Never') ||
          result.content.includes('No ');

        expect(
          hasRestrictions,
          `${formatter.name} should include restrictions in some format`
        ).toBe(true);
      }
    });

    it('all formatters should produce non-empty output', () => {
      const ast = createComprehensiveAST();

      for (const formatter of formatters) {
        const result = formatter.format(ast);
        expect(
          result.content.length,
          `${formatter.name} should produce non-empty output`
        ).toBeGreaterThan(50);
        expect(result.path, `${formatter.name} should have an output path`).toBeTruthy();
      }
    });
  });

  describe('Required Sections per Formatter', () => {
    it.each([
      ['github'],
      ['claude'],
      ['cursor'],
      ['antigravity'],
      ['factory'],
      ['opencode'],
      ['gemini'],
      ['windsurf'],
      ['cline'],
      ['roo'],
      ['codex'],
      ['continue'],
      ['augment'],
      ['goose'],
      ['kilo'],
      ['amp'],
      ['trae'],
      ['junie'],
      ['kiro'],
      ['cortex'],
      ['crush'],
      ['command-code'],
      ['kode'],
      ['mcpjam'],
      ['mistral-vibe'],
      ['mux'],
      ['openhands'],
      ['pi'],
      ['qoder'],
      ['qwen-code'],
      ['zencoder'],
      ['neovate'],
      ['pochi'],
      ['adal'],
      ['iflow'],
      ['openclaw'],
      ['codebuddy'],
    ])('%s formatter should produce identity content', (formatterName) => {
      const ast = createComprehensiveAST();
      const formatter = formatters.find((f) => f.name === formatterName)!;
      expect(formatter, `Formatter ${formatterName} should exist`).toBeDefined();

      const result = formatter.format(ast);
      const hasIdentity =
        result.content.includes('You are') ||
        result.content.includes('developer') ||
        result.content.includes('expert');

      expect(hasIdentity, `${formatterName} should include identity content`).toBe(true);
    });

    it.each([
      ['github'],
      ['claude'],
      ['cursor'],
      ['antigravity'],
      ['factory'],
      ['opencode'],
      ['gemini'],
      ['windsurf'],
      ['cline'],
      ['roo'],
      ['codex'],
      ['continue'],
      ['augment'],
      ['goose'],
      ['kilo'],
      ['amp'],
      ['trae'],
      ['junie'],
      ['kiro'],
      ['cortex'],
      ['crush'],
      ['command-code'],
      ['kode'],
      ['mcpjam'],
      ['mistral-vibe'],
      ['mux'],
      ['openhands'],
      ['pi'],
      ['qoder'],
      ['qwen-code'],
      ['zencoder'],
      ['neovate'],
      ['pochi'],
      ['adal'],
      ['iflow'],
      ['openclaw'],
      ['codebuddy'],
    ])('%s formatter should produce restrictions content', (formatterName) => {
      const ast = createComprehensiveAST();
      const formatter = formatters.find((f) => f.name === formatterName)!;
      expect(formatter, `Formatter ${formatterName} should exist`).toBeDefined();

      const result = formatter.format(ast);
      const hasRestrictions =
        result.content.includes("Don't") ||
        result.content.includes('Never') ||
        result.content.includes('never') ||
        result.content.includes('avoid');

      expect(hasRestrictions, `${formatterName} should include restrictions`).toBe(true);
    });
  });

  describe('Section Parity Report', () => {
    it('should report section coverage for all formatters', () => {
      const ast = createComprehensiveAST();
      const coverage: Record<string, string[]> = {};

      for (const formatter of formatters) {
        const result = formatter.format(ast);
        coverage[formatter.name] = extractSectionsFromOutput(result.content).map(
          normalizeSectionName
        );
      }

      // Log coverage for debugging/documentation
      const allSections = new Set<string>();
      Object.values(coverage).forEach((sections) => {
        sections.forEach((s) => allSections.add(s));
      });

      // This test always passes but provides visibility into coverage
      expect(Object.keys(coverage).length).toBe(formatters.length);

      // Verify known sections are documented
      for (const knownSection of KNOWN_SECTIONS) {
        const supportedBy = Object.entries(coverage)
          .filter(([, sections]) =>
            sections.some(
              (s) => s === knownSection.id || s === normalizeSectionName(knownSection.id)
            )
          )
          .map(([name]) => name);

        // If a section is required, at least one formatter should support it
        if (knownSection.required) {
          expect(
            supportedBy.length,
            `Required section ${knownSection.id} should be supported by at least one formatter`
          ).toBeGreaterThan(0);
        }
      }
    });
  });
});
