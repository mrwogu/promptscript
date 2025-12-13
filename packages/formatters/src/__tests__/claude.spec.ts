import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { ClaudeFormatter, CLAUDE_VERSIONS } from '../formatters/claude';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

const createMinimalProgram = (): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
});

describe('ClaudeFormatter', () => {
  let formatter: ClaudeFormatter;

  beforeEach(() => {
    formatter = new ClaudeFormatter();
  });

  it('should have correct name, outputPath and description', () => {
    expect(formatter.name).toBe('claude');
    expect(formatter.outputPath).toBe('CLAUDE.md');
    expect(formatter.description).toBe('Claude Code instructions (concise Markdown)');
  });

  describe('convention support', () => {
    it('should support markdown convention (default)', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Test project',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.content).toContain('## Project');
    });

    it('should support xml convention', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Test project',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { convention: 'xml' });
      // XML convention transforms names to kebab-case
      expect(result.content).toContain('<project>');
      expect(result.content).toContain('</project>');
      // XML convention should not include markdown header
      expect(result.content.startsWith('# CLAUDE.md')).toBe(false);
    });

    it('should default to markdown when no convention specified', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Test project',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast);
      expect(result.content).toContain('## Project');
    });
  });

  describe('format', () => {
    it('should always start with CLAUDE.md header', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);
      expect(result.path).toBe('CLAUDE.md');
      expect(result.content.startsWith('# CLAUDE.md\n')).toBe(true);
    });

    it('should generate project section from identity block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Checkout microservice for e-commerce platform.\nMore details here.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Project');
      expect(result.content).toContain('Checkout microservice for e-commerce platform.');
      // Full identity text is now included for completeness
      expect(result.content).toContain('More details here.');
    });

    it('should generate tech stack as comma-separated list', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  languages: ['TypeScript'],
                  frameworks: ['React 18', 'TanStack Query'],
                  testing: ['Vitest'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Tech Stack');
      expect(result.content).toContain('TypeScript, React 18, TanStack Query, Vitest');
    });

    it('should generate commands section as code block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Code review',
                '/test': 'Write tests',
                '/docs': 'Generate docs',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Commands');
      expect(result.content).toContain('```\n');
      expect(result.content).toContain('/review');
      expect(result.content).toContain('Code review');
      expect(result.content).toContain('/test');
      expect(result.content).toContain('Write tests');
      expect(result.content).toContain('/docs');
      expect(result.content).toContain('Generate docs');
    });

    it('should truncate long command descriptions', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/cmd': 'This is a very long description that should be truncated at 40 characters',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('/cmd');
      expect(result.content).toContain('This is a very long description that sho');
      expect(result.content).not.toContain('truncated at 40 characters');
    });

    it('should generate code style section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  style: ['Functional React', 'Custom hooks for logic'],
                  patterns: ['Named exports only'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Code Style');
      expect(result.content).toContain('- Functional React');
      expect(result.content).toContain('- Custom hooks for logic');
      expect(result.content).toContain('- Named exports only');
    });

    it("should generate don'ts section from restrictions", () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['No secrets in code', 'No any types'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("## Don'ts");
      expect(result.content).toContain('- No secrets in code');
      expect(result.content).toContain('- No any types');
    });

    it("should handle text content for don'ts section", () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: 'No secrets\nNo any types\n- Already has dash',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("## Don'ts");
      expect(result.content).toContain('- No secrets');
      expect(result.content).toContain('- No any types');
      expect(result.content).toContain('- Already has dash');
    });

    it('should skip empty sections', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {},
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('## Commands');
    });

    it('should handle single value arrays', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  languages: 'TypeScript',
                  frameworks: 'React',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('TypeScript, React');
    });

    it('should skip donts section when content is ObjectContent', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                key: 'value',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain("## Don'ts");
    });

    it('should extract donts items from ObjectContent with items array', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                items: ['Never use any type', 'Never skip tests', 'Never commit secrets'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("## Don'ts");
      // Claude formatter transforms "Never" to "Don't"
      expect(result.content).toContain("- Don't use any type");
      expect(result.content).toContain("- Don't skip tests");
      expect(result.content).toContain("- Don't commit secrets");
    });
  });

  describe('version support', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should export CLAUDE_VERSIONS', () => {
      expect(CLAUDE_VERSIONS).toBeDefined();
      expect(CLAUDE_VERSIONS.simple).toBeDefined();
      expect(CLAUDE_VERSIONS.multifile).toBeDefined();
      expect(CLAUDE_VERSIONS.full).toBeDefined();
    });

    it('should have static getSupportedVersions method', () => {
      expect(ClaudeFormatter.getSupportedVersions).toBeDefined();
      expect(ClaudeFormatter.getSupportedVersions()).toBe(CLAUDE_VERSIONS);
    });

    it('should use simple mode by default', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);
      expect(result.additionalFiles).toBeUndefined();
    });

    it('should generate rule files in multifile mode with guards', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                globs: ['**/*.ts', '**/*.tsx'],
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
                typescript: { strictMode: true },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles?.length).toBeGreaterThan(0);
      const codeStyleRule = result.additionalFiles?.find((f) =>
        f.path.includes('.claude/rules/code-style.md')
      );
      expect(codeStyleRule).toBeDefined();
      expect(codeStyleRule?.content).toContain('paths:');
    });

    it('should generate skill files in full mode', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a helpful assistant.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                commit: {
                  description: 'Create git commits',
                  context: 'fork',
                  agent: 'general-purpose',
                  content: 'Instructions for commit skill...',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      expect(result.additionalFiles).toBeDefined();
      const skillFile = result.additionalFiles?.find((f) =>
        f.path.includes('.claude/skills/commit/SKILL.md')
      );
      expect(skillFile).toBeDefined();
      expect(skillFile?.content).toContain('name: "commit"');
      expect(skillFile?.content).toContain('description: "Create git commits"');
      expect(skillFile?.content).toContain('context: fork');
      expect(skillFile?.content).toContain('agent: general-purpose');
    });

    it('should generate CLAUDE.local.md in full mode with @local block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a helpful assistant.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
          {
            type: 'Block',
            name: 'local',
            content: {
              type: 'TextContent',
              value: 'Private instructions for local development.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      expect(result.additionalFiles).toBeDefined();
      const localFile = result.additionalFiles?.find((f) => f.path === 'CLAUDE.local.md');
      expect(localFile).toBeDefined();
      expect(localFile?.content).toContain('# CLAUDE.local.md');
      expect(localFile?.content).toContain('Private instructions');
      expect(localFile?.content).toContain('Private instructions for local development.');
    });

    it('should not generate local file when @local block is missing', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a helpful assistant.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const localFile = result.additionalFiles?.find((f) => f.path === 'CLAUDE.local.md');
      expect(localFile).toBeUndefined();
    });
  });
});
