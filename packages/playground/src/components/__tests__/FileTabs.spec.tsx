import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePlaygroundStore } from '../../store';
import { FileTabs } from '../FileTabs';
import type { FileProvider } from '../../providers/file-provider';

describe('FileTabs', () => {
  beforeEach(() => {
    usePlaygroundStore.setState({
      files: [{ path: 'test.prs', content: '@identity Test' }],
      openTabs: ['test.prs'],
      activeFile: 'test.prs',
      showFileTree: false,
    });
  });

  it('syncs rename to server via provider createFile and deleteFile', async () => {
    const mockCreateFile = vi.fn().mockResolvedValue(undefined);
    const mockDeleteFile = vi.fn().mockResolvedValue(undefined);
    const mockProvider: FileProvider = {
      listFiles: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      createFile: mockCreateFile,
      deleteFile: mockDeleteFile,
      isReadOnly: false,
    };

    render(<FileTabs provider={mockProvider} />);

    // Double-click on the file tab to enter rename mode
    const fileTab = screen.getByText('test.prs');
    fireEvent.doubleClick(fileTab);

    // Find the input and change the name
    const input = screen.getByDisplayValue('test.prs');
    fireEvent.change(input, { target: { value: 'renamed.prs' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Wait for async provider calls to complete
    await vi.waitFor(() => {
      expect(mockCreateFile).toHaveBeenCalledWith('renamed.prs', '@identity Test');
    });

    expect(mockDeleteFile).toHaveBeenCalledWith('test.prs');

    // Verify store was also updated
    const state = usePlaygroundStore.getState();
    expect(state.files.some((f) => f.path === 'renamed.prs')).toBe(true);
    expect(state.files.some((f) => f.path === 'test.prs')).toBe(false);
  });

  it('only renames in store when no provider is connected', () => {
    render(<FileTabs />);

    const fileTab = screen.getByText('test.prs');
    fireEvent.doubleClick(fileTab);

    const input = screen.getByDisplayValue('test.prs');
    fireEvent.change(input, { target: { value: 'renamed.prs' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const state = usePlaygroundStore.getState();
    expect(state.files.some((f) => f.path === 'renamed.prs')).toBe(true);
    expect(state.files.some((f) => f.path === 'test.prs')).toBe(false);
  });
});
