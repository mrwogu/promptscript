import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { registerAuditCommands } from './index.js';
import { auditLogCommand } from './log.js';

vi.mock('./log.js', () => ({ auditLogCommand: vi.fn() }));

describe('registerAuditCommands', () => {
  it('registers prs audit log and passes its options on', async () => {
    // Arrange
    const program = new Command();
    registerAuditCommands(program);

    // Act
    await program.parseAsync(
      [
        'audit',
        'log',
        '--prompt',
        'acme/a',
        '--env',
        'prod',
        '--hash',
        'abcd',
        '--since',
        '2026-10-01',
        '--until',
        '2026-10-02',
        '--limit',
        '5',
        '--format',
        'cef',
        '--cwd',
        'app',
      ],
      { from: 'user' }
    );

    // Assert
    expect(vi.mocked(auditLogCommand)).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'acme/a',
        env: 'prod',
        hash: 'abcd',
        since: '2026-10-01',
        until: '2026-10-02',
        limit: '5',
        format: 'cef',
        cwd: 'app',
      })
    );
  });

  it('defaults to text output', async () => {
    // Arrange
    const program = new Command();
    registerAuditCommands(program);

    // Act
    await program.parseAsync(['audit', 'log'], { from: 'user' });

    // Assert
    expect(vi.mocked(auditLogCommand)).toHaveBeenLastCalledWith(
      expect.objectContaining({ format: 'text' })
    );
  });
});
