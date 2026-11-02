import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockSpinner,
  mockLoadConfig,
  mockResolveRegistryPath,
  mockCompile,
  mockCompilerOptions,
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
  const mockCompilerOptions = vi.fn();
  const mockExistsSync = vi.fn();
  return {
    mockSucceed,
    mockFail,
    mockSpinner,
    mockLoadConfig,
    mockResolveRegistryPath,
    mockCompile,
    mockCompilerOptions,
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
  loadEffectiveConfig: mockLoadConfig,
}));

vi.mock('../../utils/registry-resolver.js', () => ({
  resolveRegistryPath: mockResolveRegistryPath,
}));

vi.mock('@promptscript/compiler', () => ({
  Compiler: vi.fn().mockImplementation(function (options: unknown) {
    mockCompilerOptions(options);
    return { compile: mockCompile };
  }),
}));

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
}));

import { validateCommand } from '../validate.js';
import { ConsoleOutput } from '../../output/console.js';
import { resolve } from 'node:path';
import { PSError } from '@promptscript/core';

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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
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

  it('passes ignore-hashes to the compiler integrity stage', async () => {
    mockLoadConfig.mockResolvedValue({ targets: [], validation: {} });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map(),
    });

    await validateCommand({ ignoreHashes: true });

    expect(mockCompilerOptions).toHaveBeenCalledWith(
      expect.objectContaining({ ignoreHashes: true })
    );
  });

  it('ignores validation.skipPolicies from the config', async () => {
    // Arrange
    const policies = [{ name: 'approved', kind: 'registry-allowlist', allowed: ['@core'] }];
    mockLoadConfig.mockResolvedValue({
      targets: [],
      validation: { skipPolicies: true },
      policies,
    });
    mockResolveRegistryPath.mockResolvedValue({ path: './registry', isRemote: false });
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
    mockCompile.mockResolvedValue({ success: true, errors: [], warnings: [], outputs: new Map() });

    // Act
    await validateCommand({});

    // Assert
    expect(mockCompilerOptions).toHaveBeenCalledWith(
      expect.objectContaining({ validator: { policies, skipPolicies: undefined } })
    );
  });

  it('skips policies with --skip-policies', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: [],
      validation: {},
      policies: [{ name: 'approved', kind: 'registry-allowlist', allowed: ['@core'] }],
    });
    mockResolveRegistryPath.mockResolvedValue({ path: './registry', isRemote: false });
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
    mockCompile.mockResolvedValue({ success: true, errors: [], warnings: [], outputs: new Map() });

    // Act
    await validateCommand({ skipPolicies: true });

    // Assert
    expect(mockCompilerOptions).toHaveBeenCalledWith(
      expect.objectContaining({ validator: { policies: undefined, skipPolicies: true } })
    );
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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
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
        $schema: 'https://getpromptscript.dev/schema/validate-report/v1.json',
        version: 1,
        success: true,
        errors: [],
        warnings: [],
        summary: { errorCount: 0, warningCount: 0 },
      })
    );
  });

  it('should print the exact report shape and drop unknown location keys', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({ targets: [], validation: {} });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
    mockCompile.mockResolvedValue({
      success: false,
      errors: [
        {
          name: 'ParseError',
          code: 'PS2000',
          message: 'Bad block',
          location: { file: '/a.prs', line: 2, column: 3, endLine: 9 },
        },
      ],
      warnings: [
        {
          ruleId: 'PS008',
          message: 'Empty block',
          suggestion: 'Add content',
          location: { file: '/a.prs', line: 4, column: 1, offset: 20, endLine: 5 },
        },
      ],
      outputs: new Map(),
    });

    // Act
    await validateCommand({ format: 'json' });

    // Assert
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(jsonOutput).toEqual({
      $schema: 'https://getpromptscript.dev/schema/validate-report/v1.json',
      version: 1,
      success: false,
      errors: [
        {
          code: 'PS2000',
          message: 'Bad block',
          location: { file: '/a.prs', line: 2, column: 3 },
        },
      ],
      warnings: [
        {
          ruleId: 'PS008',
          message: 'Empty block',
          suggestion: 'Add content',
          location: { file: '/a.prs', line: 4, column: 1, offset: 20 },
        },
      ],
      summary: { errorCount: 1, warningCount: 1 },
    });
  });

  it.each(['EACCES', 'EISDIR'])('should leave out the %s code of a failed read', async (code) => {
    // Arrange
    mockLoadConfig.mockResolvedValue({ targets: [], validation: {} });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
    mockCompile.mockResolvedValue({
      success: false,
      errors: [{ name: 'Error', code, message: `${code}: cannot read`, location: undefined }],
      warnings: [],
      outputs: new Map(),
    });

    // Act
    await validateCommand({ format: 'json' });

    // Assert
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(jsonOutput.errors).toEqual([{ message: `${code}: cannot read` }]);
  });

  it('should keep the code and location of a config PSError', async () => {
    // Arrange
    mockLoadConfig.mockRejectedValue(
      new PSError('Bad config', 'PS4000', { location: { file: '/c.yaml', line: 2, column: 1 } })
    );

    // Act
    await validateCommand({ format: 'json' });

    // Assert
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(jsonOutput.errors).toEqual([
      { code: 'PS4000', message: 'Bad config', location: { file: '/c.yaml', line: 2, column: 1 } },
    ]);
  });

  it('should report the PS code of a config error cause', async () => {
    // Arrange
    mockLoadConfig.mockRejectedValue(
      new PSError('Bad config', 'PS2000', { cause: new PSError('Unexpected end', 'PS1000') })
    );

    // Act
    await validateCommand({ format: 'json' });

    // Assert
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(jsonOutput.errors).toEqual([{ code: 'PS2000', cause: 'PS1000', message: 'Bad config' }]);
  });

  it('should leave out a config error cause that is not a PS error', async () => {
    // Arrange
    mockLoadConfig.mockRejectedValue(
      new PSError('Bad config', 'PS4000', { cause: new Error('YAML broken') })
    );

    // Act
    await validateCommand({ format: 'json' });

    // Assert
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(jsonOutput.errors).toEqual([{ code: 'PS4000', message: 'Bad config' }]);
  });

  it('should report only PS cause codes of compile errors', async () => {
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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
    mockCompile.mockResolvedValue({
      success: false,
      errors: [
        { name: 'ResolveError', code: 'PS2000', causeCode: 'PS1000', message: 'Unexpected end' },
        { name: 'ResolveError', code: 'PS2000', causeCode: 'ENOENT', message: 'Missing file' },
      ],
      warnings: [],
      outputs: new Map(),
    });

    // Act
    await validateCommand({ format: 'json' });

    // Assert
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(jsonOutput.errors).toEqual([
      { code: 'PS2000', cause: 'PS1000', message: 'Unexpected end' },
      { code: 'PS2000', message: 'Missing file' },
    ]);
  });

  it('should leave out the code of an error that is not a PS error', async () => {
    // Arrange
    mockLoadConfig.mockRejectedValue(new Error('registry clone failed'));

    // Act
    await validateCommand({ format: 'json' });

    // Assert
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(jsonOutput.errors).toEqual([{ message: 'registry clone failed' }]);
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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
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

  it('should validate the configured entry file', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      input: { entry: 'custom/main.prs' },
      targets: [],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map(),
    });

    // Act
    await validateCommand({});

    // Assert
    expect(mockExistsSync).toHaveBeenCalledWith(resolve('custom/main.prs'));
    expect(mockCompile).toHaveBeenCalledWith(resolve('custom/main.prs'));
  });

  it('should validate each explicitly requested file', async () => {
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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map(),
    });

    // Act
    await validateCommand({ files: ['one.prs', 'nested/two.prs'] });

    // Assert
    expect(mockCompile).toHaveBeenNthCalledWith(1, resolve('one.prs'));
    expect(mockCompile).toHaveBeenNthCalledWith(2, resolve('nested/two.prs'));
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
    expect(jsonOutput.$schema).toBe('https://getpromptscript.dev/schema/validate-report/v1.json');
    expect(jsonOutput.version).toBe(1);
    expect(jsonOutput.success).toBe(false);
    expect(jsonOutput.errors).toHaveLength(1);
    expect(jsonOutput.errors[0].message).toContain('File not found');
    expect(jsonOutput.errors[0]).not.toHaveProperty('code');
    expect(jsonOutput.errors[0]).not.toHaveProperty('location');
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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
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
