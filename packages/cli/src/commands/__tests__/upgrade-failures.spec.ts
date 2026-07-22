import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  chmodSync: vi.fn(),
  compareVersions: vi.fn(),
  discoverPrsFiles: vi.fn(),
  error: vi.fn(),
  fixSyntaxVersion: vi.fn(),
  lstatSync: vi.fn(),
  parse: vi.fn(),
  readFileSync: vi.fn(),
  renameSync: vi.fn(),
  unlinkSync: vi.fn(),
  warning: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  chmodSync: mocks.chmodSync,
  lstatSync: mocks.lstatSync,
  readFileSync: mocks.readFileSync,
  renameSync: mocks.renameSync,
  unlinkSync: mocks.unlinkSync,
  writeFileSync: mocks.writeFileSync,
}));

vi.mock('node:crypto', () => ({
  randomUUID: () => 'test-id',
}));

vi.mock('@promptscript/core', () => ({
  compareVersions: mocks.compareVersions,
  getLatestSyntaxVersion: () => '2.0.0',
}));

vi.mock('@promptscript/parser', () => ({
  parse: mocks.parse,
}));

vi.mock('../validate.js', () => ({
  discoverPrsFiles: mocks.discoverPrsFiles,
  fixSyntaxVersion: mocks.fixSyntaxVersion,
}));

vi.mock('../../output/console.js', () => ({
  ConsoleOutput: {
    error: mocks.error,
    warning: mocks.warning,
  },
}));

import { upgradeCommand } from '../upgrade.js';

const ORIGINAL = '@meta { syntax: "1.0.0" }';

function regularFile(): { isSymbolicLink: () => boolean; mode: number } {
  return { isSymbolicLink: () => false, mode: 0o100640 };
}

describe('upgradeCommand failure coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.discoverPrsFiles.mockReturnValue(['project.prs']);
    mocks.lstatSync.mockReturnValue(regularFile());
    mocks.readFileSync.mockReturnValue(ORIGINAL);
    mocks.renameSync.mockImplementation(() => undefined);
    mocks.unlinkSync.mockImplementation(() => undefined);
    mocks.writeFileSync.mockImplementation(() => undefined);
    mocks.parse.mockReturnValue({
      ast: {
        meta: {
          fields: { syntax: '1.0.0' },
          loc: { offset: 0 },
        },
      },
      errors: [],
    });
    mocks.compareVersions.mockReturnValue(-1);
    mocks.fixSyntaxVersion.mockReturnValue('@meta { syntax: "2.0.0" }');
  });

  afterEach(() => {
    process.exitCode = undefined;
    vi.restoreAllMocks();
  });

  it('cleans up the temporary file when atomic replacement fails', async () => {
    mocks.renameSync.mockImplementation(() => {
      throw new Error('rename failed');
    });

    await upgradeCommand({});

    expect(mocks.writeFileSync).toHaveBeenCalled();
    expect(mocks.chmodSync).toHaveBeenCalled();
    expect(mocks.unlinkSync).toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to upgrade project.prs: rename failed')
    );
    expect(process.exitCode).toBe(1);
  });

  it('writes an upgrade atomically when preflight checks still match', async () => {
    await upgradeCommand({});

    expect(mocks.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.upgrade-'),
      '@meta { syntax: "2.0.0" }',
      { encoding: 'utf-8', mode: 0o640 }
    );
    expect(mocks.renameSync).toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it('preserves the original replacement error when cleanup also fails', async () => {
    mocks.renameSync.mockImplementation(() => {
      throw new Error('rename failed');
    });
    mocks.unlinkSync.mockImplementation(() => {
      throw new Error('cleanup failed');
    });

    await upgradeCommand({});

    expect(mocks.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to upgrade project.prs: rename failed')
    );
    expect(process.exitCode).toBe(1);
  });

  it('rejects a non-string syntax version', async () => {
    mocks.parse.mockReturnValue({
      ast: { meta: { fields: { syntax: 1 }, loc: { offset: 0 } } },
      errors: [],
    });

    await upgradeCommand({});

    expect(mocks.error).toHaveBeenCalledWith(
      'Cannot upgrade project.prs: syntax version must be a string'
    );
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('aborts when the syntax version cannot be located', async () => {
    mocks.fixSyntaxVersion.mockReturnValue(null);

    await upgradeCommand({});

    expect(mocks.error).toHaveBeenCalledWith(
      'Cannot upgrade project.prs: unable to locate syntax version'
    );
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('reports non-Error file inspection failures', async () => {
    mocks.lstatSync.mockImplementation(() => {
      throw 'access denied';
    });

    await upgradeCommand({});

    expect(mocks.error).toHaveBeenCalledWith('Cannot upgrade project.prs: access denied');
    expect(process.exitCode).toBe(1);
  });

  it('aborts when a planned file becomes a symbolic link', async () => {
    mocks.lstatSync
      .mockReturnValueOnce(regularFile())
      .mockReturnValueOnce({ isSymbolicLink: () => true, mode: 0o120777 });

    await upgradeCommand({});

    expect(mocks.error).toHaveBeenCalledWith(
      'Upgrade aborted: project.prs: file became a symbolic link during upgrade'
    );
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('aborts when a file becomes a symbolic link during replacement', async () => {
    mocks.lstatSync
      .mockReturnValueOnce(regularFile())
      .mockReturnValueOnce(regularFile())
      .mockReturnValueOnce({ isSymbolicLink: () => true, mode: 0o120777 });

    await upgradeCommand({});

    expect(mocks.error).toHaveBeenCalledWith(
      'Failed to upgrade project.prs: file became a symbolic link during upgrade'
    );
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('aborts when a planned file changes before replacement', async () => {
    mocks.readFileSync.mockReturnValueOnce(ORIGINAL).mockReturnValueOnce('changed');

    await upgradeCommand({});

    expect(mocks.error).toHaveBeenCalledWith(
      'Upgrade aborted: project.prs: file changed during upgrade'
    );
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
