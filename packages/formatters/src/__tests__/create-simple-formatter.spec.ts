import { describe, expect, it } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

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

const createProgramWithIdentity = (): Program => ({
  ...createMinimalProgram(),
  blocks: [
    {
      type: 'Block',
      name: 'identity',
      content: {
        type: 'TextContent',
        value: 'You are an expert developer.',
        loc: createLoc(),
      },
      loc: createLoc(),
    },
  ],
});

describe('createSimpleMarkdownFormatter', () => {
  describe('factory function basics', () => {
    it('should return an object with Formatter and VERSIONS', () => {
      const result = createSimpleMarkdownFormatter({
        name: 'test-tool',
        outputPath: '.test/rules/project.md',
        description: 'Test tool rules (Markdown)',
        mainFileHeader: '# Project Rules',
        dotDir: '.test',
      });

      expect(result).toHaveProperty('Formatter');
      expect(result).toHaveProperty('VERSIONS');
    });

    it('should create a class that extends MarkdownInstructionFormatter', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test-tool',
        outputPath: '.test/rules/project.md',
        description: 'Test tool rules (Markdown)',
        mainFileHeader: '# Project Rules',
        dotDir: '.test',
      });

      const instance = new Formatter();
      expect(instance).toBeInstanceOf(MarkdownInstructionFormatter);
    });

    it('should create a class that is instantiable via new', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test-tool',
        outputPath: '.test/rules/project.md',
        description: 'Test tool rules (Markdown)',
        mainFileHeader: '# Project Rules',
        dotDir: '.test',
      });

      const instance = new Formatter();
      expect(instance.name).toBe('test-tool');
      expect(instance.outputPath).toBe('.test/rules/project.md');
      expect(instance.description).toBe('Test tool rules (Markdown)');
      expect(instance.defaultConvention).toBe('markdown');
    });
  });

  describe('formatter properties', () => {
    it('should set name correctly', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'my-agent',
        outputPath: '.myagent/rules/project.md',
        description: 'My Agent rules',
        mainFileHeader: '# Rules',
        dotDir: '.myagent',
      });

      expect(new Formatter().name).toBe('my-agent');
    });

    it('should set outputPath correctly', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'my-agent',
        outputPath: 'AGENTS.md',
        description: 'My Agent rules',
        mainFileHeader: '# AGENTS.md',
        dotDir: '.agents',
      });

      expect(new Formatter().outputPath).toBe('AGENTS.md');
    });

    it('should set description correctly', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'my-agent',
        outputPath: '.myagent/rules/project.md',
        description: 'Custom description text',
        mainFileHeader: '# Rules',
        dotDir: '.myagent',
      });

      expect(new Formatter().description).toBe('Custom description text');
    });

    it('should always set defaultConvention to markdown', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'my-agent',
        outputPath: '.myagent/rules/project.md',
        description: 'My Agent rules',
        mainFileHeader: '# Rules',
        dotDir: '.myagent',
      });

      expect(new Formatter().defaultConvention).toBe('markdown');
    });

    it('should set skill base path from dotDir', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'my-agent',
        outputPath: '.myagent/rules/project.md',
        description: 'My Agent rules',
        mainFileHeader: '# Rules',
        dotDir: '.myagent',
      });

      expect(new Formatter().getSkillBasePath()).toBe('.myagent/skills');
    });

    it('should set skill file name to SKILL.md by default', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'my-agent',
        outputPath: '.myagent/rules/project.md',
        description: 'My Agent rules',
        mainFileHeader: '# Rules',
        dotDir: '.myagent',
      });

      expect(new Formatter().getSkillFileName()).toBe('SKILL.md');
    });

    it('should allow custom skillFileName', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'my-agent',
        outputPath: '.myagent/rules/project.md',
        description: 'My Agent rules',
        mainFileHeader: '# Rules',
        dotDir: '.myagent',
        skillFileName: 'skill.md',
      });

      expect(new Formatter().getSkillFileName()).toBe('skill.md');
    });
  });

  describe('optional boolean parameters', () => {
    it('should default hasAgents to false', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

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
                  description: 'Code review agent',
                  content: 'Review code',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      // In full mode with hasAgents=false, no agent files should be produced
      const result = new Formatter().format(ast, { version: 'full' });
      const agentFiles = result.additionalFiles?.filter((f) => f.path.includes('agents/'));
      expect(agentFiles ?? []).toHaveLength(0);
    });

    it('should support hasAgents=true', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: 'AGENTS.md',
        description: 'Test',
        mainFileHeader: '# AGENTS.md',
        dotDir: '.test',
        hasAgents: true,
      });

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
                  description: 'Code review agent',
                  content: 'Review code',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = new Formatter().format(ast, { version: 'full' });
      const agentFiles = result.additionalFiles?.filter((f) => f.path.includes('agents/'));
      expect(agentFiles).toBeDefined();
      expect(agentFiles!.length).toBeGreaterThan(0);
    });

    it('should support hasCommands=true', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: 'TEST.md',
        description: 'Test',
        mainFileHeader: '# TEST.md',
        dotDir: '.test',
        hasCommands: true,
      });

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
                  content: 'Run deployment\nsteps here',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = new Formatter().format(ast, { version: 'multifile' });
      const cmdFiles = result.additionalFiles?.filter((f) => f.path.includes('commands/'));
      expect(cmdFiles).toBeDefined();
      expect(cmdFiles!.length).toBeGreaterThan(0);
    });

    it('should default hasSkills to true', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'my-skill': {
                  description: 'A skill',
                  content: 'Skill content',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = new Formatter().format(ast, { version: 'full' });
      const skillFiles = result.additionalFiles?.filter((f) => f.path.includes('skills/'));
      expect(skillFiles).toBeDefined();
      expect(skillFiles!.length).toBeGreaterThan(0);
    });
  });

  describe('getSupportedVersions static method', () => {
    it('should return the VERSIONS object', () => {
      const { Formatter, VERSIONS } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      expect(Formatter.getSupportedVersions()).toBe(VERSIONS);
    });

    it('should have simple, multifile, and full versions', () => {
      const { VERSIONS } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      expect(VERSIONS.simple).toBeDefined();
      expect(VERSIONS.multifile).toBeDefined();
      expect(VERSIONS.full).toBeDefined();
      expect(VERSIONS.simple.name).toBe('simple');
      expect(VERSIONS.multifile.name).toBe('multifile');
      expect(VERSIONS.full.name).toBe('full');
    });

    it('should use outputPath in all version entries', () => {
      const { VERSIONS } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      expect(VERSIONS.simple.outputPath).toBe('.test/rules/project.md');
      expect(VERSIONS.multifile.outputPath).toBe('.test/rules/project.md');
      expect(VERSIONS.full.outputPath).toBe('.test/rules/project.md');
    });
  });

  describe('version descriptions for nested output paths', () => {
    it('should generate correct descriptions for dotDir-based paths', () => {
      const { VERSIONS } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      expect(VERSIONS.simple.description).toContain('.test/rules/project.md');
      expect(VERSIONS.multifile.description).toContain('skills via full mode');
      expect(VERSIONS.full.description).toContain('.test/skills/<name>/SKILL.md');
    });
  });

  describe('version descriptions for standalone output paths', () => {
    it('should generate correct descriptions for top-level paths', () => {
      const { VERSIONS } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: 'AGENTS.md',
        description: 'Test',
        mainFileHeader: '# AGENTS.md',
        dotDir: '.agents',
      });

      expect(VERSIONS.simple.description).toContain('AGENTS.md');
      expect(VERSIONS.multifile.description).toContain('.agents/skills/<name>/SKILL.md');
      expect(VERSIONS.full.description).toContain('.agents/skills/<name>/SKILL.md');
    });
  });

  describe('formatting output', () => {
    it('should format minimal program with correct header', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test rules',
        mainFileHeader: '# My Custom Header',
        dotDir: '.test',
      });

      const result = new Formatter().format(createMinimalProgram());
      expect(result.path).toBe('.test/rules/project.md');
      expect(result.content).toContain('# My Custom Header');
    });

    it('should include project section from identity block', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test rules',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      const result = new Formatter().format(createProgramWithIdentity());
      expect(result.content).toContain('## Project');
      expect(result.content).toContain('You are an expert developer.');
    });

    it('should support simple mode', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test rules',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      const result = new Formatter().format(createMinimalProgram(), { version: 'simple' });
      expect(result.path).toBe('.test/rules/project.md');
    });

    it('should support multifile mode', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test rules',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      const result = new Formatter().format(createMinimalProgram(), { version: 'multifile' });
      expect(result.path).toBe('.test/rules/project.md');
    });

    it('should support full mode', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test rules',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      const result = new Formatter().format(createMinimalProgram(), { version: 'full' });
      expect(result.path).toBe('.test/rules/project.md');
    });

    it('should support custom outputPath option', () => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test',
        outputPath: '.test/rules/project.md',
        description: 'Test rules',
        mainFileHeader: '# Rules',
        dotDir: '.test',
      });

      const result = new Formatter().format(createMinimalProgram(), {
        outputPath: 'custom/output.md',
      });
      expect(result.path).toBe('custom/output.md');
    });
  });

  describe('multiple independent factory calls', () => {
    it('should produce independent formatters', () => {
      const a = createSimpleMarkdownFormatter({
        name: 'alpha',
        outputPath: '.alpha/rules/project.md',
        description: 'Alpha',
        mainFileHeader: '# Alpha',
        dotDir: '.alpha',
      });

      const b = createSimpleMarkdownFormatter({
        name: 'beta',
        outputPath: '.beta/rules/project.md',
        description: 'Beta',
        mainFileHeader: '# Beta',
        dotDir: '.beta',
      });

      const instanceA = new a.Formatter();
      const instanceB = new b.Formatter();

      expect(instanceA.name).toBe('alpha');
      expect(instanceB.name).toBe('beta');
      expect(instanceA.outputPath).not.toBe(instanceB.outputPath);
    });

    it('should produce independent VERSIONS objects', () => {
      const a = createSimpleMarkdownFormatter({
        name: 'alpha',
        outputPath: '.alpha/rules/project.md',
        description: 'Alpha',
        mainFileHeader: '# Alpha',
        dotDir: '.alpha',
      });

      const b = createSimpleMarkdownFormatter({
        name: 'beta',
        outputPath: '.beta/rules/project.md',
        description: 'Beta',
        mainFileHeader: '# Beta',
        dotDir: '.beta',
      });

      expect(a.VERSIONS).not.toBe(b.VERSIONS);
      expect(a.VERSIONS.simple.outputPath).toContain('alpha');
      expect(b.VERSIONS.simple.outputPath).toContain('beta');
    });
  });

  describe('backward compatibility with existing formatters', () => {
    it('should produce formatters that work identically to hand-written ones', () => {
      // Verify the windsurf formatter (via factory) matches expected behavior
      const { Formatter: TestWindsurf } = createSimpleMarkdownFormatter({
        name: 'windsurf',
        outputPath: '.windsurf/rules/project.md',
        description: 'Windsurf rules (Markdown)',
        mainFileHeader: '# Project Rules',
        dotDir: '.windsurf',
      });

      const formatter = new TestWindsurf();
      expect(formatter.name).toBe('windsurf');
      expect(formatter.outputPath).toBe('.windsurf/rules/project.md');
      expect(formatter.description).toBe('Windsurf rules (Markdown)');
      expect(formatter.defaultConvention).toBe('markdown');
      expect(formatter.getSkillBasePath()).toBe('.windsurf/skills');
      expect(formatter.getSkillFileName()).toBe('SKILL.md');

      const ast = createProgramWithIdentity();
      const result = formatter.format(ast);
      expect(result.path).toBe('.windsurf/rules/project.md');
      expect(result.content).toContain('# Project Rules');
      expect(result.content).toContain('You are an expert developer.');
    });
  });
});
