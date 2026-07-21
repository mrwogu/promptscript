import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBackup, isGitRepo } from '../backup.js';
import type { CliServices } from '../../services.js';

describe('isGitRepo', () => {
  it('returns true when .git exists', () => {
    const services = {
      fs: { existsSync: vi.fn().mockReturnValue(true) },
      cwd: '/workspace/project',
    } as unknown as CliServices;
    expect(isGitRepo(services)).toBe(true);
    expect(services.fs.existsSync).toHaveBeenCalledWith('/workspace/project/.git');
  });

  it('returns false when .git does not exist', () => {
    const services = {
      fs: { existsSync: vi.fn().mockReturnValue(false) },
      cwd: '/workspace/project',
    } as unknown as CliServices;
    expect(isGitRepo(services)).toBe(false);
  });

  it('detects a git repository in a parent directory', () => {
    const services = {
      fs: {
        existsSync: vi.fn((path: string) => path === '/workspace/.git'),
      },
      cwd: '/workspace/packages/project',
    } as unknown as CliServices;

    expect(isGitRepo(services)).toBe(true);
  });
});

describe('createBackup', () => {
  let mockServices: CliServices;

  beforeEach(() => {
    mockServices = {
      fs: {
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn().mockReturnValue('file content'),
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue('file content'),
        readdir: vi.fn().mockResolvedValue([]),
      },
      prompts: {} as CliServices['prompts'],
      cwd: '/mock',
    } as unknown as CliServices;
  });

  it('creates timestamped backup directory', async () => {
    const result = await createBackup(['CLAUDE.md'], mockServices);
    expect(mockServices.fs.mkdir).toHaveBeenCalledWith(
      expect.stringMatching(/^\.prs-backup\/\d{4}-\d{2}-\d{2}T/),
      { recursive: true }
    );
    expect(result.dir).toMatch(/^\.prs-backup\/\d{4}-\d{2}-\d{2}T/);
  });

  it('copies listed files to backup directory', async () => {
    await createBackup(['CLAUDE.md', '.cursorrules'], mockServices);
    expect(mockServices.fs.writeFile).toHaveBeenCalledTimes(2);
    expect(mockServices.fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('CLAUDE.md'),
      'file content',
      'utf-8'
    );
  });

  it('preserves nested paths inside the backup directory', async () => {
    await createBackup(['.promptscript/project.prs'], mockServices);

    expect(mockServices.fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.prs-backup\/.+\/\.promptscript\/project\.prs$/),
      'file content',
      'utf-8'
    );
  });

  it('skips files that do not exist', async () => {
    vi.mocked(mockServices.fs.existsSync).mockImplementation(
      (p: unknown) => (p as string) !== '.cursorrules'
    );
    await createBackup(['CLAUDE.md', '.cursorrules'], mockServices);
    expect(mockServices.fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('rejects a backup directory that resolves outside the project', async () => {
    mockServices.fs.existsSync = vi.fn((path: unknown) =>
      ['CLAUDE.md', '/mock', '/mock/.prs-backup'].includes(String(path))
    ) as unknown as CliServices['fs']['existsSync'];
    mockServices.fs.realpath = vi.fn(async (path: unknown) =>
      String(path) === '/mock/.prs-backup' ? '/outside' : String(path)
    ) as NonNullable<CliServices['fs']['realpath']>;

    await expect(createBackup(['CLAUDE.md'], mockServices)).rejects.toThrow('escapes the project');

    expect(mockServices.fs.mkdir).not.toHaveBeenCalled();
    expect(mockServices.fs.writeFile).not.toHaveBeenCalled();
  });

  it.each(['../outside.md', 'C:outside.md'])(
    'rejects unsafe path %s before creating the backup directory',
    async (path) => {
      await expect(createBackup([path], mockServices)).rejects.toThrow(
        'must stay inside the project'
      );

      expect(mockServices.fs.mkdir).not.toHaveBeenCalled();
      expect(mockServices.fs.writeFile).not.toHaveBeenCalled();
    }
  );
});
