import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import type { Formatter, CompilerOptions } from '../types.js';
import { FormatterRegistry } from '@promptscript/formatters';

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
import { Compiler, createCompiler, compile } from '../compiler.js';

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
function createMockFormatter(
  name: string,
  outputPath: string = `./${name}/output.md`,
  skillBasePath: string | null = null,
  skillFileName: string | null = null
): Formatter {
  return {
    name,
    outputPath,
    description: `Mock ${name} formatter for testing`,
    defaultConvention: 'markdown',
    format: vi.fn((ast: Program) => {
      const id = ast.meta?.fields?.['id'] as string | undefined;
      return {
        path: outputPath,
        content: `# ${name} output\nID: ${id ?? 'unknown'}`,
      };
    }),
    getSkillBasePath: () => skillBasePath,
    getSkillFileName: () => skillFileName,
    referencesMode: () => 'none' as const,
  };
}

/**
 * Create a test compiler with sensible defaults.
 */
function createTestCompiler(overrides: Partial<CompilerOptions> = {}): Compiler {
  return new Compiler({
    resolver: { registryPath: '/registry' },
    formatters: [],
    ...overrides,
  });
}

/**
 * Create a mock formatter that throws an error.
 */
function createFailingFormatter(name: string, error: string): Formatter {
  return {
    name,
    outputPath: `./${name}/output.md`,
    description: `Mock failing ${name} formatter`,
    defaultConvention: 'markdown',
    format: vi.fn(() => {
      throw new Error(error);
    }),
    getSkillBasePath: () => null,
    getSkillFileName: () => null,
    referencesMode: () => 'none' as const,
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
        readonly description = 'Test formatter class';
        readonly defaultConvention = 'markdown';
        format(ast: Program) {
          const id = ast.meta?.fields?.['id'] as string | undefined;
          return { path: this.outputPath, content: `ID: ${id ?? 'unknown'}` };
        }
        getSkillBasePath() {
          return null;
        }
        getSkillFileName() {
          return null;
        }
        referencesMode() {
          return 'none' as const;
        }
      }

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [TestFormatter as unknown as Formatter],
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

    it('should load formatter with name and config object', () => {
      // First register a mock formatter
      const mockFormatter = createMockFormatter('github');
      vi.spyOn(FormatterRegistry, 'get').mockReturnValue(mockFormatter);

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [{ name: 'github', config: { version: 'multifile' } }],
      });

      const formatters = compiler.getFormatters();
      expect(formatters).toHaveLength(1);
      expect(formatters[0]?.name).toBe('github');

      vi.restoreAllMocks();
    });

    it('should use custom conventions when provided', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('github');
      vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const customConvention = {
        name: 'custom',
        section: { start: '[[{{name}}]]', end: '[[/{{name}}]]' },
        listStyle: 'asterisk' as const,
        codeBlockDelimiter: '```',
      };

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [{ name: 'github', config: { convention: 'myconv' } }],
        customConventions: { myconv: customConvention },
      });

      const result = await compiler.compile('./test.prs');
      expect(result.success).toBe(true);

      vi.restoreAllMocks();
    });

    it('should use standard convention name when not a custom one', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('github');
      vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [{ name: 'github', config: { convention: 'markdown' } }],
      });

      const result = await compiler.compile('./test.prs');
      expect(result.success).toBe(true);

      vi.restoreAllMocks();
    });

    it('should handle formatter config with output path', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('github');
      vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [{ name: 'github', config: { output: './custom/path.md' } }],
      });

      const result = await compiler.compile('./test.prs');
      expect(result.success).toBe(true);

      vi.restoreAllMocks();
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

    it('should include additionalFiles in outputs', async () => {
      const ast = createTestProgram();

      // Create a formatter that returns additionalFiles
      const formatterWithAdditionalFiles: Formatter = {
        name: 'cursor',
        outputPath: '.cursor/rules/project.mdc',
        description: 'Formatter with additional files',
        defaultConvention: 'markdown',
        format: vi.fn(() => ({
          path: '.cursor/rules/project.mdc',
          content: '# Main file',
          additionalFiles: [
            { path: '.cursor/commands/test.md', content: 'Test command content' },
            { path: '.cursor/commands/build.md', content: 'Build command content' },
          ],
        })),
        getSkillBasePath: () => null,
        getSkillFileName: () => null,
        referencesMode: () => 'none' as const,
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatterWithAdditionalFiles],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      // Should have main file + 2 additional files = 3 outputs
      expect(result.outputs.size).toBe(3);
      expect(result.outputs.has('.cursor/rules/project.mdc')).toBe(true);
      expect(result.outputs.has('.cursor/commands/test.md')).toBe(true);
      expect(result.outputs.has('.cursor/commands/build.md')).toBe(true);

      // Verify additional file content (marker is prepended by compiler)
      const testCommand = result.outputs.get('.cursor/commands/test.md');
      expect(testCommand?.content).toContain('Test command content');
      expect(testCommand?.content).toContain('<!-- PromptScript');
    });

    it('should use YAML marker inside frontmatter for files with YAML frontmatter', async () => {
      const ast = createTestProgram();

      const formatterWithFrontmatter: Formatter = {
        name: 'factory',
        outputPath: 'AGENTS.md',
        description: 'Formatter with frontmatter files',
        defaultConvention: 'markdown',
        format: vi.fn(() => ({
          path: 'AGENTS.md',
          content: '# AGENTS.md\n\nMain content',
          additionalFiles: [
            {
              path: '.factory/skills/commit/SKILL.md',
              content:
                '---\nname: commit\ndescription: Create git commits\n---\n\nUse Conventional Commits format.\n',
            },
          ],
        })),
        getSkillBasePath: () => '.factory/skills',
        getSkillFileName: () => 'SKILL.md',
        referencesMode: () => 'none' as const,
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatterWithFrontmatter],
      });

      const result = await compiler.compile('./test.prs');

      const skillFile = result.outputs.get('.factory/skills/commit/SKILL.md');
      expect(skillFile).toBeDefined();

      // Should use YAML comment inside frontmatter, not HTML comment after it
      expect(skillFile?.content).toContain('# promptscript-generated:');
      expect(skillFile?.content).not.toContain('<!-- PromptScript');

      // YAML marker should be inside frontmatter (between --- delimiters)
      const frontmatterMatch = skillFile?.content.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeTruthy();
      expect(frontmatterMatch?.[1]).toContain('# promptscript-generated:');

      // Content should still be intact
      expect(skillFile?.content).toContain('name: commit');
      expect(skillFile?.content).toContain('Use Conventional Commits format.');
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

  describe('compile - output path collision warning', () => {
    it('should warn when multiple formatters target the same output path (PS4001)', async () => {
      const ast = createTestProgram();
      const formatter1 = createMockFormatter('codex', 'AGENTS.md');
      const formatter2 = createMockFormatter('amp', 'AGENTS.md');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);

      const collisionWarning = result.warnings.find((w) => w.ruleId === 'PS4001');
      expect(collisionWarning).toBeDefined();
      expect(collisionWarning?.ruleName).toBe('output-path-collision');
      expect(collisionWarning?.message).toContain('AGENTS.md');
      expect(collisionWarning?.message).toContain('codex');
      expect(collisionWarning?.message).toContain('amp');
    });

    it('should warn and skip when additional file collides with existing output (PS4001)', async () => {
      const ast = createTestProgram();

      // Factory formatter produces AGENTS.md as main output
      const factoryFormatter: Formatter = {
        name: 'factory',
        outputPath: 'AGENTS.md',
        description: 'Factory formatter',
        defaultConvention: 'markdown',
        format: vi.fn(() => ({
          path: 'AGENTS.md',
          content: '# Full factory output with all sections\n'.repeat(20),
        })),
        getSkillBasePath: () => null,
        getSkillFileName: () => null,
        referencesMode: () => 'none' as const,
      };

      // GitHub formatter produces AGENTS.md as an additional file
      const githubFormatter: Formatter = {
        name: 'github',
        outputPath: '.github/copilot-instructions.md',
        description: 'GitHub formatter',
        defaultConvention: 'markdown',
        format: vi.fn(() => ({
          path: '.github/copilot-instructions.md',
          content: '# GitHub main output',
          additionalFiles: [{ path: 'AGENTS.md', content: '# Minimal agents\n' }],
        })),
        getSkillBasePath: () => null,
        getSkillFileName: () => null,
        referencesMode: () => 'none' as const,
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [factoryFormatter, githubFormatter],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);

      // Factory's full output should be preserved (first writer wins)
      const agentsOutput = result.outputs.get('AGENTS.md');
      expect(agentsOutput?.content).toContain('Full factory output');

      // GitHub's main output should also exist
      expect(result.outputs.has('.github/copilot-instructions.md')).toBe(true);

      // Collision warning should be present
      const collisionWarning = result.warnings.find((w) => w.ruleId === 'PS4001');
      expect(collisionWarning).toBeDefined();
      expect(collisionWarning?.message).toContain('AGENTS.md');
      expect(collisionWarning?.message).toContain('factory');
      expect(collisionWarning?.message).toContain('github');
    });

    it('should warn and skip when additional file collides with another additional file', async () => {
      const ast = createTestProgram();

      const formatter1: Formatter = {
        name: 'formatter-a',
        outputPath: 'a/main.md',
        description: 'Formatter A',
        defaultConvention: 'markdown',
        format: vi.fn(() => ({
          path: 'a/main.md',
          content: '# A main',
          additionalFiles: [{ path: 'shared/resource.md', content: '# From formatter A' }],
        })),
        getSkillBasePath: () => null,
        getSkillFileName: () => null,
        referencesMode: () => 'none' as const,
      };

      const formatter2: Formatter = {
        name: 'formatter-b',
        outputPath: 'b/main.md',
        description: 'Formatter B',
        defaultConvention: 'markdown',
        format: vi.fn(() => ({
          path: 'b/main.md',
          content: '# B main',
          additionalFiles: [{ path: 'shared/resource.md', content: '# From formatter B' }],
        })),
        getSkillBasePath: () => null,
        getSkillFileName: () => null,
        referencesMode: () => 'none' as const,
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);

      // First writer (formatter-a) should win
      const shared = result.outputs.get('shared/resource.md');
      expect(shared?.content).toContain('From formatter A');

      // Collision warning
      const collisionWarning = result.warnings.find((w) => w.ruleId === 'PS4001');
      expect(collisionWarning).toBeDefined();
      expect(collisionWarning?.message).toContain('formatter-a');
      expect(collisionWarning?.message).toContain('formatter-b');
    });

    it('should still process nested additionalFiles of skipped colliding files', async () => {
      const ast = createTestProgram();

      // First formatter claims AGENTS.md
      const formatter1 = createMockFormatter('first', 'AGENTS.md');

      // Second formatter has AGENTS.md as additional with its own nested files
      const formatter2: Formatter = {
        name: 'second',
        outputPath: 'second/main.md',
        description: 'Second formatter',
        defaultConvention: 'markdown',
        format: vi.fn(() => ({
          path: 'second/main.md',
          content: '# Second main',
          additionalFiles: [
            {
              path: 'AGENTS.md',
              content: '# Should be skipped',
              additionalFiles: [{ path: 'nested/file.md', content: '# Nested file from second' }],
            },
          ],
        })),
        getSkillBasePath: () => null,
        getSkillFileName: () => null,
        referencesMode: () => 'none' as const,
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);

      // First formatter's AGENTS.md preserved
      const agents = result.outputs.get('AGENTS.md');
      expect(agents?.content).toContain('first output');

      // Nested file from skipped additional should still be processed
      expect(result.outputs.has('nested/file.md')).toBe(true);
    });

    it('should not warn when formatters target different output paths', async () => {
      const ast = createTestProgram();
      const formatter1 = createMockFormatter('github', '.github/copilot-instructions.md');
      const formatter2 = createMockFormatter('claude', 'CLAUDE.md');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      const collisionWarning = result.warnings?.find((w) => w.ruleId === 'PS4001');
      expect(collisionWarning).toBeUndefined();
    });
  });

  describe('skill injection', () => {
    const skillContent = '# PromptScript Language Skill\nThis teaches .prs syntax.';

    it('should inject skill when skillContent provided and formatter supports skills', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [formatter], skillContent });
      const result = await compiler.compile('test.prs');
      expect(result.success).toBe(true);
      expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(true);
      const skillOutput = result.outputs.get('.claude/skills/promptscript/SKILL.md');
      expect(skillOutput?.content).toContain('PromptScript Language Skill');
    });

    it('should skip injection when skillContent is not provided', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [formatter] });
      const result = await compiler.compile('test.prs');
      expect(result.success).toBe(true);
      expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(false);
    });

    it('should skip injection when formatter returns null skill path', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('cursor', '.cursor/rules/project.mdc', null, null);

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [formatter], skillContent });
      const result = await compiler.compile('test.prs');
      expect(result.success).toBe(true);
      expect(
        Array.from(result.outputs.keys()).filter((k) => k.includes('promptscript/SKILL'))
      ).toHaveLength(0);
    });

    it('should use correct skill file name per formatter (e.g., lowercase skill.md)', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('gemini', 'GEMINI.md', '.gemini/skills', 'skill.md');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [formatter], skillContent });
      const result = await compiler.compile('test.prs');
      expect(result.outputs.has('.gemini/skills/promptscript/skill.md')).toBe(true);
      expect(result.outputs.has('.gemini/skills/promptscript/SKILL.md')).toBe(false);
    });

    it('should silently skip auto-injection when same formatter already output the skill', async () => {
      const ast = createTestProgram();
      const formatter: Formatter = {
        ...createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md'),
        format: vi.fn(() => ({
          path: 'CLAUDE.md',
          content: '# Claude',
          additionalFiles: [
            {
              path: '.claude/skills/promptscript/SKILL.md',
              content: '# User-defined promptscript skill',
            },
          ],
        })),
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [formatter], skillContent });
      const result = await compiler.compile('test.prs');
      expect(result.success).toBe(true);
      const skillOutput = result.outputs.get('.claude/skills/promptscript/SKILL.md');
      expect(skillOutput?.content).toContain('User-defined promptscript skill');
      // Same formatter → no warning (auto-discovered skill takes precedence silently)
      expect(result.warnings.some((w) => w.ruleId === 'PS4001')).toBe(false);
    });

    it('should warn when different formatter already output the skill at same path', async () => {
      const ast = createTestProgram();
      // First formatter outputs a skill at the path that the second formatter's
      // auto-injection would use
      const formatter1: Formatter = {
        ...createMockFormatter('custom', 'CUSTOM.md'),
        format: vi.fn(() => ({
          path: 'CUSTOM.md',
          content: '# Custom',
          additionalFiles: [
            {
              path: '.claude/skills/promptscript/SKILL.md',
              content: '# Custom promptscript skill',
            },
          ],
        })),
      };
      const formatter2 = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [formatter1, formatter2], skillContent });
      const result = await compiler.compile('test.prs');
      expect(result.success).toBe(true);
      // Different formatter → should warn
      expect(result.warnings.some((w) => w.ruleId === 'PS4001')).toBe(true);
    });

    it('should produce collision warning when two formatters share dotDir', async () => {
      const ast = createTestProgram();
      const cline = createMockFormatter('cline', '.clinerules', '.agents/skills', 'SKILL.md');
      const codex = createMockFormatter('codex', 'AGENTS.md', '.agents/skills', 'SKILL.md');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [cline, codex], skillContent });
      const result = await compiler.compile('test.prs');
      expect(result.success).toBe(true);
      expect(result.outputs.has('.agents/skills/promptscript/SKILL.md')).toBe(true);
      const collisionWarnings = result.warnings.filter(
        (w) => w.ruleId === 'PS4001' && w.message.includes('.agents/skills/promptscript/SKILL.md')
      );
      expect(collisionWarnings.length).toBeGreaterThanOrEqual(1);
    });

    it('should inject skill for multiple formatters with different paths', async () => {
      const ast = createTestProgram();
      const claude = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');
      const github = createMockFormatter(
        'github',
        '.github/copilot-instructions.md',
        '.github/skills',
        'SKILL.md'
      );

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [claude, github], skillContent });
      const result = await compiler.compile('test.prs');
      expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(true);
      expect(result.outputs.has('.github/skills/promptscript/SKILL.md')).toBe(true);
    });

    it('should add PromptScript marker to injected skill', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [formatter], skillContent });
      const result = await compiler.compile('test.prs');
      const skillOutput = result.outputs.get('.claude/skills/promptscript/SKILL.md');
      expect(skillOutput?.content).toContain('<!-- PromptScript');
    });

    it('should include skillContent in compiler options for downstream propagation', async () => {
      // compileAll() spreads ...this.options into per-formatter Compiler instances,
      // so skillContent propagates automatically. We verify the injection works
      // via compile() since both code paths share the same injection logic.
      const formatter = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');

      mockResolve.mockResolvedValue(createResolveSuccess(createTestProgram()));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [formatter], skillContent });

      const result = await compiler.compile('test.prs');
      expect(result.success).toBe(true);
      expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(true);
    });

    it('should support skillContent in standalone compile()', async () => {
      mockResolve.mockResolvedValue(createResolveSuccess(createTestProgram()));
      mockValidate.mockReturnValue(createValidationSuccess());

      const result = await compile('test.prs', {
        formatters: [createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md')],
        skillContent,
      });

      expect(result.success).toBe(true);
      expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(true);
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

describe('Compiler.compileFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compile a file (alias for compile)', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const result = await compiler.compileFile('./test.prs');

    expect(result.success).toBe(true);
    expect(mockResolve).toHaveBeenCalledWith('./test.prs');

    vi.restoreAllMocks();
  });
});

describe('Compiler.compileAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compile with all registered formatters', async () => {
    const ast = createTestProgram();
    const formatter1 = createMockFormatter('github');
    const formatter2 = createMockFormatter('claude');

    vi.spyOn(FormatterRegistry, 'list').mockReturnValue(['github', 'claude']);
    vi.spyOn(FormatterRegistry, 'get').mockImplementation((name: string) => {
      if (name === 'github') return formatter1;
      if (name === 'claude') return formatter2;
      return undefined;
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['github'],
    });

    const result = await compiler.compileAll('./test.prs');

    expect(result.success).toBe(true);
    expect(result.outputs.size).toBe(2);

    vi.restoreAllMocks();
  });
});

describe('Compiler.watch', () => {
  let mockWatcher: {
    on: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWatcher = {
      on: vi.fn().mockReturnThis(),
      close: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should create a file watcher', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    // Mock chokidar
    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue(mockWatcher),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const watcher = await compiler.watch('./test.prs');

    expect(mockWatcher.on).toHaveBeenCalled();
    expect(typeof watcher.close).toBe('function');

    await watcher.close();
    expect(mockWatcher.close).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('should call onCompile callback when files change', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    const onCompile = vi.fn();

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    let changeHandler: ((path: string) => void) | undefined;

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue({
          on: vi.fn().mockImplementation((event: string, handler: (path: string) => void) => {
            if (event === 'change') {
              changeHandler = handler;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
        }),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const watcher = await compiler.watch('./test.prs', {
      onCompile,
      debounce: 10,
    });

    // Simulate file change
    if (changeHandler) {
      changeHandler('./test.prs');
    }

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 50));

    await watcher.close();

    vi.restoreAllMocks();
  });

  it('should respect exclude patterns', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const watchMock = vi.fn().mockReturnValue(mockWatcher);
    vi.doMock('chokidar', () => ({
      default: {
        watch: watchMock,
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const watcher = await compiler.watch('./test.prs', {
      exclude: ['**/dist/**'],
    });

    await watcher.close();

    vi.restoreAllMocks();
  });

  it('should handle add events from watcher', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    const onCompile = vi.fn();

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    let addHandler: ((path: string) => void) | undefined;

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue({
          on: vi.fn().mockImplementation((event: string, handler: (path: string) => void) => {
            if (event === 'add') {
              addHandler = handler;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
        }),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const watcher = await compiler.watch('./test.prs', {
      onCompile,
      debounce: 10,
    });

    // Simulate file add
    if (addHandler) {
      addHandler('./new-file.prs');
    }

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 50));

    await watcher.close();

    vi.restoreAllMocks();
  });

  it('should call onError callback for watcher error events', async () => {
    const onError = vi.fn();

    let errorHandler: ((error: Error) => void) | undefined;

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'error') {
              errorHandler = handler as (error: Error) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
        }),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [],
    });

    const watcher = await compiler.watch('./test.prs', {
      onError,
    });

    // Simulate watcher error
    if (errorHandler) {
      errorHandler(new Error('Watch error'));
    }

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Watch error' }));

    await watcher.close();

    vi.restoreAllMocks();
  });

  it('should handle non-Error objects in watcher error events', async () => {
    const onError = vi.fn();

    let errorHandler: ((error: unknown) => void) | undefined;

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'error') {
              errorHandler = handler as (error: unknown) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
        }),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [],
    });

    const watcher = await compiler.watch('./test.prs', {
      onError,
    });

    // Simulate watcher error with non-Error object
    if (errorHandler) {
      errorHandler('String error');
    }

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'String error' }));

    await watcher.close();

    vi.restoreAllMocks();
  });
});

describe('marker source and target metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include source and target in HTML marker for main output', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('claude', 'CLAUDE.md');

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [formatter],
    });

    const result = await compiler.compile('.promptscript/project.prs');
    expect(result.success).toBe(true);

    const output = result.outputs.get('CLAUDE.md');
    expect(output).toBeDefined();
    expect(output?.content).toContain('| source: .promptscript/project.prs');
    expect(output?.content).toContain('| target: claude');
  });

  it('should include source and target in YAML marker for frontmatter files', async () => {
    const ast = createTestProgram();

    const formatterWithFrontmatter: Formatter = {
      name: 'factory',
      outputPath: '.factory/skills/commit/SKILL.md',
      description: 'Formatter with frontmatter',
      defaultConvention: 'markdown',
      format: vi.fn(() => ({
        path: '.factory/skills/commit/SKILL.md',
        content: '---\nname: commit\n---\n\nContent.',
      })),
      getSkillBasePath: () => '.factory/skills',
      getSkillFileName: () => 'SKILL.md',
      referencesMode: () => 'none' as const,
    };

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [formatterWithFrontmatter],
    });

    const result = await compiler.compile('.promptscript/project.prs');
    const output = result.outputs.get('.factory/skills/commit/SKILL.md');
    expect(output).toBeDefined();
    expect(output?.content).toContain('| source: .promptscript/project.prs');
    expect(output?.content).toContain('| target: factory');
  });

  it('should include source and target in HTML marker for additional files', async () => {
    const ast = createTestProgram();

    const formatterWithAdditional: Formatter = {
      name: 'cursor',
      outputPath: '.cursor/rules/project.mdc',
      description: 'Cursor formatter',
      defaultConvention: 'markdown',
      format: vi.fn(() => ({
        path: '.cursor/rules/project.mdc',
        content: '# Main',
        additionalFiles: [{ path: '.cursor/commands/test.md', content: '# Test command' }],
      })),
      getSkillBasePath: () => null,
      getSkillFileName: () => null,
      referencesMode: () => 'none' as const,
    };

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [formatterWithAdditional],
    });

    const result = await compiler.compile('.promptscript/project.prs');
    const additionalOutput = result.outputs.get('.cursor/commands/test.md');
    expect(additionalOutput).toBeDefined();
    expect(additionalOutput?.content).toContain('| source: .promptscript/project.prs');
    expect(additionalOutput?.content).toContain('| target: cursor');
  });

  it('should use "promptscript" as target for auto-injected skill files', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');
    const skillContent = '# PromptScript Skill\nTeaches .prs syntax.';

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = createTestCompiler({ formatters: [formatter], skillContent });
    const result = await compiler.compile('.promptscript/project.prs');
    expect(result.success).toBe(true);

    const skillOutput = result.outputs.get('.claude/skills/promptscript/SKILL.md');
    expect(skillOutput).toBeDefined();
    expect(skillOutput?.content).toContain('| source: .promptscript/project.prs');
    expect(skillOutput?.content).toContain('| target: promptscript');
  });

  it('should still detect existing markers for backward compat (no duplicate marker)', async () => {
    const ast = createTestProgram();

    const formatterWithMarker: Formatter = {
      name: 'claude',
      outputPath: 'CLAUDE.md',
      description: 'Formatter that already has marker',
      defaultConvention: 'markdown',
      format: vi.fn(() => ({
        path: 'CLAUDE.md',
        content:
          '<!-- PromptScript 2026-01-01T00:00:00.000Z - do not edit -->\n\n# Existing content',
      })),
      getSkillBasePath: () => null,
      getSkillFileName: () => null,
      referencesMode: () => 'none' as const,
    };

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [formatterWithMarker],
    });

    const result = await compiler.compile('.promptscript/project.prs');
    const output = result.outputs.get('CLAUDE.md');
    expect(output).toBeDefined();
    // Should not add a second marker
    const markerCount = (output?.content.match(/<!-- PromptScript/g) ?? []).length;
    expect(markerCount).toBe(1);
  });
});

describe('addMarkerToOutput edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip marker for non-markdown files', async () => {
    const ast = createTestProgram();

    const jsonFormatter: Formatter = {
      name: 'json-formatter',
      outputPath: 'output.json',
      description: 'JSON output formatter',
      defaultConvention: 'markdown',
      format: vi.fn(() => ({
        path: 'output.json',
        content: '{"key": "value"}',
      })),
      getSkillBasePath: () => null,
      getSkillFileName: () => null,
      referencesMode: () => 'none' as const,
    };

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [jsonFormatter],
    });

    const result = await compiler.compile('./test.prs');
    expect(result.success).toBe(true);

    const output = result.outputs.get('output.json');
    expect(output).toBeDefined();
    // Non-markdown file should NOT have a PromptScript marker
    expect(output?.content).not.toContain('<!-- PromptScript');
    expect(output?.content).not.toContain('# promptscript-generated:');
    expect(output?.content).toBe('{"key": "value"}');
  });
});

describe('marker uses relative source path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert absolute entryPath to relative in HTML marker', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('claude', 'CLAUDE.md');

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [formatter],
    });

    // Pass an absolute path (simulating what the CLI does)
    const absolutePath = `${process.cwd()}/.promptscript/project.prs`;
    const result = await compiler.compile(absolutePath);
    expect(result.success).toBe(true);

    const output = result.outputs.get('CLAUDE.md');
    expect(output).toBeDefined();
    // Should contain relative path, NOT absolute
    expect(output?.content).toContain('| source: .promptscript/project.prs');
    expect(output?.content).not.toContain(process.cwd());
  });

  it('should convert absolute entryPath to relative in YAML marker', async () => {
    const ast = createTestProgram();

    const formatterWithFrontmatter: Formatter = {
      name: 'factory',
      outputPath: '.factory/skills/commit/SKILL.md',
      description: 'Formatter with frontmatter',
      defaultConvention: 'markdown',
      format: vi.fn(() => ({
        path: '.factory/skills/commit/SKILL.md',
        content: '---\nname: commit\n---\n\nContent.',
      })),
      getSkillBasePath: () => '.factory/skills',
      getSkillFileName: () => 'SKILL.md',
      referencesMode: () => 'none' as const,
    };

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [formatterWithFrontmatter],
    });

    const absolutePath = `${process.cwd()}/.promptscript/project.prs`;
    const result = await compiler.compile(absolutePath);
    expect(result.success).toBe(true);

    const output = result.outputs.get('.factory/skills/commit/SKILL.md');
    expect(output).toBeDefined();
    expect(output?.content).toContain('| source: .promptscript/project.prs');
    expect(output?.content).not.toContain(process.cwd());
  });

  it('should keep already-relative paths unchanged', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('claude', 'CLAUDE.md');

    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [formatter],
    });

    const result = await compiler.compile('.promptscript/project.prs');
    expect(result.success).toBe(true);

    const output = result.outputs.get('CLAUDE.md');
    expect(output?.content).toContain('| source: .promptscript/project.prs');
  });
});

describe('compile with non-Error thrown in resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle a non-Error thrown value via String(err) fallback', async () => {
    const formatter = createMockFormatter('test');
    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);

    // Resolver throws a plain string (not an Error)
    mockResolve.mockRejectedValue('something went wrong');

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const result = await compiler.compile('./test.prs');
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('something went wrong');

    vi.restoreAllMocks();
  });

  it('should handle a numeric thrown value via String(err) fallback', async () => {
    const formatter = createMockFormatter('test');
    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);

    mockResolve.mockRejectedValue(42);

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const result = await compiler.compile('./test.prs');
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('42');

    vi.restoreAllMocks();
  });
});
