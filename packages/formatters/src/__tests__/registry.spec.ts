import type { Program } from '@promptscript/core';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FormatterRegistry } from '../registry.js';
import { BaseFormatter } from '../base-formatter.js';
import type { Formatter, FormatterOutput, FormatterVersionMap, FormatOptions } from '../types.js';

// Import the main module to trigger auto-registration of built-in formatters
import '../index.js';

// ============================================================
// Test Helpers
// ============================================================

const MOCK_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single file',
    outputPath: 'mock.txt',
  },
} as const;

// Mock formatter for testing (legacy factory pattern)
class MockFormatter implements Formatter {
  readonly name = 'mock';
  readonly outputPath = 'mock.txt';
  readonly description = 'Mock formatter for testing';
  readonly defaultConvention = 'markdown';

  format(): FormatterOutput {
    return { path: this.outputPath, content: 'mock content' };
  }

  getSkillBasePath(): string | null {
    return null;
  }

  getSkillFileName(): string | null {
    return null;
  }

  referencesMode(): 'directory' | 'inline' | 'none' {
    return 'none';
  }
}

// Valid formatter class with static getSupportedVersions()
class ValidClassFormatter extends BaseFormatter {
  readonly name = 'valid-class';
  readonly outputPath = 'VALID.md';
  readonly description = 'A valid class-based formatter';
  readonly defaultConvention = 'markdown';

  format(_ast: Program, _options?: FormatOptions): FormatterOutput {
    return { path: this.outputPath, content: '' };
  }

  static getSupportedVersions(): typeof MOCK_VERSIONS {
    return MOCK_VERSIONS;
  }
}

const MULTI_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Simple mode',
    outputPath: 'MULTI.md',
  },
  full: {
    name: 'full',
    description: 'Full mode with extras',
    outputPath: 'MULTI.md',
  },
} as const;

class MultiVersionFormatter extends BaseFormatter {
  readonly name = 'multi-version';
  readonly outputPath = 'MULTI.md';
  readonly description = 'Multi-version formatter';
  readonly defaultConvention = 'markdown';

  format(_ast: Program, _options?: FormatOptions): FormatterOutput {
    return { path: this.outputPath, content: '' };
  }

  static getSupportedVersions(): typeof MULTI_VERSIONS {
    return MULTI_VERSIONS;
  }
}

// ============================================================
// Tests
// ============================================================

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

  describe('register (class-based)', () => {
    it('should register a valid formatter class', () => {
      // Arrange & Act
      FormatterRegistry.register('class-test', ValidClassFormatter);

      // Assert
      expect(FormatterRegistry.has('class-test')).toBe(true);
    });

    it('should create instances from registered formatter class', () => {
      // Arrange
      FormatterRegistry.register('class-instance', ValidClassFormatter);

      // Act
      const formatter = FormatterRegistry.get('class-instance');

      // Assert
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('valid-class');
      expect(formatter?.outputPath).toBe('VALID.md');
    });

    it('should register a formatter with multiple versions', () => {
      // Arrange & Act
      FormatterRegistry.register('multi-ver', MultiVersionFormatter);

      // Assert
      const formatter = FormatterRegistry.get('multi-ver');
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('multi-version');
    });

    it('should throw when registering duplicate name', () => {
      // Arrange
      FormatterRegistry.register('dup-class', ValidClassFormatter);

      // Act & Assert
      expect(() => FormatterRegistry.register('dup-class', ValidClassFormatter)).toThrow(
        "Formatter 'dup-class' is already registered"
      );
    });
  });

  describe('register (enforcement)', () => {
    it('should reject a class missing getSupportedVersions', () => {
      // Arrange
      class MissingVersions extends BaseFormatter {
        readonly name = 'missing';
        readonly outputPath = 'MISSING.md';
        readonly description = 'Missing versions';
        readonly defaultConvention = 'markdown';

        format(_ast: Program, _options?: FormatOptions): FormatterOutput {
          return { path: this.outputPath, content: '' };
        }
      }

      // Force TypeScript to accept this to test runtime validation
      const BadClass = MissingVersions as unknown as {
        new (): InstanceType<typeof MissingVersions>;
        getSupportedVersions(): FormatterVersionMap;
      };

      // Act & Assert
      expect(() => FormatterRegistry.register('missing', BadClass)).toThrow(
        /must implement a static getSupportedVersions\(\) method/
      );
    });

    it('should reject a class where getSupportedVersions returns null', () => {
      // Arrange
      class NullVersions extends BaseFormatter {
        readonly name = 'null-versions';
        readonly outputPath = 'NULL.md';
        readonly description = 'Null versions';
        readonly defaultConvention = 'markdown';

        format(_ast: Program, _options?: FormatOptions): FormatterOutput {
          return { path: this.outputPath, content: '' };
        }

        static getSupportedVersions(): FormatterVersionMap {
          return null as unknown as FormatterVersionMap;
        }
      }

      // Act & Assert
      expect(() => FormatterRegistry.register('null-versions', NullVersions)).toThrow(
        /must return a non-null version map/
      );
    });

    it('should reject a class where getSupportedVersions returns a non-object', () => {
      // Arrange
      class StringVersions extends BaseFormatter {
        readonly name = 'string-versions';
        readonly outputPath = 'STRING.md';
        readonly description = 'String versions';
        readonly defaultConvention = 'markdown';

        format(_ast: Program, _options?: FormatOptions): FormatterOutput {
          return { path: this.outputPath, content: '' };
        }

        static getSupportedVersions(): FormatterVersionMap {
          return 'not-an-object' as unknown as FormatterVersionMap;
        }
      }

      // Act & Assert
      expect(() => FormatterRegistry.register('string-versions', StringVersions)).toThrow(
        /must return a non-null version map/
      );
    });

    it('should reject a class where getSupportedVersions returns empty object', () => {
      // Arrange
      class EmptyVersions extends BaseFormatter {
        readonly name = 'empty';
        readonly outputPath = 'EMPTY.md';
        readonly description = 'Empty versions';
        readonly defaultConvention = 'markdown';

        format(_ast: Program, _options?: FormatOptions): FormatterOutput {
          return { path: this.outputPath, content: '' };
        }

        static getSupportedVersions(): FormatterVersionMap {
          return {};
        }
      }

      // Act & Assert
      expect(() => FormatterRegistry.register('empty', EmptyVersions)).toThrow(
        /returned an empty version map/
      );
    });

    it('should reject a version entry missing name field', () => {
      // Arrange
      class BadName extends BaseFormatter {
        readonly name = 'bad-name';
        readonly outputPath = 'BAD.md';
        readonly description = 'Bad name';
        readonly defaultConvention = 'markdown';

        format(_ast: Program, _options?: FormatOptions): FormatterOutput {
          return { path: this.outputPath, content: '' };
        }

        static getSupportedVersions(): FormatterVersionMap {
          return {
            simple: { description: 'Missing name', outputPath: 'BAD.md' },
          } as unknown as FormatterVersionMap;
        }
      }

      // Act & Assert
      expect(() => FormatterRegistry.register('bad-name', BadName)).toThrow(
        /version 'simple' is missing required 'name' field/
      );
    });

    it('should reject a version entry missing description field', () => {
      // Arrange
      class BadDesc extends BaseFormatter {
        readonly name = 'bad-desc';
        readonly outputPath = 'BAD.md';
        readonly description = 'Bad desc';
        readonly defaultConvention = 'markdown';

        format(_ast: Program, _options?: FormatOptions): FormatterOutput {
          return { path: this.outputPath, content: '' };
        }

        static getSupportedVersions(): FormatterVersionMap {
          return {
            simple: { name: 'simple', outputPath: 'BAD.md' },
          } as unknown as FormatterVersionMap;
        }
      }

      // Act & Assert
      expect(() => FormatterRegistry.register('bad-desc', BadDesc)).toThrow(
        /version 'simple' is missing required 'description' field/
      );
    });

    it('should reject a version entry missing outputPath field', () => {
      // Arrange
      class BadPath extends BaseFormatter {
        readonly name = 'bad-path';
        readonly outputPath = 'BAD.md';
        readonly description = 'Bad path';
        readonly defaultConvention = 'markdown';

        format(_ast: Program, _options?: FormatOptions): FormatterOutput {
          return { path: this.outputPath, content: '' };
        }

        static getSupportedVersions(): FormatterVersionMap {
          return {
            simple: { name: 'simple', description: 'Missing path' },
          } as unknown as FormatterVersionMap;
        }
      }

      // Act & Assert
      expect(() => FormatterRegistry.register('bad-path', BadPath)).toThrow(
        /version 'simple' is missing required 'outputPath' field/
      );
    });

    it('should validate all version entries, not just the first', () => {
      // Arrange
      class BadSecondVersion extends BaseFormatter {
        readonly name = 'bad-second';
        readonly outputPath = 'BAD.md';
        readonly description = 'Bad second version';
        readonly defaultConvention = 'markdown';

        format(_ast: Program, _options?: FormatOptions): FormatterOutput {
          return { path: this.outputPath, content: '' };
        }

        static getSupportedVersions(): FormatterVersionMap {
          return {
            simple: { name: 'simple', description: 'OK', outputPath: 'BAD.md' },
            full: { name: 'full', outputPath: 'BAD.md' },
          } as unknown as FormatterVersionMap;
        }
      }

      // Act & Assert
      expect(() => FormatterRegistry.register('bad-second', BadSecondVersion)).toThrow(
        /version 'full' is missing required 'description' field/
      );
    });

    it('should include formatter name in error messages', () => {
      // Arrange
      class MyBadFormatter extends BaseFormatter {
        readonly name = 'my-bad';
        readonly outputPath = 'BAD.md';
        readonly description = 'Bad';
        readonly defaultConvention = 'markdown';

        format(_ast: Program, _options?: FormatOptions): FormatterOutput {
          return { path: this.outputPath, content: '' };
        }

        static getSupportedVersions(): FormatterVersionMap {
          return {};
        }
      }

      // Act & Assert
      expect(() => FormatterRegistry.register('my-bad', MyBadFormatter)).toThrow(
        /Formatter 'my-bad'/
      );
    });
  });

  describe('register (factory-based, legacy)', () => {
    it('should register a new formatter via factory function', () => {
      // Arrange & Act
      FormatterRegistry.register('test-formatter', () => new MockFormatter());

      // Assert
      expect(FormatterRegistry.has('test-formatter')).toBe(true);
    });

    it('should throw when registering duplicate name via factory', () => {
      // Arrange
      FormatterRegistry.register('duplicate-test', () => new MockFormatter());

      // Act & Assert
      expect(() => {
        FormatterRegistry.register('duplicate-test', () => new MockFormatter());
      }).toThrow("Formatter 'duplicate-test' is already registered");
    });
  });

  describe('get', () => {
    it('should return formatter instance by name', () => {
      // Arrange
      FormatterRegistry.register('get-test', () => new MockFormatter());

      // Act
      const formatter = FormatterRegistry.get('get-test');

      // Assert
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('mock');
    });

    it('should return undefined for unknown formatter', () => {
      // Act & Assert
      expect(FormatterRegistry.get('unknown-formatter')).toBeUndefined();
    });

    it('should create new instance on each call', () => {
      // Arrange
      FormatterRegistry.register('instance-test', ValidClassFormatter);

      // Act
      const instance1 = FormatterRegistry.get('instance-test');
      const instance2 = FormatterRegistry.get('instance-test');

      // Assert
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('getAll', () => {
    it('should return all registered formatters', () => {
      // Act
      const formatters = FormatterRegistry.getAll();

      // Assert
      expect(formatters.length).toBeGreaterThan(0);
    });

    it('should return formatter instances', () => {
      // Act
      const formatters = FormatterRegistry.getAll();

      // Assert
      for (const formatter of formatters) {
        expect(formatter.name).toBeDefined();
        expect(formatter.outputPath).toBeDefined();
        expect(typeof formatter.format).toBe('function');
      }
    });
  });

  describe('list', () => {
    it('should return list of formatter names', () => {
      // Act
      const names = FormatterRegistry.list();

      // Assert
      expect(Array.isArray(names)).toBe(true);
      // Should include built-in formatters
      expect(names).toContain('github');
      expect(names).toContain('claude');
      expect(names).toContain('cursor');
    });
  });

  describe('has', () => {
    it('should return true for registered formatter', () => {
      // Act & Assert
      expect(FormatterRegistry.has('github')).toBe(true);
    });

    it('should return false for unknown formatter', () => {
      // Act & Assert
      expect(FormatterRegistry.has('unknown')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should unregister a formatter', () => {
      // Arrange
      FormatterRegistry.register('unregister-test', ValidClassFormatter);
      expect(FormatterRegistry.has('unregister-test')).toBe(true);

      // Act
      const result = FormatterRegistry.unregister('unregister-test');

      // Assert
      expect(result).toBe(true);
      expect(FormatterRegistry.has('unregister-test')).toBe(false);
    });

    it('should return false for unknown formatter', () => {
      // Act & Assert
      expect(FormatterRegistry.unregister('unknown')).toBe(false);
    });
  });

  describe('built-in formatters', () => {
    it('should have github formatter registered', () => {
      // Act
      const formatter = FormatterRegistry.get('github');

      // Assert
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('github');
      expect(formatter?.outputPath).toBe('.github/copilot-instructions.md');
    });

    it('should have claude formatter registered', () => {
      // Act
      const formatter = FormatterRegistry.get('claude');

      // Assert
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('claude');
      expect(formatter?.outputPath).toBe('CLAUDE.md');
    });

    it('should have cursor formatter registered', () => {
      // Act
      const formatter = FormatterRegistry.get('cursor');

      // Assert
      expect(formatter).toBeDefined();
      expect(formatter?.name).toBe('cursor');
      expect(formatter?.outputPath).toBe('.cursor/rules/project.mdc');
    });

    it('should have all built-in formatters registered with valid getSupportedVersions', () => {
      // This test verifies that all built-in formatters passed the registration
      // validation, meaning they all have valid getSupportedVersions() methods.
      const expectedFormatters = [
        'github',
        'claude',
        'cursor',
        'antigravity',
        'factory',
        'opencode',
        'gemini',
        'windsurf',
        'cline',
        'roo',
        'codex',
        'continue',
        'augment',
        'goose',
        'kilo',
        'amp',
        'trae',
        'junie',
        'kiro',
        'cortex',
        'crush',
        'command-code',
        'kode',
        'mcpjam',
        'mistral-vibe',
        'mux',
        'openhands',
        'pi',
        'qoder',
        'qwen-code',
        'zencoder',
        'neovate',
        'pochi',
        'adal',
        'iflow',
        'openclaw',
        'codebuddy',
      ];

      // Assert
      for (const name of expectedFormatters) {
        expect(FormatterRegistry.has(name)).toBe(true);
      }
    });
  });
});
