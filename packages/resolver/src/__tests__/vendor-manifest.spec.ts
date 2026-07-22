import { afterEach, describe, expect, it } from 'vitest';
import { execFile } from 'child_process';
import { chmod, mkdtemp, mkdir, rename, rm, symlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import {
  VENDOR_GIT_DIR,
  VENDOR_MANIFEST_FILE,
  getVendorRepositoryRelativePath,
  hashVendorRepository,
  loadVendorManifest,
  resolveVendoredRepository,
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
  });

  it('rejects malformed manifests', async () => {
    const vendorDir = await createTempDirectory();
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), '{"version":1}');

    await expect(loadVendorManifest(vendorDir)).rejects.toThrow('Invalid vendor manifest');
  });

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

  it('rejects stale and missing manifest entries', async () => {
    const vendorDir = await createTempDirectory();
    const manifest: VendorManifest = { version: 1, dependencies: {} };
    await writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));

    await expect(
      resolveVendoredRepository(vendorDir, 'https://github.com/acme/base', 'v1.0.0', 'a'.repeat(40))
    ).rejects.toThrow('missing from the manifest');
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
