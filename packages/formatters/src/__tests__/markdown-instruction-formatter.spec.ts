import { describe, expect, it, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { MarkdownFormatterConfig } from '../markdown-instruction-formatter.js';

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

const createDefaultConfig = (
  overrides?: Partial<MarkdownFormatterConfig>
): MarkdownFormatterConfig => ({
  name: 'test-formatter',
  outputPath: 'TEST.md',
  description: 'Test formatter',
  defaultConvention: 'markdown',
  mainFileHeader: '# TEST.md',
  dotDir: '.test',
  skillFileName: 'SKILL.md',
  hasAgents: false,
  hasCommands: true,
  hasSkills: true,
  ...overrides,
});

class TestFormatter extends MarkdownInstructionFormatter {
  constructor(config?: Partial<MarkdownFormatterConfig>) {
    super(createDefaultConfig(config));
  }
}

describe('MarkdownInstructionFormatter', () => {
  let formatter: TestFormatter;

  beforeEach(() => {
    formatter = new TestFormatter();
  });

  describe('basic properties', () => {
    it('should expose name, outputPath, description from config', () => {
      expect(formatter.name).toBe('test-formatter');
      expect(formatter.outputPath).toBe('TEST.md');
      expect(formatter.description).toBe('Test formatter');
      expect(formatter.defaultConvention).toBe('markdown');
    });
  });

  describe('format', () => {
    it('should produce header in simple mode', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);
      expect(result.path).toBe('TEST.md');
      expect(result.content).toContain('# TEST.md');
    });

    it('should default to full mode', () => {
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

    it('should support multifile mode', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { version: 'multifile' });
      expect(result.path).toBe('TEST.md');
    });

    it('should support full mode', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { version: 'full' });
      expect(result.path).toBe('TEST.md');
    });
  });

  describe('section extraction', () => {
    it('should extract project from @identity', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: { type: 'TextContent', value: 'A test project.', loc: createLoc() },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Project');
      expect(result.content).toContain('A test project.');
    });

    it('should extract tech stack from @context', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                languages: ['TypeScript', 'Python'],
                runtime: 'Node.js 20',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Tech Stack');
      expect(result.content).toContain('TypeScript');
      expect(result.content).toContain('Node.js 20');
    });

    it('should extract restrictions from ArrayContent', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['No any types', 'No default exports'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('No any types');
      expect(result.content).toContain('No default exports');
    });

    it('should extract restrictions from TextContent', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: '- No any types\n- No default exports',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('No any types');
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
                items: ['No any types', 'No default exports'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('No any types');
    });
  });

  describe('section name customization', () => {
    it('should use default section names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['No foo'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Restrictions');
    });

    it('should use custom section names from config', () => {
      const customFormatter = new TestFormatter({
        sectionNames: { restrictions: "Don'ts" },
      });

      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['No foo'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = customFormatter.format(ast);
      expect(result.content).toContain("## Don'ts");
      expect(result.content).not.toContain('## Restrictions');
    });
  });

  describe('restrictions transform', () => {
    it('should not transform by default', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never use any'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Never use any');
    });

    it('should apply restrictionsTransform when configured', () => {
      const customFormatter = new TestFormatter({
        restrictionsTransform: (s: string) => s.replace(/^Never\s+/i, "Don't "),
      });

      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never use any'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = customFormatter.format(ast);
      expect(result.content).toContain("Don't use any");
      expect(result.content).not.toContain('Never use any');
    });
  });

  describe('yamlString helper', () => {
    it('should not quote simple strings', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                test: {
                  description: 'simple description',
                  content: 'test content',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('SKILL.md'));
      expect(skillFile?.content).toContain('description: simple description');
    });

    it('should quote strings with special characters', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                test: {
                  description: "it's a test: value",
                  content: 'test content',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('SKILL.md'));
      expect(skillFile?.content).toContain('"it\'s a test: value"');
    });
  });

  describe('multifile mode', () => {
    it('should not include skills in multifile when skillsInMultifile is false', () => {
      const customFormatter = new TestFormatter({ skillsInMultifile: false });
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                test: { description: 'desc', content: 'content' },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = customFormatter.format(ast, { version: 'multifile' });
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('SKILL.md'));
      expect(skillFile).toBeUndefined();
    });

    it('should include skills in multifile when skillsInMultifile is true', () => {
      const customFormatter = new TestFormatter({ skillsInMultifile: true });
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                test: { description: 'desc', content: 'content' },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = customFormatter.format(ast, { version: 'multifile' });
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('SKILL.md'));
      expect(skillFile).toBeDefined();
    });
  });

  describe('full mode', () => {
    it('should include skills in full mode', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                test: { description: 'desc', content: 'content' },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('SKILL.md'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.path).toBe('.test/skills/test/SKILL.md');
    });

    it('should include agents in full mode when hasAgents is true', () => {
      const agentFormatter = new TestFormatter({ hasAgents: true });
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
                  description: 'A helper agent',
                  content: 'Help with tasks',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = agentFormatter.format(ast, { version: 'full' });
      const agentFile = result.additionalFiles?.find((f) => f.path.includes('agents'));
      expect(agentFile).toBeDefined();
      expect(agentFile?.path).toBe('.test/agents/helper.md');
    });

    it('should not include agents when hasAgents is false', () => {
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
                  description: 'A helper agent',
                  content: 'Help with tasks',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const agentFile = result.additionalFiles?.find((f) => f.path.includes('agents'));
      expect(agentFile).toBeUndefined();
    });
  });

  describe('skill file generation', () => {
    it('should use configured skillFileName', () => {
      const lowercaseFormatter = new TestFormatter({ skillFileName: 'skill.md' });
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                test: { description: 'desc', content: 'content' },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = lowercaseFormatter.format(ast, { version: 'full' });
      const skillFile = result.additionalFiles?.find((f) => f.path.includes('skill.md'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.path).toBe('.test/skills/test/skill.md');
    });
  });

  describe('command file generation', () => {
    it('should generate command files in dotDir/commands/', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                build: {
                  description: 'Run build',
                  prompt: true,
                  content: 'Build the project.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.test/commands/build.md');
      expect(cmdFile?.content).toContain('description: Run build');
    });
  });

  describe('getSkillBasePath', () => {
    it('should return dotDir/skills from config', () => {
      expect(formatter.getSkillBasePath()).toBe('.test/skills');
    });
  });

  describe('getSkillFileName', () => {
    it('should return skillFileName from config', () => {
      expect(formatter.getSkillFileName()).toBe('SKILL.md');
    });

    it('should return lowercase skill.md when configured', () => {
      const lowercaseFormatter = new TestFormatter({ skillFileName: 'skill.md' });
      expect(lowercaseFormatter.getSkillFileName()).toBe('skill.md');
    });
  });

  describe('dotDir configuration', () => {
    it('should use configured dotDir for file paths', () => {
      const customFormatter = new TestFormatter({ dotDir: '.custom' });
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
                  description: 'Test cmd',
                  prompt: true,
                  content: 'Run tests.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = customFormatter.format(ast, { version: 'multifile' });
      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands'));
      expect(cmdFile?.path).toBe('.custom/commands/test.md');
    });
  });
});
