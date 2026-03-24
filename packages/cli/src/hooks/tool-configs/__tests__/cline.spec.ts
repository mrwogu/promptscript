import { describe, it, expect } from 'vitest';
import { clineConfig } from '../cline.js';

describe('hooks/tool-configs/clineConfig', () => {
  // --- metadata ---

  it('has correct name', () => {
    expect(clineConfig.name).toBe('cline');
  });

  it('has correct settingsPath', () => {
    expect(clineConfig.settingsPath).toBe('.clinerules/hooks/');
  });

  it('has correct timeoutUnit', () => {
    expect(clineConfig.timeoutUnit).toBe('n/a');
  });

  it('has correct detectPaths', () => {
    expect(clineConfig.detectPaths).toEqual(['.clinerules']);
  });

  // --- generatePreEditHook ---

  it('generates pre-edit hook returning script path and content', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = clineConfig.generatePreEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      scriptPath: '.clinerules/hooks/prs-pre-edit.sh',
      content: `#!/bin/bash\n${prsPath} hook pre-edit`,
    });
  });

  // --- generatePostEditHook ---

  it('generates post-edit hook returning script path and content', () => {
    // Arrange
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = clineConfig.generatePostEditHook(prsPath);

    // Assert
    expect(result).toEqual({
      scriptPath: '.clinerules/hooks/prs-post-edit.sh',
      content: `#!/bin/bash\n${prsPath} hook post-edit`,
    });
  });

  // --- mergeIntoSettings (no-op) ---

  it('mergeIntoSettings is a no-op and returns existing unchanged', () => {
    // Arrange
    const existing = { someKey: 'someValue' };
    const prsPath = '/usr/local/bin/prs';

    // Act
    const result = clineConfig.mergeIntoSettings(existing, prsPath);

    // Assert
    expect(result).toEqual(existing);
    expect(result).toBe(existing);
  });

  // --- removeFromSettings (no-op) ---

  it('removeFromSettings is a no-op and returns existing unchanged', () => {
    // Arrange
    const existing = { someKey: 'someValue' };

    // Act
    const result = clineConfig.removeFromSettings(existing);

    // Assert
    expect(result).toEqual(existing);
    expect(result).toBe(existing);
  });
});
