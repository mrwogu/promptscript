import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockSpinner,
  mockLoadConfig,
  mockResolveRegistryPath,
  mockCompile,
  mockExistsSync,
} = vi.hoisted(() => {
  const mockStart = vi.fn().mockReturnThis();
  const mockSucceed = vi.fn().mockReturnThis();
  const mockFail = vi.fn().mockReturnThis();
  const mockStop = vi.fn().mockReturnThis();
  const mockSpinner = {
    start: mockStart,
    succeed: mockSucceed,
    fail: mockFail,
    stop: mockStop,
    text: '',
  };
  const mockLoadConfig = vi.fn();
  const mockResolveRegistryPath = vi.fn();
  const mockCompile = vi.fn();
  const mockExistsSync = vi.fn();
  return {
    mockSucceed,
    mockFail,
    mockSpinner,
    mockLoadConfig,
    mockResolveRegistryPath,
    mockCompile,
    mockExistsSync,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    muted: vi.fn(),
    newline: vi.fn(),
  },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: mockLoadConfig,
}));

vi.mock('../../utils/registry-resolver.js', () => ({
  resolveRegistryPath: mockResolveRegistryPath,
}));

vi.mock('@promptscript/compiler', () => ({
  Compiler: vi.fn().mockImplementation(function () {
    return { compile: mockCompile };
  }),
}));

vi.mock('fs', () => ({
  existsSync: mockExistsSync,
}));

import { validateCommand } from '../validate.js';
import { ConsoleOutput } from '../../output/console.js';

describe('validateCommand', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockSpinner.text = '';
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('should succeed when files are valid with no issues', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: [],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(true);
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map(),
    });

    // Act
    await validateCommand({});

    // Assert
    expect(mockSucceed).toHaveBeenCalledWith('Validation successful');
    expect(ConsoleOutput.success).toHaveBeenCalledWith('No issues found');
    expect(process.exitCode).toBeUndefined();
  });

  it('should output JSON format when --format json is specified', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: [],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(true);
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map(),
    });

    // Act
    await validateCommand({ format: 'json' });

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(jsonOutput).toEqual(
      expect.objectContaining({
        success: true,
        errors: [],
        warnings: [],
        summary: { errorCount: 0, warningCount: 0 },
      })
    );
  });

  it('should treat warnings as errors when --strict is enabled', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: [],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(true);
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [
        {
          ruleId: 'no-empty-section',
          message: 'Section body is empty',
          suggestion: 'Add content or remove the section',
        },
      ],
      outputs: new Map(),
    });

    // Act
    await validateCommand({ strict: true });

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Validation failed');
    expect(process.exitCode).toBe(1);
  });

  it('should fail when entry file is not found', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: [],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(false);

    // Act
    await validateCommand({});

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Entry file not found');
    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('File not found'));
    expect(process.exitCode).toBe(1);
  });

  it('should output JSON error when entry file is not found with --format json', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: [],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(false);

    // Act
    await validateCommand({ format: 'json' });

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(jsonOutput.success).toBe(false);
    expect(jsonOutput.errors).toHaveLength(1);
    expect(jsonOutput.errors[0].message).toContain('File not found');
    expect(process.exitCode).toBe(1);
  });

  it('should fail when compilation has errors', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: [],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(true);
    mockCompile.mockResolvedValue({
      success: false,
      errors: [
        {
          message: 'Unexpected token',
          location: { file: 'project.prs', line: 5, column: 10 },
        },
      ],
      warnings: [],
      outputs: new Map(),
    });

    // Act
    await validateCommand({});

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Validation failed');
    expect(process.exitCode).toBe(1);
  });

  it('should set exitCode on unexpected error', async () => {
    // Arrange
    mockLoadConfig.mockRejectedValue(new Error('Config not found'));

    // Act
    await validateCommand({});

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Error');
    expect(ConsoleOutput.error).toHaveBeenCalledWith('Config not found');
    expect(process.exitCode).toBe(1);
  });
});
