import { describe, expect, it } from 'vitest';
import {
  createOutputPlan,
  normalizeOutputCollisionKey,
  normalizeOutputPath,
  OutputPlanPathError,
  type OutputPlanCandidate,
} from '../output-plan.js';

describe('output plan', () => {
  it('normalizes portable relative paths and rejects escapes', () => {
    expect(normalizeOutputPath('./nested//file.md')).toBe('nested/file.md');
    expect(normalizeOutputPath(String.raw`nested\file.md`)).toBe('nested/file.md');

    expect(() => normalizeOutputPath('../outside.md')).toThrow(OutputPlanPathError);
    expect(() => normalizeOutputPath('/outside.md')).toThrow(OutputPlanPathError);
    expect(() => normalizeOutputPath('C:/outside.md')).toThrow(OutputPlanPathError);
  });

  it('uses a stable case-folded key without changing the reported path', () => {
    const plan = createOutputPlan([
      {
        owner: 'first',
        output: { path: './Foo\\README.md', content: 'first' },
      },
      {
        owner: 'second',
        output: { path: 'foo/readme.md', content: 'second' },
      },
    ]);

    expect(normalizeOutputCollisionKey('./Foo\\README.md')).toBe('foo/readme.md');
    expect(plan.collisions).toEqual([
      expect.objectContaining({
        path: 'foo/readme.md',
        existingOwner: 'first',
        incomingOwner: 'second',
        resolution: 'replace-existing',
      }),
    ]);
    expect(plan.files.map((file) => file.path)).toEqual(['foo/readme.md']);
    expect(plan.files[0]?.originalPath).toBe('foo/readme.md');

    const preservedPlan = createOutputPlan([
      {
        owner: 'first',
        output: { path: 'Foo.md', content: 'first' },
      },
      {
        owner: 'resource',
        role: 'resource',
        output: { path: 'foo.md', content: 'second' },
      },
    ]);
    expect(preservedPlan.files[0]?.path).toBe('Foo.md');
  });

  it('rejects empty output paths and validates managed paths', () => {
    expect(() => normalizeOutputPath('')).toThrow(OutputPlanPathError);
    expect(() => normalizeOutputPath('.')).toThrow(OutputPlanPathError);

    const plan = createOutputPlan([
      {
        owner: 'owner',
        output: {
          path: 'output.md',
          content: 'content',
          managedOutputDirectories: ['', '.', './nested//'],
          managedOutputFiles: [''],
        },
      },
    ]);

    expect(plan.managedPaths).toEqual({
      directories: ['.', 'nested'],
      files: [],
    });
    expect(() =>
      createOutputPlan([
        {
          owner: 'owner',
          output: {
            path: 'output.md',
            content: 'content',
            managedOutputDirectories: ['/outside'],
          },
        },
      ])
    ).toThrow(OutputPlanPathError);
    expect(() =>
      createOutputPlan([
        {
          owner: 'owner',
          output: {
            path: 'output.md',
            content: 'content',
            managedOutputFiles: ['../outside'],
          },
        },
      ])
    ).toThrow(OutputPlanPathError);
  });

  it('flattens nested resources and keeps deterministic path order', () => {
    const candidates: OutputPlanCandidate[] = [
      {
        owner: 'factory',
        output: {
          path: './AGENTS.md',
          content: 'main',
          managedOutputDirectories: ['./.factory/rules', '.factory/rules', '.'],
          managedOutputFiles: ['.factory/hooks.json'],
          additionalFiles: [
            {
              path: '.factory/rules/one.md',
              content: 'one',
              additionalFiles: [
                { path: '.factory/rules/scripts/run.sh', content: 'run', mode: 0o755 },
              ],
            },
          ],
        },
      },
    ];

    const plan = createOutputPlan(candidates);

    expect(plan.files.map((file) => file.path)).toEqual([
      '.factory/rules/one.md',
      '.factory/rules/scripts/run.sh',
      'AGENTS.md',
    ]);
    expect(plan.resources.map((file) => file.path)).toEqual([
      '.factory/rules/one.md',
      '.factory/rules/scripts/run.sh',
    ]);
    expect(plan.resources[1]?.mode).toBe(0o755);
    expect(plan.managedPaths).toEqual({
      directories: ['.', '.factory/rules'],
      files: ['.factory/hooks.json'],
    });
  });

  it('resolves identical and conflicting collisions deterministically', () => {
    const candidates: OutputPlanCandidate[] = [
      {
        owner: 'first',
        output: {
          path: 'shared.md',
          content: 'same',
          managedOutputDirectories: ['first'],
          managedOutputFiles: ['first.json'],
        },
      },
      {
        owner: 'resource-owner',
        role: 'resource',
        output: {
          path: 'resource-root.md',
          content: 'resource root',
          additionalFiles: [{ path: 'shared.md', content: 'different' }],
        },
      },
      {
        owner: 'second',
        output: {
          path: 'shared.md',
          content: 'same',
          managedOutputDirectories: ['second'],
          managedOutputFiles: ['second.json'],
        },
      },
      {
        owner: 'third',
        output: {
          path: 'shared.md',
          content: 'replacement',
          managedOutputDirectories: ['third'],
          managedOutputFiles: ['third.json'],
        },
      },
    ];

    const plan = createOutputPlan(candidates);

    expect(plan.outputs.get('shared.md')?.content).toBe('replacement');
    expect(plan.owners.get('shared.md')).toBe('third');
    expect(plan.outputs.get('shared.md')?.managedOutputDirectories).toEqual([
      'third',
      'first',
      'second',
    ]);
    expect(plan.outputs.get('shared.md')?.managedOutputFiles).toEqual([
      'third.json',
      'first.json',
      'second.json',
    ]);
    expect(plan.collisions).toEqual([
      expect.objectContaining({
        path: 'shared.md',
        existingOwner: 'first',
        incomingOwner: 'resource-owner',
        resolution: 'preserve-existing',
      }),
      expect.objectContaining({
        path: 'shared.md',
        existingOwner: 'first',
        incomingOwner: 'second',
        identical: true,
        resolution: 'merge-identical',
      }),
      expect.objectContaining({
        path: 'shared.md',
        existingOwner: 'first',
        incomingOwner: 'third',
        resolution: 'replace-existing',
      }),
    ]);
  });

  it('retains cleanup ownership from a losing primary candidate', () => {
    const plan = createOutputPlan([
      {
        owner: 'old-target',
        output: {
          path: 'AGENTS.md',
          content: 'old',
          managedOutputDirectories: ['.old-target'],
        },
      },
      {
        owner: 'new-target',
        output: {
          path: 'agents.md',
          content: 'new',
          managedOutputDirectories: ['.new-target'],
        },
      },
    ]);

    expect(plan.outputs.get('agents.md')?.managedOutputDirectories).toEqual([
      '.new-target',
      '.old-target',
    ]);
    expect(plan.managedPaths.directories).toEqual(['.new-target', '.old-target']);
  });

  it('compares structured merge semantics deeply', () => {
    const merge = {
      format: 'json' as const,
      owner: 'promptscript',
      operations: [{ path: 'hooks.PreToolUse', value: { command: 'check' } }],
    };
    const createPair = (incomingMerge: unknown): ReturnType<typeof createOutputPlan> =>
      createOutputPlan([
        {
          owner: 'first',
          output: { path: 'settings.json', content: '{}', merge },
        },
        {
          owner: 'second',
          output: {
            path: 'settings.json',
            content: '{}',
            merge: incomingMerge as typeof merge,
          },
        },
      ]);

    expect(createPair(structuredClone(merge)).collisions[0]?.identical).toBe(true);
    expect(createPair(undefined).collisions[0]?.identical).toBe(false);
    expect(createPair(null).collisions[0]?.identical).toBe(false);
    expect(createPair({ ...merge, operations: [] }).collisions[0]?.identical).toBe(false);
    expect(
      createPair({
        ...merge,
        operations: [{ path: 'hooks.PreToolUse', value: 'different' }],
      }).collisions[0]?.identical
    ).toBe(false);
    expect(
      createPair({
        ...merge,
        operations: [{ path: 'hooks.PreToolUse', value: { command: 'check', extra: true } }],
      }).collisions[0]?.identical
    ).toBe(false);
    expect(
      createPair({
        ...merge,
        operations: [{ path: 'hooks.PreToolUse', value: { different: 'check' } }],
      }).collisions[0]?.identical
    ).toBe(false);
    expect(
      createPair({
        ...merge,
        operations: [{ path: 'hooks.PostToolUse', value: { command: 'check' } }],
      }).collisions[0]?.identical
    ).toBe(false);
  });

  it('retains structured merge data and modes', () => {
    const merge = {
      format: 'json' as const,
      owner: 'promptscript',
      operations: [{ path: 'hooks.PreToolUse', value: { command: 'check' } }],
    };

    const plan = createOutputPlan([
      {
        owner: 'claude',
        output: { path: 'settings.json', content: '{}', mode: 0o640, merge },
      },
    ]);

    expect(plan.outputs.get('settings.json')).toEqual(
      expect.objectContaining({ mode: 0o640, merge })
    );
  });
});
