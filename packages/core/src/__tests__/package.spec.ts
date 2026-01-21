import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { getPackageInfo, getPackageVersion } from '../utils/package.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

describe('utils/package', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPackageInfo', () => {
    it('should return package info from package.json', () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          name: '@promptscript/core',
          version: '1.2.3',
          description: 'Core library',
        })
      );

      const info = getPackageInfo('/some/path');

      expect(info.name).toBe('@promptscript/core');
      expect(info.version).toBe('1.2.3');
      expect(info.description).toBe('Core library');
    });

    it('should use custom relative path', () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          name: 'test',
          version: '0.1.0',
        })
      );

      getPackageInfo('/base', '../../package.json');

      expect(readFileSync).toHaveBeenCalledWith(expect.stringContaining('package.json'), 'utf-8');
    });

    it('should return defaults when file not found', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const info = getPackageInfo('/invalid/path');

      expect(info.name).toBe('unknown');
      expect(info.version).toBe('0.0.0');
      expect(info.description).toBeUndefined();
    });

    it('should return defaults when JSON is invalid', () => {
      vi.mocked(readFileSync).mockReturnValue('not valid json');

      const info = getPackageInfo('/some/path');

      expect(info.name).toBe('unknown');
      expect(info.version).toBe('0.0.0');
    });

    it('should handle missing fields gracefully', () => {
      vi.mocked(readFileSync).mockReturnValue('{}');

      const info = getPackageInfo('/some/path');

      expect(info.name).toBe('unknown');
      expect(info.version).toBe('0.0.0');
    });
  });

  describe('getPackageVersion', () => {
    it('should return version from package.json', () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          name: 'test',
          version: '2.0.0',
        })
      );

      const version = getPackageVersion('/some/path');

      expect(version).toBe('2.0.0');
    });

    it('should return 0.0.0 when file not found', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const version = getPackageVersion('/invalid/path');

      expect(version).toBe('0.0.0');
    });
  });
});
