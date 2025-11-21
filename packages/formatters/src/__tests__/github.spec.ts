import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github';

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

  it('should have correct name, outputPath and description', () => {
    expect(formatter.name).toBe('github');
    expect(formatter.outputPath).toBe('.github/copilot-instructions.md');
    expect(formatter.description).toBe('GitHub Copilot instructions (Markdown)');
  });

  describe('format', () => {
    it('should generate header with meta information', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        meta: {
          type: 'MetaBlock',
          fields: { id: 'my-project', version: '1.0.0' },
          loc: createLoc(),
        },
      };

      const result = formatter.format(ast);
      expect(result.path).toBe('.github/copilot-instructions.md');
      expect(result.content).toContain('# GitHub Copilot Instructions');
      expect(result.content).toContain('Source: my-project@1.0.0');
      expect(result.content).toContain('Generated: 2024-01-01T00:00:00.000Z');
      expect(result.content).toContain('**Do not edit manually**');
    });

    it('should handle missing meta with defaults', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);
      expect(result.content).toContain('Source: unknown@0.0.0');
    });

    it('should generate context section from identity block', () => {
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
      expect(result.content).toContain('## Context');
      expect(result.content).toContain('You are a helpful coding assistant.');
    });

    it('should generate context section from both identity and context blocks', () => {
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
            name: 'context',
            content: {
              type: 'TextContent',
              value: 'Working on e-commerce project.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('You are a helpful assistant.');
      expect(result.content).toContain('Working on e-commerce project.');
    });

    it('should generate tech stack section', () => {
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
                  languages: ['TypeScript', 'Python'],
                  frameworks: ['React', 'Node.js'],
                  testing: ['Vitest', 'Testing Library'],
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
      expect(result.content).toContain('- **Languages:** TypeScript, Python');
      expect(result.content).toContain('- **Frameworks:** React, Node.js');
      expect(result.content).toContain('- **Testing:** Vitest, Testing Library');
    });

    it('should generate code standards section', () => {
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
                  style: ['Clean code principles', 'Functional React'],
                  patterns: ['Dependency injection', 'Repository pattern'],
                },
                testing: {
                  required: true,
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
      expect(result.content).toContain('## Code Standards');
      expect(result.content).toContain('### Style');
      expect(result.content).toContain('- Clean code principles');
      expect(result.content).toContain('- Functional React');
      expect(result.content).toContain('### Patterns');
      expect(result.content).toContain('- Dependency injection');
      expect(result.content).toContain('### Testing');
      expect(result.content).toContain('- Required: Yes');
      expect(result.content).toContain('- Minimum coverage: 80%');
    });

    it('should generate restrictions section from array content', () => {
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
      expect(result.content).toContain('## Restrictions');
      expect(result.content).toContain('- Never expose secrets');
      expect(result.content).toContain('- Always validate input');
    });

    it('should generate restrictions section from text content', () => {
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
      expect(result.content).toContain('## Restrictions');
      expect(result.content).toContain('No secrets in code');
    });

    it('should generate commands section as table', () => {
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
                '/test': 'Write comprehensive tests',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Commands');
      expect(result.content).toContain('| Command | Description |');
      expect(result.content).toContain('| `/review` | Review code for quality |');
      expect(result.content).toContain('| `/test` | Write comprehensive tests |');
    });

    it('should truncate long command descriptions', () => {
      const longDescription =
        'This is a very long description that exceeds the maximum length allowed for the commands table';

      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/cmd': longDescription,
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('...');
      expect(result.content).not.toContain(longDescription);
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
      expect(result.content).not.toContain('## Code Standards');
      expect(result.content).not.toContain('## Tech Stack');
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

    it('should handle context block with object properties', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                project: 'Checkout service',
                team: 'Platform',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Context');
      expect(result.content).toContain('**Project:** Checkout service');
      expect(result.content).toContain('**Team:** Platform');
    });

    it('should separate sections with horizontal rules', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        meta: {
          type: 'MetaBlock',
          fields: { id: 'test', version: '1.0.0' },
          loc: createLoc(),
        },
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Identity content',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('\n\n---\n\n');
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
      expect(result.content).not.toContain('## Restrictions');
    });

    it('should capitalize context property keys', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                lowercase: 'value',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('**Lowercase:** value');
    });
  });
});
