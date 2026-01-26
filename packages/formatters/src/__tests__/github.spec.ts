import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter, GITHUB_VERSIONS } from '../formatters/github.js';

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

describe('GitHubFormatter', () => {
  let formatter: GitHubFormatter;

  beforeEach(() => {
    formatter = new GitHubFormatter();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have correct name, outputPath, description and defaultConvention', () => {
    expect(formatter.name).toBe('github');
    expect(formatter.outputPath).toBe('.github/copilot-instructions.md');
    expect(formatter.description).toBe('GitHub Copilot instructions (Markdown)');
    expect(formatter.defaultConvention).toBe('markdown');
  });

  describe('format with default Markdown convention', () => {
    it('should generate project section from identity block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a helpful coding assistant.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## project');
      expect(result.content).toContain('You are a helpful coding assistant.');
    });

    it('should generate restrictions as donts section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never expose secrets', 'Always validate input'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## donts');
      expect(result.content).toContain("- Don't expose secrets");
      expect(result.content).toContain('- Always validate input');
    });

    it('should generate restrictions from text content', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: 'No secrets in code',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## donts');
      expect(result.content).toContain('No secrets in code');
    });

    it('should skip sections with empty content', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
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
      expect(result.content).not.toContain('## code-standards');
      expect(result.content).not.toContain('## tech-stack');
    });

    it('should ignore blocks starting with __', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: '__internal',
            content: {
              type: 'TextContent',
              value: 'Internal content',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Internal content');
    });

    it('should skip restrictions section when content is ObjectContent', () => {
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
      expect(result.content).not.toContain('## donts');
    });

    it('should use kebab-case for section names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                testing: {
                  coverage: 80,
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## code-standards');
    });
  });

  describe('format with XML convention', () => {
    it('should generate project section with XML tags', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a helpful coding assistant.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { convention: 'xml' });
      expect(result.content).toContain('<project>');
      expect(result.content).toContain('You are a helpful coding assistant.');
      expect(result.content).toContain('</project>');
    });

    it('should generate donts section with XML tags', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never expose secrets'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { convention: 'xml' });
      expect(result.content).toContain('<donts>');
      expect(result.content).toContain("- Don't expose secrets");
      expect(result.content).toContain('</donts>');
    });
  });

  describe('format with explicit markdown convention', () => {
    it('should generate header with meta information', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        meta: {
          type: 'MetaBlock',
          fields: { id: 'my-project', syntax: '1.0.0' },
          loc: createLoc(),
        },
      };

      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.path).toBe('.github/copilot-instructions.md');
      expect(result.content).toContain('# GitHub Copilot Instructions');
      expect(result.content).toContain('Source: my-project (syntax 1.0.0)');
      expect(result.content).toContain('Generated: 2024-01-01T00:00:00.000Z');
      expect(result.content).toContain('**Do not edit manually**');
    });

    it('should handle missing meta with defaults', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.content).toContain('Source: unknown (syntax 0.0.0)');
    });

    it('should generate project section with ## header', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a helpful coding assistant.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.content).toContain('## project');
      expect(result.content).toContain('You are a helpful coding assistant.');
    });

    it('should generate donts section with ## header', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never expose secrets', 'Always validate input'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.content).toContain('## donts');
      expect(result.content).toContain("- Don't expose secrets");
    });
  });

  describe('format with custom output path', () => {
    it('should use custom output path when provided', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { outputPath: 'custom/path.md' });
      expect(result.path).toBe('custom/path.md');
    });
  });

  describe('version support', () => {
    it('should export GITHUB_VERSIONS', () => {
      expect(GITHUB_VERSIONS).toBeDefined();
      expect(GITHUB_VERSIONS.simple).toBeDefined();
      expect(GITHUB_VERSIONS.multifile).toBeDefined();
      expect(GITHUB_VERSIONS.full).toBeDefined();
    });

    it('should have static getSupportedVersions method', () => {
      expect(GitHubFormatter.getSupportedVersions).toBeDefined();
      expect(GitHubFormatter.getSupportedVersions()).toBe(GITHUB_VERSIONS);
    });

    it('should use simple mode by default', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);
      expect(result.additionalFiles).toBeUndefined();
    });

    it('should generate instruction files in multifile mode with guards', () => {
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
      const tsInstructions = result.additionalFiles?.find((f) =>
        f.path.includes('typescript.instructions.md')
      );
      expect(tsInstructions).toBeDefined();
      expect(tsInstructions?.content).toContain('applyTo:');
    });

    it('should generate AGENTS.md in full mode', () => {
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
      expect(result.additionalFiles).toBeDefined();
      const agentsFile = result.additionalFiles?.find((f) => f.path === 'AGENTS.md');
      expect(agentsFile).toBeDefined();
      expect(agentsFile?.content).toContain('# Agent Instructions');
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
                  disableModelInvocation: true,
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
        f.path.includes('.github/skills/commit/SKILL.md')
      );
      expect(skillFile).toBeDefined();
      expect(skillFile?.content).toContain("name: 'commit'");
      expect(skillFile?.content).toContain("description: 'Create git commits'");
      expect(skillFile?.content).toContain('disable-model-invocation: true');
    });

    it('should generate custom agent files in full mode', () => {
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
                  description: 'Code review specialist',
                  tools: ['read_file', 'grep_search'],
                  content: 'You specialize in code reviews.',
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
        f.path.includes('.github/agents/code-reviewer.md')
      );
      expect(agentFile).toBeDefined();
      expect(agentFile?.content).toContain('name: code-reviewer');
      expect(agentFile?.content).toContain('description: Code review specialist');
      // Tools should be in inline YAML array format with GitHub Copilot canonical names
      expect(agentFile?.content).toContain("tools: ['read_file', 'grep_search']");
      expect(agentFile?.content).toContain('You specialize in code reviews.');
    });

    it('should generate agent file with minimal config', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                helper: {
                  description: 'A helpful agent',
                  content: 'You are a helpful agent.',
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
        f.path.includes('.github/agents/helper.md')
      );
      expect(agentFile).toBeDefined();
      expect(agentFile?.content).toContain('name: helper');
      expect(agentFile?.content).toContain('You are a helpful agent.');
      // Should not have tools if not provided
      expect(agentFile?.content).not.toContain('tools:');
    });

    it('should generate agent file with model selection', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                'smart-agent': {
                  description: 'Agent using a specific model',
                  model: 'gpt-4o',
                  content: 'You are a smart agent.',
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
        f.path.includes('.github/agents/smart-agent.md')
      );
      expect(agentFile).toBeDefined();
      expect(agentFile?.content).toContain('name: smart-agent');
      // gpt-4o should be mapped to GPT-4o
      expect(agentFile?.content).toContain('model: GPT-4o');
    });

    it('should map Claude Code model names to GitHub Copilot format', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                reviewer: {
                  description: 'Code reviewer with sonnet model',
                  model: 'sonnet',
                  content: 'Reviews code.',
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
        f.path.includes('.github/agents/reviewer.md')
      );
      expect(agentFile).toBeDefined();
      // 'sonnet' should be mapped to 'Claude Sonnet 4.5' (latest version)
      expect(agentFile?.content).toContain('model: Claude Sonnet 4.5');
    });

    it('should omit model property when set to inherit', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                helper: {
                  description: 'Helper with inherited model',
                  model: 'inherit',
                  content: 'Helps with tasks.',
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
        f.path.includes('.github/agents/helper.md')
      );
      expect(agentFile).toBeDefined();
      // 'inherit' should result in no model property
      expect(agentFile?.content).not.toContain('model:');
    });

    it('should map all Claude model aliases correctly', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                'opus-agent': {
                  description: 'Agent with opus model',
                  model: 'opus',
                  content: 'Uses opus.',
                },
                'haiku-agent': {
                  description: 'Agent with haiku model',
                  model: 'haiku',
                  content: 'Uses haiku.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const opusAgent = result.additionalFiles?.find((f) =>
        f.path.includes('.github/agents/opus-agent.md')
      );
      expect(opusAgent).toBeDefined();
      expect(opusAgent?.content).toContain('model: Claude Opus 4.5');

      const haikuAgent = result.additionalFiles?.find((f) =>
        f.path.includes('.github/agents/haiku-agent.md')
      );
      expect(haikuAgent).toBeDefined();
      expect(haikuAgent?.content).toContain('model: Claude Haiku 4.5');
    });

    it('should pass through unknown model names as-is', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                custom: {
                  description: 'Agent with custom model',
                  model: 'Gemini 2.5 Pro',
                  content: 'Uses custom model.',
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
        f.path.includes('.github/agents/custom.md')
      );
      expect(agentFile).toBeDefined();
      // Unknown model names should pass through unchanged
      expect(agentFile?.content).toContain('model: Gemini 2.5 Pro');
    });

    it('should handle multiple agents', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                reviewer: {
                  description: 'Code reviewer',
                  content: 'Review code.',
                },
                debugger: {
                  description: 'Debug specialist',
                  content: 'Debug issues.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const reviewerFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/agents/reviewer.md')
      );
      const debuggerFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/agents/debugger.md')
      );
      expect(reviewerFile).toBeDefined();
      expect(debuggerFile).toBeDefined();
    });

    it('should not generate agents in standard mode', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                helper: {
                  content: 'You are a helpful agent.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'standard' });
      const agentFile = result.additionalFiles?.find((f) => f.path.includes('.github/agents/'));
      expect(agentFile).toBeUndefined();
    });

    it('should parse tools from comma-separated string', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                helper: {
                  description: 'Helper agent with tools',
                  tools: ['read_file', 'write_file', 'run_terminal'],
                  content: 'Agent with tools.',
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
        f.path.includes('.github/agents/helper.md')
      );
      expect(agentFile).toBeDefined();
      // Tools should be in inline YAML array format
      expect(agentFile?.content).toContain("tools: ['read_file', 'write_file', 'run_terminal']");
    });

    it('should map Claude Code tool names to GitHub Copilot canonical names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                reviewer: {
                  description: 'Code reviewer with Claude Code tools',
                  tools: ['Read', 'Grep', 'Glob', 'Bash'],
                  content: 'Reviews code.',
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
        f.path.includes('.github/agents/reviewer.md')
      );
      expect(agentFile).toBeDefined();
      // Claude Code tools should be mapped: Read->read, Grep+Glob->search (deduplicated), Bash->execute
      expect(agentFile?.content).toContain("tools: ['read', 'search', 'execute']");
    });

    it('should deduplicate tools that map to the same GitHub Copilot tool', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                searcher: {
                  description: 'Agent with duplicate search tools',
                  tools: ['Grep', 'Glob', 'Grep'], // Both map to 'search'
                  content: 'Searches code.',
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
        f.path.includes('.github/agents/searcher.md')
      );
      expect(agentFile).toBeDefined();
      // Should only have 'search' once, not duplicated
      expect(agentFile?.content).toContain("tools: ['search']");
      expect(agentFile?.content).not.toContain("['search', 'search']");
    });

    it('should map all supported Claude Code tools correctly', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                'full-agent': {
                  description: 'Agent with all tool types',
                  tools: ['Read', 'Edit', 'Write', 'WebFetch', 'WebSearch', 'Task', 'TodoWrite'],
                  content: 'Full featured agent.',
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
        f.path.includes('.github/agents/full-agent.md')
      );
      expect(agentFile).toBeDefined();
      // Edit and Write both map to 'edit', WebFetch and WebSearch both map to 'web'
      expect(agentFile?.content).toContain("tools: ['read', 'edit', 'web', 'agent', 'todo']");
    });

    it('should lowercase unknown tools that are not in the mapping', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                custom: {
                  description: 'Agent with custom tools',
                  tools: ['CustomTool', 'AnotherTool', 'read'], // Custom + already lowercase
                  content: 'Custom agent.',
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
        f.path.includes('.github/agents/custom.md')
      );
      expect(agentFile).toBeDefined();
      // Unknown tools should be lowercased
      expect(agentFile?.content).toContain("tools: ['customtool', 'anothertool', 'read']");
    });
  });
});
