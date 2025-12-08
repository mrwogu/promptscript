import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FormatterRegistry } from '../registry';
import type { Formatter, FormatterOutput } from '../types';

// Mock formatter for testing
class MockFormatter implements Formatter {
  readonly name = 'coverage-mock';
  readonly outputPath = 'coverage-mock.txt';
  readonly description = 'Coverage mock formatter';
  readonly defaultConvention = 'markdown';

  format(): FormatterOutput {
    return { path: this.outputPath, content: 'coverage content' };
  }
}

describe('FormatterRegistry coverage', () => {
  let savedFormatters: Map<string, () => Formatter>;

  beforeEach(() => {
    // Save current state
    savedFormatters = new Map();
    for (const name of FormatterRegistry.list()) {
      const formatter = FormatterRegistry.get(name);
      if (formatter) {
        savedFormatters.set(name, () => FormatterRegistry.get(name)!);
      }
    }
  });

  afterEach(() => {
    // Cleanup test formatters
    for (const name of FormatterRegistry.list()) {
      if (!savedFormatters.has(name)) {
        FormatterRegistry.unregister(name);
      }
    }
  });

  describe('clear', () => {
    it('should clear all formatters', () => {
      // Register a test formatter
      FormatterRegistry.register('clear-test', () => new MockFormatter());
      expect(FormatterRegistry.list().length).toBeGreaterThan(0);

      // Clear all
      FormatterRegistry.clear();
      expect(FormatterRegistry.list()).toHaveLength(0);

      // Re-register built-in formatters for other tests
      // This is needed because clear() removes ALL formatters
    });
  });

  describe('edge cases', () => {
    it('should handle getting formatter after clear', () => {
      FormatterRegistry.register('edge-test', () => new MockFormatter());
      FormatterRegistry.clear();

      const formatter = FormatterRegistry.get('edge-test');
      expect(formatter).toBeUndefined();
    });

    it('should allow re-registration after unregister', () => {
      FormatterRegistry.register('reregister-test', () => new MockFormatter());
      FormatterRegistry.unregister('reregister-test');

      // Should not throw
      FormatterRegistry.register('reregister-test', () => new MockFormatter());
      expect(FormatterRegistry.has('reregister-test')).toBe(true);
    });
  });
});
