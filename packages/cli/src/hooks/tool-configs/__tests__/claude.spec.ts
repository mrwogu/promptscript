import { describe, it, expect } from 'vitest';
import { claudeConfig, isPrsHookEntry } from '../claude.js';

describe('hooks/tool-configs/claudeConfig', () => {
  // --- metadata ---

  it('has correct name', () => {
    expect(claudeConfig.name).toBe('claude');
  });

  it('has correct settingsPath', () => {
    expect(claudeConfig.settingsPath).toBe('.claude/settings.json');
  });

  it('has correct timeoutUnit', () => {
    expect(claudeConfig.timeoutUnit).toBe('seconds');
  });

  it('has correct detectPaths', () => {
    expect(claudeConfig.detectPaths).toEqual(['.claude']);
  });

  // --- generatePreEditHook ---

  it('generates valid pre-edit hook config', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = claudeConfig.generatePreEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      matcher: 'Edit|Write',
      hooks: [
        {
          type: 'command',
          command: '/usr/local/bin/prs hook pre-edit',
          timeout: 5,
          statusMessage: 'PromptScript: checking generated files...',
        },
      ],
    });
  });

  // --- generatePostEditHook ---

  it('generates valid post-edit hook config', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = claudeConfig.generatePostEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      matcher: 'Edit|Write',
      hooks: [
        {
          type: 'command',
          command: '/usr/local/bin/prs hook post-edit',
          timeout: 15,
          statusMessage: 'PromptScript: compiling...',
        },
      ],
    });
  });

  // --- mergeIntoSettings ---

  it('merges into empty settings', () => {
    // Arrange
    const existing = {};
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = claudeConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    expect(result).toEqual({
      hooks: {
        PreToolUse: [claudeConfig.generatePreEditHook(prsPath)],
        PostToolUse: [claudeConfig.generatePostEditHook(prsPath)],
      },
    });
  });

  it('merges preserving existing hooks in PreToolUse', () => {
    // Arrange
    const existingHook = { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo hi' }] };
    const existing = {
      hooks: {
        PreToolUse: [existingHook],
      },
    };
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = claudeConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const hooks = (result as { hooks: { PreToolUse: unknown[]; PostToolUse: unknown[] } }).hooks;
    expect(hooks.PreToolUse).toHaveLength(2);
    expect(hooks.PreToolUse[0]).toEqual(existingHook);
    expect(hooks.PreToolUse[1]).toEqual(claudeConfig.generatePreEditHook(prsPath));
    expect(hooks.PostToolUse).toHaveLength(1);
    expect(hooks.PostToolUse[0]).toEqual(claudeConfig.generatePostEditHook(prsPath));
  });

  it('skips merge if pre-edit hook already installed', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = {
      hooks: {
        PreToolUse: [claudeConfig.generatePreEditHook(prsPath)],
        PostToolUse: [claudeConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = claudeConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const hooks = (result as { hooks: { PreToolUse: unknown[]; PostToolUse: unknown[] } }).hooks;
    expect(hooks.PreToolUse).toHaveLength(1);
    expect(hooks.PostToolUse).toHaveLength(1);
  });

  it('preserves non-hook settings (permissions, etc.) during merge', () => {
    // Arrange
    const existing = {
      permissions: { allow: ['Bash'], deny: [] },
      someOtherSetting: 42,
    };
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = claudeConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['permissions']).toEqual({ allow: ['Bash'], deny: [] });
    expect(typed['someOtherSetting']).toBe(42);
  });

  // --- removeFromSettings ---

  it('removes only prs hooks on uninstall, preserves other hooks', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const otherHook = { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo hi' }] };
    const existing = {
      hooks: {
        PreToolUse: [claudeConfig.generatePreEditHook(prsPath), otherHook],
        PostToolUse: [claudeConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = claudeConfig.removeFromSettings(existing);

    // Assert
    const hooks = (result as { hooks: { PreToolUse: unknown[]; PostToolUse: unknown[] } }).hooks;
    expect(hooks.PreToolUse).toHaveLength(1);
    expect(hooks.PreToolUse[0]).toEqual(otherHook);
    expect(hooks.PostToolUse).toHaveLength(0);
  });

  it('preserves non-hook settings during uninstall', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = {
      permissions: { allow: ['Bash'] },
      hooks: {
        PreToolUse: [claudeConfig.generatePreEditHook(prsPath)],
        PostToolUse: [],
      },
    };

    // Act
    const result = claudeConfig.removeFromSettings(existing);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['permissions']).toEqual({ allow: ['Bash'] });
  });
});

describe('isPrsHookEntry', () => {
  it('returns false for null', () => {
    expect(isPrsHookEntry(null)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isPrsHookEntry('not an object')).toBe(false);
  });

  it('returns false when hooks is not an array', () => {
    expect(isPrsHookEntry({ hooks: 'not array' })).toBe(false);
  });

  it('returns false for empty hooks array', () => {
    expect(isPrsHookEntry({ hooks: [] })).toBe(false);
  });

  it('returns true when hooks contain prs hook command', () => {
    expect(isPrsHookEntry({ hooks: [{ command: '/usr/bin/prs hook pre-edit' }] })).toBe(true);
  });
});
