import { describe, it, expect } from 'vitest';
import { windsurfConfig } from '../windsurf.js';

describe('hooks/tool-configs/windsurfConfig', () => {
  // --- metadata ---

  it('has correct name', () => {
    expect(windsurfConfig.name).toBe('windsurf');
  });

  it('has correct settingsPath', () => {
    expect(windsurfConfig.settingsPath).toBe('.windsurf/hooks.json');
  });

  it('has correct timeoutUnit', () => {
    expect(windsurfConfig.timeoutUnit).toBe('milliseconds');
  });

  it('has correct detectPaths', () => {
    expect(windsurfConfig.detectPaths).toEqual(['.windsurf']);
  });

  // --- generatePreEditHook ---

  it('generates valid pre-edit hook config with pre_write_code event and ms timeout', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = windsurfConfig.generatePreEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      matcher: 'Edit|Write',
      hooks: [
        {
          type: 'command',
          command: '/usr/local/bin/prs hook pre-edit',
          timeout: 5000,
          statusMessage: 'PromptScript: checking generated files...',
        },
      ],
    });
  });

  // --- generatePostEditHook ---

  it('generates valid post-edit hook config with post_write_code event and ms timeout', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = windsurfConfig.generatePostEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      matcher: 'Edit|Write',
      hooks: [
        {
          type: 'command',
          command: '/usr/local/bin/prs hook post-edit',
          timeout: 15000,
          statusMessage: 'PromptScript: compiling...',
        },
      ],
    });
  });

  // --- mergeIntoSettings ---

  it('merges into empty settings using pre_write_code/post_write_code event keys', () => {
    // Arrange
    const existing = {};
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = windsurfConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    expect(result).toEqual({
      hooks: {
        pre_write_code: [windsurfConfig.generatePreEditHook(prsPath)],
        post_write_code: [windsurfConfig.generatePostEditHook(prsPath)],
      },
    });
  });

  it('skips merge if hooks already installed', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = {
      hooks: {
        pre_write_code: [windsurfConfig.generatePreEditHook(prsPath)],
        post_write_code: [windsurfConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = windsurfConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const hooks = (result as { hooks: { pre_write_code: unknown[]; post_write_code: unknown[] } })
      .hooks;
    expect(hooks.pre_write_code).toHaveLength(1);
    expect(hooks.post_write_code).toHaveLength(1);
  });

  it('preserves non-hook settings during merge', () => {
    // Arrange
    const existing = { theme: 'dark', someOtherSetting: 42 };
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = windsurfConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['theme']).toBe('dark');
    expect(typed['someOtherSetting']).toBe(42);
  });

  // --- removeFromSettings ---

  it('removes only prs hooks on uninstall, preserves other hooks', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const otherHook = { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo hi' }] };
    const existing = {
      hooks: {
        pre_write_code: [windsurfConfig.generatePreEditHook(prsPath), otherHook],
        post_write_code: [windsurfConfig.generatePostEditHook(prsPath)],
      },
    };

    // Act
    const result = windsurfConfig.removeFromSettings(existing);

    // Assert
    const hooks = (result as { hooks: { pre_write_code: unknown[]; post_write_code: unknown[] } })
      .hooks;
    expect(hooks.pre_write_code).toHaveLength(1);
    expect(hooks.pre_write_code[0]).toEqual(otherHook);
    expect(hooks.post_write_code).toHaveLength(0);
  });

  it('preserves non-hook settings during uninstall', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';
    const existing = {
      theme: 'dark',
      hooks: {
        pre_write_code: [windsurfConfig.generatePreEditHook(prsPath)],
        post_write_code: [],
      },
    };

    // Act
    const result = windsurfConfig.removeFromSettings(existing);

    // Assert
    const typed = result as Record<string, unknown>;
    expect(typed['theme']).toBe('dark');
  });
});
