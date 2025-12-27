import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import type { Formatter, CompilerOptions } from '../types';

// Create mock classes before importing Compiler
const mockResolve = vi.fn();
const mockValidate = vi.fn();

vi.mock('@promptscript/resolver', () => ({
  Resolver: class MockResolver {
    resolve = mockResolve;
  },
}));

vi.mock('@promptscript/validator', () => ({
  Validator: class MockValidator {
    validate = mockValidate;
  },
}));

// Import after mocks are set up
import { Compiler, createCompiler, compile } from '../compiler';

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
    blocks: [],
    extends: [],
    ...overrides,
  };
}

/**
 * Create a mock formatter for testing.
 */
function createMockFormatter(name: string, outputPath: string = `./${name}/output.md`): Formatter {
  return {
    name,
    outputPath,
    defaultConvention: 'markdown',
    format: vi.fn((ast: Program) => ({
      path: outputPath,
      content: `# ${name} output\nID: ${ast.meta?.fields?.['id']}`,
    })),
  };
}

/**
 * Create a mock formatter that throws an error.
 */
function createFailingFormatter(name: string, error: string): Formatter {
  return {
    name,
    outputPath: `./${name}/output.md`,
    defaultConvention: 'markdown',
    format: vi.fn(() => {
      throw new Error(error);
    }),
  };
}

/**
 * Helper to create a successful resolve result.
 */
function createResolveSuccess(ast: Program) {
  return {
    ast,
    sources: ['test.prs'],
    errors: [],
  };
}

/**
 * Helper to create a successful validation result.
 */
function createValidationSuccess() {
  return {
    valid: true,
    errors: [],
    warnings: [],
    infos: [],
    all: [],
  };
}

describe('Compiler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create compiler with options', () => {
      const options: CompilerOptions = {
        resolver: { registryPath: '/registry' },
        formatters: [],
      };

      const compiler = new Compiler(options);
      expect(compiler).toBeInstanceOf(Compiler);
    });

    it('should create compiler with createCompiler factory', () => {
      const options: CompilerOptions = {
        resolver: { registryPath: '/registry' },
        formatters: [],
      };

      const compiler = createCompiler(options);
      expect(compiler).toBeInstanceOf(Compiler);
    });

    it('should load formatter instances', () => {
      const formatter = createMockFormatter('test');
      const options: CompilerOptions = {
        resolver: { registryPath: '/registry' },
        formatters: [formatter],
      };

      const compiler = new Compiler(options);
      const formatters = compiler.getFormatters();

      expect(formatters).toHaveLength(1);
      expect(formatters[0]).toBe(formatter);
    });

    it('should instantiate formatter classes passed as constructors', () => {
      class TestFormatter implements Formatter {
        readonly name = 'test-class';
        readonly outputPath = './test/output.md';
        readonly defaultConvention = 'markdown';
        format(ast: Program) {
          return { path: this.outputPath, content: `ID: ${ast.meta?.fields?.['id']}` };
        }
      }

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [TestFormatter as any],
      });

      const formatters = compiler.getFormatters();
      expect(formatters).toHaveLength(1);
      expect(formatters[0]?.name).toBe('test-class');
    });

    it('should throw error for unknown formatter string', () => {
      const options: CompilerOptions = {
        resolver: { registryPath: '/registry' },
        formatters: ['unknown'],
      };

      expect(() => new Compiler(options)).toThrow("Unknown formatter: 'unknown'");
    });

    it('should list available formatters in error message when unknown formatter requested', () => {
      const options: CompilerOptions = {
        resolver: { registryPath: '/registry' },
        formatters: ['nonexistent-formatter'],
      };

      expect(() => new Compiler(options)).toThrow(/Available formatters:/);
    });
  });

  describe('compile - successful compilation', () => {
    it('should compile successfully with valid input', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('github');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.outputs.size).toBe(1);
      expect(result.outputs.has('./github/output.md')).toBe(true);

      const output = result.outputs.get('./github/output.md');
      expect(output).toBeDefined();
      expect(output?.content).toContain('github output');
      expect(output?.content).toContain('test-project');
    });

    it('should support multiple formatters', async () => {
      const ast = createTestProgram();
      const githubFormatter = createMockFormatter('github');
      const claudeFormatter = createMockFormatter('claude');
      const cursorFormatter = createMockFormatter('cursor');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [githubFormatter, claudeFormatter, cursorFormatter],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      expect(result.outputs.size).toBe(3);
      expect(result.outputs.has('./github/output.md')).toBe(true);
      expect(result.outputs.has('./claude/output.md')).toBe(true);
      expect(result.outputs.has('./cursor/output.md')).toBe(true);
    });

    it('should pass warnings from validation', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('test');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [
          {
            ruleId: 'PS999',
            ruleName: 'test-warning',
            severity: 'warning',
            message: 'This is a warning',
          },
        ],
        infos: [],
        all: [],
      });

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toBe('This is a warning');
    });

    it('should collect timing stats', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('test');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      expect(result.stats.resolveTime).toBeGreaterThanOrEqual(0);
      expect(result.stats.validateTime).toBeGreaterThanOrEqual(0);
      expect(result.stats.formatTime).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('compile - resolve errors', () => {
    it('should return errors when resolver throws', async () => {
      mockResolve.mockRejectedValue(new Error('File not found'));

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [],
      });

      const result = await compiler.compile('./missing.prs');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toBe('File not found');
      expect(result.outputs.size).toBe(0);
    });

    it('should preserve PSError format function when resolver throws', async () => {
      const psError = {
        name: 'PSError',
        code: 'PS2001',
        message: 'File not found',
        location: { file: 'test.prs', line: 1, column: 1 },
        format: () => 'PSError [PS2001]: File not found\n  at test.prs:1:1',
      };
      mockResolve.mockRejectedValue(psError);

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [],
      });

      const result = await compiler.compile('./missing.prs');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.format).toBeDefined();
      expect(result.errors[0]?.format?.()).toContain('PSError [PS2001]');
    });

    it('should return errors from resolver result', async () => {
      mockResolve.mockResolvedValue({
        ast: null,
        sources: ['test.prs'],
        errors: [
          {
            name: 'ResolveError',
            code: 'PS2001',
            message: 'Import not found: @unknown/module',
          },
        ],
      });

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('Import not found');
    });

    it('should not proceed to validation if resolve fails', async () => {
      mockResolve.mockResolvedValue({
        ast: null,
        sources: [],
        errors: [{ name: 'Error', code: 'E001', message: 'Failed' }],
      });

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [],
      });

      await compiler.compile('./test.prs');

      expect(mockValidate).not.toHaveBeenCalled();
    });
  });

  describe('compile - validation errors', () => {
    it('should return errors when validation fails', async () => {
      const ast = createTestProgram();

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue({
        valid: false,
        errors: [
          {
            ruleId: 'PS001',
            ruleName: 'required-meta-id',
            severity: 'error',
            message: '@meta.id is required',
            location: { file: 'test.prs', line: 1, column: 1 },
          },
        ],
        warnings: [
          {
            ruleId: 'PS007',
            ruleName: 'deprecated',
            severity: 'warning',
            message: 'Block is deprecated',
          },
        ],
        infos: [],
        all: [],
      });

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);

      const firstError = result.errors[0];
      expect(firstError).toBeDefined();
      expect(firstError?.code).toBe('PS001');
      expect(firstError?.name).toBe('ValidationError');
      expect(firstError?.location).toEqual({
        file: 'test.prs',
        line: 1,
        column: 1,
      });
      expect(result.warnings).toHaveLength(1);
    });

    it('should not proceed to formatting if validation fails', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('test');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue({
        valid: false,
        errors: [
          {
            ruleId: 'PS001',
            ruleName: 'required-meta-id',
            severity: 'error',
            message: '@meta.id is required',
          },
        ],
        warnings: [],
        infos: [],
        all: [],
      });

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter],
      });

      await compiler.compile('./test.prs');

      expect(formatter.format).not.toHaveBeenCalled();
    });
  });

  describe('compile - formatter errors', () => {
    it('should handle formatter errors gracefully', async () => {
      const ast = createTestProgram();
      const failingFormatter = createFailingFormatter('broken', 'Format failed');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [failingFormatter],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);

      const error = result.errors[0];
      expect(error).toBeDefined();
      expect(error?.name).toBe('FormatterError');
      expect(error?.code).toBe('PS4000');
      expect(error?.message).toContain('broken');
      expect(error?.message).toContain('Format failed');
    });

    it('should report partial outputs when some formatters succeed', async () => {
      const ast = createTestProgram();
      const successFormatter = createMockFormatter('success');
      const failingFormatter = createFailingFormatter('failing', 'Error');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [successFormatter, failingFormatter],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(false);
      expect(result.outputs.size).toBe(1);
      expect(result.outputs.has('./success/output.md')).toBe(true);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getFormatters', () => {
    it('should return readonly array of formatters', () => {
      const formatter1 = createMockFormatter('f1');
      const formatter2 = createMockFormatter('f2');

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const formatters = compiler.getFormatters();

      expect(formatters).toHaveLength(2);
      expect(formatters[0]).toBe(formatter1);
      expect(formatters[1]).toBe(formatter2);
    });
  });
});

describe('compile (standalone)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compile with default options', async () => {
    const ast = createTestProgram();

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const result = await compile('./test.prs');

    expect(result.success).toBe(true);
    expect(mockResolve).toHaveBeenCalledWith('./test.prs');
    expect(mockValidate).toHaveBeenCalled();
  });

  it('should accept custom formatters', async () => {
    const ast = createTestProgram();
    const customFormatter = createMockFormatter('custom');

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const result = await compile('./test.prs', {
      formatters: [customFormatter],
    });

    expect(result.success).toBe(true);
    expect(customFormatter.format).toHaveBeenCalled();
    expect(result.outputs.has('./custom/output.md')).toBe(true);
  });

  it('should accept resolver options', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const result = await compile('./test.prs', {
      resolver: { registryPath: '/custom/registry' },
      formatters: [formatter],
    });

    expect(result.success).toBe(true);
  });

  it('should return errors on failure', async () => {
    mockResolve.mockRejectedValue(new Error('File not found'));

    const result = await compile('./missing.prs', {
      formatters: [createMockFormatter('test')],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain('File not found');
  });
});
