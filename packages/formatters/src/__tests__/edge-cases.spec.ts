import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github.js';
import { ClaudeFormatter } from '../formatters/claude.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { AntigravityFormatter } from '../formatters/antigravity.js';

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

describe('GitHubFormatter Edge Cases', () => {
  let formatter: GitHubFormatter;

  beforeEach(() => {
    formatter = new GitHubFormatter();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('extractRestrictionItems with ObjectContent', () => {
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
                items: ['No secrets', 'Validate input', 'Use types'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## donts');
      expect(result.content).toContain('No secrets');
    });
  });

  describe('prompt file generation', () => {
    it('should generate prompt files with agent mode and tools', () => {
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
                  description: 'Deploy application',
                  mode: 'agent',
                  tools: ['run_terminal', 'read_file'],
                  content: 'Deploy the app to production.',
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
      expect(promptFile?.content).toContain('description: "Deploy application"');
      expect(promptFile?.content).toContain('mode: agent');
      // Tools should be in inline YAML array format with mapped names
      expect(promptFile?.content).toContain("tools: ['run_terminal', 'read_file']");
      expect(promptFile?.content).toContain('Deploy the app to production.');
    });

    it('should generate prompt file with type: prompt', () => {
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
                  type: 'prompt',
                  description: 'Code review',
                  content: 'Review the code changes.',
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
      expect(promptFile?.content).toContain('description: "Code review"');
    });

    it('should map Claude Code tool names in agent mode prompts', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                debug: {
                  prompt: true,
                  description: 'Debug issues',
                  mode: 'agent',
                  tools: ['Read', 'Grep', 'Bash', 'Edit'],
                  content: 'Debug the issue.',
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
        f.path.includes('.github/prompts/debug.prompt.md')
      );
      expect(promptFile).toBeDefined();
      // Claude Code tools should be mapped to GitHub Copilot canonical names
      expect(promptFile?.content).toContain("tools: ['read', 'search', 'execute', 'edit']");
    });
  });

  describe('testing rule content from standards', () => {
    it('should extract all testing properties', () => {
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
                  filePattern: '*.spec.ts',
                  pattern: 'AAA',
                  coverage: 90,
                  fixtures: 'for parser tests',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Test files: `*.spec.ts`');
      expect(result.content).toContain('Follow AAA pattern');
      expect(result.content).toContain('Target >90% coverage');
      expect(result.content).toContain('Use fixtures for parser tests');
    });
  });

  describe('getTestingInstructionContent for multifile version', () => {
    it('should generate testing instruction content with all fields using globs', () => {
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
                  filePattern: '*.spec.ts',
                  pattern: 'AAA',
                  coverage: '90',
                  fixtures: 'for parser tests',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                globs: ['**/*.spec.ts', '**/*.test.ts'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const testInstructionFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/instructions/testing.instructions.md')
      );
      expect(testInstructionFile).toBeDefined();
      expect(testInstructionFile?.content).toContain('Test files:');
      expect(testInstructionFile?.content).toContain('pattern');
      expect(testInstructionFile?.content).toContain('coverage');
      expect(testInstructionFile?.content).toContain('fixtures');
    });

    it('should return default message when no testing standards', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                globs: ['**/*.spec.ts'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const testInstructionFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/instructions/testing.instructions.md')
      );
      expect(testInstructionFile).toBeDefined();
      // When no testing standards exist, the content is empty but file is still generated
      expect(testInstructionFile?.content).toContain('Testing-specific rules and patterns');
    });
  });

  describe('getTypeScriptInstructionContent for multifile version', () => {
    it('should generate TypeScript instruction content with all naming fields using globs', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                naming: {
                  files: 'kebab-case',
                  classes: 'PascalCase',
                  functions: 'camelCase',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
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
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const tsInstructionFile = result.additionalFiles?.find((f) =>
        f.path.includes('.github/instructions/typescript.instructions.md')
      );
      expect(tsInstructionFile).toBeDefined();
      expect(tsInstructionFile?.content).toContain('Files:');
      expect(tsInstructionFile?.content).toContain('Classes/Interfaces:');
      expect(tsInstructionFile?.content).toContain('Functions/Variables:');
    });
  });

  describe('extractRestrictionItems with empty ObjectContent', () => {
    it('should return empty array when content has no items', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
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
      // Should not crash and should handle gracefully
      expect(result.content).toBeDefined();
    });
  });
});

describe('ClaudeFormatter Edge Cases', () => {
  let formatter: ClaudeFormatter;

  beforeEach(() => {
    formatter = new ClaudeFormatter();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('guards with named rules', () => {
    it('should extract named rules with paths from guards block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                typescript: {
                  paths: ['**/*.ts', '**/*.tsx'],
                  description: 'TypeScript rules',
                  content: 'Use strict TypeScript.',
                },
                testing: {
                  applyTo: ['**/*.spec.ts'],
                  description: 'Test rules',
                  content: 'Follow AAA pattern.',
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

      const tsFile = result.additionalFiles?.find((f) => f.path.includes('typescript'));
      expect(tsFile).toBeDefined();
      expect(tsFile?.content).toContain('TypeScript rules');
    });
  });

  describe('testing rule content', () => {
    it('should extract testing properties with framework', () => {
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
                  framework: 'vitest',
                  coverage: 80,
                  pattern: 'AAA',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('vitest');
      expect(result.content).toContain('80');
    });
  });
});

describe('CursorFormatter Edge Cases', () => {
  let formatter: CursorFormatter;

  beforeEach(() => {
    formatter = new CursorFormatter();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('devCommands', () => {
    it('should extract commands from knowledge block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'knowledge',
            content: {
              type: 'TextContent',
              value: `## Development Commands

\`\`\`bash
pnpm install
pnpm build
pnpm test
\`\`\``,
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('pnpm install');
      expect(result.content).toContain('pnpm build');
      expect(result.content).toContain('pnpm test');
    });

    it('should return null when no knowledge block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Development Commands');
    });
  });

  describe('postWork', () => {
    it('should extract post-work-verification from knowledge block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'knowledge',
            content: {
              type: 'TextContent',
              value: `## Post-Work Verification

\`\`\`bash
Run tests
Check linting
Verify build
\`\`\``,
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Run tests');
      expect(result.content).toContain('Check linting');
      expect(result.content).toContain('Verify build');
    });

    it('should return null when no knowledge block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Post-Work Verification');
    });
  });
});

describe('AntigravityFormatter Edge Cases', () => {
  let formatter: AntigravityFormatter;

  beforeEach(() => {
    formatter = new AntigravityFormatter();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('tech stack', () => {
    it('should extract monorepo with tool only', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                monorepo: {
                  tool: 'nx',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('**Monorepo:** nx');
    });

    it('should extract monorepo with tool and packageManager', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                monorepo: {
                  tool: 'nx',
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
      expect(result.content).toContain('**Monorepo:** nx with pnpm workspaces');
    });

    it('should extract frameworks as array', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                frameworks: ['react', 'express', 'jest'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('**Frameworks:** react, express, jest');
    });

    it('should handle single framework', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                frameworks: 'react',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('**Frameworks:** react');
    });
  });
});
