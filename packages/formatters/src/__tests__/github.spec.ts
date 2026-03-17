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
                testing: ['Target >80% coverage for libraries'],
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
    it('should generate header with title', () => {
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

    it('should use full mode by default', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                commit: {
                  description: 'Create git commits',
                  content: 'Instructions for commit skill...',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast);
      // Full mode produces skill files; simple mode would not
      expect(result.additionalFiles).toBeDefined();
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('skills/'));
      expect(skillFile).toBeDefined();
    });

    it('should default to full mode for unknown version', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                commit: {
                  description: 'Create git commits',
                  content: 'Instructions for commit skill...',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { version: 'unknown-version' });
      // Unknown versions fall back to full mode, which produces skill files
      expect(result.additionalFiles).toBeDefined();
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('skills/'));
      expect(skillFile).toBeDefined();
    });

    it('should skip markdown header with XML convention in multifile mode', () => {
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
      const result = formatter.format(ast, { version: 'multifile', convention: 'xml' });
      expect(result.content).not.toContain('# GitHub Copilot Instructions');
      expect(result.content).toContain('<project>');
    });

    it('should skip markdown header with XML convention in full mode', () => {
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
      const result = formatter.format(ast, { version: 'full', convention: 'xml' });
      expect(result.content).not.toContain('# GitHub Copilot Instructions');
      expect(result.content).toContain('<project>');
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
                typescript: [
                  'Strict mode enabled',
                  'Never use `any` type - use `unknown` with type guards',
                ],
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
      expect(skillFile?.content).toContain('name: commit');
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

    it('should generate agent file with specModel (mixed models)', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                planner: {
                  description: 'Planning agent with mixed models',
                  model: 'sonnet',
                  specModel: 'opus',
                  content: 'Plan features.',
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
        f.path.includes('.github/agents/planner.md')
      );
      expect(agentFile).toBeDefined();
      expect(agentFile?.content).toContain('model: Claude Sonnet 4.5');
      expect(agentFile?.content).toContain('specModel: Claude Opus 4.5');
    });

    it('should map specModel names to GitHub Copilot format', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                planner: {
                  description: 'Agent with GPT spec model',
                  model: 'sonnet',
                  specModel: 'gpt-4o',
                  content: 'Plan things.',
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
        f.path.includes('.github/agents/planner.md')
      );
      expect(agentFile?.content).toContain('model: Claude Sonnet 4.5');
      expect(agentFile?.content).toContain('specModel: GPT-4o');
    });

    it('should omit specModel when set to inherit', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                planner: {
                  description: 'Agent with inherit spec model',
                  model: 'opus',
                  specModel: 'inherit',
                  content: 'Plan things.',
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
        f.path.includes('.github/agents/planner.md')
      );
      expect(agentFile?.content).toContain('model: Claude Opus 4.5');
      expect(agentFile?.content).not.toContain('specModel:');
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

  describe('code-standards with arbitrary keys', () => {
    it('should generate subsections for any key in @standards', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: ['Use functional programming', 'Prefer hooks'],
                security: ['Validate all input', 'Never expose secrets'],
                api: ['Use REST conventions', 'Document endpoints'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## code-standards');
      expect(result.content).toContain('### code');
      expect(result.content).toContain('- Use functional programming');
      expect(result.content).toContain('- Prefer hooks');
      expect(result.content).toContain('### security');
      expect(result.content).toContain('- Validate all input');
      expect(result.content).toContain('- Never expose secrets');
      expect(result.content).toContain('### api');
      expect(result.content).toContain('- Use REST conventions');
      expect(result.content).toContain('- Document endpoints');
    });

    it('should map errors key to error-handling for backwards compatibility', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                errors: ['Handle all exceptions', 'Log errors properly'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('### error-handling');
      expect(result.content).toContain('- Handle all exceptions');
    });
  });

  describe('shortcuts section', () => {
    it('should generate shortcuts section for simple string shortcuts', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Review code for quality',
                '/test': 'Write unit tests',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## shortcuts');
      expect(result.content).toContain('- /review: Review code for quality');
      expect(result.content).toContain('- /test: Write unit tests');
    });

    it('should use only first line for multi-line shortcuts', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/test': 'Write tests using:\n- Vitest\n- AAA pattern',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('- /test: Write tests using:');
      expect(result.content).not.toContain('- Vitest');
    });

    it('should exclude shortcuts with prompt: true from shortcuts section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Review code',
                '/deploy': {
                  prompt: true,
                  description: 'Deploy app',
                  content: 'Deploy the application',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## shortcuts');
      expect(result.content).toContain('- /review: Review code');
      expect(result.content).not.toContain('/deploy');
    });

    it('should use description for object shortcuts without prompt: true', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/build': {
                  description: 'Build the project',
                  steps: ['Run lint', 'Run tests', 'Build'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## shortcuts');
      expect(result.content).toContain('- /build: Build the project');
    });
  });

  describe('prompt files in multifile mode', () => {
    it('should generate prompt files in multifile mode', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                review: {
                  prompt: true,
                  description: 'Review code',
                  content: 'Review the code carefully.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      expect(result.additionalFiles).toBeDefined();
      const promptFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/prompts/review.prompt.md')
      );
      expect(promptFile).toBeDefined();
      expect(promptFile?.content).toContain("description: 'Review code'");
      expect(promptFile?.content).toContain('Review the code carefully.');
    });
  });

  describe('named instruction blocks within guards', () => {
    it('should generate instruction files from named blocks with applyTo', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                globs: ['**/*.ts'],
                security: {
                  applyTo: ['src/auth/**/*.ts', 'src/crypto/**/*.ts'],
                  description: 'Security-sensitive code rules',
                  content: 'All auth code must use bcrypt.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      expect(result.additionalFiles).toBeDefined();
      const securityFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/instructions/security.instructions.md')
      );
      expect(securityFile).toBeDefined();
      expect(securityFile?.content).toContain('applyTo:');
      expect(securityFile?.content).toContain('"src/auth/**/*.ts"');
      expect(securityFile?.content).toContain('"src/crypto/**/*.ts"');
      expect(securityFile?.content).toContain('# Security-sensitive code rules');
      expect(securityFile?.content).toContain('All auth code must use bcrypt.');
    });

    it('should generate instruction file with excludeAgent', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                globs: ['**/*.ts'],
                testing: {
                  applyTo: ['**/*.spec.ts'],
                  excludeAgent: 'code-reviewer',
                  description: 'Test file rules',
                  content: 'Use vitest for testing.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const testFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/instructions/testing.instructions.md')
      );
      expect(testFile).toBeDefined();
      expect(testFile?.content).toContain('excludeAgent: "code-reviewer"');
    });

    it('should use default description for named instruction blocks', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                globs: ['**/*.ts'],
                styles: {
                  applyTo: ['**/*.css'],
                  content: 'Use BEM naming.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const stylesFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/instructions/styles.instructions.md')
      );
      expect(stylesFile).toBeDefined();
      expect(stylesFile?.content).toContain('# styles rules');
    });
  });

  describe('prompt file tools without agent mode', () => {
    it('should render tools independently of mode in prompt files', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                review: {
                  prompt: true,
                  description: 'Review code',
                  tools: ['Read', 'Grep'],
                  content: 'Review the code...',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const promptFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/prompts/review.prompt.md')
      );
      expect(promptFile).toBeDefined();
      // Tools should be rendered even without mode: agent
      expect(promptFile?.content).toContain("tools: ['read', 'search']");
      expect(promptFile?.content).not.toContain('mode:');
    });

    it('should render both mode and tools when mode is agent', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                deploy: {
                  prompt: true,
                  description: 'Deploy app',
                  mode: 'agent',
                  tools: ['Bash'],
                  content: 'Deploy the application...',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const promptFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/prompts/deploy.prompt.md')
      );
      expect(promptFile).toBeDefined();
      expect(promptFile?.content).toContain('mode: agent');
      expect(promptFile?.content).toContain("tools: ['execute']");
    });
  });

  describe('handoffs in prompt files', () => {
    it('should render handoffs in prompt file frontmatter', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                'monitor-ci': {
                  prompt: true,
                  description: 'Monitor CI pipeline',
                  handoffs: [
                    {
                      label: 'Delegate to CI monitor',
                      agent: 'ci-monitor-subagent',
                      prompt: 'Monitor the CI pipeline',
                    },
                  ],
                  content: 'You are the CI monitor...',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const promptFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/prompts/monitor-ci.prompt.md')
      );
      expect(promptFile).toBeDefined();
      expect(promptFile?.content).toContain('handoffs:');
      expect(promptFile?.content).toContain("label: 'Delegate to CI monitor'");
      expect(promptFile?.content).toContain('agent: ci-monitor-subagent');
      expect(promptFile?.content).toContain("prompt: 'Monitor the CI pipeline'");
    });

    it('should render handoff with send: true', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                deploy: {
                  prompt: true,
                  description: 'Deploy',
                  handoffs: [
                    {
                      label: 'Auto deploy',
                      agent: 'deployer',
                      prompt: 'Deploy now',
                      send: true,
                    },
                  ],
                  content: 'Deploy steps...',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const promptFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/prompts/deploy.prompt.md')
      );
      expect(promptFile).toBeDefined();
      expect(promptFile?.content).toContain('send: true');
    });

    it('should not render handoffs when array is empty', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                review: {
                  prompt: true,
                  description: 'Review code',
                  handoffs: [],
                  content: 'Review...',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const promptFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/prompts/review.prompt.md')
      );
      expect(promptFile).toBeDefined();
      expect(promptFile?.content).not.toContain('handoffs:');
    });
  });

  describe('handoffs in agent files', () => {
    it('should render handoffs in agent file frontmatter', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                orchestrator: {
                  description: 'Main orchestrator agent',
                  handoffs: [
                    {
                      label: 'Code review',
                      agent: 'code-reviewer',
                      prompt: 'Review the code changes',
                    },
                    {
                      label: 'Run tests',
                      agent: 'test-runner',
                      prompt: 'Execute the test suite',
                      send: true,
                    },
                  ],
                  content: 'You orchestrate tasks...',
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
        f.path.includes('.github/agents/orchestrator.md')
      );
      expect(agentFile).toBeDefined();
      expect(agentFile?.content).toContain('handoffs:');
      expect(agentFile?.content).toContain("label: 'Code review'");
      expect(agentFile?.content).toContain('agent: code-reviewer');
      expect(agentFile?.content).toContain("label: 'Run tests'");
      expect(agentFile?.content).toContain('agent: test-runner');
      expect(agentFile?.content).toContain('send: true');
    });

    it('should skip handoff entries missing label or agent', () => {
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
                  description: 'Helper agent',
                  handoffs: [
                    { label: 'Valid', agent: 'target', prompt: 'Do something' },
                    { label: '', agent: 'target', prompt: 'Missing label' },
                    { label: 'Missing agent', agent: '', prompt: 'No agent' },
                  ],
                  content: 'Help with tasks...',
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
      expect(agentFile?.content).toContain('handoffs:');
      expect(agentFile?.content).toContain("label: 'Valid'");
      // Should only have 1 handoff entry (the valid one)
      const handoffCount = (agentFile?.content.match(/- label:/g) ?? []).length;
      expect(handoffCount).toBe(1);
    });
  });

  describe('TypeScript instruction content generation', () => {
    it('should generate TypeScript instruction file with structured standards', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                globs: ['**/*.ts'],
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
                  useUnknown: 'with type guards',
                  exports: 'named exports only',
                  returnTypes: 'on public functions',
                },
                naming: {
                  files: 'kebab-case.ts',
                  classes: 'PascalCase',
                  functions: 'camelCase',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const tsFile = result.additionalFiles?.find((f) =>
        f.path.includes('typescript.instructions.md')
      );
      expect(tsFile).toBeDefined();
      expect(tsFile?.content).toContain('strict TypeScript');
      expect(tsFile?.content).toContain('`unknown` with type guards');
      expect(tsFile?.content).toContain('Named exports only');
      expect(tsFile?.content).toContain('return types on public functions');
      expect(tsFile?.content).toContain('Files: `kebab-case.ts`');
    });
  });

  describe('tech stack rendering', () => {
    it('should render monorepo tech stack info', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                stack: ['TypeScript', 'Node.js'],
                runtime: 'Node.js 20+',
                monorepo: {
                  tool: 'Nx',
                  packageManager: 'pnpm',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Node.js 20+');
      expect(result.content).toContain('Nx with pnpm workspaces');
    });
  });

  describe('AGENTS.md restrictions rendering', () => {
    it('should render TextContent restrictions in AGENTS.md (full mode)', () => {
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
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: '- use eval\n- use any type\n- skip tests',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const agentsFile = result.additionalFiles?.find((f) => f.path === 'AGENTS.md');
      expect(agentsFile).toBeDefined();
      expect(agentsFile?.content).toContain('## Restrictions');
      expect(agentsFile?.content).toContain('- use eval');
      expect(agentsFile?.content).toContain('- use any type');
      expect(agentsFile?.content).toContain('- skip tests');
    });

    it('should render ObjectContent restrictions with items in AGENTS.md (full mode)', () => {
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
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                items: ['expose secrets', 'commit API keys'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const agentsFile = result.additionalFiles?.find((f) => f.path === 'AGENTS.md');
      expect(agentsFile).toBeDefined();
      expect(agentsFile?.content).toContain('## Restrictions');
      expect(agentsFile?.content).toContain('- expose secrets');
      expect(agentsFile?.content).toContain('- commit API keys');
    });
  });

  describe('restrictions with ObjectContent items', () => {
    it('should extract items from ObjectContent with items array', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                items: ['expose secrets', 'commit API keys'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## donts');
      // Items from ObjectContent are extracted
      expect(result.content).toContain('expose secrets');
      expect(result.content).toContain('commit API keys');
    });

    it('should handle TextContent restrictions with multiple lines', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: '- use eval\n- use any type\n- skip error handling',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## donts');
      // TextContent is parsed and each line is extracted
      expect(result.content).toContain('use eval');
      expect(result.content).toContain('use any type');
      expect(result.content).toContain('skip error handling');
    });
  });

  describe('getSkillBasePath', () => {
    it('should return .github/skills', () => {
      const formatter = new GitHubFormatter();
      expect(formatter.getSkillBasePath()).toBe('.github/skills');
    });
  });

  describe('getSkillFileName', () => {
    it('should return SKILL.md', () => {
      const formatter = new GitHubFormatter();
      expect(formatter.getSkillFileName()).toBe('SKILL.md');
    });
  });
});
