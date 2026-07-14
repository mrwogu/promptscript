import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all command modules to prevent side effects during import
vi.mock('../commands/init', () => ({ initCommand: vi.fn() }));
vi.mock('../commands/compile', () => ({ compileCommand: vi.fn() }));
vi.mock('../commands/validate', () => ({ validateCommand: vi.fn() }));
vi.mock('../commands/pull', () => ({ pullCommand: vi.fn() }));
vi.mock('../commands/diff', () => ({ diffCommand: vi.fn() }));
vi.mock('../commands/registry/index', () => ({ registerRegistryCommands: vi.fn() }));
vi.mock('../commands/hook', () => ({ hookCommand: vi.fn() }));
vi.mock('../commands/skills', () => ({
  skillsAddCommand: vi.fn(),
  skillsRemoveCommand: vi.fn(),
  skillsListCommand: vi.fn(),
  skillsUpdateCommand: vi.fn(),
}));

// Mock version-check to prevent network calls
vi.mock('../utils/version-check', () => ({
  checkForUpdates: vi.fn().mockResolvedValue(null),
  printUpdateNotification: vi.fn(),
}));

// Mock core getPackageVersion
vi.mock('@promptscript/core', () => ({
  getPackageVersion: vi.fn().mockReturnValue('1.0.0'),
}));

const mockParse = vi.fn();

// Mock commander
vi.mock('commander', () => {
  const chainable = {
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    hook: vi.fn().mockReturnThis(),
    argument: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    command: vi.fn().mockReturnThis(),
  };
  return {
    Command: class MockCommand {
      name = chainable.name;
      description = chainable.description;
      version = chainable.version;
      option = chainable.option;
      hook = chainable.hook;
      argument = chainable.argument;
      action = chainable.action;
      command = chainable.command;
      parse = mockParse;
    },
  };
});

describe('cli guard run() - Issue 1', () => {
  beforeEach(() => {
    mockParse.mockClear();
  });

  it('should NOT call program.parse() automatically on module import', async () => {
    // Force a fresh module import
    vi.resetModules();

    // Importing the CLI module should NOT auto-run
    await import('../cli.js');

    // parse should not have been called because the module is not the entry point
    expect(mockParse).not.toHaveBeenCalled();
  });

  it('should call program.parse() when run() is called explicitly', async () => {
    vi.resetModules();
    const { run } = await import('../cli.js');

    run(['node', 'prs', '--help']);

    expect(mockParse).toHaveBeenCalledTimes(1);
    expect(mockParse).toHaveBeenCalledWith(['node', 'prs', '--help']);
  });
});
