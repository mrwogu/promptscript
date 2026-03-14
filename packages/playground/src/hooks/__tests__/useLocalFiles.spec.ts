import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaygroundStore } from '../../store';
import { useLocalFiles } from '../useLocalFiles';

const mockListFiles = vi
  .fn()
  .mockResolvedValue([{ path: 'test.prs', size: 10, modified: '2026-01-01' }]);
const mockReadFile = vi.fn().mockResolvedValue('@identity Test');
const mockWriteFile = vi.fn().mockResolvedValue(undefined);

vi.mock('../../providers/local-file-provider', () => {
  class LocalFileProvider {
    listFiles = mockListFiles;
    readFile = mockReadFile;
    writeFile = mockWriteFile;
  }
  return { LocalFileProvider };
});

describe('useLocalFiles', () => {
  const mockOnFileEvent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePlaygroundStore.setState({
      files: [],
      activeFile: '',
    });
  });

  it('loads files from server when connected', async () => {
    const { result } = renderHook(() => useLocalFiles('localhost:3000', mockOnFileEvent));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = usePlaygroundStore.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0]?.path).toBe('test.prs');
  });

  it('does not load files when serverHost is null', () => {
    renderHook(() => useLocalFiles(null, mockOnFileEvent));

    const state = usePlaygroundStore.getState();
    expect(state.files).toHaveLength(0);
  });

  it('provides a saveFile function', async () => {
    const { result } = renderHook(() => useLocalFiles('localhost:3000', mockOnFileEvent));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.saveFile).toBeInstanceOf(Function);
  });
});
