import { describe, it, expect, vi } from 'vitest';

// Mock all command modules first
vi.mock('../commands/init', () => ({
  initCommand: vi.fn(),
}));

vi.mock('../commands/compile', () => ({
  compileCommand: vi.fn(),
}));

vi.mock('../commands/validate', () => ({
  validateCommand: vi.fn(),
}));

vi.mock('../commands/pull', () => ({
  pullCommand: vi.fn(),
}));

vi.mock('../commands/diff', () => ({
  diffCommand: vi.fn(),
}));

// Store references to mock functions for assertions
const mockCommand = vi.fn();
const mockName = vi.fn().mockReturnThis();
const mockDescription = vi.fn().mockReturnThis();
const mockVersion = vi.fn().mockReturnThis();
const mockOption = vi.fn().mockReturnThis();
const mockHook = vi.fn().mockReturnThis();
const mockAction = vi.fn().mockReturnThis();
const mockParse = vi.fn();

// Create chainable mock for command
mockCommand.mockImplementation(() => ({
  description: mockDescription,
  option: mockOption,
  action: mockAction,
}));

// Mock commander with class
vi.mock('commander', () => {
  return {
    Command: class MockCommand {
      name = mockName;
      description = mockDescription;
      version = mockVersion;
      option = mockOption;
      hook = mockHook;
      command = mockCommand;
      parse = mockParse;
    },
  };
});

describe('cli', () => {
  describe('run', () => {
    it('should create CLI with expected configuration', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', '--help']);

      expect(mockName).toHaveBeenCalledWith('prs');
      expect(mockDescription).toHaveBeenCalledWith(
        'PromptScript CLI - Standardize AI instructions'
      );
      // Version is dynamically read from package.json
      expect(mockVersion).toHaveBeenCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+/));
    });

    it('should register init command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'init']);

      expect(mockCommand).toHaveBeenCalledWith('init');
    });

    it('should register compile command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'compile']);

      expect(mockCommand).toHaveBeenCalledWith('compile');
    });

    it('should register validate command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'validate']);

      expect(mockCommand).toHaveBeenCalledWith('validate');
    });

    it('should register pull command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'pull']);

      expect(mockCommand).toHaveBeenCalledWith('pull');
    });

    it('should register diff command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'diff']);

      expect(mockCommand).toHaveBeenCalledWith('diff');
    });

    it('should call parse with provided args', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'init', '--team', 'frontend']);

      expect(mockParse).toHaveBeenCalledWith(['node', 'prs', 'init', '--team', 'frontend']);
    });

    it('should register --migrate option for init command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'init', '--migrate']);

      // Verify init command is registered
      expect(mockCommand).toHaveBeenCalledWith('init');
      // Verify --migrate option is registered (among other options)
      expect(mockOption).toHaveBeenCalledWith(
        '-m, --migrate',
        'Install migration skill for AI-assisted migration'
      );
    });

    it('should register update-check command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'update-check']);

      expect(mockCommand).toHaveBeenCalledWith('update-check');
    });
  });
});
