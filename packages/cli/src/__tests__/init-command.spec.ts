import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { initCommand } from '../commands/init';

// Mock fs modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
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
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('initCommand', () => {
    it('should warn when already initialized', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await initCommand({});

      expect(existsSync).toHaveBeenCalledWith('promptscript.config.yaml');
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should create config and project files', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await initCommand({});

      expect(mkdir).toHaveBeenCalledWith('promptscript', { recursive: true });
      expect(writeFile).toHaveBeenCalledTimes(2);
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.config.yaml',
        expect.stringContaining('version: "1"'),
        'utf-8'
      );
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript/project.prs',
        expect.stringContaining('@meta'),
        'utf-8'
      );
    });

    it('should include team in config when provided', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await initCommand({ team: 'frontend' });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.config.yaml',
        expect.stringContaining('team: "frontend"'),
        'utf-8'
      );
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.config.yaml',
        expect.stringContaining('inherit: "@frontend/team"'),
        'utf-8'
      );
    });

    it('should use project directory name as id', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await initCommand({});

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.config.yaml',
        expect.stringContaining('id: "project"'),
        'utf-8'
      );
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript/project.prs',
        expect.stringContaining('id: "project"'),
        'utf-8'
      );
    });

    it('should exit with error when write fails', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(mkdir).mockRejectedValue(new Error('Permission denied'));

      await expect(initCommand({})).rejects.toThrow('process.exit called');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
