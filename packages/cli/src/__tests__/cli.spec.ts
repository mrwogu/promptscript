import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock all command modules first
vi.mock('../commands/init', () => ({
  initCommand: vi.fn(),
}));

vi.mock('../commands/compile', () => ({
  compileCommand: vi.fn(),
}));

const mockValidate = vi.fn();

vi.mock('../commands/validate', () => ({
  validateCommand: mockValidate,
}));

const mockFmt = vi.fn();

vi.mock('../commands/fmt', () => ({
  fmtCommand: mockFmt,
}));

const mockExplain = vi.fn();

vi.mock('../commands/explain', () => ({
  explainCommand: mockExplain,
}));

vi.mock('../commands/pull', () => ({
  pullCommand: vi.fn(),
}));

vi.mock('../commands/diff', () => ({
  diffCommand: vi.fn(),
}));

vi.mock('../commands/registry/index', () => ({
  registerRegistryCommands: vi.fn(),
}));

vi.mock('../commands/release/index', () => ({
  registerReleaseCommands: vi.fn(),
}));

vi.mock('../commands/approve/index', () => ({
  registerApproveCommand: vi.fn(),
}));

const mockPrepareCliTelemetry = vi.fn().mockResolvedValue(undefined);
const mockFinishCliTelemetry = vi.fn();
const mockFlushCliTelemetry = vi.fn().mockResolvedValue(undefined);

vi.mock('../telemetry/session', () => ({
  prepareCliTelemetry: mockPrepareCliTelemetry,
  finishCliTelemetry: mockFinishCliTelemetry,
  flushCliTelemetry: mockFlushCliTelemetry,
}));

vi.mock('../commands/telemetry', () => ({
  telemetryCommand: vi.fn(),
}));

vi.mock('../commands/hook', () => ({
  hookCommand: vi.fn(),
}));

const mockSkillsAdd = vi.fn();
const mockSkillsRemove = vi.fn();
const mockSkillsList = vi.fn();
const mockSkillsUpdate = vi.fn();

vi.mock('../commands/skills', () => ({
  skillsAddCommand: mockSkillsAdd,
  skillsRemoveCommand: mockSkillsRemove,
  skillsListCommand: mockSkillsList,
  skillsUpdateCommand: mockSkillsUpdate,
}));

// Store references to mock functions for assertions
const mockCommand = vi.fn();
const mockName = vi.fn().mockReturnThis();
const mockDescription = vi.fn().mockReturnThis();
const mockVersion = vi.fn().mockReturnThis();
const mockOption = vi.fn().mockReturnThis();
const mockHook = vi.fn().mockReturnThis();
const mockArgument = vi.fn().mockReturnThis();
// Actions keyed by command spec; subcommands are keyed 'parent spec' so they never
// collide with top-level names and adding a command never shifts a lookup.
const actionsBySpec = new Map<string, (...args: unknown[]) => unknown>();
const mockAction = vi.fn().mockReturnThis();
const mockParseAsync = vi.fn();

// Create a chainable mock that supports nested command() calls
const createChainableMock = (key: string): Record<string, ReturnType<typeof vi.fn>> => ({
  argument: mockArgument,
  description: mockDescription,
  option: mockOption,
  addHelpText: vi.fn().mockReturnThis(),
  action: vi.fn().mockImplementation(function (
    this: Record<string, ReturnType<typeof vi.fn>>,
    fn: (...args: unknown[]) => unknown
  ) {
    actionsBySpec.set(key, fn);
    mockAction(fn);
    return this;
  }),
  command: vi.fn().mockImplementation((spec: string, ...rest: unknown[]) => {
    mockCommand(spec, ...rest);
    return createChainableMock(`${key} ${spec}`);
  }),
});

// Create chainable mock for command
mockCommand.mockImplementation((spec: string) => createChainableMock(spec));

afterEach(() => {
  delete process.env['PROMPTSCRIPT_TELEMETRY_FLUSH'];
});

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
      parseAsync = mockParseAsync;
    },
  };
});

describe('cli', () => {
  describe('run', () => {
    // Loading the command graph costs about a second on a cold transform cache,
    // which competes with the per-test timeout when the suites run in parallel.
    beforeAll(async () => {
      await import('../cli.js');
    });

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

    it('should register build command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'build']);

      expect(mockCommand).toHaveBeenCalledWith('build <name>');
    });

    it('should register validate command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'validate']);

      expect(mockCommand).toHaveBeenCalledWith('validate [files...]');
    });

    it('should pass files and options to the validate command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', '--help']);

      const validateAction = actionsBySpec.get('validate [files...]');
      expect(validateAction).toBeDefined();

      validateAction?.(['project.prs'], { strict: true, format: 'json' });

      expect(mockValidate).toHaveBeenCalledWith({
        strict: true,
        format: 'json',
        files: ['project.prs'],
      });
    });

    it('should pass paths and options to the fmt command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', '--help']);

      const fmtAction = actionsBySpec.get('fmt [paths...]');
      expect(fmtAction).toBeDefined();

      fmtAction?.(['a.prs'], { check: true });

      expect(mockFmt).toHaveBeenCalledWith({ check: true, paths: ['a.prs'] });
    });

    it('should wire the explain action callback', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', '--help']);

      const explainAction = actionsBySpec.get('explain <path>');
      expect(explainAction).toBeDefined();

      explainAction?.('standards.code', { format: 'json' });

      expect(mockExplain).toHaveBeenCalledWith('standards.code', { format: 'json' });
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

      expect(mockParseAsync).toHaveBeenCalledWith(['node', 'prs', 'init', '--team', 'frontend']);
    });

    it('should register --migrate option for init command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'init', '--migrate']);

      // Verify init command is registered
      expect(mockCommand).toHaveBeenCalledWith('init');
      // Verify --migrate option is registered (among other options)
      expect(mockOption).toHaveBeenCalledWith(
        '-m, --migrate',
        'Deprecated: run migration during initialization'
      );
    });

    it('should register update-check command', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'update-check']);

      expect(mockCommand).toHaveBeenCalledWith('update-check');
    });

    it('should register telemetry commands', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'telemetry', 'status']);

      expect(mockCommand).toHaveBeenCalledWith('telemetry');
      expect(mockCommand).toHaveBeenCalledWith('__telemetry-flush', { hidden: true });
    });

    it('should register registry command group', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'registry']);

      expect(mockCommand).toHaveBeenCalledWith('registry');
    });

    it('should register release command group', async () => {
      const { run } = await import('../cli.js');
      const { registerReleaseCommands } = await import('../commands/release/index.js');
      run(['node', 'prs', 'release']);

      expect(mockCommand).toHaveBeenCalledWith('release');
      expect(registerReleaseCommands).toHaveBeenCalled();
    });

    it('should register the approve command', async () => {
      const { run } = await import('../cli.js');
      const { registerApproveCommand } = await import('../commands/approve/index.js');
      run(['node', 'prs', 'approve']);

      expect(registerApproveCommand).toHaveBeenCalled();
    });

    it('should register skills command group', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'skills']);

      expect(mockCommand).toHaveBeenCalledWith('skills');
    });

    it('should register skills add subcommand', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'skills', 'add']);

      expect(mockCommand).toHaveBeenCalledWith('add <source>');
    });

    it('should register skills remove subcommand', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'skills', 'remove']);

      expect(mockCommand).toHaveBeenCalledWith('remove <name>');
    });

    it('should register skills list subcommand', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'skills', 'list']);

      expect(mockCommand).toHaveBeenCalledWith('list');
    });

    it('should register skills update subcommand', async () => {
      const { run } = await import('../cli.js');
      run(['node', 'prs', 'skills', 'update']);

      expect(mockCommand).toHaveBeenCalledWith('update [name]');
    });

    it('should wire skills action callbacks to their command functions', async () => {
      // Actions are captured during module loading, keyed by command spec.
      const { run } = await import('../cli.js');
      run(['node', 'prs', '--help']);

      const skillsActions = [
        'skills add <source>',
        'skills remove <name>',
        'skills list',
        'skills update [name]',
      ].map((key) => actionsBySpec.get(key));
      expect(skillsActions.every((fn) => fn !== undefined)).toBe(true);

      // Invoke each skills action with test arguments
      for (const cb of skillsActions) {
        cb?.('test-arg', { dryRun: false });
      }

      // Verify each skills command function was called
      expect(mockSkillsAdd).toHaveBeenCalledWith('test-arg', { dryRun: false });
      expect(mockSkillsRemove).toHaveBeenCalledWith('test-arg', { dryRun: false });
      expect(mockSkillsList).toHaveBeenCalled();
      expect(mockSkillsUpdate).toHaveBeenCalledWith('test-arg', { dryRun: false });
    });

    it('should guard detached telemetry flush and finish command telemetry', async () => {
      const preAction = mockHook.mock.calls.find((call) => call[0] === 'preAction')?.[1] as (
        thisCommand: { opts: () => Record<string, unknown> },
        actionCommand: { name: () => string; opts: () => Record<string, unknown> }
      ) => Promise<void>;
      const postAction = mockHook.mock.calls.find((call) => call[0] === 'postAction')?.[1] as (
        thisCommand: unknown,
        actionCommand: unknown
      ) => void;

      process.env['PROMPTSCRIPT_TELEMETRY_FLUSH'] = '1';
      await preAction({ opts: () => ({}) }, { name: () => '__telemetry-flush', opts: () => ({}) });
      expect(mockPrepareCliTelemetry).not.toHaveBeenCalled();

      delete process.env['PROMPTSCRIPT_TELEMETRY_FLUSH'];
      await preAction(
        { opts: () => ({ quiet: true }) },
        { name: () => 'telemetry', opts: () => ({}) }
      );
      expect(mockPrepareCliTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({ name: expect.any(Function) }),
        expect.stringMatching(/^\d+\.\d+\.\d+/)
      );

      postAction(undefined, undefined);
      expect(mockFinishCliTelemetry).toHaveBeenCalled();
    });

    it('should finish telemetry and rethrow parse errors', async () => {
      const error = new Error('parse failed');
      mockParseAsync.mockReset();
      mockParseAsync.mockRejectedValue(error);
      mockFinishCliTelemetry.mockClear();

      const { run } = await import('../cli.js');

      await expect(run(['node', 'prs', 'compile'])).rejects.toBe(error);
      expect(mockFinishCliTelemetry).toHaveBeenCalledWith('error');
      expect(mockFinishCliTelemetry).toHaveBeenCalledWith();

      mockParseAsync.mockReset();
    });
  });
});
