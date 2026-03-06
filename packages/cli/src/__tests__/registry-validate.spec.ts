import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registryValidateCommand } from '../commands/registry/validate.js';
import { type CliServices } from '../services.js';

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  }),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
  },
}));

const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

describe('commands/registry/validate', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockServices: CliServices;
  let mockFs: {
    existsSync: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    mkdir: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
  };

  const validManifest = `
version: '1'
meta:
  name: Test Registry
  description: Test
  lastUpdated: '2026-01-01'
namespaces:
  '@core':
    description: Core configs
    priority: 100
catalog:
  - id: '@core/base'
    path: '@core/base.prs'
    name: Base
    description: Base config
    tags: [core]
    targets: [github]
    dependencies: []
`;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockFs = {
      existsSync: vi.fn().mockReturnValue(true),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(validManifest),
      readdir: vi.fn().mockResolvedValue(['base.prs']),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: {} as CliServices['prompts'],
      cwd: '/test',
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should succeed for valid registry', async () => {
    await registryValidateCommand('.', { format: 'text' }, mockServices);

    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should exit with code 1 for invalid registry', async () => {
    mockFs.existsSync.mockReturnValue(false);

    await expect(registryValidateCommand('.', { format: 'text' }, mockServices)).rejects.toThrow(
      'process.exit called'
    );

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should output JSON when format is json', async () => {
    await registryValidateCommand('.', { format: 'json' }, mockServices);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"valid": true'));
  });

  it('should exit with code 1 in strict mode with warnings', async () => {
    // Add an orphaned file to trigger a warning
    mockFs.readdir.mockResolvedValue(['base.prs', 'orphan.prs']);

    await expect(
      registryValidateCommand('.', { strict: true, format: 'text' }, mockServices)
    ).rejects.toThrow('process.exit called');

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit with code 1 in strict mode with warnings in JSON format', async () => {
    mockFs.readdir.mockResolvedValue(['base.prs', 'orphan.prs']);

    await expect(
      registryValidateCommand('.', { strict: true, format: 'json' }, mockServices)
    ).rejects.toThrow('process.exit called');

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle unexpected validation errors', async () => {
    mockFs.readFile.mockRejectedValue(new Error('disk failure'));

    await expect(registryValidateCommand('.', { format: 'text' }, mockServices)).rejects.toThrow(
      'process.exit called'
    );

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
