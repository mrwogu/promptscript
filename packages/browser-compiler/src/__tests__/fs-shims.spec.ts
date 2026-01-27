import { describe, it, expect } from 'vitest';
import { readFileSync, readFile, writeFile, existsSync } from '../shims/fs.js';
import fsDefault from '../shims/fs.js';

describe('fs shims', () => {
  describe('readFileSync', () => {
    it('should throw error indicating not available in browser', () => {
      expect(() => readFileSync()).toThrow(
        'fs.readFileSync is not available in browser environment'
      );
    });
  });

  describe('readFile', () => {
    it('should throw error indicating not available in browser', () => {
      expect(() => readFile()).toThrow('fs.readFile is not available in browser environment');
    });
  });

  describe('writeFile', () => {
    it('should throw error indicating not available in browser', () => {
      expect(() => writeFile()).toThrow('fs.writeFile is not available in browser environment');
    });
  });

  describe('existsSync', () => {
    it('should always return false', () => {
      expect(existsSync()).toBe(false);
    });
  });

  describe('default export', () => {
    it('should export all functions', () => {
      expect(fsDefault.readFileSync).toBe(readFileSync);
      expect(fsDefault.readFile).toBe(readFile);
      expect(fsDefault.writeFile).toBe(writeFile);
      expect(fsDefault.existsSync).toBe(existsSync);
    });

    it('should throw from default export functions', () => {
      expect(() => fsDefault.readFileSync()).toThrow('not available in browser');
      expect(() => fsDefault.readFile()).toThrow('not available in browser');
      expect(() => fsDefault.writeFile()).toThrow('not available in browser');
    });

    it('should return false from default export existsSync', () => {
      expect(fsDefault.existsSync()).toBe(false);
    });
  });
});
