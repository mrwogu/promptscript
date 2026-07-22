import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLockCommand } = vi.hoisted(() => ({
  mockLockCommand: vi.fn(),
}));

vi.mock('../lock.js', () => ({
  lockCommand: mockLockCommand,
}));

import { updateCommand } from '../update.js';

describe('updateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should re-resolve all dependencies through the lock command', async () => {
    await updateCommand(undefined, {});

    expect(mockLockCommand).toHaveBeenCalledWith({
      command: 'update',
      dryRun: undefined,
      update: true,
      updatePackage: undefined,
    });
  });

  it('should forward package and dry-run options', async () => {
    await updateCommand('company/base', { dryRun: true });

    expect(mockLockCommand).toHaveBeenCalledWith({
      command: 'update',
      dryRun: true,
      update: true,
      updatePackage: 'company/base',
    });
  });
});
