import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { CompileResult, CompileWarning } from '@promptscript/browser-compiler';
import { compile } from '@promptscript/browser-compiler';
import { useCompiler } from '../useCompiler';
import { usePlaygroundStore, type FormatterName } from '../../store';

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
});
