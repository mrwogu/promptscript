import { resolveSafePath } from '../path-guard.js';
import { mkdtemp, mkdir, symlink, rm, realpath, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('resolveSafePath', () => {
  const workspace = '/workspace';

  it('resolves a valid relative path', async () => {
    expect(await resolveSafePath(workspace, 'src/team.prs')).toBe('/workspace/src/team.prs');
  });

  it('resolves a nested path', async () => {
    expect(await resolveSafePath(workspace, 'deep/nested/file.prs')).toBe(
      '/workspace/deep/nested/file.prs'
    );
  });

  it('rejects path traversal with ../', async () => {
    await expect(resolveSafePath(workspace, '../etc/passwd')).rejects.toThrow();
  });

  it('rejects encoded path traversal', async () => {
    await expect(resolveSafePath(workspace, '..%2F..%2Fetc/passwd')).rejects.toThrow();
  });

  it('rejects absolute paths', async () => {
    await expect(resolveSafePath(workspace, '/etc/passwd')).rejects.toThrow();
  });

  it('rejects paths that resolve outside workspace', async () => {
    await expect(resolveSafePath(workspace, 'src/../../outside')).rejects.toThrow();
  });

  it('allows paths with .. in filenames', async () => {
    expect(await resolveSafePath(workspace, 'src/my..file.prs')).toBe(
      '/workspace/src/my..file.prs'
    );
  });

  it('rejects symlink that points outside workspace', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'prs-guard-'));
    const outside = join(tmp, 'outside');
    const ws = join(tmp, 'workspace');
    const linkPath = join(ws, 'evil.prs');

    await mkdir(ws, { recursive: true });
    await mkdir(outside, { recursive: true });
    await writeFile(join(outside, 'secret.txt'), 'secret');

    // Create symlink inside workspace pointing outside
    await symlink(join(outside, 'secret.txt'), linkPath);

    const realWs = await realpath(ws);
    await expect(resolveSafePath(realWs, 'evil.prs')).rejects.toThrow();

    await rm(tmp, { recursive: true, force: true });
  });

  it('accepts symlink that stays within workspace', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'prs-guard-'));
    const ws = join(tmp, 'workspace');
    const srcDir = join(ws, 'src');
    const targetFile = join(ws, 'target.prs');

    await mkdir(ws, { recursive: true });
    await mkdir(srcDir, { recursive: true });
    await writeFile(targetFile, '@identity Test');

    // Create symlink inside workspace pointing to another file in workspace
    await symlink(targetFile, join(srcDir, 'link.prs'));

    const realWs = await realpath(ws);
    const resolved = await resolveSafePath(realWs, 'src/link.prs');
    const realResolved = await realpath(resolved);
    expect(realResolved.startsWith(realWs)).toBe(true);

    await rm(tmp, { recursive: true, force: true });
  });
});
