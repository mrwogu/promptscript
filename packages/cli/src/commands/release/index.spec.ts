import { describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import { registerReleaseCommands } from './index.js';
import { releaseSplitCommand } from './split.js';

vi.mock('./split.js', () => ({ releaseSplitCommand: vi.fn() }));

describe('prs release split command line', () => {
  it('collects every --arm into a list', async () => {
    const program = new Command();
    registerReleaseCommands(program.command('release'));

    await program.parseAsync([
      'node',
      'prs',
      'release',
      'split',
      'acme/refund',
      '--env',
      'prod',
      '--name',
      'warm',
      '--arm',
      'a@aaaaaaaa=1',
      '--arm',
      'b@bbbbbbbb=2',
    ]);

    expect(releaseSplitCommand).toHaveBeenCalledWith(
      'acme/refund',
      expect.objectContaining({
        env: 'prod',
        name: 'warm',
        arm: ['a@aaaaaaaa=1', 'b@bbbbbbbb=2'],
      })
    );
  });

  it('starts with an empty arm list', async () => {
    const program = new Command();
    registerReleaseCommands(program.command('release'));

    await program.parseAsync([
      'node',
      'prs',
      'release',
      'split',
      'acme/refund',
      '--env',
      'prod',
      '--end',
    ]);

    expect(releaseSplitCommand).toHaveBeenLastCalledWith(
      'acme/refund',
      expect.objectContaining({ arm: [], end: true })
    );
  });
});
