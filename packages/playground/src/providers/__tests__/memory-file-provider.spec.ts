import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaygroundStore } from '../../store';
import { MemoryFileProvider } from '../memory-file-provider';

describe('MemoryFileProvider', () => {
  let provider: MemoryFileProvider;

  beforeEach(() => {
    provider = new MemoryFileProvider();
    usePlaygroundStore.setState({
      files: [{ path: 'test.prs', content: 'hello' }],
      activeFile: 'test.prs',
    });
  });

  it('lists files from store', async () => {
    const files = await provider.listFiles();
    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('test.prs');
  });

  it('reads a file from store', async () => {
    const content = await provider.readFile('test.prs');
    expect(content).toBe('hello');
  });

  it('throws when reading nonexistent file', async () => {
    await expect(provider.readFile('nope.prs')).rejects.toThrow('File not found');
  });

  it('writes to store', async () => {
    await provider.writeFile('test.prs', 'updated');
    expect(usePlaygroundStore.getState().files[0]?.content).toBe('updated');
  });

  it('creates a new file in store', async () => {
    await provider.createFile('new.prs', 'new content');
    expect(usePlaygroundStore.getState().files).toHaveLength(2);
  });

  it('deletes a file from store', async () => {
    await provider.deleteFile('test.prs');
    expect(usePlaygroundStore.getState().files).toHaveLength(0);
  });

  it('is not read-only', () => {
    expect(provider.isReadOnly).toBe(false);
  });
});
