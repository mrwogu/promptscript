import { describe, expect, it, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GeminiFormatter, GEMINI_VERSIONS } from '../formatters/gemini.js';

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

describe('GeminiFormatter', () => {
  let formatter: GeminiFormatter;

  beforeEach(() => {
    formatter = new GeminiFormatter();
  });

  it('should have correct name, outputPath and description', () => {
    expect(formatter.name).toBe('gemini');
    expect(formatter.outputPath).toBe('GEMINI.md');
    expect(formatter.description).toBe('Gemini CLI instructions (Markdown + TOML)');
  });

  it('should have markdown as default convention', () => {
    expect(formatter.defaultConvention).toBe('markdown');
  });

  describe('getSupportedVersions', () => {
    it('should return supported versions', () => {
      const versions = GeminiFormatter.getSupportedVersions();
      expect(versions).toBe(GEMINI_VERSIONS);
      expect(versions.simple).toBeDefined();
      expect(versions.multifile).toBeDefined();
    });

    it('should have correct version metadata', () => {
      const versions = GeminiFormatter.getSupportedVersions();
      expect(versions.simple.name).toBe('simple');
      expect(versions.simple.description).toBe('Single GEMINI.md file');
      expect(versions.multifile.name).toBe('multifile');
    });

    it('should have full version (alias for multifile)', () => {
      const versions = GeminiFormatter.getSupportedVersions();
      expect(versions.full).toBeDefined();
      expect(versions.full.name).toBe('full');
    });
  });

  describe('format', () => {
    it('should always start with GEMINI.md header', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);

      expect(result.path).toBe('GEMINI.md');
      expect(result.content).toContain('# GEMINI.md');
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

    it('should handle empty AST gracefully', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);

      expect(result.path).toBe('GEMINI.md');
      expect(result.content).toContain('# GEMINI.md');
      expect(result.additionalFiles).toBeUndefined();
    });

    it('should default to simple mode for unknown version', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { version: 'unknown-version' });
      expect(result.additionalFiles).toBeUndefined();
      expect(result.content.startsWith('# GEMINI.md\n')).toBe(true);
    });

    it('should generate multifile output in full mode', () => {
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
                  description: 'Create commits',
                  content: 'Use Conventional Commits.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { version: 'full' });
      expect(result.content.startsWith('# GEMINI.md\n')).toBe(true);
      // Full mode should generate skill files (same as multifile)
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('skills/commit'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.path).toBe('.gemini/skills/commit/skill.md');
    });
  });

  describe('command file generation (TOML)', () => {
    it('should generate TOML command files from shortcuts with prompt: true', () => {
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
                  prompt: true,
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

      expect(result.additionalFiles).toBeDefined();
      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/monitor-ci'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.gemini/commands/monitor-ci.toml');
      expect(cmdFile?.content).toContain('description = "Monitor CI pipeline"');
      expect(cmdFile?.content).toContain('prompt = """');
      expect(cmdFile?.content).toContain('You are the CI monitor orchestrator.');
      expect(cmdFile?.content).toContain('"""');
    });

    it('should generate TOML command files from shortcuts with content', () => {
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
      expect(cmdFile?.path).toBe('.gemini/commands/build-plan.toml');
      expect(cmdFile?.content).toContain('description = "Build a technical plan"');
      expect(cmdFile?.content).toContain('Analyze requirements and create a plan.');
    });

    it('should escape double quotes in TOML description', () => {
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
                  description: 'Monitor "important" things',
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

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/test'));
      expect(cmdFile?.content).toContain('description = "Monitor \\"important\\" things"');
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
      expect(cmdFile?.path).toBe('.gemini/commands/deploy.toml');
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
  });

  describe('skill file generation', () => {
    it('should generate skill files with lowercase skill.md in multifile mode', () => {
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

      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeDefined();
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('skills/commit'));
      expect(skillFile).toBeDefined();
      // Gemini uses lowercase skill.md, not SKILL.md
      expect(skillFile?.path).toBe('.gemini/skills/commit/skill.md');
      expect(skillFile?.content).toContain('---');
      expect(skillFile?.content).toContain('name: commit');
      expect(skillFile?.content).toContain('description: Create git commits');
      expect(skillFile?.content).toContain('Use Conventional Commits format.');
    });

    it('should emit resource files alongside skill skill.md', () => {
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

      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('skill.md'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.path).toBe('.gemini/skills/ui-skill/skill.md');

      const resourceFiles = skillFile?.additionalFiles;
      expect(resourceFiles).toBeDefined();
      expect(resourceFiles).toHaveLength(2);

      const csv = resourceFiles?.find((f) => f.path.includes('colors.csv'));
      expect(csv?.path).toBe('.gemini/skills/ui-skill/data/colors.csv');
      expect(csv?.content).toBe('red,#ff0000\n');

      const py = resourceFiles?.find((f) => f.path.includes('search.py'));
      expect(py?.path).toBe('.gemini/skills/ui-skill/scripts/search.py');
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

    it('should use quotes for descriptions containing apostrophes', () => {
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

      expect(skill?.content).toContain('"Fix code that doesn\'t work"');
    });
  });

  describe('no agent support', () => {
    it('should not generate agent files even in multifile mode', () => {
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
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const agentFile = result.additionalFiles?.find((f) => f.path.includes('agents/'));
      expect(agentFile).toBeUndefined();
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

  describe('tech stack from context with monorepo', () => {
    it('should include monorepo tool and packageManager', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                languages: 'TypeScript',
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
      expect(result.content).toContain('Nx + pnpm');
    });
  });

  describe('restrictions from text content', () => {
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
