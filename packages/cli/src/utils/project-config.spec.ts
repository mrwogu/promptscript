import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  loadProjectLockfile,
  registryReferenceRoots,
  resolveProjectConfigPath,
  resolveProjectRoot,
  resolveUniversalDir,
} from './project-config.js';

const originalConfig = process.env['PROMPTSCRIPT_CONFIG'];
const directories: string[] = [];

async function directory(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'promptscript-project-config-'));
  directories.push(path);
  return path;
}

afterEach(async () => {
  if (originalConfig === undefined) {
    delete process.env['PROMPTSCRIPT_CONFIG'];
  } else {
    process.env['PROMPTSCRIPT_CONFIG'] = originalConfig;
  }
  for (const path of directories.splice(0)) {
    await rm(path, { recursive: true, force: true });
  }
});

describe('resolveProjectRoot', () => {
  it('uses --cwd when given, else the current directory', () => {
    expect(resolveProjectRoot({ cwd: 'some/dir' })).toBe(resolve('some/dir'));
    expect(resolveProjectRoot({})).toBe(process.cwd());
  });
});

describe('resolveProjectConfigPath', () => {
  it('resolves --config against the project root', () => {
    expect(resolveProjectConfigPath('/repo', { config: 'custom.yaml' })).toBe(
      resolve('/repo', 'custom.yaml')
    );
    expect(resolveProjectConfigPath('/repo', { config: '/etc/prs.yaml' })).toBe('/etc/prs.yaml');
  });

  it('honors PROMPTSCRIPT_CONFIG under --cwd', () => {
    process.env['PROMPTSCRIPT_CONFIG'] = 'env.yaml';

    expect(resolveProjectConfigPath('/repo', { cwd: '/repo' })).toBe(resolve('/repo', 'env.yaml'));
  });

  it('finds a config file under --cwd in the loader order', async () => {
    delete process.env['PROMPTSCRIPT_CONFIG'];
    const root = await directory();
    await writeFile(join(root, 'promptscript.yml'), 'targets: []\n');

    expect(resolveProjectConfigPath(root, { cwd: root })).toBe(join(root, 'promptscript.yml'));
  });

  it('fails under --cwd without a config file, and leaves the search to the loader without it', async () => {
    delete process.env['PROMPTSCRIPT_CONFIG'];
    const root = await directory();

    expect(() => resolveProjectConfigPath(root, { cwd: root })).toThrow('Run: prs init');
    expect(resolveProjectConfigPath(root, {})).toBeUndefined();
  });
});

describe('resolveUniversalDir', () => {
  it('defaults to .agents, honors a path and turns off with false', () => {
    expect(resolveUniversalDir(undefined)).toEqual({ universalDir: '.agents' });
    expect(resolveUniversalDir(true)).toEqual({ universalDir: '.agents' });
    expect(resolveUniversalDir('.skills')).toEqual({ universalDir: '.skills' });
    expect(resolveUniversalDir(false)).toBeUndefined();
  });
});

describe('loadProjectLockfile', () => {
  it('returns undefined without a lockfile and rejects an invalid one', async () => {
    const root = await directory();

    expect(await loadProjectLockfile(root)).toBeUndefined();

    await writeFile(join(root, 'promptscript.lock'), 'version: nope\n');
    await expect(loadProjectLockfile(root)).rejects.toThrow('Invalid lockfile');
  });

  it('reads a valid lockfile', async () => {
    const root = await directory();
    await writeFile(join(root, 'promptscript.lock'), 'version: 1\ndependencies: {}\n');

    expect(await loadProjectLockfile(root)).toEqual({ version: 1, dependencies: {} });
  });
});

describe('registryReferenceRoots', () => {
  it('keys the checkout by its repository URL, and is empty for a path registry', () => {
    expect(
      registryReferenceRoots({ repositoryUrl: 'https://git.example/r.git', repositoryPath: '/c' })
    ).toEqual({ 'https://git.example/r.git': ['/c'] });
    expect(registryReferenceRoots({})).toBeUndefined();
  });
});
