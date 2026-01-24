import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { ClaudeFormatter, CLAUDE_VERSIONS } from '../formatters/claude.js';

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

    it('should show full command descriptions (first line only)', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/cmd': 'This is a very long description that is shown in full',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('/cmd');
      // Full first line is shown (no truncation)
      expect(result.content).toContain('This is a very long description that is shown in full');
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
      expect(skillFile?.content).toContain("name: 'commit'");
      expect(skillFile?.content).toContain("description: 'Create git commits'");
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

    describe('agent file generation', () => {
      it('should generate agent files in full mode with @agents block', () => {
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
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'code-reviewer': {
                    description: 'Reviews code for quality and best practices',
                    tools: ['Read', 'Grep', 'Glob', 'Bash'],
                    model: 'sonnet',
                    content: 'You are a senior code reviewer.',
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
        const agentFile = result.additionalFiles?.find((f) =>
          f.path.includes('.claude/agents/code-reviewer.md')
        );
        expect(agentFile).toBeDefined();
        expect(agentFile?.content).toContain('name: code-reviewer');
        expect(agentFile?.content).toContain(
          'description: Reviews code for quality and best practices'
        );
        expect(agentFile?.content).toContain('tools: Read, Grep, Glob, Bash');
        expect(agentFile?.content).toContain('model: sonnet');
        expect(agentFile?.content).toContain('You are a senior code reviewer.');
      });

      it('should generate agent with all supported fields', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'db-reader': {
                    description: 'Execute read-only database queries',
                    tools: ['Bash', 'Read'],
                    disallowedTools: ['Write', 'Edit'],
                    model: 'haiku',
                    permissionMode: 'dontAsk',
                    skills: ['sql-patterns', 'data-analysis'],
                    content: 'You are a database analyst with read-only access.',
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'full' });
        const agentFile = result.additionalFiles?.find((f) =>
          f.path.includes('.claude/agents/db-reader.md')
        );
        expect(agentFile).toBeDefined();
        expect(agentFile?.content).toContain('name: db-reader');
        expect(agentFile?.content).toContain('tools: Bash, Read');
        expect(agentFile?.content).toContain('disallowedTools: Write, Edit');
        expect(agentFile?.content).toContain('model: haiku');
        expect(agentFile?.content).toContain('permissionMode: dontAsk');
        expect(agentFile?.content).toContain('skills:');
        expect(agentFile?.content).toContain('  - sql-patterns');
        expect(agentFile?.content).toContain('  - data-analysis');
      });

      it('should generate multiple agent files', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'code-reviewer': {
                    description: 'Reviews code',
                    content: 'Review code carefully.',
                  },
                  debugger: {
                    description: 'Debug issues',
                    tools: ['Read', 'Edit', 'Bash'],
                    content: 'You are an expert debugger.',
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

        const reviewerFile = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/code-reviewer.md'
        );
        const debuggerFile = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/debugger.md'
        );

        expect(reviewerFile).toBeDefined();
        expect(debuggerFile).toBeDefined();
        expect(debuggerFile?.content).toContain('tools: Read, Edit, Bash');
      });

      it('should generate minimal agent with only required fields', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'simple-agent': {
                    description: 'A simple agent',
                    content: 'Do simple tasks.',
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'full' });
        const agentFile = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/simple-agent.md'
        );
        expect(agentFile).toBeDefined();
        expect(agentFile?.content).toContain('name: simple-agent');
        expect(agentFile?.content).toContain('description: A simple agent');
        expect(agentFile?.content).not.toContain('tools:');
        expect(agentFile?.content).not.toContain('model:');
        expect(agentFile?.content).not.toContain('permissionMode:');
        expect(agentFile?.content).toContain('Do simple tasks.');
      });

      it('should not generate agent files in simple mode', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'my-agent': {
                    description: 'An agent',
                    content: 'Agent content.',
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'simple' });
        expect(result.additionalFiles).toBeUndefined();
      });

      it('should not generate agent files in multifile mode', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'my-agent': {
                    description: 'An agent',
                    content: 'Agent content.',
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'multifile' });
        const agentFile = result.additionalFiles?.find((f) => f.path.includes('.claude/agents/'));
        expect(agentFile).toBeUndefined();
      });

      it('should skip agents without description', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'invalid-agent': {
                    content: 'No description provided.',
                  },
                  'valid-agent': {
                    description: 'Has description',
                    content: 'Agent content.',
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'full' });
        const invalidAgent = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/invalid-agent.md'
        );
        const validAgent = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/valid-agent.md'
        );

        expect(invalidAgent).toBeUndefined();
        expect(validAgent).toBeDefined();
      });

      it('should validate model values', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'test-agent': {
                    description: 'Test agent',
                    model: 'invalid-model',
                    content: 'Test content.',
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'full' });
        const agentFile = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/test-agent.md'
        );
        expect(agentFile).toBeDefined();
        // Invalid model should be omitted
        expect(agentFile?.content).not.toContain('model:');
      });

      it('should validate permissionMode values', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'agent-1': {
                    description: 'Valid permission',
                    permissionMode: 'acceptEdits',
                    content: 'Content.',
                  },
                  'agent-2': {
                    description: 'Invalid permission',
                    permissionMode: 'invalid-mode',
                    content: 'Content.',
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'full' });
        const agent1 = result.additionalFiles?.find((f) => f.path === '.claude/agents/agent-1.md');
        const agent2 = result.additionalFiles?.find((f) => f.path === '.claude/agents/agent-2.md');

        expect(agent1?.content).toContain('permissionMode: acceptEdits');
        expect(agent2?.content).not.toContain('permissionMode:');
      });

      it('should support all valid model types', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'agents',
              content: {
                type: 'ObjectContent',
                properties: {
                  'sonnet-agent': { description: 'Sonnet', model: 'sonnet', content: 'c' },
                  'opus-agent': { description: 'Opus', model: 'opus', content: 'c' },
                  'haiku-agent': { description: 'Haiku', model: 'haiku', content: 'c' },
                  'inherit-agent': { description: 'Inherit', model: 'inherit', content: 'c' },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'full' });

        const sonnetAgent = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/sonnet-agent.md'
        );
        const opusAgent = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/opus-agent.md'
        );
        const haikuAgent = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/haiku-agent.md'
        );
        const inheritAgent = result.additionalFiles?.find(
          (f) => f.path === '.claude/agents/inherit-agent.md'
        );

        expect(sonnetAgent?.content).toContain('model: sonnet');
        expect(opusAgent?.content).toContain('model: opus');
        expect(haikuAgent?.content).toContain('model: haiku');
        expect(inheritAgent?.content).toContain('model: inherit');
      });
    });
  });
});
