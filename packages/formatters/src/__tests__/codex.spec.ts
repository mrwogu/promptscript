import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CodexFormatter } from '../formatters/codex.js';
import type { Program, Value } from '@promptscript/core';

function createLoc() {
  return { file: 'test.prs', line: 1, column: 0 };
}

function createProgramWithAgent(): Program {
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
      {
        type: 'Block',
        name: 'agents',
        content: {
          type: 'ObjectContent',
          properties: {
            reviewer: {
              description: 'Review changed code',
              content: {
                type: 'TextContent',
                value: 'Review correctness and security.',
                loc: createLoc(),
              },
              reasoningEffort: 'high',
              sandboxMode: 'read-only',
              nicknameCandidates: ['reviewer', 'auditor'],
            } as Record<string, Value>,
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
}

describe('CodexFormatter', () => {
  let formatter: CodexFormatter;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    formatter = new CodexFormatter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('metadata', () => {
    it('should have name codex', () => {
      expect(formatter.name).toBe('codex');
    });

    it('should have outputPath AGENTS.md', () => {
      expect(formatter.outputPath).toBe('AGENTS.md');
    });

    it('should report .agents/skills as skill base path', () => {
      expect(formatter.getSkillBasePath()).toBe('.agents/skills');
    });

    it('should report SKILL.md as skill file name', () => {
      expect(formatter.getSkillFileName()).toBe('SKILL.md');
    });

    it('should support simple, multifile, and full versions', () => {
      const versions = CodexFormatter.getSupportedVersions();
      expect(versions['simple']).toBeDefined();
      expect(versions['multifile']).toBeDefined();
      expect(versions['full']).toBeDefined();
    });
  });

  describe('simple version', () => {
    it('should emit AGENTS.md as the primary file', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'simple' });
      expect(result.path).toBe('AGENTS.md');
    });

    it('should not emit additional files in simple mode', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'simple' });
      expect(result.additionalFiles ?? []).toHaveLength(0);
    });
  });

  describe('multifile version', () => {
    it('should emit AGENTS.md as the primary file', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'multifile' });
      expect(result.path).toBe('AGENTS.md');
    });

    it('should emit .codex/agents/<name>.toml for agents', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'multifile' });
      const additional = result.additionalFiles ?? [];
      const agentToml = additional.find((f) => f.path === '.codex/agents/reviewer.toml');
      expect(agentToml).toBeDefined();
    });

    it('should map content to developer_instructions', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'multifile' });
      const agentToml = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/agents/reviewer.toml'
      );
      expect(agentToml).toBeDefined();
      expect(agentToml!.content).toContain('developer_instructions');
      expect(agentToml!.content).toContain('Review correctness and security.');
    });

    it('should map reasoningEffort to model_reasoning_effort', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'multifile' });
      const agentToml = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/agents/reviewer.toml'
      );
      expect(agentToml).toBeDefined();
      expect(agentToml!.content).toContain('model_reasoning_effort = "high"');
    });

    it('should map sandboxMode to sandbox_mode', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'multifile' });
      const agentToml = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/agents/reviewer.toml'
      );
      expect(agentToml).toBeDefined();
      expect(agentToml!.content).toContain('sandbox_mode = "read-only"');
    });

    it('should map nicknameCandidates to nickname_candidates', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'multifile' });
      const agentToml = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/agents/reviewer.toml'
      );
      expect(agentToml).toBeDefined();
      expect(agentToml!.content).toContain('nickname_candidates = ["reviewer", "auditor"]');
    });
  });

  describe('full version', () => {
    it('should emit AGENTS.md as the primary file', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'full' });
      expect(result.path).toBe('AGENTS.md');
    });

    it('should emit agent TOML files', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'full' });
      const additional = result.additionalFiles ?? [];
      const agentToml = additional.find((f) => f.path === '.codex/agents/reviewer.toml');
      expect(agentToml).toBeDefined();
    });
  });

  describe('TOML serialization', () => {
    it('should not emit developer_instructions when content is absent', () => {
      const program: Program = {
        type: 'Program',
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                simple: {
                  description: 'Simple agent without content',
                } as Record<string, Value>,
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
      const result = formatter.format(program, { version: 'multifile' });
      const agentToml = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/agents/simple.toml'
      );
      expect(agentToml).toBeDefined();
      expect(agentToml!.content).not.toContain('developer_instructions');
    });

    it('should manage .codex/agents directory', () => {
      const result = formatter.format(createProgramWithAgent(), { version: 'multifile' });
      expect(result.managedOutputDirectories).toContain('.codex/agents');
    });
  });

  describe('project config merge', () => {
    it('should emit .codex/config.toml when maxThreads is set', () => {
      const result = formatter.format(createProgramWithAgent(), {
        version: 'multifile',
        targetConfig: { maxThreads: 8 },
      });
      const configFile = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/config.toml'
      );
      expect(configFile).toBeDefined();
      expect(configFile!.content).toContain('max_threads = 8');
    });

    it('should emit .codex/config.toml when maxDepth is set', () => {
      const result = formatter.format(createProgramWithAgent(), {
        version: 'multifile',
        targetConfig: { maxDepth: 2 },
      });
      const configFile = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/config.toml'
      );
      expect(configFile).toBeDefined();
      expect(configFile!.content).toContain('max_depth = 2');
    });

    it('should emit .codex/config.toml when agentsFile is set', () => {
      const result = formatter.format(createProgramWithAgent(), {
        version: 'multifile',
        targetConfig: { agentsFile: 'AGENTS.override.md' },
      });
      const configFile = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/config.toml'
      );
      expect(configFile).toBeDefined();
      expect(configFile!.content).toContain('agents_file = "AGENTS.override.md"');
    });

    it('should not emit config.toml when no project config options are set', () => {
      const result = formatter.format(createProgramWithAgent(), {
        version: 'multifile',
      });
      const configFile = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/config.toml'
      );
      expect(configFile).toBeUndefined();
    });

    it('should manage .codex directory when config is emitted', () => {
      const result = formatter.format(createProgramWithAgent(), {
        version: 'multifile',
        targetConfig: { maxThreads: 4 },
      });
      expect(result.managedOutputDirectories).toContain('.codex');
    });

    it('should floor fractional maxThreads to integer', () => {
      const result = formatter.format(createProgramWithAgent(), {
        version: 'multifile',
        targetConfig: { maxThreads: 8.7 },
      });
      const configFile = (result.additionalFiles ?? []).find(
        (f) => f.path === '.codex/config.toml'
      );
      expect(configFile).toBeDefined();
      expect(configFile!.content).toContain('max_threads = 8');
    });
  });
});
