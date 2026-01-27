import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import {
  format,
  getFormatter,
  registerFormatter,
  hasFormatter,
  listFormatters,
  unregisterFormatter,
  FormatterRegistry,
} from '../index.js';

/**
 * Create a minimal valid AST for testing.
 */
function createTestProgram(overrides: Partial<Program> = {}): Program {
  const defaultLoc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
  return {
    type: 'Program',
    loc: defaultLoc,
    meta: {
      type: 'MetaBlock',
      loc: defaultLoc,
      fields: {
        id: 'test-project',
        version: '1.0.0',
      },
    },
    uses: [],
    blocks: [
      {
        type: 'Block',
        loc: defaultLoc,
        name: 'identity',
        content: {
          type: 'TextContent',
          loc: defaultLoc,
          value: 'Test project content',
        },
      },
    ],
    extends: [],
    ...overrides,
  };
}

describe('format (standalone)', () => {
  it('should use default formatter (github) when not specified', () => {
    const ast = createTestProgram();

    const output = format(ast);

    expect(output.path).toBe('.github/copilot-instructions.md');
    expect(output.content).toContain('Test project content');
  });

  it('should accept formatter by name', () => {
    const ast = createTestProgram();

    const output = format(ast, { formatter: 'claude' });

    expect(output.path).toBe('CLAUDE.md');
    expect(output.content).toContain('CLAUDE.md');
  });

  it('should accept formatter instance', () => {
    const ast = createTestProgram();
    const mockFormatter = {
      name: 'mock',
      outputPath: './mock/output.md',
      description: 'Mock formatter',
      defaultConvention: 'markdown',
      format: vi.fn(() => ({
        path: './mock/output.md',
        content: 'mock content',
      })),
    };

    const output = format(ast, { formatter: mockFormatter });

    expect(output.path).toBe('./mock/output.md');
    expect(output.content).toBe('mock content');
    expect(mockFormatter.format).toHaveBeenCalledWith(ast, {});
  });

  it('should accept formatter factory function', () => {
    const ast = createTestProgram();
    const mockFormatter = {
      name: 'factory-mock',
      outputPath: './factory/output.md',
      description: 'Factory mock formatter',
      defaultConvention: 'markdown',
      format: vi.fn(() => ({
        path: './factory/output.md',
        content: 'factory content',
      })),
    };
    const factory = () => mockFormatter;

    const output = format(ast, { formatter: factory });

    expect(output.path).toBe('./factory/output.md');
    expect(output.content).toBe('factory content');
  });

  it('should pass format options to formatter', () => {
    const ast = createTestProgram();
    const mockFormatter = {
      name: 'options-mock',
      outputPath: './options/output.md',
      description: 'Options mock formatter',
      defaultConvention: 'markdown',
      format: vi.fn(() => ({
        path: './custom/path.md',
        content: 'content',
      })),
    };

    format(ast, {
      formatter: mockFormatter,
      outputPath: './custom/path.md',
      version: 'legacy',
    });

    expect(mockFormatter.format).toHaveBeenCalledWith(ast, {
      outputPath: './custom/path.md',
      version: 'legacy',
    });
  });

  it('should throw for unknown formatter name', () => {
    const ast = createTestProgram();

    expect(() => format(ast, { formatter: 'unknown-formatter' })).toThrow(
      "Formatter 'unknown-formatter' not found"
    );
  });

  it('should list available formatters in error message', () => {
    const ast = createTestProgram();

    expect(() => format(ast, { formatter: 'unknown' })).toThrow('github');
    expect(() => format(ast, { formatter: 'unknown' })).toThrow('claude');
  });
});

describe('getFormatter', () => {
  it('should return formatter by name', () => {
    const formatter = getFormatter('github');

    expect(formatter.name).toBe('github');
    expect(formatter.outputPath).toBe('.github/copilot-instructions.md');
  });

  it('should throw for unknown formatter', () => {
    expect(() => getFormatter('nonexistent')).toThrow("Formatter 'nonexistent' not found");
  });

  it('should list available formatters in error', () => {
    expect(() => getFormatter('bad')).toThrow('github');
  });
});

describe('registerFormatter', () => {
  const testFormatterName = 'test-register-formatter';

  beforeEach(() => {
    // Clean up any previously registered test formatter
    FormatterRegistry.unregister(testFormatterName);
  });

  it('should register a new formatter', () => {
    const mockFormatter = {
      name: testFormatterName,
      outputPath: './test/output.md',
      description: 'Test formatter',
      defaultConvention: 'markdown',
      format: () => ({ path: './test/output.md', content: 'test' }),
    };

    registerFormatter(testFormatterName, () => mockFormatter);

    expect(hasFormatter(testFormatterName)).toBe(true);
    expect(getFormatter(testFormatterName).name).toBe(testFormatterName);

    // Clean up
    unregisterFormatter(testFormatterName);
  });

  it('should throw when registering duplicate name', () => {
    const factory = () => ({
      name: 'duplicate-test',
      outputPath: './dup/output.md',
      description: 'Dup formatter',
      defaultConvention: 'markdown',
      format: () => ({ path: './dup/output.md', content: '' }),
    });

    FormatterRegistry.unregister('duplicate-test');
    registerFormatter('duplicate-test', factory);

    expect(() => registerFormatter('duplicate-test', factory)).toThrow(
      "Formatter 'duplicate-test' is already registered"
    );

    // Clean up
    unregisterFormatter('duplicate-test');
  });
});

describe('hasFormatter', () => {
  it('should return true for registered formatters', () => {
    expect(hasFormatter('github')).toBe(true);
    expect(hasFormatter('claude')).toBe(true);
    expect(hasFormatter('cursor')).toBe(true);
  });

  it('should return false for unregistered formatters', () => {
    expect(hasFormatter('nonexistent')).toBe(false);
    expect(hasFormatter('')).toBe(false);
  });
});

describe('listFormatters', () => {
  it('should return array of formatter names', () => {
    const names = listFormatters();

    expect(names).toContain('github');
    expect(names).toContain('claude');
    expect(names).toContain('cursor');
    expect(names).toContain('antigravity');
  });

  it('should return strings', () => {
    const names = listFormatters();

    names.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });
});

describe('unregisterFormatter', () => {
  it('should remove a registered formatter', () => {
    const name = 'temp-formatter';
    const factory = () => ({
      name,
      outputPath: './temp/output.md',
      description: 'Temp formatter',
      defaultConvention: 'markdown',
      format: () => ({ path: './temp/output.md', content: '' }),
    });

    registerFormatter(name, factory);
    expect(hasFormatter(name)).toBe(true);

    const result = unregisterFormatter(name);

    expect(result).toBe(true);
    expect(hasFormatter(name)).toBe(false);
  });

  it('should return false for non-existent formatter', () => {
    const result = unregisterFormatter('does-not-exist');

    expect(result).toBe(false);
  });
});
