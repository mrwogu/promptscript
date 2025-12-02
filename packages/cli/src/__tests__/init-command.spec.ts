import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { writeFile, mkdir, readFile, readdir } from 'fs/promises';
import { initCommand } from '../commands/init';

// Mock fs modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{}'),
  readdir: vi.fn().mockResolvedValue([]),
}));

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

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn().mockResolvedValue('test-project'),
  confirm: vi.fn().mockResolvedValue(false),
  checkbox: vi.fn().mockResolvedValue(['github', 'claude', 'cursor']),
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

// Mock process.cwd
vi.spyOn(process, 'cwd').mockReturnValue('/mock/project');

describe('commands/init', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Default: no files exist except for detection purposes
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFile).mockResolvedValue('{}');
    vi.mocked(readdir).mockResolvedValue([]);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('initCommand', () => {
    it('should warn when already initialized', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'promptscript.yaml');

      await initCommand({});

      expect(existsSync).toHaveBeenCalledWith('promptscript.yaml');
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should create config and project files with --yes flag', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await initCommand({ yes: true });

      expect(mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });
      expect(writeFile).toHaveBeenCalledTimes(2);
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('version: "1"'),
        'utf-8'
      );
      expect(writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('@meta'),
        'utf-8'
      );
    });

    it('should use custom name when provided with --yes flag', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await initCommand({ yes: true, name: 'custom-project' });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('id: "custom-project"'),
        'utf-8'
      );
    });

    it('should include targets from options', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await initCommand({ yes: true, targets: ['github', 'claude'] });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('- github'),
        'utf-8'
      );
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('- claude'),
        'utf-8'
      );
    });

    it('should include inherit when provided', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await initCommand({ yes: true, inherit: '@company/team' });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('inherit: "@company/team"'),
        'utf-8'
      );
    });

    it('should exit with error when write fails', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(mkdir).mockRejectedValue(new Error('Permission denied'));

      await expect(initCommand({ yes: true })).rejects.toThrow('process.exit called');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
