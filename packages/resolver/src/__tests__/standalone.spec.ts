import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { resolve, createResolver } from '../index.js';

describe('standalone resolve function', () => {
  let tempDir: string;
  let registryDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `prs-resolve-test-${Date.now()}`);
    registryDir = join(tempDir, 'registry');
    await fs.mkdir(registryDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should resolve a simple file', async () => {
    const projectFile = join(tempDir, 'project.prs');
    await fs.writeFile(
      projectFile,
      `@meta {
  id: "test-project"
  syntax: "1.0.0"
}`
    );

    const result = await resolve(projectFile, {
      registryPath: registryDir,
      localPath: tempDir,
    });

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();
    expect(result.ast?.meta?.fields['id']).toBe('test-project');
  });

  it('should reuse provided resolver', async () => {
    const projectFile = join(tempDir, 'project.prs');
    await fs.writeFile(
      projectFile,
      `@meta {
  id: "test"
  syntax: "1.0.0"
}`
    );

    const resolver = createResolver({
      registryPath: registryDir,
      localPath: tempDir,
    });

    const result = await resolve(projectFile, {
      registryPath: registryDir,
      localPath: tempDir,
      resolver,
    });

    expect(result.ast).not.toBeNull();
  });

  it('should return errors for missing files', async () => {
    const result = await resolve(join(tempDir, 'missing.prs'), {
      registryPath: registryDir,
      localPath: tempDir,
    });

    expect(result.ast).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should resolve with inheritance', async () => {
    // Create parent file
    const parentDir = join(registryDir, '@company');
    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(
      join(parentDir, 'base.prs'),
      `@meta {
  id: "base"
  syntax: "1.0.0"
}

@identity {
  """
  Base identity
  """
}`
    );

    // Create child file
    const childFile = join(tempDir, 'child.prs');
    await fs.writeFile(
      childFile,
      `@meta {
  id: "child"
  syntax: "1.0.0"
}

@inherit @company/base`
    );

    const result = await resolve(childFile, {
      registryPath: registryDir,
      localPath: tempDir,
    });

    expect(result.ast).not.toBeNull();
    expect(result.sources.length).toBeGreaterThan(1);
  });
});
