import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import { loadUserConfig } from '../config/user-config.js';

// Mock fs modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('os', () => ({
  homedir: () => '/mock/home',
}));

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFile = vi.mocked(readFile);

describe('config/user-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default config when file does not exist', async () => {
    mockExistsSync.mockReturnValue(false);

    const config = await loadUserConfig();

    expect(config).toEqual({ version: '1' });
  });

  it('should load config from custom path', async () => {
    const customPath = '/custom/config.yaml';
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      `
version: '1'
registry:
  git:
    url: https://github.com/my-org/registry.git
    ref: main
defaults:
  team: frontend
  targets:
    - github
    - claude
` as unknown as string
    );

    const config = await loadUserConfig(customPath);

    expect(mockExistsSync).toHaveBeenCalledWith(customPath);
    expect(config.version).toBe('1');
    expect(config.registry?.git?.url).toBe('https://github.com/my-org/registry.git');
    expect(config.registry?.git?.ref).toBe('main');
    expect(config.defaults?.team).toBe('frontend');
    expect(config.defaults?.targets).toEqual(['github', 'claude']);
  });

  it('should return default config when file is invalid YAML', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockRejectedValue(new Error('read error'));

    const config = await loadUserConfig();

    expect(config).toEqual({ version: '1' });
  });

  it('should return default config when parsed value is null', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('' as unknown as string);

    const config = await loadUserConfig();

    expect(config).toEqual({ version: '1' });
  });

  it('should merge partial config with defaults', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      `
version: '1'
defaults:
  team: backend
` as unknown as string
    );

    const config = await loadUserConfig();

    expect(config.version).toBe('1');
    expect(config.defaults?.team).toBe('backend');
    expect(config.registry).toBeUndefined();
  });

  it('should use default path from homedir', async () => {
    mockExistsSync.mockReturnValue(false);

    await loadUserConfig();

    expect(mockExistsSync).toHaveBeenCalledWith(join('/mock/home', '.promptscript', 'config.yaml'));
  });
});
