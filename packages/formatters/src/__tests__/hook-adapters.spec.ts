import { describe, it, expect } from 'vitest';
import {
  extractHooks,
  generateClaudeHooks,
  generateCodexHooks,
  generateCursorHooks,
  generateFactoryHooks,
  mapEvent,
  convertTimeout,
} from '../hook-adapters.js';
import type { Value } from '@promptscript/core';

function makeLoc() {
  return { file: 'test.prs', line: 1, column: 0 };
}

function makeHooksBlock(hooks: Record<string, Record<string, Value>>) {
  return {
    content: {
      type: 'ObjectContent',
      properties: hooks,
      loc: makeLoc(),
    },
  };
}

describe('hook-adapters', () => {
  describe('extractHooks', () => {
    it('should extract a valid hook definition', () => {
      const block = makeHooksBlock({
        'protect-generated': {
          event: 'pre-tool-use',
          matcher: 'Edit|Write',
          command: ['prs', 'hook', 'pre-edit'],
          timeoutMs: 5000,
          statusMessage: 'Checking generated files',
          continueOnFailure: false,
          enabled: true,
        },
      });
      const hooks = extractHooks(block);
      expect(hooks).toHaveLength(1);
      expect(hooks[0]!.id).toBe('protect-generated');
      expect(hooks[0]!.event).toBe('pre-tool-use');
      expect(hooks[0]!.matcher).toBe('Edit|Write');
      expect(hooks[0]!.command).toEqual(['prs', 'hook', 'pre-edit']);
      expect(hooks[0]!.timeoutMs).toBe(5000);
      expect(hooks[0]!.statusMessage).toBe('Checking generated files');
      expect(hooks[0]!.continueOnFailure).toBe(false);
      expect(hooks[0]!.enabled).toBe(true);
    });

    it('should skip entries without event', () => {
      const block = makeHooksBlock({
        bad: { command: ['prs', 'hook'] },
      });
      expect(extractHooks(block)).toHaveLength(0);
    });

    it('should skip entries without command', () => {
      const block = makeHooksBlock({
        bad: { event: 'pre-tool-use' },
      });
      expect(extractHooks(block)).toHaveLength(0);
    });

    it('should return empty for non-object content', () => {
      const block = { content: { type: 'TextContent' } };
      expect(extractHooks(block as never)).toHaveLength(0);
    });
  });

  describe('mapEvent', () => {
    it('should map pre-tool-use to Claude PreToolUse', () => {
      expect(mapEvent('pre-tool-use', 'claude')).toBe('PreToolUse');
    });

    it('should map post-tool-use to Claude PostToolUse', () => {
      expect(mapEvent('post-tool-use', 'claude')).toBe('PostToolUse');
    });

    it('should map session-start to Claude SessionStart', () => {
      expect(mapEvent('session-start', 'claude')).toBe('SessionStart');
    });

    it('should map setup to Claude SessionStart', () => {
      expect(mapEvent('setup', 'claude')).toBe('SessionStart');
    });

    it('should map pre-tool-use to Codex pre_tool_use', () => {
      expect(mapEvent('pre-tool-use', 'codex')).toBe('pre_tool_use');
    });

    it('should map pre-tool-use to Cursor preEdit', () => {
      expect(mapEvent('pre-tool-use', 'cursor')).toBe('preEdit');
    });

    it('should map post-tool-use to Factory postToolUse', () => {
      expect(mapEvent('post-tool-use', 'factory')).toBe('postToolUse');
    });
  });

  describe('convertTimeout', () => {
    it('should convert ms to seconds for Claude', () => {
      expect(convertTimeout(5000, 'claude')).toBe(5);
    });

    it('should convert ms to seconds for Cursor', () => {
      expect(convertTimeout(15000, 'cursor')).toBe(15);
    });

    it('should keep ms for Codex', () => {
      expect(convertTimeout(5000, 'codex')).toBe(5000);
    });

    it('should convert ms to seconds for Factory', () => {
      expect(convertTimeout(15000, 'factory')).toBe(15);
    });
  });

  describe('generateClaudeHooks', () => {
    it('should generate PreToolUse hook entry', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          protect: {
            event: 'pre-tool-use',
            matcher: 'Edit|Write',
            command: ['prs', 'hook', 'pre-edit'],
            timeoutMs: 5000,
          },
        })
      );
      const result = generateClaudeHooks(hooks);
      expect(result['PreToolUse']).toBeDefined();
      expect(result['PreToolUse']).toHaveLength(1);
    });

    it('should skip disabled hooks', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          disabled: {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            enabled: false,
          },
        })
      );
      const result = generateClaudeHooks(hooks);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should join command arguments with spaces', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          test: {
            event: 'pre-tool-use',
            command: ['prs', 'hook', 'pre-edit'],
          },
        })
      );
      const result = generateClaudeHooks(hooks);
      const preToolUse = result['PreToolUse'] as unknown[] | undefined;
      expect(preToolUse).toBeDefined();
      const entry = preToolUse![0] as Record<string, unknown>;
      const hookArr = entry['hooks'] as Record<string, unknown>[];
      expect(hookArr[0]!['command']).toBe('prs hook pre-edit');
    });
  });

  describe('generateCodexHooks', () => {
    it('should generate TOML hook sections', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          protect: {
            event: 'pre-tool-use',
            matcher: 'Edit|Write',
            command: ['prs', 'hook', 'pre-edit'],
            timeoutMs: 5000,
          },
        })
      );
      const toml = generateCodexHooks(hooks);
      expect(toml).toContain('[[hooks.pre_tool_use]]');
      expect(toml).toContain('id = "protect"');
      expect(toml).toContain('command = ["prs", "hook", "pre-edit"]');
      expect(toml).toContain('matcher = "Edit|Write"');
      expect(toml).toContain('timeout_ms = 5000');
    });

    it('should skip disabled hooks', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          disabled: {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            enabled: false,
          },
        })
      );
      const toml = generateCodexHooks(hooks);
      expect(toml.trim()).toBe('');
    });

    it('should include statusMessage in Claude hooks', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          'status-hook': {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            statusMessage: 'Running pre-tool hook',
          },
        })
      );
      const claudeHooks = generateClaudeHooks(hooks);
      expect(claudeHooks).toBeDefined();
      // Verify statusMessage is included somewhere in the structure
      const json = JSON.stringify(claudeHooks);
      expect(json).toContain('statusMessage');
      expect(json).toContain('Running pre-tool hook');
    });
  });

  describe('generateCursorHooks', () => {
    it('should generate enabled hooks with Cursor options', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          active: {
            event: 'pre-tool-use',
            matcher: 'Edit|Write',
            command: ['prs', 'hook', 'pre-edit'],
            timeoutMs: 5000,
            statusMessage: 'Checking files',
            continueOnFailure: true,
          },
          disabled: {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            enabled: false,
          },
        })
      );

      expect(generateCursorHooks(hooks)).toEqual({
        preEdit: [
          {
            matcher: 'Edit|Write',
            command: 'prs hook pre-edit',
            timeout: 5,
            statusMessage: 'Checking files',
            continueOnFailure: true,
          },
        ],
      });
    });
  });

  describe('generateFactoryHooks', () => {
    it('should generate enabled hooks with Factory options', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          active: {
            event: 'pre-tool-use',
            command: ['prs', 'hook', 'pre-edit'],
            timeoutMs: 5000,
            statusMessage: 'Checking files',
          },
          disabled: {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            enabled: false,
          },
        })
      );

      expect(generateFactoryHooks(hooks)).toEqual({
        preToolUse: [
          {
            matcher: '.*',
            hooks: [
              {
                type: 'command',
                command: 'prs hook pre-edit',
                timeout: 5,
                statusMessage: 'Checking files',
              },
            ],
          },
        ],
      });
    });
  });
});
