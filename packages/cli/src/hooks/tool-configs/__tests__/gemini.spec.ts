import { describe, it, expect } from 'vitest';
import { geminiConfig } from '../gemini.js';

describe('hooks/tool-configs/geminiConfig', () => {
  // --- metadata ---

  it('has correct name', () => {
    expect(geminiConfig.name).toBe('gemini');
  });

  it('has correct settingsPath', () => {
    expect(geminiConfig.settingsPath).toBe('.gemini/settings.json');
  });

  it('has correct timeoutUnit', () => {
    expect(geminiConfig.timeoutUnit).toBe('milliseconds');
  });

  it('has correct detectPaths', () => {
    expect(geminiConfig.detectPaths).toEqual(['.gemini']);
  });

  // --- generatePreEditHook ---

  it('generates valid pre-edit hook config with BeforeTool event and ms timeout', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = geminiConfig.generatePreEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      matcher: 'write_.*|edit_.*',
      hooks: [
        {
          type: 'command',
          command: '/usr/local/bin/prs hook pre-edit',
          timeout: 5000,
        },
      ],
    });
  });

  it('does not include statusMessage in pre-edit hook', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = geminiConfig.generatePreEditHook(prsPath);

    // Assert
    const hooks = (result as { hooks: unknown[] }).hooks;
    const hook = hooks[0] as Record<string, unknown>;
    expect(hook).not.toHaveProperty('statusMessage');
  });

  // --- generatePostEditHook ---

  it('generates valid post-edit hook config with AfterTool event and ms timeout', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = geminiConfig.generatePostEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      matcher: 'write_.*|edit_.*',
      hooks: [
        {
          type: 'command',
          command: '/usr/local/bin/prs hook post-edit',
          timeout: 15000,
        },
      ],
    });
  });

  // --- mergeIntoSettings ---

  it('merges into empty settings using BeforeTool/AfterTool event keys', () => {
    // Arrange
    const existing = {};
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = geminiConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    expect(result).toEqual({
      hooks: {
        BeforeTool: [geminiConfig.generatePreEditHook(prsPath)],
        AfterTool: [geminiConfig.generatePostEditHook(prsPath)],
      },
    });
  });

  it('skips merge if hooks already installed', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = {
      hooks: {
        BeforeTool: [geminiConfig.generatePreEditHook(prsPath)],
        AfterTool: [geminiConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = geminiConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const hooks = (result as { hooks: { BeforeTool: unknown[]; AfterTool: unknown[] } }).hooks;
    expect(hooks.BeforeTool).toHaveLength(1);
    expect(hooks.AfterTool).toHaveLength(1);
  });

  it('preserves non-hook settings during merge', () => {
    // Arrange
    const existing = { model: 'gemini-pro', someOtherSetting: 42 };
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = geminiConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['model']).toBe('gemini-pro');
    expect(typed['someOtherSetting']).toBe(42);
  });

  // --- removeFromSettings ---

  it('removes only prs hooks on uninstall, preserves other hooks', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const otherHook = { matcher: 'read_.*', hooks: [{ type: 'command', command: 'echo hi' }] };
    const existing = {
      hooks: {
        BeforeTool: [geminiConfig.generatePreEditHook(prsPath), otherHook],
        AfterTool: [geminiConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = geminiConfig.removeFromSettings(existing);

    // Assert
    const hooks = (result as { hooks: { BeforeTool: unknown[]; AfterTool: unknown[] } }).hooks;
    expect(hooks.BeforeTool).toHaveLength(1);
    expect(hooks.BeforeTool[0]).toEqual(otherHook);
    expect(hooks.AfterTool).toHaveLength(0);
  });

  it('preserves non-hook settings during uninstall', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = {
      model: 'gemini-pro',
      hooks: {
        BeforeTool: [geminiConfig.generatePreEditHook(prsPath)],
        AfterTool: [],
      },
    };

    // Act
    const result = geminiConfig.removeFromSettings(existing);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['model']).toBe('gemini-pro');
  });
});
