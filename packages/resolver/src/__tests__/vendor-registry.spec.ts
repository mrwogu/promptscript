import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { FileNotFoundError } from '@promptscript/core';
import { VendorRegistry, createVendorRegistry } from '../vendor-registry.js';

describe('VendorRegistry', () => {
  let vendorDir: string;
  let registry: VendorRegistry;

  beforeEach(async () => {
    vendorDir = join(
      tmpdir(),
      `prs-vendor-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(vendorDir, { recursive: true });

    // Populate vendor directory with fixture files
    await fs.mkdir(join(vendorDir, '@company'), { recursive: true });
    await fs.writeFile(join(vendorDir, '@company', 'base.prs'), '@meta\nname = "base"');
    await fs.writeFile(join(vendorDir, '@company', 'security.prs'), '@meta\nname = "security"');

    registry = new VendorRegistry(vendorDir);
  });

  afterEach(async () => {
    await fs.rm(vendorDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('creates a VendorRegistry instance', () => {
      expect(registry).toBeInstanceOf(VendorRegistry);
    });
  });

  describe('fetch()', () => {
    it('returns file content for an existing vendored path', async () => {
      // Arrange / Act
      const content = await registry.fetch('@company/base.prs');

      // Assert
      expect(content).toContain('name = "base"');
    });

    it('throws FileNotFoundError for a missing path', async () => {
      // Arrange / Act / Assert
      await expect(registry.fetch('@company/nonexistent.prs')).rejects.toThrow(FileNotFoundError);
    });

    it('reads nested file correctly', async () => {
      // Arrange
      await fs.mkdir(join(vendorDir, '@company', 'nested'), { recursive: true });
      await fs.writeFile(join(vendorDir, '@company', 'nested', 'deep.prs'), '@meta\nname = "deep"');

      // Act
      const content = await registry.fetch('@company/nested/deep.prs');

      // Assert
      expect(content).toContain('name = "deep"');
    });
  });

  describe('exists()', () => {
    it('returns true for an existing file', async () => {
      // Arrange / Act
      const result = await registry.exists('@company/base.prs');

      // Assert
      expect(result).toBe(true);
    });

    it('returns false for a non-existent path', async () => {
      // Arrange / Act
      const result = await registry.exists('@company/nonexistent.prs');

      // Assert
      expect(result).toBe(false);
    });

    it('returns false for a path outside the vendor directory', async () => {
      // Arrange / Act
      const result = await registry.exists('@other/missing.prs');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('list()', () => {
    it('returns file names in a vendor subdirectory', async () => {
      // Arrange / Act
      const entries = await registry.list('@company');

      // Assert
      expect(entries).toContain('base.prs');
      expect(entries).toContain('security.prs');
    });

    it('returns empty array for a non-existent directory', async () => {
      // Arrange / Act
      const entries = await registry.list('@nonexistent');

      // Assert
      expect(entries).toEqual([]);
    });
  });

  describe('createVendorRegistry()', () => {
    it('creates a VendorRegistry instance', () => {
      // Arrange / Act
      const r = createVendorRegistry(vendorDir);

      // Assert
      expect(r).toBeInstanceOf(VendorRegistry);
    });
  });
});
