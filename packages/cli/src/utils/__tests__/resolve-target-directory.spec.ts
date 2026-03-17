import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTargetDirectory } from '../resolve-target-directory.js';
import type { FileSystem, PromptSystem } from '../../services.js';

describe('utils/resolve-target-directory', () => {
  let mockReaddir: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReaddir = vi.fn();
    mockSelect = vi.fn();
  });

  function callResolve(overrides: {
    cwd?: string;
    directoryArg?: string;
    registryName?: string;
    nonInteractive?: boolean;
  } = {}): Promise<string> {
    return resolveTargetDirectory(
      {
        cwd: overrides.cwd ?? '/test/empty-dir',
        directoryArg: overrides.directoryArg,
        registryName: overrides.registryName ?? 'My Registry',
        nonInteractive: overrides.nonInteractive ?? false,
      },
      {
        fs: { readdir: mockReaddir as unknown as FileSystem['readdir'] },
        prompts: { select: mockSelect as unknown as PromptSystem['select'] },
      }
    );
  }

  it('should return resolved directoryArg when provided', async () => {
    mockReaddir.mockResolvedValue(['file.txt']);

    const result = await callResolve({ directoryArg: '/explicit/path' });

    expect(result).toBe('/explicit/path');
    expect(mockReaddir).not.toHaveBeenCalled();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should ask and return CWD when directory is empty and user picks here', async () => {
    mockReaddir.mockResolvedValue(['.git', '.gitkeep']);
    mockSelect.mockResolvedValue('here');

    const result = await callResolve({ cwd: '/test/empty-dir' });

    expect(result).toBe('/test/empty-dir');
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('empty'),
      })
    );
  });

  it('should ask and return subdirectory when directory is empty and user picks subdirectory', async () => {
    mockReaddir.mockResolvedValue(['.git']);
    mockSelect.mockResolvedValue('subdirectory');

    const result = await callResolve({
      cwd: '/test/empty-dir',
      registryName: 'Comarch PromptScript Registry',
    });

    expect(result).toBe('/test/empty-dir/comarch-promptscript-registry');
  });

  it('should return CWD without asking when empty and --yes', async () => {
    mockReaddir.mockResolvedValue(['.git']);

    const result = await callResolve({
      cwd: '/test/empty-dir',
      nonInteractive: true,
    });

    expect(result).toBe('/test/empty-dir');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should return slugified subdirectory when CWD is not empty', async () => {
    mockReaddir.mockResolvedValue(['package.json', 'src']);

    const result = await callResolve({
      cwd: '/test/project',
      registryName: 'Comarch PromptScript Registry',
    });

    expect(result).toBe('/test/project/comarch-promptscript-registry');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should treat directory with only .git as empty', async () => {
    mockReaddir.mockResolvedValue(['.git']);
    mockSelect.mockResolvedValue('here');

    const result = await callResolve({ cwd: '/test/git-init' });

    expect(result).toBe('/test/git-init');
  });
});
