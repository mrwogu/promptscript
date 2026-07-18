import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GrokFormatter } from '../formatters/grok.js';
import { ClaudeFormatter } from '../formatters/claude.js';
import type { Program } from '@promptscript/core';
import type { FormatterOutput } from '../types.js';

function createLoc() {
  return { file: 'test.prs', line: 1, column: 0 };
}

function createTestProgram(): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: {
          type: 'TextContent',
          value: 'You are a test assistant.',
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
    uses: [],
    extends: [],
    loc: createLoc(),
  };
}

describe('GrokFormatter', () => {
  let formatter: GrokFormatter;
  let claudeFormatter: ClaudeFormatter;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    formatter = new GrokFormatter();
    claudeFormatter = new ClaudeFormatter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('metadata', () => {
    it('should have name grok', () => {
      expect(formatter.name).toBe('grok');
    });

    it('should have outputPath AGENTS.md', () => {
      expect(formatter.outputPath).toBe('AGENTS.md');
    });

    it('should report .claude/skills as skill base path', () => {
      expect(formatter.getSkillBasePath()).toBe('.claude/skills');
    });

    it('should report SKILL.md as skill file name', () => {
      expect(formatter.getSkillFileName()).toBe('SKILL.md');
    });

    it('should report directory references mode', () => {
      expect(formatter.referencesMode()).toBe('directory');
    });

    it('should support simple, multifile, and full versions', () => {
      const versions = GrokFormatter.getSupportedVersions();
      expect(versions['simple']).toBeDefined();
      expect(versions['multifile']).toBeDefined();
      expect(versions['full']).toBeDefined();
    });
  });

  describe('simple version', () => {
    it('should emit AGENTS.md as the primary file', () => {
      const result = formatter.format(createTestProgram(), { version: 'simple' });
      expect(result.path).toBe('AGENTS.md');
    });

    it('should not emit additional files in simple mode', () => {
      const result = formatter.format(createTestProgram(), { version: 'simple' });
      expect(result.additionalFiles ?? []).toHaveLength(0);
    });
  });

  describe('multifile version', () => {
    it('should emit AGENTS.md as the primary file', () => {
      const result = formatter.format(createTestProgram(), { version: 'multifile' });
      expect(result.path).toBe('AGENTS.md');
    });

    it('should delegate additional files from Claude multifile', () => {
      const result = formatter.format(createTestProgram(), { version: 'multifile' });
      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles!.length).toBeGreaterThan(0);
    });

    it('should propagate guard rule files from Claude multifile', () => {
      const program: Program = {
        ...createTestProgram(),
        blocks: [
          ...createTestProgram().blocks,
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
        ],
      };

      const result = formatter.format(program, { version: 'multifile' });
      const ruleFile = result.additionalFiles?.find(
        (file) => file.path === '.claude/rules/code-style.md'
      );

      expect(ruleFile).toBeDefined();
      expect(ruleFile?.content).toContain('paths:');
      expect(ruleFile?.content).toContain('**/*.ts');
    });
  });

  describe('full version', () => {
    it('should emit AGENTS.md as the primary file', () => {
      const result = formatter.format(createTestProgram(), { version: 'full' });
      expect(result.path).toBe('AGENTS.md');
    });

    it('should delegate additional files from Claude full', () => {
      const result = formatter.format(createTestProgram(), { version: 'full' });
      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles!.length).toBeGreaterThan(0);
    });

    it('should emit Grok plugin config in full mode', () => {
      const program: Program = {
        ...createTestProgram(),
        blocks: [
          ...createTestProgram().blocks,
          {
            type: 'Block',
            name: 'plugins',
            content: {
              type: 'ObjectContent',
              properties: {
                'security-suite': {
                  version: '1.0.0',
                  source: 'npm',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(program, { version: 'full' });
      const pluginFile = result.additionalFiles?.find((file) => file.path === '.grok/plugins.json');

      expect(pluginFile).toBeDefined();
      const parsed = JSON.parse(pluginFile!.content) as {
        plugins: Record<string, unknown>;
      };
      expect(parsed.plugins['security-suite']).toEqual({
        version: '1.0.0',
        source: 'npm',
      });
    });
  });

  describe('Claude delegation byte-for-byte', () => {
    it('simple version AGENTS.md content should match Claude simple content', () => {
      const ast = createTestProgram();
      const grokResult = formatter.format(ast, { version: 'simple' });
      const claudeResult = claudeFormatter.format(ast, { version: 'simple' });
      expect(grokResult.content).toBe(claudeResult.content);
    });

    it('multifile delegated files should match Claude multifile output', () => {
      const ast = createTestProgram();
      const grokResult = formatter.format(ast, { version: 'multifile' });
      const claudeResult = claudeFormatter.format(ast, { version: 'multifile' });

      // Collect all Claude files
      const claudeFiles: FormatterOutput[] = [
        claudeResult,
        ...(claudeResult.additionalFiles ?? []),
      ];

      // Grok additional files should match Claude files (minus AGENTS.md which is primary)
      const grokAdditional = grokResult.additionalFiles ?? [];
      for (const grokFile of grokAdditional) {
        const claudeMatch = claudeFiles.find((c) => c.path === grokFile.path);
        expect(
          claudeMatch,
          `Grok file ${grokFile.path} should have a Claude counterpart`
        ).toBeDefined();
        expect(grokFile.content).toBe(claudeMatch!.content);
      }
    });

    it('full delegated files should match Claude full output', () => {
      const ast = createTestProgram();
      const grokResult = formatter.format(ast, { version: 'full' });
      const claudeResult = claudeFormatter.format(ast, { version: 'full' });

      const claudeFiles: FormatterOutput[] = [
        claudeResult,
        ...(claudeResult.additionalFiles ?? []),
      ];
      const grokAdditional = grokResult.additionalFiles ?? [];

      for (const grokFile of grokAdditional) {
        const claudeMatch = claudeFiles.find((c) => c.path === grokFile.path);
        expect(
          claudeMatch,
          `Grok file ${grokFile.path} should have a Claude counterpart`
        ).toBeDefined();
        expect(grokFile.content).toBe(claudeMatch!.content);
      }
    });
  });

  describe('additionalFiles propagation', () => {
    it('should propagate additionalFiles from Claude multifile', () => {
      const program: Program = {
        type: 'Program',
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                deploy: {
                  description: 'Deploy skill',
                  content: 'Deploy the app.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
        uses: [],
        extends: [],
        loc: createLoc(),
      };
      const formatter = new GrokFormatter();
      const result = formatter.format(program, { version: 'multifile' });
      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles!.length).toBeGreaterThan(0);
    });

    it('should propagate additionalFiles from Claude full', () => {
      const program: Program = {
        type: 'Program',
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                reviewer: {
                  description: 'Reviewer agent',
                  content: 'Review code.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
        uses: [],
        extends: [],
        loc: createLoc(),
      };
      const formatter = new GrokFormatter();
      const result = formatter.format(program, { version: 'full' });
      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles!.length).toBeGreaterThan(0);
    });
  });
});
