import { describe, expect, it, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { OpenCodeFormatter, OPENCODE_VERSIONS } from '../formatters/opencode.js';

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

describe('OpenCodeFormatter', () => {
  let formatter: InstanceType<typeof OpenCodeFormatter>;

  beforeEach(() => {
    formatter = new OpenCodeFormatter();
  });

  it('should have correct name, outputPath and description', () => {
    expect(formatter.name).toBe('opencode');
    expect(formatter.outputPath).toBe('OPENCODE.md');
    expect(formatter.description).toBe('OpenCode instructions (Markdown)');
  });

  it('should have markdown as default convention', () => {
    expect(formatter.defaultConvention).toBe('markdown');
  });

  describe('getSupportedVersions', () => {
    it('should return supported versions', () => {
      const versions = OpenCodeFormatter.getSupportedVersions();
      expect(versions).toBe(OPENCODE_VERSIONS);
      expect(versions.simple).toBeDefined();
      expect(versions.multifile).toBeDefined();
      expect(versions.full).toBeDefined();
    });

    it('should have correct version metadata', () => {
      const versions = OpenCodeFormatter.getSupportedVersions();
      expect(versions.simple.name).toBe('simple');
      expect(versions.simple.description).toBe('Single OPENCODE.md file');
      expect(versions.multifile.name).toBe('multifile');
      expect(versions.full.name).toBe('full');
    });
  });

  describe('format', () => {
    it('should always start with OPENCODE.md header', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);

      expect(result.path).toBe('OPENCODE.md');
      expect(result.content).toContain('# OPENCODE.md');
    });

    it('should include project section from identity block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a TypeScript developer.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Project');
      expect(result.content).toContain('You are a TypeScript developer.');
    });

    it('should include tech stack from context block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                languages: ['TypeScript', 'JavaScript'],
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
      expect(result.content).toContain('## Tech Stack');
      expect(result.content).toContain('TypeScript');
      expect(result.content).toContain('Node.js 20+');
    });

    it('should include commands from shortcuts block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Review code quality',
                '/test': 'Run tests',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Commands');
      expect(result.content).toContain('/review');
    });

    it("should use Restrictions heading instead of Don'ts", () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never use any type', 'Never skip error handling'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Restrictions');
      expect(result.content).not.toContain("## Don'ts");
      expect(result.content).toContain('Never use any type');
    });

    it('should handle TextContent restrictions', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: '- Never use any type\n- Never skip tests',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Restrictions');
      expect(result.content).toContain('Never use any type');
      expect(result.content).toContain('Never skip tests');
    });

    it('should handle ObjectContent restrictions with items array', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                items: ['Never use any type', 'Never skip error handling'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Restrictions');
      expect(result.content).toContain('Never use any type');
    });

    it('should handle empty AST gracefully', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);

      expect(result.path).toBe('OPENCODE.md');
      expect(result.content).toContain('# OPENCODE.md');
      expect(result.additionalFiles).toBeUndefined();
    });

    it('should default to simple mode for unknown version', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { version: 'unknown-version' });
      expect(result.additionalFiles).toBeUndefined();
      expect(result.content.startsWith('# OPENCODE.md\n')).toBe(true);
    });
  });

  describe('command file generation', () => {
    it('should generate command files from shortcuts with prompt: true', () => {
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
                  description: 'Deploy the application',
                  prompt: true,
                  content: 'Run deployment steps...',
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
      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/deploy'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.opencode/commands/deploy.md');
      expect(cmdFile?.content).toContain('---');
      expect(cmdFile?.content).toContain('description: Deploy the application');
      expect(cmdFile?.content).toContain('Run deployment steps...');
    });

    it('should generate command files from shortcuts with content', () => {
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
                  description: 'Monitor CI pipeline',
                  content: 'You are the CI monitor orchestrator.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/monitor-ci'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.opencode/commands/monitor-ci.md');
      expect(cmdFile?.content).toContain('description: Monitor CI pipeline');
      expect(cmdFile?.content).toContain('You are the CI monitor orchestrator.');
    });

    it('should include argument-hint in frontmatter when specified', () => {
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
                  description: 'Monitor CI pipeline',
                  argumentHint: '[instructions] [--max-cycles N]',
                  content: 'Monitor CI steps.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/monitor-ci'));
      expect(cmdFile?.content).toContain("argument-hint: '[instructions] [--max-cycles N]'");
    });

    it('should strip leading slashes from command names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/deploy': {
                  description: 'Deploy app',
                  prompt: true,
                  content: 'Deploy the application.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/deploy'));
      expect(cmdFile?.path).toBe('.opencode/commands/deploy.md');
    });

    it('should not generate command files for simple string shortcuts', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Review code quality',
                '/test': 'Run tests',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const commandFiles = result.additionalFiles?.filter((f) => f.path.includes('commands/'));
      expect(commandFiles ?? []).toHaveLength(0);
    });

    it('should not generate command files in simple mode', () => {
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
                  content: 'Deploy steps...',
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

    it('should generate command files in full mode', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                analyze: {
                  description: 'Analyze code',
                  content: 'Analyze the codebase.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/analyze'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.opencode/commands/analyze.md');
    });

    it('should use quotes for descriptions containing special characters', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                fix: {
                  description: "Fix code that doesn't work",
                  content: 'Fix it.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/fix'));
      expect(cmdFile?.content).toContain('"Fix code that doesn\'t work"');
    });
  });

  describe('skill file generation', () => {
    it('should generate skill files in full mode', () => {
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
                  content: 'Use Conventional Commits format.',
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
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('skills/commit'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.path).toBe('.opencode/skills/commit/SKILL.md');
      expect(skillFile?.content).toContain('---');
      expect(skillFile?.content).toContain('name: commit');
      expect(skillFile?.content).toContain('description: Create git commits');
      expect(skillFile?.content).toContain('Use Conventional Commits format.');
    });

    it('should emit resource files alongside skill SKILL.md', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'ui-skill': {
                  description: 'UI skill with resources',
                  content: 'Skill content.',
                  resources: [
                    { relativePath: 'data/colors.csv', content: 'red,#ff0000\n' },
                    { relativePath: 'scripts/search.py', content: 'print("hello")\n' },
                  ],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.path).toBe('.opencode/skills/ui-skill/SKILL.md');

      const resourceFiles = skillFile?.additionalFiles;
      expect(resourceFiles).toBeDefined();
      expect(resourceFiles).toHaveLength(2);

      const csv = resourceFiles?.find((f) => f.path.includes('colors.csv'));
      expect(csv?.path).toBe('.opencode/skills/ui-skill/data/colors.csv');
      expect(csv?.content).toBe('red,#ff0000\n');

      const py = resourceFiles?.find((f) => f.path.includes('search.py'));
      expect(py?.path).toBe('.opencode/skills/ui-skill/scripts/search.py');
      expect(py?.content).toBe('print("hello")\n');
    });

    it('should not generate skill files in simple mode', () => {
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
                  content: 'Content.',
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

    it('should not generate skill files in multifile mode', () => {
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
                  content: 'Content.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('skills/'));
      expect(skillFile).toBeUndefined();
    });
  });

  describe('agent file generation', () => {
    it('should generate agent files in full mode with @agents block', () => {
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
                  description: 'Reviews code for quality and best practices',
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
        f.path.includes('.opencode/agents/code-reviewer.md')
      );
      expect(agentFile).toBeDefined();
      expect(agentFile?.content).toContain(
        'description: Reviews code for quality and best practices'
      );
      expect(agentFile?.content).toContain('mode: subagent');
      expect(agentFile?.content).toContain('You are a senior code reviewer.');
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
      const agentFile = result.additionalFiles?.find((f) => f.path.includes('.opencode/agents/'));
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
        (f) => f.path === '.opencode/agents/invalid-agent.md'
      );
      const validAgent = result.additionalFiles?.find(
        (f) => f.path === '.opencode/agents/valid-agent.md'
      );

      expect(invalidAgent).toBeUndefined();
      expect(validAgent).toBeDefined();
    });
  });

  describe('documentation section', () => {
    it('should render documentation from standards block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                documentation: {
                  verifyBefore: true,
                  verifyAfter: true,
                  codeExamples: true,
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Documentation');
      expect(result.content).toContain('Review docs before changes');
      expect(result.content).toContain('Update docs after changes');
      expect(result.content).toContain('Keep code examples accurate');
    });
  });

  describe('diagrams section', () => {
    it('should render diagrams from standards block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                diagrams: {
                  format: 'mermaid',
                  types: ['flowchart', 'sequence', 'class'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Diagrams');
      expect(result.content).toContain('Use mermaid for diagrams');
      expect(result.content).toContain('Types: flowchart, sequence, class');
    });
  });

  describe('tech stack from standards block', () => {
    it('should extract tech stack from standards.code', () => {
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
                  frameworks: ['React'],
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
      expect(result.content).toContain('TypeScript');
      expect(result.content).toContain('React');
      expect(result.content).toContain('Vitest');
    });
  });

  describe('restrictions from text and object content', () => {
    it('should extract restrictions from TextContent', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: '- Never use any type\n- Never skip tests',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Never use any type');
      expect(result.content).toContain('Never skip tests');
    });

    it('should extract restrictions from ObjectContent with items', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                items: ['No any type', 'No default exports'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('No any type');
      expect(result.content).toContain('No default exports');
    });
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
      expect(result.content).toContain('<project>');
      expect(result.content).toContain('</project>');
    });
  });
});
