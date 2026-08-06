import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Mock all command modules to prevent side effects during import
vi.mock('../commands/init', () => ({ initCommand: vi.fn() }));
vi.mock('../commands/compile', () => ({ compileCommand: vi.fn() }));
vi.mock('../commands/validate', () => ({ validateCommand: vi.fn() }));
vi.mock('../commands/pull', () => ({ pullCommand: vi.fn() }));
vi.mock('../commands/diff', () => ({ diffCommand: vi.fn() }));
vi.mock('../commands/check', () => ({ checkCommand: vi.fn() }));
vi.mock('../commands/update-check', () => ({ updateCheckCommand: vi.fn() }));
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
vi.mock('@promptscript/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@promptscript/core')>()),
  getPackageVersion: vi.fn().mockReturnValue('1.0.0'),
}));

const mockParseAsync = vi.fn();

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
      parseAsync = mockParseAsync;
    },
  };
});

describe('cli guard run() - Issue 1', () => {
  // Loading the command graph costs about a second on a cold transform cache,
  // which competes with the per-test timeout when the suites run in parallel.
  beforeAll(async () => {
    await import('../cli.js');
  });

  beforeEach(() => {
    mockParseAsync.mockClear();
  });

  it('should NOT call program.parseAsync() automatically on module import', async () => {
    // Force a fresh module import
    vi.resetModules();

    // Importing the CLI module should NOT auto-run
    await import('../cli.js');

    // parse should not have been called because the module is not the entry point
    expect(mockParseAsync).not.toHaveBeenCalled();
  });

  it('should call program.parseAsync() when run() is called explicitly', async () => {
    vi.resetModules();
    const { run } = await import('../cli.js');

    await run(['node', 'prs', '--help']);

    expect(mockParseAsync).toHaveBeenCalledTimes(1);
    expect(mockParseAsync).toHaveBeenCalledWith(['node', 'prs', '--help']);
  });

  it('should run automatically when imported as the CLI entry point', async () => {
    const originalArgv = process.argv[1];
    const entrypoint = fileURLToPath(new URL('../cli.ts', import.meta.url));
    process.argv[1] = entrypoint;
    mockParseAsync.mockResolvedValue(undefined);

    try {
      vi.resetModules();
      await import('../cli.js');

      expect(mockParseAsync).toHaveBeenCalledWith(process.argv);
    } finally {
      if (originalArgv === undefined) {
        process.argv.splice(1, 1);
      } else {
        process.argv[1] = originalArgv;
      }
    }
  });
});
