import { Command } from 'commander';
import { afterEach, describe, expect, it } from 'vitest';
import { commandFeatures, exitOutcome, normalizedCommandName } from './session.js';

const originalCi = process.env['CI'];

afterEach(() => {
  if (originalCi === undefined) {
    delete process.env['CI'];
  } else {
    process.env['CI'] = originalCi;
  }
});

describe('CLI telemetry command normalization', () => {
  it('normalizes nested command groups to allowlisted names', () => {
    const skills = new Command('skills');
    const add = skills.command('add');
    const vendor = new Command('vendor');
    const sync = vendor.command('sync');
    const registry = new Command('registry');
    const publish = registry.command('publish');

    expect(normalizedCommandName(add)).toBe('skills-add');
    expect(normalizedCommandName(sync)).toBe('vendor-sync');
    expect(normalizedCommandName(publish)).toBe('registry');
  });

  it('extracts only allowlisted command features', () => {
    const command = new Command('compile');
    command.setOptionValue('target', 'claude');
    command.setOptionValue('targets', ['github', 'private-target']);
    command.setOptionValue('dryRun', true);
    command.setOptionValue('watch', true);
    command.setOptionValue('strict', true);
    command.setOptionValue('build', 'production');
    process.env['CI'] = 'true';

    expect(commandFeatures(command)).toEqual([
      'target:claude',
      'target:github',
      'dry_run',
      'watch',
      'strict',
      'build_profile',
      'ci',
    ]);
  });

  it('maps process outcomes to the bounded collector taxonomy', () => {
    expect(exitOutcome(0)).toBe('success');
    expect(exitOutcome(1)).toBe('error');
    expect(exitOutcome(130)).toBe('cancelled');
    expect(exitOutcome(143)).toBe('cancelled');
  });
});
