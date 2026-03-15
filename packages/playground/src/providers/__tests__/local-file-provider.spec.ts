import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalFileProvider } from '../local-file-provider';

describe('LocalFileProvider', () => {
  let provider: LocalFileProvider;

  beforeEach(() => {
    provider = new LocalFileProvider('localhost:3000');
    vi.restoreAllMocks();
  });

  it('constructs with http:// for non-443 ports', () => {
    expect(provider.serverUrl).toBe('http://localhost:3000');
  });

  it('constructs with https:// for port 443', () => {
    const p = new LocalFileProvider('example.com:443');
    expect(p.serverUrl).toBe('https://example.com:443');
  });

  it('isReadOnly defaults to false', () => {
    expect(provider.isReadOnly).toBe(false);
  });

  it('isReadOnly can be set to true', () => {
    const p = new LocalFileProvider('localhost:3000', true);
    expect(p.isReadOnly).toBe(true);
  });

  it('listFiles fetches from /api/files', async () => {
    const mockFiles = { files: [{ path: 'test.prs', size: 10, modified: '2026-01-01' }] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFiles),
    } as Response);

    const result = await provider.listFiles();
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files');
    expect(result).toEqual(mockFiles.files);
  });

  it('readFile fetches from /api/files/*', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ path: 'test.prs', content: 'hello' }),
    } as Response);

    const content = await provider.readFile('test.prs');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/test.prs');
    expect(content).toBe('hello');
  });

  it('readFile preserves path slashes (no encodeURIComponent)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ path: 'src/team.prs', content: 'hello' }),
    } as Response);

    await provider.readFile('src/team.prs');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/src/team.prs');
  });

  it('writeFile sends PUT to /api/files/*', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    await provider.writeFile('test.prs', 'updated');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/test.prs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'updated' }),
    });
  });

  it('createFile sends POST to /api/files/*', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    await provider.createFile('new.prs', 'content');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/new.prs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'content' }),
    });
  });

  it('deleteFile sends DELETE to /api/files/*', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    await provider.deleteFile('test.prs');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/test.prs', {
      method: 'DELETE',
    });
  });

  it('throws on failed fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(provider.readFile('nope.prs')).rejects.toThrow('Not Found');
  });
});
