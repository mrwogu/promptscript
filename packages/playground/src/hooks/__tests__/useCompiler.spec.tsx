import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { CompileResult, CompileWarning } from '@promptscript/browser-compiler';
import { compile } from '@promptscript/browser-compiler';
import { createOutputPlan } from '@promptscript/core';
import type { OutputPlan, OutputPlanCandidate } from '@promptscript/core';
import { useCompiler } from '../useCompiler';
import { usePlaygroundStore, selectOutputsForFormatter, type FormatterName } from '../../store';

vi.mock('@promptscript/browser-compiler', () => ({ compile: vi.fn() }));

const compileMock = vi.mocked(compile);

const sharedWarning: CompileWarning = {
  ruleId: 'PS018',
  ruleName: 'syntax-version-compat',
  severity: 'warning',
  message: 'Same warning from both compiles.',
  location: { file: 'project.prs', line: 1, column: 1, offset: 0 },
};

function resultFor(
  path: string,
  formatter: string,
  warnings: CompileWarning[] = []
): CompileResult {
  return {
    success: true,
    outputs: new Map([[path, { path, content: path, formatter }]]),
    outputOwners: new Map([[path, formatter]]),
    errors: [],
    warnings,
    stats: { resolveTime: 1, validateTime: 1, formatTime: 1, totalTime: 3 },
  };
}

function resultFromPlan(plan: OutputPlan): CompileResult {
  return {
    success: true,
    outputs: new Map(
      plan.files.map((file) => [
        file.path,
        { path: file.path, content: file.content, formatter: file.owner },
      ])
    ),
    outputOwners: plan.owners,
    outputPlan: plan,
    errors: [],
    warnings: [],
    stats: { resolveTime: 1, validateTime: 1, formatTime: 1, totalTime: 3 },
  };
}

function primary(owner: string, path: string, content: string): OutputPlanCandidate {
  return { owner, role: 'primary', output: { path, content } };
}

function resource(owner: string, path: string, content: string): OutputPlanCandidate {
  return { owner, role: 'resource', output: { path, content } };
}

/** The coding pass gets the first plan and the prompt pass gets the second. */
function mockPasses(codingPlan: OutputPlan, promptPlan: OutputPlan): void {
  compileMock.mockImplementation(async (_files, _entry, options) =>
    resultFromPlan(
      options?.formatters?.some((f) => nameOf(f) === 'bundle') ? promptPlan : codingPlan
    )
  );
}

/** Enable exactly these targets and set the environment variables. */
function arrange(enabled: FormatterName[], envVars: Record<string, string>): void {
  const { config } = usePlaygroundStore.getState();
  const targets = Object.fromEntries(
    Object.entries(config.targets).map(([name, settings]) => [
      name,
      { ...settings, enabled: enabled.includes(name as FormatterName) },
    ])
  ) as typeof config.targets;
  usePlaygroundStore.setState({
    files: [{ path: 'project.prs', content: '@meta { id: "x" syntax: "1.6.0" }' }],
    config: { ...config, targets, envVars },
    compileResult: null,
  });
}

async function compiled(): Promise<CompileResult> {
  renderHook(() => useCompiler());
  await waitFor(() => expect(usePlaygroundStore.getState().compileResult).not.toBeNull());
  return usePlaygroundStore.getState().compileResult as CompileResult;
}

type FormatterSpec = NonNullable<NonNullable<Parameters<typeof compile>[2]>['formatters']>[number];

const nameOf = (f: FormatterSpec): string => (typeof f === 'string' ? f : f.name);

function namesOf(call: number): string[] {
  return (compileMock.mock.calls[call]?.[2]?.formatters ?? []).map(nameOf);
}

describe('useCompiler', () => {
  beforeEach(() => {
    compileMock.mockReset();
  });

  it('compiles every enabled target in one call without environment variables', async () => {
    arrange(['claude', 'bundle'], {});
    compileMock.mockResolvedValue(resultFor('CLAUDE.md', 'claude'));

    const result = await compiled();

    expect(compileMock).toHaveBeenCalledTimes(1);
    expect(namesOf(0)).toEqual(['claude', 'bundle']);
    expect(result.success).toBe(true);
  });

  it('compiles prompt targets in a second pass without environment variables', async () => {
    arrange(['claude', 'bundle'], { NAME: 'value' });
    compileMock.mockImplementation(async (_files, _entry, options) =>
      options?.formatters?.some((f) => nameOf(f) === 'bundle')
        ? resultFor('prompts/index.json', 'bundle', [sharedWarning])
        : resultFor('CLAUDE.md', 'claude', [sharedWarning])
    );

    const result = await compiled();

    expect(compileMock).toHaveBeenCalledTimes(2);
    expect(namesOf(0)).toEqual(['claude']);
    expect(compileMock.mock.calls[0]?.[2]?.envVars).toEqual({ NAME: 'value' });
    expect(namesOf(1)).toEqual(['bundle']);
    expect(compileMock.mock.calls[1]?.[2]?.envVars).toEqual({});
    expect([...result.outputs.keys()].sort()).toEqual(['CLAUDE.md', 'prompts/index.json']);
    expect(result.outputOwners?.get('prompts/index.json')).toBe('bundle');
    expect(result.warnings).toEqual([sharedWarning]);
  });

  it('compiles only prompt targets once and drops the environment variables', async () => {
    arrange(['bundle', 'prompt-text'], { NAME: 'value' });
    compileMock.mockResolvedValue(resultFor('prompts/index.json', 'bundle'));

    await compiled();

    expect(compileMock).toHaveBeenCalledTimes(1);
    expect(namesOf(0)).toEqual(['bundle', 'prompt-text']);
    expect(compileMock.mock.calls[0]?.[2]?.envVars).toEqual({});
  });

  it('reports a failing prompt compile as an error and keeps the coding outputs', async () => {
    arrange(['claude', 'bundle'], { NAME: 'value' });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    compileMock.mockImplementation(async (_files, _entry, options) => {
      if (options?.formatters?.some((f) => nameOf(f) === 'bundle')) throw new Error('bundle broke');
      return resultFor('CLAUDE.md', 'claude');
    });

    const result = await compiled();

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      expect.objectContaining({ code: 'PS0000', message: 'bundle broke' }),
    ]);
    expect(result.outputs.has('CLAUDE.md')).toBe(true);
  });

  it('keeps messages that differ only by column and drops identical ones', async () => {
    arrange(['claude', 'bundle'], { NAME: 'value' });
    const error = (column: number) => ({
      name: 'CompileError',
      code: 'PS0001',
      message: 'same',
      location: { file: 'project.prs', line: 2, column },
    });
    compileMock.mockImplementation(async (_files, _entry, options) => ({
      ...resultFor('x', 'x'),
      success: false,
      errors: options?.formatters?.some((f) => nameOf(f) === 'bundle')
        ? [error(1), error(5)]
        : [error(1)],
    }));

    const result = await compiled();

    expect(result.errors).toEqual([error(1), error(5)]);
  });

  describe('output plan of two passes', () => {
    const codingPlan = (): OutputPlan =>
      createOutputPlan([
        primary('github', 'AGENTS.md', 'shared'),
        primary('codex', 'AGENTS.md', 'shared'),
        primary('claude', 'CLAUDE.md', 'claude'),
      ]);
    const promptPlan = (): OutputPlan =>
      createOutputPlan([
        primary('bundle', 'prompts/main.json', '{}'),
        resource('bundle', 'prompts/index.json', '{}'),
        primary('bundle', 'prompts/shared.md', 'text'),
        primary('prompt-text', 'prompts/shared.md', 'text'),
      ]);

    const pathsFor = (formatter: FormatterName): string[] =>
      selectOutputsForFormatter(usePlaygroundStore.getState(), formatter).map((o) => o.path);

    it('shows shared files of both passes in the tabs of every sharing target', async () => {
      arrange(['github', 'codex', 'bundle', 'prompt-text'], { NAME: 'value' });
      mockPasses(codingPlan(), promptPlan());

      await compiled();

      expect(pathsFor('codex')).toContain('AGENTS.md');
      expect(pathsFor('prompt-text')).toContain('prompts/shared.md');
    });

    it('puts the planned main file of the prompt pass first', async () => {
      arrange(['github', 'codex', 'bundle', 'prompt-text'], { NAME: 'value' });
      mockPasses(codingPlan(), promptPlan());

      await compiled();

      expect(pathsFor('bundle')[0]).toBe('prompts/main.json');
    });

    it('keeps the primary files of both passes', async () => {
      arrange(['claude', 'bundle'], { NAME: 'value' });
      mockPasses(
        createOutputPlan([
          primary('claude', 'docs/guide.md', 'guide'),
          primary('claude', 'CLAUDE.md', 'claude'),
        ]),
        promptPlan()
      );

      const result = await compiled();

      const primaries = result.outputPlan?.files.filter((f) => f.role === 'primary');
      expect(primaries?.map((f) => f.path)).toEqual([
        'CLAUDE.md',
        'docs/guide.md',
        'prompts/main.json',
        'prompts/shared.md',
      ]);
    });

    it('merges files, owners, outputs and collisions of both plans', async () => {
      arrange(['github', 'codex', 'bundle', 'prompt-text'], { NAME: 'value' });
      const coding = codingPlan();
      const prompt = promptPlan();
      mockPasses(coding, prompt);

      const plan = (await compiled()).outputPlan;

      expect(plan?.files.map((f) => f.path)).toEqual([
        'AGENTS.md',
        'CLAUDE.md',
        'prompts/index.json',
        'prompts/main.json',
        'prompts/shared.md',
      ]);
      expect([...(plan?.outputs.keys() ?? [])]).toEqual(plan?.files.map((f) => f.path));
      expect(plan?.owners.get('prompts/index.json')).toBe('bundle');
      expect(plan?.owners.get('CLAUDE.md')).toBe('claude');
      expect(plan?.resources.map((f) => f.path)).toEqual(['prompts/index.json']);
      expect(plan?.collisions).toEqual([...coding.collisions, ...prompt.collisions]);
    });

    it('unions the managed paths of both plans', async () => {
      arrange(['claude', 'bundle'], { NAME: 'value' });
      const managed = (owner: string, path: string, dir: string, file: string): OutputPlan =>
        createOutputPlan([
          {
            owner,
            role: 'primary',
            output: {
              path,
              content: owner,
              managedOutputDirectories: [dir],
              managedOutputFiles: [file],
            },
          },
        ]);
      mockPasses(
        managed('claude', 'CLAUDE.md', '.claude', '.claude/a.md'),
        managed('bundle', 'prompts/main.json', 'prompts', 'prompts/b.md')
      );

      const plan = (await compiled()).outputPlan;

      expect(plan?.managedPaths).toEqual({
        directories: ['.claude', 'prompts'],
        files: ['.claude/a.md', 'prompts/b.md'],
      });
      expect(plan?.managedOutputDirectories).toBe(plan?.managedPaths.directories);
      expect(plan?.managedOutputFiles).toBe(plan?.managedPaths.files);
    });

    it('keeps the managed paths of a file that the later pass replaces', async () => {
      arrange(['claude', 'bundle'], { NAME: 'value' });
      const planWith = (owner: string, content: string, dir: string): OutputPlan =>
        createOutputPlan([
          {
            owner,
            role: 'primary',
            output: { path: 'shared.txt', content, managedOutputDirectories: [dir] },
          },
        ]);
      mockPasses(planWith('claude', 'first', 'one'), planWith('bundle', 'second', 'two'));

      const plan = (await compiled()).outputPlan;

      expect(plan?.files).toHaveLength(1);
      expect(plan?.files[0]?.content).toBe('second');
      expect(plan?.owners.get('shared.txt')).toBe('bundle');
      expect(plan?.managedPaths.directories).toEqual(['one', 'two']);
      expect(plan?.collisions).toEqual([]);
    });

    it('joins the omitted managed directories of both plans', async () => {
      arrange(['claude', 'bundle'], { NAME: 'value' });
      const omitted = (owner: string, directory: string): OutputPlan =>
        createOutputPlan([
          {
            owner,
            role: 'primary',
            output: {
              path: `${directory}/index.json`,
              content: '',
              omit: true,
              managedOutputDirectories: [directory],
            },
          },
        ]);
      mockPasses(omitted('claude', 'one'), omitted('bundle', 'two'));

      const plan = (await compiled()).outputPlan;

      expect(plan?.omittedManagedDirectories).toEqual([
        { owner: 'claude', directory: 'one', primaryFile: 'index.json' },
        { owner: 'bundle', directory: 'two', primaryFile: 'index.json' },
      ]);
    });

    it('leaves out the omitted directories key when no plan has it', async () => {
      arrange(['claude', 'bundle'], { NAME: 'value' });
      const bare = (owner: string, path: string): OutputPlan => {
        const plan = createOutputPlan([primary(owner, path, owner)]);
        delete plan.omittedManagedDirectories;
        return plan;
      };
      mockPasses(bare('claude', 'CLAUDE.md'), bare('bundle', 'prompts/main.json'));

      const plan = (await compiled()).outputPlan;

      expect(plan).toBeDefined();
      expect(plan && 'omittedManagedDirectories' in plan).toBe(false);
    });

    it('keeps the plan object of a single pass', async () => {
      arrange(['claude', 'bundle'], {});
      const plan = codingPlan();
      compileMock.mockResolvedValue(resultFromPlan(plan));

      const result = await compiled();

      expect(result.outputPlan).toBe(plan);
    });

    it('does not change the plans it merges', async () => {
      arrange(['github', 'codex', 'bundle', 'prompt-text'], { NAME: 'value' });
      const coding = codingPlan();
      const prompt = promptPlan();
      const codingFiles = [...coding.files];
      const promptCollisions = [...prompt.collisions];
      mockPasses(coding, prompt);

      await compiled();

      expect(coding.files).toEqual(codingFiles);
      expect(prompt.collisions).toEqual(promptCollisions);
      expect(prompt.files).toHaveLength(3);
    });

    it('returns no plan when no pass has one', async () => {
      arrange(['claude', 'bundle'], { NAME: 'value' });
      compileMock.mockImplementation(async () => resultFor('x.md', 'x'));

      const result = await compiled();

      expect(result.outputPlan).toBeUndefined();
    });

    it('keeps the coding plan when the prompt pass fails without one', async () => {
      arrange(['claude', 'bundle'], { NAME: 'value' });
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const coding = codingPlan();
      compileMock.mockImplementation(async (_files, _entry, options) => {
        if (options?.formatters?.some((f) => nameOf(f) === 'bundle')) throw new Error('boom');
        return resultFromPlan(coding);
      });

      const result = await compiled();

      expect(result.outputPlan).toBe(coding);
    });
  });
});
