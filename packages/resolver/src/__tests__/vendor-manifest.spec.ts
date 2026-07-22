import { afterEach, describe, expect, it } from 'vitest';
import { execFile } from 'child_process';
import { chmod, mkdtemp, mkdir, rename, rm, symlink, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import {
  VENDOR_GIT_DIR,
  VENDOR_MANIFEST_FILE,
  getVendorRepositoryRelativePath,
  hashVendorRepository,
  isValidVendorManifest,
  loadVendorManifest,
  resolveVendoredRepository,
  verifyGitRepositoryCheckout,
  verifyVendoredGitRepository,
  type VendorManifest,
} from '../vendor-manifest.js';

const tempDirectories: string[] = [];
const execFileAsync = promisify(execFile);

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'prs-vendor-manifest-'));
  tempDirectories.push(directory);
  return directory;
}

async function initializeVendoredGitRepository(directory: string): Promise<string> {
  await execFileAsync('git', ['init', directory]);
  await execFileAsync('git', ['-C', directory, 'add', '.']);
  await execFileAsync(
    'git',
    [
      '-C',
      directory,
      '-c',
      'user.name=PromptScript Tests',
      '-c',
      'user.email=tests@promptscript.dev',
      'commit',
      '-m',
      'fixture',
    ],
    { env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' } }
  );
  const result = await execFileAsync('git', ['-C', directory, 'rev-parse', 'HEAD']);
  await rename(join(directory, '.git'), join(directory, VENDOR_GIT_DIR));
  return result.stdout.trim();
}

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('vendor manifest', () => {
  it('maps supported Git URL forms to a portable repository path', () => {
    expect(getVendorRepositoryRelativePath('https://github.com/acme/base.git')).toBe(
      'github.com/acme/base'
    );
    expect(getVendorRepositoryRelativePath('git@github.com:acme/base.git')).toBe(
      'github.com/acme/base'
    );
    expect(getVendorRepositoryRelativePath('github.com/acme/base')).toBe('github.com/acme/base');
    expect(
      getVendorRepositoryRelativePath('https://gitlab.example.com:8443/groups/team/base.git')
    ).toBe('gitlab.example.com_8443/groups/team/base');
  });

  it('rejects repository URLs that can escape or collide at the host root', () => {
    expect(() => getVendorRepositoryRelativePath('https://github.com/acme/../outside.git')).toThrow(
      'Invalid Git repository URL'
    );
    expect(() => getVendorRepositoryRelativePath('https://github.com/repo.git')).toThrow(
      'Invalid Git repository URL'
    );
    expect(() => getVendorRepositoryRelativePath('://invalid')).toThrow(
      'Invalid Git repository URL'
    );
  });

  it('validates every manifest object boundary and metadata field', () => {
    expect(isValidVendorManifest(null)).toBe(false);
    expect(isValidVendorManifest([])).toBe(false);
    expect(isValidVendorManifest({ version: 1, dependencies: [] })).toBe(false);
    expect(isValidVendorManifest({ version: 1, dependencies: { repo: null } })).toBe(false);
    expect(
      isValidVendorManifest({
        version: 1,
        dependencies: {
          repo: { commit: 1, integrity: 'hash', path: 'repo/path', version: 'v1' },
        },
      })
    ).toBe(false);
    expect(
      isValidVendorManifest({
        version: 1,
        dependencies: {
          repo: { commit: 'commit', integrity: 1, path: 'repo/path', version: 'v1' },
        },
      })
    ).toBe(false);
    expect(
      isValidVendorManifest({
        version: 1,
        dependencies: {
          repo: { commit: 'commit', integrity: 'hash', path: 1, version: 'v1' },
        },
      })
    ).toBe(false);
    expect(
      isValidVendorManifest({
        version: 1,
        dependencies: {
          repo: { commit: 'commit', integrity: 'hash', path: 'repo/path', version: 1 },
        },
      })
    ).toBe(false);
    expect(
      isValidVendorManifest({
        version: 1,
        dependencies: {
          repo: {
            commit: 'commit',
            integrity: 'hash',
            path: 'repo/path',
            version: 'v1',
          },
        },
      })
    ).toBe(true);
  });

  it('rejects malformed manifests', async () => {
    const vendorDir = await createTempDirectory();
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), '{"version":1}');

    await expect(loadVendorManifest(vendorDir)).rejects.toThrow('Invalid vendor manifest');
  });

  it('preserves the JSON parse error as the invalid manifest cause', async () => {
    const vendorDir = await createTempDirectory();
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), '{');

    await expect(loadVendorManifest(vendorDir)).rejects.toMatchObject({
      cause: expect.any(SyntaxError),
    });
  });

  it('returns null when the manifest or its parent directory does not exist', async () => {
    const vendorDir = await createTempDirectory();
    const missingParentVendorDir = join(vendorDir, 'missing-parent', 'vendor');

    await expect(loadVendorManifest(vendorDir)).resolves.toBeNull();
    await expect(loadVendorManifest(missingParentVendorDir)).resolves.toBeNull();
    await expect(
      resolveVendoredRepository(vendorDir, 'https://github.com/acme/base', 'v1.0.0', null)
    ).resolves.toBeNull();
  });

  it('hashes nested files deterministically and excludes retained Git metadata', async () => {
    const repositoryDir = await createTempDirectory();
    await mkdir(join(repositoryDir, 'nested'));
    await mkdir(join(repositoryDir, VENDOR_GIT_DIR));
    await writeFile(join(repositoryDir, 'b.prs'), 'b');
    await writeFile(join(repositoryDir, 'a.prs'), 'a');
    await writeFile(join(repositoryDir, 'Beta.prs'), 'beta');
    await writeFile(join(repositoryDir, 'nested', 'c.prs'), 'c');
    await writeFile(join(repositoryDir, VENDOR_GIT_DIR, 'ignored'), 'first');
    const firstHash = await hashVendorRepository(repositoryDir);
    await writeFile(join(repositoryDir, VENDOR_GIT_DIR, 'ignored'), 'second');

    await expect(hashVendorRepository(repositoryDir)).resolves.toBe(firstHash);
  });

  it('rejects a non-directory retained Git metadata entry while hashing', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, VENDOR_GIT_DIR), 'not a directory');

    await expect(hashVendorRepository(repositoryDir)).rejects.toThrow(
      'Invalid vendor Git metadata directory'
    );
  });

  it.skipIf(process.platform === 'win32')(
    'rejects unsupported filesystem entries while hashing',
    async () => {
      const repositoryDir = await createTempDirectory();
      const pipePath = join(repositoryDir, 'named-pipe');
      await execFileAsync('mkfifo', [pipePath]);

      await expect(hashVendorRepository(repositoryDir)).rejects.toThrow(
        'Unsupported vendor repository entry'
      );
    }
  );

  it('resolves an exact vendored repository', async () => {
    const vendorDir = await createTempDirectory();
    const repoUrl = 'https://github.com/acme/base';
    const path = getVendorRepositoryRelativePath(repoUrl);
    const repositoryDir = join(vendorDir, path);
    await mkdir(repositoryDir, { recursive: true });
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    const commit = await initializeVendoredGitRepository(repositoryDir);
    const integrity = await hashVendorRepository(repositoryDir);
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: { version: 'v1.0.0', commit, integrity, path },
      },
    };
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));

    await expect(resolveVendoredRepository(vendorDir, repoUrl, 'v1.0.0', commit)).resolves.toBe(
      repositoryDir
    );
  });

  it('rejects worktree changes even when the editable manifest hash is updated', async () => {
    const vendorDir = await createTempDirectory();
    const repoUrl = 'https://github.com/acme/base';
    const path = getVendorRepositoryRelativePath(repoUrl);
    const repositoryDir = join(vendorDir, path);
    await mkdir(repositoryDir, { recursive: true });
    const filePath = join(repositoryDir, 'base.prs');
    await writeFile(filePath, '@meta { id: "base" }');
    const commit = await initializeVendoredGitRepository(repositoryDir);
    await writeFile(filePath, '@meta { id: "modified" }');
    const integrity = await hashVendorRepository(repositoryDir);
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: { version: 'v1.0.0', commit, integrity, path },
      },
    };
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));

    await expect(resolveVendoredRepository(vendorDir, repoUrl, 'v1.0.0', commit)).rejects.toThrow(
      'contents do not match commit'
    );
  });

  it.skipIf(process.platform === 'win32')(
    'rejects executable mode changes in vendored repositories',
    async () => {
      const repositoryDir = await createTempDirectory();
      const scriptPath = join(repositoryDir, 'run.sh');
      await writeFile(scriptPath, '#!/bin/sh\n');
      await chmod(scriptPath, 0o755);
      const commit = await initializeVendoredGitRepository(repositoryDir);
      await chmod(scriptPath, 0o644);

      await expect(verifyVendoredGitRepository(repositoryDir, commit)).rejects.toThrow(
        'executable modes do not match'
      );
    }
  );

  it('rejects invalid retained Git metadata directories', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, VENDOR_GIT_DIR), 'not a directory');

    await expect(
      verifyGitRepositoryCheckout(repositoryDir, VENDOR_GIT_DIR, 'a'.repeat(40))
    ).rejects.toThrow('Invalid vendor Git metadata directory');
  });

  it('rejects Git object alternates', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    const commit = await initializeVendoredGitRepository(repositoryDir);
    const infoDir = join(repositoryDir, VENDOR_GIT_DIR, 'objects', 'info');
    await mkdir(infoDir, { recursive: true });
    await writeFile(join(infoDir, 'alternates'), '/tmp/external-objects');

    await expect(verifyVendoredGitRepository(repositoryDir, commit)).rejects.toThrow(
      'Git object alternates'
    );
  });

  it('rejects a checkout at a different commit', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    await initializeVendoredGitRepository(repositoryDir);

    await expect(verifyVendoredGitRepository(repositoryDir, 'a'.repeat(40))).rejects.toThrow(
      'commit does not match'
    );
  });

  it('rejects non-blob Git tree entries', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    const firstCommit = await initializeVendoredGitRepository(repositoryDir);
    const gitDir = join(repositoryDir, VENDOR_GIT_DIR);
    const commonArgs = [`--git-dir=${gitDir}`, `--work-tree=${repositoryDir}`];
    await execFileAsync('git', [
      ...commonArgs,
      'update-index',
      '--add',
      '--cacheinfo',
      `160000,${firstCommit},nested`,
    ]);
    await execFileAsync(
      'git',
      [
        ...commonArgs,
        '-c',
        'user.name=PromptScript Tests',
        '-c',
        'user.email=tests@promptscript.dev',
        'commit',
        '-m',
        'add gitlink',
      ],
      { env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' } }
    );
    const result = await execFileAsync('git', [...commonArgs, 'rev-parse', 'HEAD']);

    await expect(verifyVendoredGitRepository(repositoryDir, result.stdout.trim())).rejects.toThrow(
      'Unsupported Git tree entry'
    );
  });

  it('rejects unsupported Git tree modes', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    await symlink('base.prs', join(repositoryDir, 'linked.prs'));
    const commit = await initializeVendoredGitRepository(repositoryDir);

    await expect(verifyVendoredGitRepository(repositoryDir, commit)).rejects.toThrow(
      'Unsupported Git tree mode'
    );
  });

  it('rejects worktree symlinks after validating the Git tree', async () => {
    const repositoryDir = await createTempDirectory();
    const filePath = join(repositoryDir, 'base.prs');
    await writeFile(filePath, '@meta { id: "base" }');
    const commit = await initializeVendoredGitRepository(repositoryDir);
    await unlink(filePath);
    await symlink(join(repositoryDir, 'missing.prs'), filePath);

    await expect(verifyVendoredGitRepository(repositoryDir, commit)).rejects.toThrow(
      'Symbolic links are not allowed'
    );
  });

  it.skipIf(process.platform === 'win32')(
    'rejects unsupported worktree entries after validating the Git tree',
    async () => {
      const repositoryDir = await createTempDirectory();
      await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
      const commit = await initializeVendoredGitRepository(repositoryDir);
      await execFileAsync('mkfifo', [join(repositoryDir, 'named-pipe')]);

      await expect(verifyVendoredGitRepository(repositoryDir, commit)).rejects.toThrow(
        'Unsupported vendor repository entry'
      );
    }
  );

  it('rejects untracked worktree files', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    const commit = await initializeVendoredGitRepository(repositoryDir);
    await writeFile(join(repositoryDir, 'extra.prs'), '@meta { id: "extra" }');

    await expect(verifyVendoredGitRepository(repositoryDir, commit)).rejects.toThrow(
      'contents do not match commit'
    );
  });

  it('permits explicitly allowed untracked worktree files', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    const commit = await initializeVendoredGitRepository(repositoryDir);
    await writeFile(join(repositoryDir, '.allowed'), 'metadata');

    await expect(
      verifyGitRepositoryCheckout(repositoryDir, VENDOR_GIT_DIR, commit, new Set(['.allowed']))
    ).resolves.toBeUndefined();
  });

  it('rejects stale and missing manifest entries', async () => {
    const vendorDir = await createTempDirectory();
    const manifest: VendorManifest = { version: 1, dependencies: {} };
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));

    await expect(
      resolveVendoredRepository(vendorDir, 'https://github.com/acme/base', 'v1.0.0', 'a'.repeat(40))
    ).rejects.toThrow('missing from the manifest');
  });

  it('rejects manifest entries with the wrong version or repository path', async () => {
    const vendorDir = await createTempDirectory();
    const repoUrl = 'https://github.com/acme/base';
    const path = getVendorRepositoryRelativePath(repoUrl);
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: {
          version: 'v2.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-test',
          path: 'github.com/acme/other',
        },
      },
    };
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));

    await expect(resolveVendoredRepository(vendorDir, repoUrl, 'v1.0.0', null)).rejects.toThrow(
      'out of sync'
    );
    manifest.dependencies[repoUrl] = {
      ...manifest.dependencies[repoUrl]!,
      version: 'v1.0.0',
      path: `${path}-wrong`,
    };
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));
    await expect(resolveVendoredRepository(vendorDir, repoUrl, 'v1.0.0', null)).rejects.toThrow(
      'Invalid vendor manifest path'
    );
  });

  it('rejects vendored paths that escape through symlinks', async () => {
    const parentDir = await createTempDirectory();
    const vendorDir = join(parentDir, 'vendor');
    const outsideDir = join(parentDir, 'outside');
    const repoUrl = 'https://github.com/acme/base';
    const path = getVendorRepositoryRelativePath(repoUrl);
    await mkdir(join(vendorDir, 'github.com', 'acme'), { recursive: true });
    await mkdir(outsideDir);
    await symlink(outsideDir, join(vendorDir, path));
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-test',
          path,
        },
      },
    };
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));

    await expect(resolveVendoredRepository(vendorDir, repoUrl, 'v1.0.0', null)).rejects.toThrow(
      'escapes the vendor directory'
    );
  });

  it('rejects vendored paths that are files or missing', async () => {
    const vendorDir = await createTempDirectory();
    const repoUrl = 'https://github.com/acme/base';
    const path = getVendorRepositoryRelativePath(repoUrl);
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-test',
          path,
        },
      },
    };
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));

    await expect(resolveVendoredRepository(vendorDir, repoUrl, 'v1.0.0', null)).rejects.toThrow(
      'Vendored dependency is missing'
    );
    await mkdir(join(vendorDir, 'github.com', 'acme'), { recursive: true });
    await writeFile(join(vendorDir, path), 'not a directory');
    await expect(resolveVendoredRepository(vendorDir, repoUrl, 'v1.0.0', null)).rejects.toThrow(
      'Vendored dependency is not a directory'
    );
  });

  it('rejects a manifest integrity mismatch after Git verification', async () => {
    const vendorDir = await createTempDirectory();
    const repoUrl = 'https://github.com/acme/base';
    const path = getVendorRepositoryRelativePath(repoUrl);
    const repositoryDir = join(vendorDir, path);
    await mkdir(repositoryDir, { recursive: true });
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    const commit = await initializeVendoredGitRepository(repositoryDir);
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: {
          version: 'v1.0.0',
          commit,
          integrity: 'sha256-wrong',
          path,
        },
      },
    };
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));

    await expect(resolveVendoredRepository(vendorDir, repoUrl, 'v1.0.0', commit)).rejects.toThrow(
      'contents do not match the manifest'
    );
  });

  it('rejects symbolic links while hashing repository content', async () => {
    const vendorDir = await createTempDirectory();
    const repositoryDir = join(vendorDir, 'repo');
    await mkdir(repositoryDir);
    await symlink(join(vendorDir, 'outside'), join(repositoryDir, 'linked'));

    await expect(hashVendorRepository(repositoryDir)).rejects.toThrow('Symbolic links');
  });

  it('rejects symbolic links in retained Git metadata', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    const commit = await initializeVendoredGitRepository(repositoryDir);
    await symlink(tmpdir(), join(repositoryDir, VENDOR_GIT_DIR, 'external'));

    await expect(verifyVendoredGitRepository(repositoryDir, commit)).rejects.toThrow(
      'vendor Git metadata'
    );
  });

  it('rejects partial clone metadata that could fetch objects during verification', async () => {
    const repositoryDir = await createTempDirectory();
    await writeFile(join(repositoryDir, 'base.prs'), '@meta { id: "base" }');
    const commit = await initializeVendoredGitRepository(repositoryDir);
    await writeFile(
      join(repositoryDir, VENDOR_GIT_DIR, 'config'),
      '\n[remote "origin"]\n\tpromisor = true\n',
      { flag: 'a' }
    );

    await expect(verifyVendoredGitRepository(repositoryDir, commit)).rejects.toThrow(
      'partial Git object sources'
    );
  });

  it('fails closed when an interrupted vendor backup exists', async () => {
    const parentDir = await createTempDirectory();
    const vendorDir = join(parentDir, 'vendor');
    await mkdir(join(parentDir, 'vendor.backup-123-456'));

    await expect(loadVendorManifest(vendorDir)).rejects.toThrow('Vendor update was interrupted');
  });
});
