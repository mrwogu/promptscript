import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registryPublishCommand } from '../commands/registry/publish.js';
import { type CliServices } from '../services.js';

// Mock child_process
vi.mock('child_process', () => ({
  execFileSync: vi.fn().mockReturnValue(''),
}));

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  }),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
  },
}));

import { execFileSync } from 'child_process';

const mockExecFileSync = vi.mocked(execFileSync);

describe('commands/registry/publish', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockServices: CliServices;
  let mockFs: {
    existsSync: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    mkdir: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
  };

  const validManifest = `version: '1'
meta:
  name: Test
  description: Test
  lastUpdated: '2026-01-01'
namespaces:
  '@core':
    description: Core
    priority: 100
catalog:
  - id: '@core/base'
    path: '@core/base.prs'
    name: Base
    description: Base config
    tags: [core]
    targets: [github]
    dependencies: []
`;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockFs = {
      existsSync: vi.fn().mockReturnValue(true),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(validManifest),
      readdir: vi.fn().mockResolvedValue(['base.prs']),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: {} as CliServices['prompts'],
      cwd: '/test',
    };

    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'show-ref') {
        throw new Error('missing ref');
      }
      if (Array.isArray(args) && args[0] === 'status') {
        return 'M registry-manifest.yaml' as unknown as ReturnType<typeof execFileSync>;
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should show dry run output without git operations', async () => {
    await registryPublishCommand('.', { dryRun: true }, mockServices);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
    // Should not have called git commands
    expect(mockExecFileSync).not.toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['commit']),
      expect.any(Object)
    );
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('should skip validation when --force is used', async () => {
    // Make validation fail if it runs
    mockFs.existsSync.mockImplementation((path: string) => {
      if (typeof path === 'string' && path.endsWith('registry-manifest.yaml')) return true;
      return false;
    });
    mockFs.readFile.mockResolvedValue(validManifest);

    await registryPublishCommand('.', { dryRun: true, force: true }, mockServices);

    // Should succeed despite validation issues because --force skips validation
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
  });

  it('should fail when validation fails without --force', async () => {
    mockFs.existsSync.mockImplementation((path: string) => {
      if (typeof path === 'string' && path.endsWith('registry-manifest.yaml')) return false;
      return false;
    });

    await registryPublishCommand('.', {}, mockServices);

    expect(process.exitCode).toBe(1);
  });

  it('should update lastUpdated in manifest', async () => {
    await registryPublishCommand('.', { force: true }, mockServices);

    const writeCall = mockFs.writeFile.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' && (call[0] as string).includes('registry-manifest.yaml')
    );
    expect(writeCall).toBeDefined();
    const today = new Date().toISOString().split('T')[0];
    expect(writeCall?.[1]).toContain(today);
  });

  it('should leave a manifest without lastUpdated unchanged', async () => {
    mockFs.readFile.mockResolvedValue("version: '1'\nmeta:\n  name: Test\n");

    await registryPublishCommand('.', { force: true }, mockServices);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('should use custom commit message', async () => {
    await registryPublishCommand('.', { dryRun: true, message: 'Custom commit' }, mockServices);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Custom commit'));
  });

  it('should show tag in dry run when --tag is provided', async () => {
    await registryPublishCommand('.', { dryRun: true, tag: 'v1.0.0' }, mockServices);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('v1.0.0'));
  });

  it('should fail when not a git repository', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'rev-parse') {
        throw new Error('not a git repo');
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true }, mockServices);

    expect(process.exitCode).toBe(1);
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('should reject a registry path below the Git repository root', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'rev-parse' && args[1] === '--show-toplevel') {
        return '/parent' as unknown as ReturnType<typeof execFileSync>;
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true }, mockServices);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should succeed with full git publish flow', async () => {
    await registryPublishCommand('.', { force: true }, mockServices);

    // Should call git add, commit, push
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['rev-parse', '--is-inside-work-tree'],
      expect.any(Object)
    );
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['add', '-A', '--', '.'],
      expect.any(Object)
    );
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['commit', '-m', 'chore: publish registry updates'],
      expect.any(Object)
    );
    expect(mockExecFileSync).toHaveBeenCalledWith('git', ['push'], expect.any(Object));
  });

  it('should push without committing when the working tree is clean', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, _args: unknown) => {
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true }, mockServices);

    expect(mockExecFileSync).not.toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['commit']),
      expect.any(Object)
    );
    expect(mockExecFileSync).toHaveBeenCalledWith('git', ['push'], expect.any(Object));
    expect(process.exitCode).toBeUndefined();
  });

  it('should fail when commit creation fails', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'status') {
        return 'M registry-manifest.yaml' as unknown as ReturnType<typeof execFileSync>;
      }
      if (Array.isArray(args) && args[0] === 'commit') {
        throw new Error('commit hook rejected');
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true }, mockServices);

    expect(mockExecFileSync).not.toHaveBeenCalledWith('git', ['push'], expect.any(Object));
    expect(process.exitCode).toBe(1);
  });

  it('should fail when push fails', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'push') {
        throw new Error('push rejected');
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true }, mockServices);

    expect(process.exitCode).toBe(1);
  });

  it('should create and push tag when --tag is provided', async () => {
    await registryPublishCommand('.', { force: true, tag: 'v1.0.0' }, mockServices);

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['tag', '--', 'v1.0.0'],
      expect.any(Object)
    );
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['push', 'origin', 'refs/tags/v1.0.0'],
      expect.any(Object)
    );
  });

  it('should validate a tag before mutating the repository', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'check-ref-format') {
        throw new Error('invalid ref');
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true, tag: 'bad tag' }, mockServices);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
    expect(mockExecFileSync).not.toHaveBeenCalledWith(
      'git',
      ['add', '-A', '--', '.'],
      expect.any(Object)
    );
    expect(process.exitCode).toBe(1);
  });

  it('should reject an existing local tag before mutating the repository', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'show-ref') {
        return '' as unknown as ReturnType<typeof execFileSync>;
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true, tag: 'v1.0.0' }, mockServices);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
    expect(mockExecFileSync).not.toHaveBeenCalledWith(
      'git',
      ['add', '-A', '--', '.'],
      expect.any(Object)
    );
    expect(process.exitCode).toBe(1);
  });

  it('should fail before mutation when remote tags cannot be checked', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'show-ref') {
        throw new Error('missing ref');
      }
      if (Array.isArray(args) && args[0] === 'ls-remote') {
        throw new Error('network unavailable');
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true, tag: 'v1.0.0' }, mockServices);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should reject an existing remote tag before mutating the repository', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'show-ref') {
        throw new Error('missing ref');
      }
      if (Array.isArray(args) && args[0] === 'ls-remote') {
        return 'abc123\trefs/tags/v1.0.0' as unknown as ReturnType<typeof execFileSync>;
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true, tag: 'v1.0.0' }, mockServices);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
    expect(mockExecFileSync).not.toHaveBeenCalledWith(
      'git',
      ['add', '-A', '--', '.'],
      expect.any(Object)
    );
    expect(process.exitCode).toBe(1);
  });

  it('should remove a local tag when tag push fails', async () => {
    mockExecFileSync.mockImplementation((_cmd: unknown, args: unknown) => {
      if (Array.isArray(args) && args[0] === 'show-ref') {
        throw new Error('missing ref');
      }
      if (Array.isArray(args) && args[0] === 'status') {
        return 'M registry-manifest.yaml' as unknown as ReturnType<typeof execFileSync>;
      }
      if (Array.isArray(args) && args[0] === 'push' && args[1] === 'origin') {
        throw new Error('tag rejected');
      }
      return '' as unknown as ReturnType<typeof execFileSync>;
    });

    await registryPublishCommand('.', { force: true, tag: 'v1.0.0' }, mockServices);

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['tag', '-d', '--', 'v1.0.0'],
      expect.any(Object)
    );
    expect(process.exitCode).toBe(1);
  });

  it('should use custom commit message in git operations', async () => {
    await registryPublishCommand('.', { force: true, message: 'release: v2.0' }, mockServices);

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'git',
      ['commit', '-m', 'release: v2.0'],
      expect.any(Object)
    );
  });

  it('should handle unexpected errors', async () => {
    mockFs.existsSync.mockImplementation(() => {
      throw new Error('filesystem error');
    });

    await registryPublishCommand('.', { force: true }, mockServices);

    expect(process.exitCode).toBe(1);
  });
});
