import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { governanceCodeownersCommand } from './codeowners.js';
import { registerGovernanceCommands } from './index.js';

vi.mock('./codeowners.js', () => ({ governanceCodeownersCommand: vi.fn() }));

describe('registerGovernanceCommands', () => {
  it('registers prs governance codeowners and passes its options on', async () => {
    // Arrange
    const program = new Command();
    registerGovernanceCommands(program);

    // Act
    await program.parseAsync(
      ['governance', 'codeowners', '--check', '--output', 'CODEOWNERS', '--cwd', 'app'],
      { from: 'user' }
    );

    // Assert
    expect(vi.mocked(governanceCodeownersCommand)).toHaveBeenCalledWith(
      expect.objectContaining({ check: true, output: 'CODEOWNERS', cwd: 'app', format: 'text' })
    );
  });

  it('defines no way to skip a check', () => {
    // Arrange
    const program = new Command();

    // Act
    registerGovernanceCommands(program);

    // Assert
    const codeowners = program.commands
      .find((command) => command.name() === 'governance')
      ?.commands.find((command) => command.name() === 'codeowners');
    expect(codeowners?.options.map((option) => option.long)).toEqual([
      '--output',
      '--check',
      '--format',
      '--config',
      '--cwd',
    ]);
  });
});
