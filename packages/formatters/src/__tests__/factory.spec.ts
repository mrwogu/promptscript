import { describe, expect, it, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { FactoryFormatter, FACTORY_VERSIONS } from '../formatters/factory.js';

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

describe('FactoryFormatter', () => {
  let formatter: FactoryFormatter;

  beforeEach(() => {
    formatter = new FactoryFormatter();
  });

  it('should have correct name, outputPath and description', () => {
    expect(formatter.name).toBe('factory');
    expect(formatter.outputPath).toBe('AGENTS.md');
    expect(formatter.description).toBe('Factory AI AGENTS.md (Markdown)');
  });

  it('should have markdown as default convention', () => {
    expect(formatter.defaultConvention).toBe('markdown');
  });

  describe('getSupportedVersions', () => {
    it('should return supported versions', () => {
      const versions = FactoryFormatter.getSupportedVersions();
      expect(versions).toBe(FACTORY_VERSIONS);
      expect(versions.simple).toBeDefined();
      expect(versions.multifile).toBeDefined();
      expect(versions.full).toBeDefined();
    });

    it('should have correct version metadata', () => {
      const versions = FactoryFormatter.getSupportedVersions();
      expect(versions.simple.name).toBe('simple');
      expect(versions.simple.description).toBe('Single AGENTS.md file');
      expect(versions.multifile.name).toBe('multifile');
      expect(versions.full.name).toBe('full');
    });
  });

  describe('format', () => {
    it('should always start with AGENTS.md header', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);

      expect(result.path).toBe('AGENTS.md');
      expect(result.content).toContain('# AGENTS.md');
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

    it('should include conventions section from standards block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                typescript: {
                  strictMode: true,
                  exports: 'named only',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Conventions & Patterns');
    });

    it('should include git workflows from standards.git', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                git: {
                  format: 'Conventional Commits',
                  types: ['feat', 'fix', 'docs'],
                  example: 'feat(parser): add support',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Git Workflows');
      expect(result.content).toContain('Conventional Commits');
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

    it('should include restrictions section', () => {
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
      expect(result.content).toContain("## Don'ts");
      expect(result.content).toContain("Don't use any type");
    });

    it('should handle empty AST gracefully', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);

      expect(result.path).toBe('AGENTS.md');
      expect(result.content).toContain('# AGENTS.md');
      expect(result.additionalFiles).toBeUndefined();
    });

    it('should handle missing blocks gracefully', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'A developer',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Project');
      // Should not contain sections for absent blocks
      expect(result.content).not.toContain('## Git Workflows');
      expect(result.content).not.toContain("## Don'ts");
    });
  });

  describe('multifile version', () => {
    it('should generate skill files from @skills block', () => {
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
                review: {
                  description: 'Review code for quality',
                  allowedTools: ['Read', 'Grep'],
                  content: 'You are a code reviewer.',
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
      expect(result.additionalFiles).toHaveLength(2);

      const commitSkill = result.additionalFiles?.find((f) => f.path.includes('commit'));
      expect(commitSkill).toBeDefined();
      expect(commitSkill?.path).toBe('.factory/skills/commit/SKILL.md');
      expect(commitSkill?.content).toContain('---');
      expect(commitSkill?.content).toContain('name: commit');
      expect(commitSkill?.content).toContain('description: Create git commits');
      expect(commitSkill?.content).not.toContain('user-invocable');
      expect(commitSkill?.content).not.toContain('disable-model-invocation');
      expect(commitSkill?.content).toContain('Use Conventional Commits format.');
    });

    it('should not generate additional files when no skills', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeUndefined();
    });
  });

  describe('full version', () => {
    it('should generate skill files same as multifile', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                deploy: {
                  description: 'Deploy the application',
                  content: 'Run deploy pipeline.',
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
      expect(result.additionalFiles).toHaveLength(1);
      expect(result.additionalFiles?.[0]?.path).toBe('.factory/skills/deploy/SKILL.md');
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
                '/create-spec': {
                  description: 'Create feature specification',
                  prompt: true,
                  content: 'Create a detailed spec for the given feature.',
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
      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/create-spec'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.factory/commands/create-spec.md');
      expect(cmdFile?.content).toContain('---');
      expect(cmdFile?.content).toContain('description: Create feature specification');
      expect(cmdFile?.content).toContain('Create a detailed spec for the given feature.');
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
                'build-plan': {
                  description: 'Build a technical plan',
                  content: 'Analyze requirements and create a plan.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/build-plan'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.factory/commands/build-plan.md');
      expect(cmdFile?.content).toContain('Analyze requirements and create a plan.');
    });

    it('should include agent in frontmatter when specified', () => {
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
                  description: 'Review code',
                  agent: 'reviewer.expert',
                  content: 'Review the code.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/review'));
      expect(cmdFile?.content).toContain('agent: reviewer.expert');
    });

    it('should include handoffs in frontmatter', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                'create-spec': {
                  description: 'Create specification',
                  content: 'Create a spec.',
                  handoffs: [
                    {
                      label: 'Build Plan',
                      agent: 'speckit.plan',
                      prompt: 'Create a plan for the spec',
                    },
                    {
                      label: 'Clarify',
                      agent: 'speckit.clarify',
                      prompt: 'Clarify requirements',
                      send: true,
                    },
                  ],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/create-spec'));
      expect(cmdFile?.content).toContain('handoffs:');
      expect(cmdFile?.content).toContain('label: Build Plan');
      expect(cmdFile?.content).toContain('agent: speckit.plan');
      expect(cmdFile?.content).toContain('prompt: Create a plan for the spec');
      expect(cmdFile?.content).toContain('label: Clarify');
      expect(cmdFile?.content).toContain('send: true');
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
      expect(cmdFile?.path).toBe('.factory/commands/deploy.md');
    });

    it('should include tools in frontmatter when specified', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                'tasks-to-issues': {
                  description: 'Convert tasks to GitHub issues',
                  tools: ['github/github-mcp-server/issue_write'],
                  content: 'Convert tasks.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) =>
        f.path.includes('commands/tasks-to-issues')
      );
      expect(cmdFile?.content).toContain("tools: ['github/github-mcp-server/issue_write']");
    });

    it('should generate command files from TextContent shortcuts with multiline content', () => {
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
                  type: 'TextContent',
                  value: 'Step 1: Build\nStep 2: Deploy',
                  loc: createLoc(),
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
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.factory/commands/deploy.md');
      expect(cmdFile?.content).toContain('Step 1: Build');
      expect(cmdFile?.content).toContain('Step 2: Deploy');
    });

    it('should skip TextContent shortcuts with single-line content', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/simple': {
                  type: 'TextContent',
                  value: 'Just a single line',
                  loc: createLoc(),
                },
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

      // Should have no additional files (only simple shortcuts, no command files)
      const commandFiles = result.additionalFiles?.filter((f) => f.path.includes('commands/'));
      expect(commandFiles ?? []).toHaveLength(0);
    });

    it('should generate command files in full version', () => {
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
      expect(cmdFile?.path).toBe('.factory/commands/analyze.md');
    });

    it('should use double quotes for descriptions containing apostrophes', () => {
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
      expect(cmdFile?.content).toContain('description: "Fix code that doesn\'t work"');
    });
  });

  describe('skill frontmatter', () => {
    it('should generate correct YAML frontmatter', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'test-skill': {
                  description: 'A test skill',
                  userInvocable: false,
                  disableModelInvocation: true,
                  content: 'Test content.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];

      expect(skill?.content).toContain('name: test-skill');
      expect(skill?.content).toContain('description: A test skill');
      expect(skill?.content).not.toContain('user-invocable');
      expect(skill?.content).not.toContain('disable-model-invocation');
    });

    it('should use double quotes for descriptions containing apostrophes', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
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
      const skill = result.additionalFiles?.[0];

      expect(skill?.content).toContain('description: "Fix code that doesn\'t work"');
    });

    it('should convert dots to hyphens in skill names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'speckit.plan': {
                  description: 'Plan things',
                  content: 'Plan content.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.find((f) => f.path.includes('skills/'));

      expect(skill?.content).toContain('name: speckit-plan');
      expect(skill?.content).not.toContain('name: speckit.plan');
    });

    it('should emit resource files alongside SKILL.md', () => {
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

      const result = formatter.format(ast, { version: 'multifile' });

      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.path).toBe('.factory/skills/ui-skill/SKILL.md');

      const resourceFiles = skillFile?.additionalFiles;
      expect(resourceFiles).toBeDefined();
      expect(resourceFiles).toHaveLength(2);

      const csv = resourceFiles?.find((f) => f.path.includes('colors.csv'));
      expect(csv?.path).toBe('.factory/skills/ui-skill/data/colors.csv');
      expect(csv?.content).toBe('red,#ff0000\n');

      const py = resourceFiles?.find((f) => f.path.includes('search.py'));
      expect(py?.path).toBe('.factory/skills/ui-skill/scripts/search.py');
      expect(py?.content).toBe('print("hello")\n');
    });

    it('should not emit additionalFiles when no resources', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'bare-skill': {
                  description: 'No resources',
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
      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.additionalFiles).toBeUndefined();
    });

    it('should include trailing space on handoffs key in command YAML', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                test: {
                  description: 'Test command',
                  content: 'Test content',
                  handoffs: [
                    {
                      label: 'Next Step',
                      agent: 'next.step',
                      prompt: 'Do the next thing',
                    },
                  ],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/'));
      expect(cmdFile).toBeDefined();

      // Should have trailing space after "handoffs:" to match Factory AI format
      expect(cmdFile?.content).toMatch(/handoffs: \n/);
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

    it('should return null when documentation has no items', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                documentation: {},
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Documentation');
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

    it('should return null when diagrams property is missing', () => {
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
      expect(result.content).not.toContain('Diagrams');
    });
  });

  describe('restrictions with different content types', () => {
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
      expect(result.content).toContain("Don'ts");
      expect(result.content).toContain("Don't use any type");
      expect(result.content).toContain("Don't skip tests");
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
      expect(result.content).toContain("Don'ts");
      expect(result.content).toContain("Don't use any type");
      expect(result.content).toContain("Don't skip error handling");
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
    it("should extract restrictions from TextContent and transform Never to Don't", () => {
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
      expect(result.content).toContain("Don't use any type");
      expect(result.content).toContain("Don't skip tests");
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
