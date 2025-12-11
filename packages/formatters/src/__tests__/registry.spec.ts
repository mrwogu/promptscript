import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FormatterRegistry } from '../registry';
import type { Formatter, FormatterOutput } from '../types';

// Import the main module to trigger auto-registration of built-in formatters
import '../index';

// Mock formatter for testing
class MockFormatter implements Formatter {
  readonly name = 'mock';
  readonly outputPath = 'mock.txt';
  readonly description = 'Mock formatter for testing';
  readonly defaultConvention = 'markdown';

  format(): FormatterOutput {
    return { path: this.outputPath, content: 'mock content' };
  }
}

describe('FormatterRegistry', () => {
  // Store original state
  let originalFormatters: string[];

  beforeEach(() => {
    originalFormatters = FormatterRegistry.list();
  });

  afterEach(() => {
    // Clean up any test formatters
    const currentFormatters = FormatterRegistry.list();
    for (const name of currentFormatters) {
      if (!originalFormatters.includes(name)) {
        FormatterRegistry.unregister(name);
      }
    }
  });

  describe('register', () => {
    it('should register a new formatter', () => {
      FormatterRegistry.register('test-formatter', () => new MockFormatter());
      expect(FormatterRegistry.has('test-formatter')).toBe(true);
    });

    it('should throw when registering duplicate name', () => {
      FormatterRegistry.register('duplicate-test', () => new MockFormatter());
      expect(() => {
        FormatterRegistry.register('duplicate-test', () => new MockFormatter());
      }).toThrow("Formatter 'duplicate-test' is already registered");
    });
  });

  describe('get', () => {
    it('should return formatter instance by name', () => {
      FormatterRegistry.register('get-test', () => new MockFormatter());
      const formatter = FormatterRegistry.get('get-test');
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('mock');
    });

    it('should return undefined for unknown formatter', () => {
      const formatter = FormatterRegistry.get('unknown-formatter');
      expect(formatter).toBeUndefined();
    });

    it('should create new instance on each call', () => {
      FormatterRegistry.register('instance-test', () => new MockFormatter());
      const instance1 = FormatterRegistry.get('instance-test');
      const instance2 = FormatterRegistry.get('instance-test');
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('getAll', () => {
    it('should return all registered formatters', () => {
      const formatters = FormatterRegistry.getAll();
      expect(formatters.length).toBeGreaterThan(0);
    });

    it('should return formatter instances', () => {
      const formatters = FormatterRegistry.getAll();
      for (const formatter of formatters) {
        expect(formatter.name).toBeDefined();
        expect(formatter.outputPath).toBeDefined();
        expect(typeof formatter.format).toBe('function');
      }
    });
  });

  describe('list', () => {
    it('should return list of formatter names', () => {
      const names = FormatterRegistry.list();
      expect(Array.isArray(names)).toBe(true);
      // Should include built-in formatters
      expect(names).toContain('github');
      expect(names).toContain('claude');
      expect(names).toContain('cursor');
    });
  });

  describe('has', () => {
    it('should return true for registered formatter', () => {
      expect(FormatterRegistry.has('github')).toBe(true);
    });

    it('should return false for unknown formatter', () => {
      expect(FormatterRegistry.has('unknown')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should unregister a formatter', () => {
      FormatterRegistry.register('unregister-test', () => new MockFormatter());
      expect(FormatterRegistry.has('unregister-test')).toBe(true);

      const result = FormatterRegistry.unregister('unregister-test');
      expect(result).toBe(true);
      expect(FormatterRegistry.has('unregister-test')).toBe(false);
    });

    it('should return false for unknown formatter', () => {
      const result = FormatterRegistry.unregister('unknown');
      expect(result).toBe(false);
    });
  });

  describe('built-in formatters', () => {
    it('should have github formatter registered', () => {
      const formatter = FormatterRegistry.get('github');
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('github');
      expect(formatter?.outputPath).toBe('.github/copilot-instructions.md');
    });

    it('should have claude formatter registered', () => {
      const formatter = FormatterRegistry.get('claude');
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('claude');
      expect(formatter?.outputPath).toBe('CLAUDE.md');
    });

    it('should have cursor formatter registered', () => {
      const formatter = FormatterRegistry.get('cursor');
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('cursor');
      expect(formatter?.outputPath).toBe('.cursor/rules/project.mdc');
    });
  });
});
