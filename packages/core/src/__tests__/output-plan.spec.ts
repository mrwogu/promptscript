import { describe, expect, it } from 'vitest';
import {
  createOutputPlan,
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
        },
      },
      {
        owner: 'third',
        output: {
          path: 'shared.md',
          content: 'replacement',
        },
      },
    ];

    const plan = createOutputPlan(candidates);

    expect(plan.outputs.get('shared.md')?.content).toBe('replacement');
    expect(plan.owners.get('shared.md')).toBe('third');
    expect(plan.outputs.get('shared.md')?.managedOutputDirectories).toEqual(['first', 'second']);
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
