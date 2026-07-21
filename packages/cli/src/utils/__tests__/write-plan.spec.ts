import { describe, expect, it, vi } from 'vitest';
import type { CliServices } from '../../services.js';
import { executeWritePlan } from '../write-plan.js';

function createServices(files: Record<string, string>): {
  services: CliServices;
  writeFile: ReturnType<typeof vi.fn>;
  rm: ReturnType<typeof vi.fn>;
} {
  const writeFile = vi.fn(async (path: string, content: string) => {
    files[path] = content;
  });
  const rm = vi.fn(async (path: string) => {
    delete files[path];
  });
  const services = {
    fs: {
      existsSync: vi.fn((path: string) => files[path] !== undefined),
      readFile: vi.fn(async (path: string) => files[path] ?? ''),
      readFileSync: vi.fn((path: string) => files[path] ?? ''),
      writeFile,
      mkdir: vi.fn().mockResolvedValue(undefined),
      readdir: vi.fn().mockResolvedValue([]),
      rm,
    },
    prompts: {},
    cwd: '/project',
  } as unknown as CliServices;

  return { services, writeFile, rm };
}

describe('executeWritePlan', () => {
  it('rejects user-owned conflicts before writing any file', async () => {
    const files = { 'existing.md': 'user content' };
    const { services, writeFile } = createServices(files);

    await expect(
      executeWritePlan(
        [
          { path: 'new.md', content: 'new' },
          { path: 'existing.md', content: 'replacement' },
        ],
        services
      )
    ).rejects.toThrow('Refusing to overwrite');

    expect(writeFile).not.toHaveBeenCalled();
    expect(files).toEqual({ 'existing.md': 'user content' });
  });

  it.each(['../outside.md', 'C:outside.md'])(
    'rejects unsafe path %s before writing',
    async (path) => {
      const files: Record<string, string> = {};
      const { services, writeFile } = createServices(files);

      await expect(executeWritePlan([{ path, content: 'new' }], services)).rejects.toThrow(
        'must stay inside the project'
      );

      expect(writeFile).not.toHaveBeenCalled();
    }
  );

  it('rejects duplicate normalized paths', async () => {
    const files: Record<string, string> = {};
    const { services, writeFile } = createServices(files);

    await expect(
      executeWritePlan(
        [
          { path: 'same.md', content: 'first' },
          { path: 'same.md', content: 'second' },
        ],
        services
      )
    ).rejects.toThrow('duplicate path');

    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects an existing symbolic-link destination', async () => {
    const files: Record<string, string> = {};
    const { services, writeFile } = createServices(files);
    services.fs.existsSync = vi.fn((path: unknown) =>
      ['/project', '/project/link.md'].includes(String(path))
    ) as unknown as CliServices['fs']['existsSync'];
    services.fs.realpath = vi.fn(async (path: unknown) => String(path)) as NonNullable<
      CliServices['fs']['realpath']
    >;
    services.fs.lstat = vi.fn().mockResolvedValue({
      isSymbolicLink: () => true,
    }) as unknown as NonNullable<CliServices['fs']['lstat']>;

    await expect(executeWritePlan([{ path: 'link.md', content: 'new' }], services)).rejects.toThrow(
      'Refusing to replace symbolic link'
    );

    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects writes through a symlinked parent outside the project', async () => {
    const files: Record<string, string> = {};
    const { services, writeFile } = createServices(files);
    services.fs.existsSync = vi.fn(
      (path: unknown) => String(path) === '/project' || String(path) === '/project/link'
    ) as unknown as CliServices['fs']['existsSync'];
    services.fs.realpath = vi.fn(async (path: string) =>
      path === '/project/link' ? '/outside' : path
    ) as NonNullable<CliServices['fs']['realpath']>;

    await expect(
      executeWritePlan([{ path: 'link/output.md', content: 'new' }], services)
    ).rejects.toThrow('escapes the project');

    expect(writeFile).not.toHaveBeenCalled();
  });

  it('allows managed PromptScript files to be updated', async () => {
    const files = { 'managed.md': '<!-- PromptScript generated -->\nold' };
    const { services } = createServices(files);

    const result = await executeWritePlan(
      [{ path: 'managed.md', content: '<!-- PromptScript generated -->\nnew' }],
      services
    );

    expect(result.updated).toEqual(['managed.md']);
    expect(files['managed.md']).toContain('new');
  });

  it('does not treat prose that mentions a marker as managed content', async () => {
    const files = {
      'guide.md': 'Use `<!-- PromptScript generated -->` to identify generated output.',
    };
    const { services, writeFile } = createServices(files);

    await expect(
      executeWritePlan([{ path: 'guide.md', content: 'replacement' }], services)
    ).rejects.toThrow('Refusing to overwrite');

    expect(writeFile).not.toHaveBeenCalled();
  });

  it('reports dry-run changes without writing', async () => {
    const files: Record<string, string> = {};
    const { services, writeFile } = createServices(files);

    const result = await executeWritePlan([{ path: 'new.md', content: 'new' }], services, {
      dryRun: true,
    });

    expect(result.created).toEqual(['new.md']);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('skips byte-identical files', async () => {
    const files = { 'same.md': 'same' };
    const { services, writeFile } = createServices(files);

    const result = await executeWritePlan([{ path: 'same.md', content: 'same' }], services);

    expect(result.unchanged).toEqual(['same.md']);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rolls back earlier writes when a later write fails', async () => {
    const files: Record<string, string> = { 'first.md': 'old' };
    const { services, writeFile, rm } = createServices(files);
    writeFile.mockImplementation(async (path: string, content: string) => {
      if (path === 'second.md') {
        throw new Error('disk full');
      }
      files[path] = content;
    });

    await expect(
      executeWritePlan(
        [
          { path: 'first.md', content: 'new' },
          { path: 'second.md', content: 'new' },
        ],
        services,
        { force: true }
      )
    ).rejects.toThrow('disk full');

    expect(files['first.md']).toBe('old');
    expect(rm).not.toHaveBeenCalledWith('first.md', expect.anything());
  });

  it('removes a partially written new file after a write failure', async () => {
    const files: Record<string, string> = {};
    const { services, writeFile } = createServices(files);
    writeFile.mockImplementation(async (path: string, content: string) => {
      files[path] = content.slice(0, 1);
      throw new Error('disk full');
    });

    await expect(
      executeWritePlan([{ path: 'partial.md', content: 'new' }], services)
    ).rejects.toThrow('disk full');

    expect(files['partial.md']).toBeUndefined();
  });

  it('reports rollback failures with the original write error', async () => {
    const files: Record<string, string> = {};
    const { services, writeFile, rm } = createServices(files);
    writeFile.mockRejectedValue(new Error('disk full'));
    rm.mockRejectedValue(new Error('permission denied'));

    await expect(
      executeWritePlan([{ path: 'partial.md', content: 'new' }], services)
    ).rejects.toThrow('disk full. Rollback failed for 1 operation(s).');
  });

  it('reports temporary-file cleanup failures', async () => {
    const files: Record<string, string> = {};
    const { services, writeFile, rm } = createServices(files);
    services.fs.rename = vi.fn().mockResolvedValue(undefined);
    writeFile.mockImplementation(async (path: string, content: string) => {
      if (path.startsWith('second.md.tmp-')) {
        throw new Error('disk full');
      }
      files[path] = content;
    });
    rm.mockRejectedValue(new Error('permission denied'));

    await expect(
      executeWritePlan(
        [
          { path: 'first.md', content: 'new' },
          { path: 'second.md', content: 'new' },
        ],
        services
      )
    ).rejects.toThrow('disk full. Rollback failed for 2 operation(s).');
  });

  it('reports failure to restore an updated file', async () => {
    const files: Record<string, string> = { 'first.md': 'old' };
    const { services, writeFile } = createServices(files);
    writeFile.mockImplementation(async (path: string, content: string) => {
      if (path === 'second.md') {
        throw new Error('disk full');
      }
      if (path === 'first.md' && content === 'old') {
        throw new Error('restore denied');
      }
      files[path] = content;
    });

    await expect(
      executeWritePlan(
        [
          { path: 'first.md', content: 'new' },
          { path: 'second.md', content: 'new' },
        ],
        services,
        { force: true }
      )
    ).rejects.toThrow('disk full. Rollback failed for 1 operation(s).');
  });

  it('reports unavailable cleanup for a failed new file', async () => {
    const files: Record<string, string> = {};
    const { services, writeFile } = createServices(files);
    services.fs.rm = undefined;
    writeFile.mockRejectedValue(new Error('disk full'));

    await expect(
      executeWritePlan([{ path: 'partial.md', content: 'new' }], services)
    ).rejects.toThrow('disk full. Rollback failed for 1 operation(s).');
  });
});
