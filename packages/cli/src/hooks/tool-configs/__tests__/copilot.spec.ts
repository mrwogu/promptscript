import { describe, it, expect } from 'vitest';
import { copilotConfig } from '../copilot.js';

describe('hooks/tool-configs/copilotConfig', () => {
  // --- metadata ---

  it('has correct name', () => {
    expect(copilotConfig.name).toBe('copilot');
  });

  it('has correct settingsPath', () => {
    expect(copilotConfig.settingsPath).toBe('.vscode/hooks.json');
  });

  it('has correct timeoutUnit', () => {
    expect(copilotConfig.timeoutUnit).toBe('seconds');
  });

  it('has correct detectPaths', () => {
    expect(copilotConfig.detectPaths).toEqual(['.vscode', '.github/copilot-instructions.md']);
  });

  // --- generatePreEditHook ---

  it('generates valid pre-edit hook config', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = copilotConfig.generatePreEditHook(prsPath);

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
    const result = copilotConfig.generatePostEditHook(prsPath);

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
    const result = copilotConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    expect(result).toEqual({
      hooks: {
        PreToolUse: [copilotConfig.generatePreEditHook(prsPath)],
        PostToolUse: [copilotConfig.generatePostEditHook(prsPath)],
      },
    });
  });

  it('skips merge if hooks already installed', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = {
      hooks: {
        PreToolUse: [copilotConfig.generatePreEditHook(prsPath)],
        PostToolUse: [copilotConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = copilotConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const hooks = (result as { hooks: { PreToolUse: unknown[]; PostToolUse: unknown[] } }).hooks;
    expect(hooks.PreToolUse).toHaveLength(1);
    expect(hooks.PostToolUse).toHaveLength(1);
  });

  it('preserves non-hook settings during merge', () => {
    // Arrange
    const existing = { permissions: { allow: ['Bash'] }, someOtherSetting: 42 };
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = copilotConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['permissions']).toEqual({ allow: ['Bash'] });
    expect(typed['someOtherSetting']).toBe(42);
  });

  // --- removeFromSettings ---

  it('removes only prs hooks on uninstall, preserves other hooks', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const otherHook = { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo hi' }] };
    const existing = {
      hooks: {
        PreToolUse: [copilotConfig.generatePreEditHook(prsPath), otherHook],
        PostToolUse: [copilotConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = copilotConfig.removeFromSettings(existing);

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
        PreToolUse: [copilotConfig.generatePreEditHook(prsPath)],
        PostToolUse: [],
      },
    };

    // Act
    const result = copilotConfig.removeFromSettings(existing);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['permissions']).toEqual({ allow: ['Bash'] });
  });
});
