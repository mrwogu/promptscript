import { resolveSafePath } from '../path-guard.js';

describe('resolveSafePath', () => {
  const workspace = '/workspace';

  it('resolves a valid relative path', () => {
    expect(resolveSafePath(workspace, 'src/team.prs')).toBe('/workspace/src/team.prs');
  });

  it('resolves a nested path', () => {
    expect(resolveSafePath(workspace, 'deep/nested/file.prs')).toBe(
      '/workspace/deep/nested/file.prs'
    );
  });

  it('rejects path traversal with ../', () => {
    expect(() => resolveSafePath(workspace, '../etc/passwd')).toThrow();
  });

  it('rejects encoded path traversal', () => {
    expect(() => resolveSafePath(workspace, '..%2F..%2Fetc/passwd')).toThrow();
  });

  it('rejects absolute paths', () => {
    expect(() => resolveSafePath(workspace, '/etc/passwd')).toThrow();
  });

  it('rejects paths that resolve outside workspace', () => {
    expect(() => resolveSafePath(workspace, 'src/../../outside')).toThrow();
  });

  it('allows paths with .. in filenames', () => {
    expect(resolveSafePath(workspace, 'src/my..file.prs')).toBe('/workspace/src/my..file.prs');
  });
});
