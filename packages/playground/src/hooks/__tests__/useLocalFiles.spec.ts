import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaygroundStore, type PlaygroundConfig } from '../../store';
import { useLocalFiles, applyProjectConfig } from '../useLocalFiles';

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
    renderHook(() => useLocalFiles('localhost:3000', mockOnFileEvent));

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

  it('handles file:changed event by updating store', async () => {
    usePlaygroundStore.setState({
      files: [{ path: 'test.prs', content: 'original' }],
      activeFile: 'test.prs',
    });

    let capturedHandler: ((event: { type: string; path: string }) => void) | null = null;
    const mockOnFileEventCapture = vi.fn((handler) => {
      capturedHandler = handler;
    });

    renderHook(() => useLocalFiles('localhost:3000', mockOnFileEventCapture));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await act(async () => {
      capturedHandler?.({ type: 'file:changed', path: 'test.prs' });
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = usePlaygroundStore.getState();
    expect(state.files.some((f) => f.path === 'test.prs')).toBe(true);
  });

  it('handles file:created event by adding to store', async () => {
    let capturedHandler: ((event: { type: string; path: string }) => void) | null = null;
    const mockOnFileEventCapture = vi.fn((handler) => {
      capturedHandler = handler;
    });

    renderHook(() => useLocalFiles('localhost:3000', mockOnFileEventCapture));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await act(async () => {
      capturedHandler?.({ type: 'file:created', path: 'new.prs' });
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = usePlaygroundStore.getState();
    expect(state.files.some((f) => f.path === 'new.prs')).toBe(true);
  });

  it('handles file:deleted event by removing from store', async () => {
    usePlaygroundStore.setState({
      files: [{ path: 'test.prs', content: 'content' }],
      activeFile: 'test.prs',
    });

    let capturedHandler: ((event: { type: string; path: string }) => void) | null = null;
    const mockOnFileEventCapture = vi.fn((handler) => {
      capturedHandler = handler;
    });

    renderHook(() => useLocalFiles('localhost:3000', mockOnFileEventCapture));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await act(async () => {
      capturedHandler?.({ type: 'file:deleted', path: 'test.prs' });
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = usePlaygroundStore.getState();
    expect(state.files.some((f) => f.path === 'test.prs')).toBe(false);
  });

  it('saveFile is a no-op when provider is null', async () => {
    const { result } = renderHook(() => useLocalFiles(null, mockOnFileEvent));

    await act(async () => {
      await result.current.saveFile('test.prs', 'content');
    });

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('saveFile writes to provider and suppresses echo', async () => {
    const { result } = renderHook(() => useLocalFiles('localhost:3000', mockOnFileEvent));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await act(async () => {
      await result.current.saveFile('test.prs', 'updated content');
    });

    expect(mockWriteFile).toHaveBeenCalledWith('test.prs', 'updated content');
  });
});

const DEFAULT_CONFIG: PlaygroundConfig = {
  targets: {
    github: { enabled: true, version: 'full' },
    claude: { enabled: true, version: 'full' },
    cursor: { enabled: true, version: 'standard' },
    antigravity: { enabled: true, version: 'frontmatter' },
    factory: { enabled: false, version: 'simple' },
    opencode: { enabled: false, version: 'full' },
    gemini: { enabled: false, version: 'full' },
    windsurf: { enabled: false },
    cline: { enabled: false },
    roo: { enabled: false },
    codex: { enabled: false },
    continue: { enabled: false },
    augment: { enabled: false },
    goose: { enabled: false },
    kilo: { enabled: false },
    amp: { enabled: false },
    trae: { enabled: false },
    junie: { enabled: false },
    kiro: { enabled: false },
    cortex: { enabled: false },
    crush: { enabled: false },
    'command-code': { enabled: false },
    kode: { enabled: false },
    mcpjam: { enabled: false },
    'mistral-vibe': { enabled: false },
    mux: { enabled: false },
    openhands: { enabled: false },
    pi: { enabled: false },
    qoder: { enabled: false },
    'qwen-code': { enabled: false },
    zencoder: { enabled: false },
    neovate: { enabled: false },
    pochi: { enabled: false },
    adal: { enabled: false },
    iflow: { enabled: false },
    openclaw: { enabled: false },
    codebuddy: { enabled: false },
  },
  formatting: {
    tabWidth: 2,
    proseWrap: 'preserve',
    printWidth: 80,
  },
  envVars: {},
};

describe('applyProjectConfig', () => {
  describe('targets', () => {
    it('enables only the listed string targets and disables all others', () => {
      // Arrange
      const projectConfig = { targets: ['claude', 'github'] };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.targets.claude.enabled).toBe(true);
      expect(result.targets.github.enabled).toBe(true);
      expect(result.targets.cursor.enabled).toBe(false);
      expect(result.targets.antigravity.enabled).toBe(false);
      expect(result.targets.factory.enabled).toBe(false);
    });

    it('applies version and convention from object targets', () => {
      // Arrange
      const projectConfig = {
        targets: [{ claude: { version: 'lite', convention: 'xml' } }],
      };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.targets.claude.enabled).toBe(true);
      expect(result.targets.claude.version).toBe('lite');
      expect(result.targets.claude.convention).toBe('xml');
    });

    it('handles mixed string and object targets', () => {
      // Arrange
      const projectConfig = {
        targets: ['cursor', { github: { version: 'multifile' } }],
      };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.targets.cursor.enabled).toBe(true);
      expect(result.targets.cursor.version).toBe('standard'); // preserved from current
      expect(result.targets.github.enabled).toBe(true);
      expect(result.targets.github.version).toBe('multifile');
      expect(result.targets.claude.enabled).toBe(false);
      expect(result.targets.antigravity.enabled).toBe(false);
    });

    it('does not change config when targets array is empty', () => {
      // Arrange
      const projectConfig = { targets: [] };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.targets).toEqual(DEFAULT_CONFIG.targets);
    });

    it('does not change targets when targets property is absent', () => {
      // Arrange
      const projectConfig = {};

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.targets).toEqual(DEFAULT_CONFIG.targets);
    });

    it('ignores object target entries for unknown formatter names', () => {
      // Arrange
      const projectConfig = {
        targets: [{ unknownTool: { version: 'v1' } }],
      };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert — all known targets should be disabled (targets list processed but unknown key skipped)
      expect(result.targets.claude.enabled).toBe(false);
      expect(result.targets.github.enabled).toBe(false);
    });

    it('does not apply version when settings.version is absent', () => {
      // Arrange
      const projectConfig = {
        targets: [{ claude: { convention: 'markdown' } }],
      };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.targets.claude.enabled).toBe(true);
      expect(result.targets.claude.version).toBe('full'); // preserved from current
      expect(result.targets.claude.convention).toBe('markdown');
    });

    it('does not apply convention when settings.convention is absent', () => {
      // Arrange
      const projectConfig = {
        targets: [{ github: { version: 'minimal' } }],
      };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.targets.github.enabled).toBe(true);
      expect(result.targets.github.version).toBe('minimal');
      expect(result.targets.github.convention).toBeUndefined();
    });
  });

  describe('formatting', () => {
    it('overrides all formatting fields when all are provided', () => {
      // Arrange
      const projectConfig = {
        formatting: { tabWidth: 4, proseWrap: 'always', printWidth: 120 },
      };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.formatting.tabWidth).toBe(4);
      expect(result.formatting.proseWrap).toBe('always');
      expect(result.formatting.printWidth).toBe(120);
    });

    it('only overrides tabWidth when only tabWidth is provided', () => {
      // Arrange
      const projectConfig = { formatting: { tabWidth: 4 } };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.formatting.tabWidth).toBe(4);
      expect(result.formatting.proseWrap).toBe('preserve'); // unchanged
      expect(result.formatting.printWidth).toBe(80); // unchanged
    });

    it('only overrides proseWrap when only proseWrap is provided', () => {
      // Arrange
      const projectConfig = { formatting: { proseWrap: 'never' } };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.formatting.tabWidth).toBe(2); // unchanged
      expect(result.formatting.proseWrap).toBe('never');
      expect(result.formatting.printWidth).toBe(80); // unchanged
    });

    it('only overrides printWidth when only printWidth is provided', () => {
      // Arrange
      const projectConfig = { formatting: { printWidth: 100 } };

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.formatting.tabWidth).toBe(2); // unchanged
      expect(result.formatting.proseWrap).toBe('preserve'); // unchanged
      expect(result.formatting.printWidth).toBe(100);
    });

    it('does not change formatting when formatting property is absent', () => {
      // Arrange
      const projectConfig = {};

      // Act
      const result = applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(result.formatting).toEqual(DEFAULT_CONFIG.formatting);
    });
  });

  describe('immutability', () => {
    it('does not mutate the input config', () => {
      // Arrange
      const projectConfig = {
        targets: ['cursor'],
        formatting: { tabWidth: 4 },
      };
      const originalTargets = { ...DEFAULT_CONFIG.targets };
      const originalFormatting = { ...DEFAULT_CONFIG.formatting };

      // Act
      applyProjectConfig(DEFAULT_CONFIG, projectConfig);

      // Assert
      expect(DEFAULT_CONFIG.targets).toEqual(originalTargets);
      expect(DEFAULT_CONFIG.formatting).toEqual(originalFormatting);
    });
  });
});
