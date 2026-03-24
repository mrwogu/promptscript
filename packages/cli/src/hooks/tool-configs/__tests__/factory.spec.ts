import { describe, it, expect } from 'vitest';
import { factoryConfig } from '../factory.js';

describe('hooks/tool-configs/factoryConfig', () => {
  // --- metadata ---

  it('has correct name', () => {
    expect(factoryConfig.name).toBe('factory');
  });

  it('has correct settingsPath', () => {
    expect(factoryConfig.settingsPath).toBe('.factory/settings.json');
  });

  it('has correct timeoutUnit', () => {
    expect(factoryConfig.timeoutUnit).toBe('seconds');
  });

  it('has correct detectPaths', () => {
    expect(factoryConfig.detectPaths).toEqual(['.factory']);
  });

  // --- generatePreEditHook ---

  it('generates valid pre-edit hook config', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = factoryConfig.generatePreEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      matcher: 'Create|Edit',
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
    const result = factoryConfig.generatePostEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      matcher: 'Create|Edit',
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
    const result = factoryConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    expect(result).toEqual({
      hooks: {
        PreToolUse: [factoryConfig.generatePreEditHook(prsPath)],
        PostToolUse: [factoryConfig.generatePostEditHook(prsPath)],
      },
    });
  });

  it('skips merge if pre-edit hook already installed', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = {
      hooks: {
        PreToolUse: [factoryConfig.generatePreEditHook(prsPath)],
        PostToolUse: [factoryConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = factoryConfig.mergeIntoSettings(existing, prsPath);

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
    const result = factoryConfig.mergeIntoSettings(existing, prsPath);

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
        PreToolUse: [factoryConfig.generatePreEditHook(prsPath), otherHook],
        PostToolUse: [factoryConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = factoryConfig.removeFromSettings(existing);

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
        PreToolUse: [factoryConfig.generatePreEditHook(prsPath)],
        PostToolUse: [],
      },
    };

    // Act
    const result = factoryConfig.removeFromSettings(existing);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['permissions']).toEqual({ allow: ['Bash'] });
  });
});
