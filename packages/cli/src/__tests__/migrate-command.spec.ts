// packages/cli/src/__tests__/migrate-command.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrateCommand } from '../commands/migrate.js';

const mockInitCommand = vi.fn().mockResolvedValue(undefined);
vi.mock('../commands/init.js', () => ({
  initCommand: (...args: unknown[]) => mockInitCommand(...args),
}));

describe('migrateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to initCommand with _forceMigrate flag', async () => {
    await migrateCommand({});
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({ _forceMigrate: true }),
      expect.anything()
    );
  });

  it('--static maps to yes + autoImport flags', async () => {
    await migrateCommand({ static: true });
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({ yes: true, autoImport: true, _forceMigrate: true }),
      expect.anything()
    );
  });

  it('--llm maps to _forceLlm flag', async () => {
    await migrateCommand({ llm: true });
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({ _forceMigrate: true, _forceLlm: true }),
      expect.anything()
    );
  });

  it('--files are passed through to initCommand', async () => {
    await migrateCommand({ files: ['CLAUDE.md', '.cursorrules'] });
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        _forceMigrate: true,
        _migrateFiles: ['CLAUDE.md', '.cursorrules'],
      }),
      expect.anything()
    );
  });

  it('always sets force: true to allow running on initialized projects', async () => {
    await migrateCommand({});
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({ force: true }),
      expect.anything()
    );
  });
});
