/**
 * Vendor registry implementation.
 *
 * Reads PromptScript files from a local `.promptscript/vendor/` directory.
 * Intended for offline and CI builds where network access is unavailable.
 * Should be placed first in a CompositeRegistry so it takes priority over
 * network-based registries.
 *
 * @packageDocumentation
 */

import { readFile, stat, readdir } from 'fs/promises';
import { join } from 'path';
import { FileNotFoundError } from '@promptscript/core';
import type { Registry } from './registry.js';

/**
 * Registry that reads from a local vendor directory (e.g. .promptscript/vendor/).
 * Used for offline/CI builds where network access is restricted.
 * Takes priority over network registries when placed first in a CompositeRegistry.
 */
export class VendorRegistry implements Registry {
  constructor(private readonly vendorDir: string) {}

  /**
   * Fetch the content of a vendored file.
   *
   * @param path - Path relative to the vendor directory
   * @returns File content as string
   * @throws FileNotFoundError if the file is not in the vendor directory
   */
  async fetch(path: string): Promise<string> {
    const fullPath = join(this.vendorDir, path);
    try {
      return await readFile(fullPath, 'utf-8');
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(fullPath);
      }
      throw err;
    }
  }

  /**
   * Check if a file exists in the vendor directory.
   *
   * @param path - Path relative to the vendor directory
   * @returns True if the file exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      await stat(join(this.vendorDir, path));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List entries in a vendor subdirectory.
   *
   * @param path - Directory path relative to the vendor directory
   * @returns Array of entry names, or empty array if directory does not exist
   */
  async list(path: string): Promise<string[]> {
    try {
      return await readdir(join(this.vendorDir, path));
    } catch {
      return [];
    }
  }
}

/**
 * Create a VendorRegistry backed by the given directory.
 *
 * @param vendorDir - Absolute path to the vendor directory
 * @returns VendorRegistry instance
 *
 * @example
 * ```typescript
 * import { createVendorRegistry } from '@promptscript/resolver';
 *
 * const vendor = createVendorRegistry('/project/.promptscript/vendor');
 * const content = await vendor.fetch('@company/base.prs');
 * ```
 */
export function createVendorRegistry(vendorDir: string): VendorRegistry {
  return new VendorRegistry(vendorDir);
}
