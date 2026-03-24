import { describe, it, expect } from 'vitest';
import { cursorConfig } from '../cursor.js';

describe('hooks/tool-configs/cursorConfig', () => {
  // --- metadata ---

  it('has correct name', () => {
    expect(cursorConfig.name).toBe('cursor');
  });

  it('has correct settingsPath', () => {
    expect(cursorConfig.settingsPath).toBe('.cursor/hooks.json');
  });

  it('has correct timeoutUnit', () => {
    expect(cursorConfig.timeoutUnit).toBe('milliseconds');
  });

  it('has correct detectPaths', () => {
    expect(cursorConfig.detectPaths).toEqual(['.cursor']);
  });

  // --- generatePreEditHook ---

  it('generates valid pre-edit hook config with beforeFileEdit key and timeout_ms', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = cursorConfig.generatePreEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      hooks: {
        beforeFileEdit: [
          {
            command: ['bash', '-c', '/usr/local/bin/prs hook pre-edit'],
            timeout_ms: 5000,
          },
        ],
      },
    });
  });

  // --- generatePostEditHook ---

  it('generates valid post-edit hook config with afterFileEdit key and timeout_ms', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = cursorConfig.generatePostEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      hooks: {
        afterFileEdit: [
          {
            command: ['bash', '-c', '/usr/local/bin/prs hook post-edit'],
            timeout_ms: 15000,
          },
        ],
      },
    });
  });

  // --- mergeIntoSettings ---

  it('merges into empty settings using beforeFileEdit/afterFileEdit structure', () => {
    // Arrange
    const existing = {};
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = cursorConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const hooks = (result as { hooks: { beforeFileEdit: unknown[]; afterFileEdit: unknown[] } })
      .hooks;
    expect(hooks.beforeFileEdit).toHaveLength(1);
    expect(hooks.afterFileEdit).toHaveLength(1);
  });

  it('skips merge if hooks already installed', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = cursorConfig.mergeIntoSettings({}, prsPath);

    // Act
    const result = cursorConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const hooks = (result as { hooks: { beforeFileEdit: unknown[]; afterFileEdit: unknown[] } })
      .hooks;
    expect(hooks.beforeFileEdit).toHaveLength(1);
    expect(hooks.afterFileEdit).toHaveLength(1);
  });

  it('preserves non-hook settings during merge', () => {
    // Arrange
    const existing = { theme: 'dark', fontSize: 14 };
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = cursorConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['theme']).toBe('dark');
    expect(typed['fontSize']).toBe(14);
  });

  // --- removeFromSettings ---

  it('removes only prs hooks on uninstall, preserves other hooks', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const otherHook = { command: ['bash', '-c', 'echo hi'], timeout_ms: 1000 };
    const existing = {
      hooks: {
        beforeFileEdit: [
          { command: ['bash', '-c', `${prsPath} hook pre-edit`], timeout_ms: 5000 },
          otherHook,
        ],
        afterFileEdit: [
          { command: ['bash', '-c', `${prsPath} hook post-edit`], timeout_ms: 15000 },
        ],
      },
    };

    // Act
    const result = cursorConfig.removeFromSettings(existing);

    // Assert
    const hooks = (result as { hooks: { beforeFileEdit: unknown[]; afterFileEdit: unknown[] } })
      .hooks;
    expect(hooks.beforeFileEdit).toHaveLength(1);
    expect(hooks.beforeFileEdit[0]).toEqual(otherHook);
    expect(hooks.afterFileEdit).toHaveLength(0);
  });

  it('preserves non-hook settings during uninstall', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = {
      theme: 'dark',
      hooks: {
        beforeFileEdit: [{ command: ['bash', '-c', `${prsPath} hook pre-edit`], timeout_ms: 5000 }],
        afterFileEdit: [],
      },
    };

    // Act
    const result = cursorConfig.removeFromSettings(existing);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['theme']).toBe('dark');
  });
});
