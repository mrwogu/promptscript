import { describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import { registerReleaseCommands } from './index.js';
import { releaseSplitCommand } from './split.js';
import { releaseStatusCommand } from './status.js';

vi.mock('./split.js', () => ({ releaseSplitCommand: vi.fn() }));
vi.mock('./status.js', () => ({ releaseStatusCommand: vi.fn() }));

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

describe('prs release status command line', () => {
  it('passes --check-models and --retiring-within on', async () => {
    const program = new Command();
    registerReleaseCommands(program.command('release'));

    await program.parseAsync([
      'node',
      'prs',
      'release',
      'status',
      '--check-models',
      '--retiring-within',
      '7',
    ]);

    expect(releaseStatusCommand).toHaveBeenCalledWith(
      expect.objectContaining({ checkModels: true, retiringWithin: '7' })
    );
  });
});
