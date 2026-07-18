import { describe, it, expect } from 'vitest';
import {
  OWNERSHIP_KEY,
  applyMergeOperations,
  removeStaleOwned,
  serializeMerged,
  hasOwnedEntries,
  parsePath,
  type StructuredMergePlan,
} from '../structured-output.js';

/** Type-safe bracket access helper for Record<string, unknown>. */
function get(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}

describe('Structured output merge', () => {
  describe('parsePath', () => {
    it('should split dotted paths into segments', () => {
      expect(parsePath('hooks.PreToolUse')).toEqual(['hooks', 'PreToolUse']);
      expect(parsePath('a.b.c')).toEqual(['a', 'b', 'c']);
      expect(parsePath('single')).toEqual(['single']);
    });
  });

  describe('applyMergeOperations', () => {
    it('should set values at the target path', () => {
      const target: Record<string, unknown> = {};
      const plan: StructuredMergePlan = {
        format: 'json',
        owner: 'promptscript',
        operations: [
          { path: 'hooks.PreToolUse', value: [{ type: 'command', command: 'echo hi' }] },
        ],
      };
      applyMergeOperations(target, plan);
      expect(target['hooks']).toBeDefined();
      expect(get(target['hooks'] as Record<string, unknown>, 'PreToolUse')).toEqual([
        { type: 'command', command: 'echo hi' },
      ]);
    });

    it('should mark created objects with ownership key', () => {
      const target: Record<string, unknown> = {};
      const plan: StructuredMergePlan = {
        format: 'json',
        owner: 'promptscript',
        operations: [{ path: 'hooks.PreToolUse', value: { command: 'echo hi' } }],
      };
      applyMergeOperations(target, plan);
      const hooks = target['hooks'] as Record<string, unknown>;
      expect(hooks[OWNERSHIP_KEY]).toBe(true);
      expect(get(hooks['PreToolUse'] as Record<string, unknown>, OWNERSHIP_KEY)).toBe(true);
    });

    it('should preserve unknown keys in existing settings', () => {
      const target: Record<string, unknown> = {
        hooks: {
          UserCustom: { command: 'my-script' },
          PreToolUse: { command: 'old-value' },
        },
      };
      const plan: StructuredMergePlan = {
        format: 'json',
        owner: 'promptscript',
        operations: [{ path: 'hooks.PreToolUse', value: { command: 'new-value' } }],
      };
      applyMergeOperations(target, plan);
      const hooks = target['hooks'] as Record<string, unknown>;
      expect(get(hooks, 'UserCustom')).toEqual({ command: 'my-script' });
    });

    it('should remove previously owned entries when value is undefined', () => {
      const target: Record<string, unknown> = {
        hooks: {
          [OWNERSHIP_KEY]: true,
          PreToolUse: { [OWNERSHIP_KEY]: true, command: 'echo hi' },
        },
      };
      const plan: StructuredMergePlan = {
        format: 'json',
        owner: 'promptscript',
        operations: [{ path: 'hooks.PreToolUse', value: undefined }],
      };
      applyMergeOperations(target, plan);
      const hooks = target['hooks'] as Record<string, unknown>;
      expect(get(hooks, 'PreToolUse')).toBeUndefined();
    });

    it('should not remove non-owned entries when value is undefined', () => {
      const target: Record<string, unknown> = {
        hooks: {
          UserCustom: { command: 'my-script' },
        },
      };
      const plan: StructuredMergePlan = {
        format: 'json',
        owner: 'promptscript',
        operations: [{ path: 'hooks.UserCustom', value: undefined }],
      };
      applyMergeOperations(target, plan);
      const hooks = target['hooks'] as Record<string, unknown>;
      expect(get(hooks, 'UserCustom')).toEqual({ command: 'my-script' });
    });

    it('should not overwrite existing intermediate objects', () => {
      const target: Record<string, unknown> = {
        hooks: {
          UserKey: 'user-value',
        },
      };
      const plan: StructuredMergePlan = {
        format: 'json',
        owner: 'promptscript',
        operations: [{ path: 'hooks.PSKey', value: 'ps-value' }],
      };
      applyMergeOperations(target, plan);
      const hooks = target['hooks'] as Record<string, unknown>;
      expect(get(hooks, 'UserKey')).toBe('user-value');
      expect(get(hooks, 'PSKey')).toBe('ps-value');
    });
  });

  describe('removeStaleOwned', () => {
    it('should remove owned entries not in the current plan', () => {
      const target: Record<string, unknown> = {
        hooks: {
          [OWNERSHIP_KEY]: true,
          OldPSKey: { [OWNERSHIP_KEY]: true, command: 'old' },
          UserKey: { command: 'user' },
        },
      };
      const plan: StructuredMergePlan = {
        format: 'json',
        owner: 'promptscript',
        operations: [{ path: 'hooks.NewPSKey', value: { command: 'new' } }],
      };
      removeStaleOwned(target, plan);
      const hooks = target['hooks'] as Record<string, unknown>;
      expect(get(hooks, 'OldPSKey')).toBeUndefined();
      expect(get(hooks, 'UserKey')).toEqual({ command: 'user' });
      expect(get(hooks, 'NewPSKey')).toBeUndefined();
    });

    it('should not remove entries that are in the current plan', () => {
      const target: Record<string, unknown> = {
        hooks: {
          [OWNERSHIP_KEY]: true,
          ActiveKey: { [OWNERSHIP_KEY]: true, command: 'active' },
        },
      };
      const plan: StructuredMergePlan = {
        format: 'json',
        owner: 'promptscript',
        operations: [{ path: 'hooks.ActiveKey', value: { command: 'updated' } }],
      };
      removeStaleOwned(target, plan);
      const hooks = target['hooks'] as Record<string, unknown>;
      expect(get(hooks, 'ActiveKey')).toBeDefined();
    });
  });

  describe('serializeMerged', () => {
    it('should serialize JSON with indentation and trailing newline', () => {
      expect(serializeMerged({ enabled: true }, 'json')).toBe('{\n  "enabled": true\n}\n');
    });

    it('should reject unsupported TOML serialization', () => {
      expect(() => serializeMerged({}, 'toml')).toThrow(
        'TOML serialization requires a TOML library; use the writer implementation'
      );
    });
  });

  describe('hasOwnedEntries', () => {
    it('should return true when ownership marker is present', () => {
      expect(hasOwnedEntries({ [OWNERSHIP_KEY]: true })).toBe(true);
      expect(hasOwnedEntries({ hooks: { [OWNERSHIP_KEY]: true } })).toBe(true);
    });

    it('should return false when no ownership markers are present', () => {
      expect(hasOwnedEntries({})).toBe(false);
      expect(hasOwnedEntries({ hooks: { command: 'user' } })).toBe(false);
    });
  });

  describe('idempotency', () => {
    it('should produce the same result when applied twice', () => {
      const target1: Record<string, unknown> = {};
      const target2: Record<string, unknown> = {};
      const plan: StructuredMergePlan = {
        format: 'json',
        owner: 'promptscript',
        operations: [
          { path: 'hooks.PreToolUse', value: { command: 'echo hi' } },
          { path: 'hooks.PostToolUse', value: { command: 'echo bye' } },
        ],
      };
      applyMergeOperations(target1, plan);
      applyMergeOperations(target2, plan);
      applyMergeOperations(target2, plan);
      expect(JSON.stringify(target1)).toBe(JSON.stringify(target2));
    });
  });
});
