import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CanonicalProgram, Program, SourceLocation } from '@promptscript/core';
import type { Formatter, CompilerOptions } from '../types.js';
import { FormatterRegistry } from '@promptscript/formatters';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// Create mock classes before importing Compiler
const mockResolve = vi.fn();
const mockValidate = vi.fn();
const mockUpdateConfig = vi.fn();
const mockVerifyReferenceHashes = vi.fn().mockResolvedValue([]);
const mockRegistryCacheConstructor = vi.fn();
const mockResolverConstructor = vi.fn();
const mockInvalidate = vi.fn();
const mockClearCache = vi.fn();

vi.mock('@promptscript/resolver', () => ({
  Resolver: class MockResolver {
    constructor(options: unknown) {
      mockResolverConstructor(options);
    }

    resolve = mockResolve;
    invalidate = mockInvalidate;
    clearCache = mockClearCache;
    verifyReferenceHashes = mockVerifyReferenceHashes;
  },
  RegistryCache: class MockRegistryCache {
    constructor(cacheDir: string) {
      mockRegistryCacheConstructor(cacheDir);
    }

    getCachePath(repoUrl: string, version: string): string {
      return `/cache/registries/${repoUrl}/${version}`;
    }
  },
  getVendorRepositoryRelativePath: (repoUrl: string): string => {
    if (repoUrl.startsWith('file:')) {
      throw new Error('Unsupported vendor URL');
    }
    return repoUrl;
  },
}));

vi.mock('@promptscript/validator', () => ({
  Validator: class MockValidator {
    validate = mockValidate;
    updateConfig = mockUpdateConfig;
  },
}));

// Import after mocks are set up
import { MAX_ENTRY_RESOLVERS, Compiler, createCompiler, compile } from '../compiler.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

function createMarkedWorkspace(): { root: string; entry: string } {
  const root = mkdtempSync(join(tmpdir(), 'promptscript-compiler-'));
  writeFileSync(join(root, 'package.json'), '{}');
  const entry = join(root, 'entry.prs');
  writeFileSync(entry, '@meta { id: "compiler-test" }\n');
  return { root, entry };
}

function createSuccessfulResolverResult() {
  return createResolveSuccess(createTestProgram());
}

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
function createResolveSuccess(ast: Program, dependencies: string[] = []) {
  return {
    ast,
    sources: ['test.prs'],
    dependencies,
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

function createValidationFailure() {
  return {
    valid: false,
    errors: [
      {
        ruleId: 'PS1000',
        ruleName: 'test-rule',
        severity: 'error' as const,
        message: 'Validation failed',
      },
    ],
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

    it('should preserve cwd registry lookup defaults in compile', async () => {
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());

      await compile('entry.prs', { formatters: [] });

      expect(mockResolverConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ registryPath: process.cwd() })
      );
    });

    it('should reuse one entry resolver for entries under one marked root', async () => {
      const workspace = createMarkedWorkspace();
      const secondEntry = join(workspace.root, 'second.prs');
      writeFileSync(secondEntry, '@meta { id: "second" }\n');
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());

      try {
        const compiler = new Compiler({
          resolver: { registryPath: '/registry' },
          formatters: [],
        });

        await compiler.compile(workspace.entry);
        await compiler.compile(secondEntry);

        expect(mockResolverConstructor).toHaveBeenCalledTimes(2);
      } finally {
        rmSync(workspace.root, { recursive: true, force: true });
      }
    });

    it('should share an entry resolver across symlinked roots', async () => {
      const workspace = createMarkedWorkspace();
      const linkParent = mkdtempSync(join(tmpdir(), 'promptscript-compiler-link-'));
      const linkRoot = join(linkParent, 'linked-root');
      symlinkSync(workspace.root, linkRoot, 'dir');
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());

      try {
        const compiler = new Compiler({
          resolver: { registryPath: '/registry' },
          formatters: [],
        });

        await compiler.compile(workspace.entry);
        await compiler.compile(join(linkRoot, 'entry.prs'));

        expect(mockResolverConstructor).toHaveBeenCalledTimes(2);
        expect(mockResolverConstructor).toHaveBeenLastCalledWith(
          expect.objectContaining({ projectRoot: realpathSync(workspace.root) })
        );
      } finally {
        rmSync(workspace.root, { recursive: true, force: true });
        rmSync(linkParent, { recursive: true, force: true });
      }
    });

    it('should use the configured local path for entries elsewhere', async () => {
      const workspace = createMarkedWorkspace();
      const entry = join(tmpdir(), `promptscript-local-entry-${Date.now()}.prs`);
      writeFileSync(entry, '@meta { id: "outside" }\n');
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());

      try {
        const compiler = new Compiler({
          resolver: { registryPath: '/registry', localPath: workspace.root },
          formatters: [],
        });

        await compiler.compile(entry);

        expect(mockResolverConstructor).toHaveBeenCalledTimes(1);
        expect(mockResolverConstructor).toHaveBeenCalledWith(
          expect.objectContaining({ localPath: workspace.root })
        );
      } finally {
        rmSync(workspace.root, { recursive: true, force: true });
        rmSync(entry, { force: true });
      }
    });

    it('should use the configured project root for entries elsewhere', async () => {
      const workspace = createMarkedWorkspace();
      const entry = join(tmpdir(), `promptscript-project-entry-${Date.now()}.prs`);
      writeFileSync(entry, '@meta { id: "outside" }\n');
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());

      try {
        const compiler = new Compiler({
          resolver: { registryPath: '/registry', projectRoot: workspace.root },
          formatters: [],
        });

        await compiler.compile(entry);

        expect(mockResolverConstructor).toHaveBeenCalledTimes(1);
        expect(mockResolverConstructor).toHaveBeenCalledWith(
          expect.objectContaining({ projectRoot: workspace.root })
        );
      } finally {
        rmSync(workspace.root, { recursive: true, force: true });
        rmSync(entry, { force: true });
      }
    });

    it('should preserve an explicit native skill project root', async () => {
      const workspace = createMarkedWorkspace();
      const skillRoot = mkdtempSync(join(tmpdir(), 'promptscript-skill-root-'));
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());

      try {
        const compiler = new Compiler({
          resolver: {
            registryPath: '/registry',
            skills: { universalDir: '.agents', projectRoot: skillRoot },
          },
          formatters: [],
        });

        await compiler.compile(workspace.entry);

        expect(mockResolverConstructor).toHaveBeenCalledTimes(2);
        expect(mockResolverConstructor).toHaveBeenLastCalledWith(
          expect.objectContaining({
            skills: expect.objectContaining({ projectRoot: skillRoot }),
          })
        );
      } finally {
        rmSync(workspace.root, { recursive: true, force: true });
        rmSync(skillRoot, { recursive: true, force: true });
      }
    });

    it('should resolve relative entries from cwd before applying the inferred root', async () => {
      const workspace = createMarkedWorkspace();
      const nestedDir = join(workspace.root, 'nested');
      const nestedEntry = join(nestedDir, 'nested.prs');
      const originalCwd = process.cwd();
      mkdirSync(nestedDir, { recursive: true });
      writeFileSync(nestedEntry, '@meta { id: "nested" }\n');
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());

      try {
        process.chdir(nestedDir);
        const compiler = new Compiler({
          resolver: { registryPath: '/registry' },
          formatters: [],
        });

        await compiler.compile('nested.prs');

        expect(mockResolve).toHaveBeenCalledWith(realpathSync(resolve(nestedDir, 'nested.prs')));
      } finally {
        process.chdir(originalCwd);
        rmSync(workspace.root, { recursive: true, force: true });
      }
    });

    it('should append the default extension before resolving a missing entry', async () => {
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());
      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [],
      });

      await compiler.compile('missing-entry');

      expect(mockResolve).toHaveBeenCalledWith(resolve(process.cwd(), 'missing-entry.prs'));
    });

    it('should preserve registry aliases during entry resolution', async () => {
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());
      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [],
      });

      await compiler.compile('@vendor/project');

      expect(mockResolve).toHaveBeenCalledWith('@vendor/project');
    });

    it('should verify lockfile hashes with the entry resolver', async () => {
      const workspace = createMarkedWorkspace();
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());

      try {
        const compiler = new Compiler({
          resolver: {
            registryPath: '/registry',
            lockfile: { version: 1, dependencies: {}, references: {} },
          },
          formatters: [],
        });

        const result = await compiler.compile(workspace.entry);

        expect(result.success).toBe(true);
        expect(mockVerifyReferenceHashes).toHaveBeenCalledOnce();
      } finally {
        rmSync(workspace.root, { recursive: true, force: true });
      }
    });

    it('should evict oldest entry resolvers after reaching the bound', async () => {
      const workspaces = Array.from({ length: MAX_ENTRY_RESOLVERS + 1 }, () =>
        createMarkedWorkspace()
      );
      mockResolve.mockResolvedValue(createSuccessfulResolverResult());
      mockValidate.mockReturnValue(createValidationSuccess());

      try {
        const compiler = new Compiler({
          resolver: { registryPath: '/registry' },
          formatters: [],
        });

        for (const workspace of workspaces) {
          await compiler.compile(workspace.entry);
        }

        const cache = (compiler as unknown as { entryResolvers: Map<string, unknown> })
          .entryResolvers;
        expect(cache.size).toBeLessThanOrEqual(MAX_ENTRY_RESOLVERS);
      } finally {
        for (const workspace of workspaces) {
          rmSync(workspace.root, { recursive: true, force: true });
        }
      }
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

    it('should invoke canonical formatter capabilities', async () => {
      const ast = createTestProgram();
      const formatCanonical = vi.fn((program: CanonicalProgram) => ({
        path: './canonical/output.md',
        content: program.type,
      }));
      const formatter: Formatter & {
        formatCanonical: typeof formatCanonical;
      } = {
        name: 'canonical',
        outputPath: './canonical/output.md',
        description: 'Canonical formatter',
        defaultConvention: 'markdown',
        format: vi.fn(() => {
          throw new Error('Legacy formatter path should not run');
        }),
        formatCanonical,
        getSkillBasePath: () => null,
        getSkillFileName: () => null,
        referencesMode: () => 'none' as const,
      };
      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());
      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      expect(formatCanonical).toHaveBeenCalledOnce();
      expect(result.outputs.get('./canonical/output.md')?.content).toContain('CanonicalProgram');
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

    it('should return errors for missing hook scripts', async () => {
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'hooks',
            content: {
              type: 'ObjectContent',
              properties: {
                check: {
                  event: 'post-tool-use',
                  script: {
                    path: '.promptscript/scripts/missing.mjs',
                    interpreter: 'node',
                  },
                },
              },
              loc: { file: 'test.prs', line: 1, column: 1 },
            },
            loc: { file: 'test.prs', line: 1, column: 1 },
          },
        ],
      });
      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        expect.objectContaining({
          code: 'PS2001',
          message: expect.stringContaining('script not found'),
        }),
      ]);
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
    it('should preserve formatter compatibility warnings', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('github', '.github/copilot-instructions.md');
      vi.mocked(formatter.format).mockReturnValue({
        path: '.github/copilot-instructions.md',
        content: '# GitHub output',
        warnings: [
          {
            code: 'PS4002',
            message: 'Hook event "beforeRead" is not supported by target "github".',
            location: { file: 'test.prs', line: 4, column: 1 },
          },
        ],
      });

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'PS4002',
            ruleName: 'target-hook-compatibility',
            message: 'Hook event "beforeRead" is not supported by target "github".',
            location: { file: 'test.prs', line: 4, column: 1 },
          }),
        ])
      );
    });

    it('should warn when multiple formatters target the same output path (PS4001)', async () => {
      const ast = createTestProgram();
      const formatter1 = createMockFormatter('codex', 'AGENTS.md');
      const formatter2 = createMockFormatter('amp', 'AGENTS.md');
      vi.mocked(formatter1.format).mockReturnValue({
        path: 'AGENTS.md',
        content: '# Codex output',
        managedOutputDirectories: ['.factory/rules'],
        managedOutputFiles: ['.factory/hooks.json'],
      });

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
      expect(result.outputs.get('AGENTS.md')?.managedOutputDirectories).toEqual(['.factory/rules']);
      expect(result.outputs.get('AGENTS.md')?.managedOutputFiles).toEqual(['.factory/hooks.json']);
    });

    it('should not warn when formatters write identical content to one path', async () => {
      const ast = createTestProgram();
      const formatter1 = createMockFormatter('codex', 'AGENTS.md');
      const formatter2 = createMockFormatter('amp', 'AGENTS.md');
      vi.mocked(formatter1.format).mockReturnValue({
        path: 'AGENTS.md',
        content: '# Shared AGENTS output',
      });
      vi.mocked(formatter2.format).mockReturnValue({
        path: 'AGENTS.md',
        content: '# Shared AGENTS output',
      });

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      expect(result.warnings.some((w) => w.ruleId === 'PS4001')).toBe(false);
      expect(result.outputs.get('AGENTS.md')?.content).toMatch(
        /^# Shared AGENTS output\n\n<!-- PromptScript .* \| target: codex - do not edit -->$/
      );
      expect(result.outputs.get('AGENTS.md')?.content).not.toContain(
        '| target: amp - do not edit -->'
      );
    });

    it('should merge managed metadata from identical main output collisions', async () => {
      const ast = createTestProgram();
      const formatter1 = createMockFormatter('codex', 'AGENTS.md');
      const formatter2 = createMockFormatter('amp', 'AGENTS.md');
      vi.mocked(formatter1.format).mockReturnValue({
        path: 'AGENTS.md',
        content: '# Shared AGENTS output',
        managedOutputDirectories: ['.codex/rules'],
        managedOutputFiles: ['.codex/settings.json'],
      });
      vi.mocked(formatter2.format).mockReturnValue({
        path: 'AGENTS.md',
        content: '# Shared AGENTS output',
        managedOutputDirectories: ['.amp/rules'],
        managedOutputFiles: ['.amp/settings.json'],
      });

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.warnings.some((w) => w.ruleId === 'PS4001')).toBe(false);
      expect(result.outputs.get('AGENTS.md')?.managedOutputDirectories).toEqual([
        '.codex/rules',
        '.amp/rules',
      ]);
      expect(result.outputs.get('AGENTS.md')?.managedOutputFiles).toEqual([
        '.codex/settings.json',
        '.amp/settings.json',
      ]);
    });

    it('should warn when identical main content has different write settings', async () => {
      const ast = createTestProgram();
      const formatter1 = createMockFormatter('formatter-a', 'shared.md');
      const formatter2 = createMockFormatter('formatter-b', 'shared.md');
      vi.mocked(formatter1.format).mockReturnValue({
        path: 'shared.md',
        content: '# Shared content',
        mode: 0o644,
      });
      vi.mocked(formatter2.format).mockReturnValue({
        path: 'shared.md',
        content: '# Shared content',
        mode: 0o755,
      });

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.warnings.filter((w) => w.ruleId === 'PS4001')).toHaveLength(1);
      expect(result.outputs.get('shared.md')?.mode).toBe(0o755);
    });

    it('should preserve the first owner for identical main output collisions', async () => {
      const ast = createTestProgram();
      const formatterA = createMockFormatter('formatter-a', 'shared.md');
      const formatterB = createMockFormatter('formatter-b', 'shared.md');
      const formatterC = createMockFormatter('formatter-c', 'shared.md');
      vi.mocked(formatterA.format).mockReturnValue({
        path: 'shared.md',
        content: '# Shared content',
      });
      vi.mocked(formatterB.format).mockReturnValue({
        path: 'shared.md',
        content: '# Shared content',
      });
      vi.mocked(formatterC.format).mockReturnValue({
        path: 'shared.md',
        content: '# Different content',
      });

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatterA, formatterB, formatterC],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      const collisionWarnings = result.warnings.filter((w) => w.ruleId === 'PS4001');
      expect(collisionWarnings).toHaveLength(1);
      expect(collisionWarnings[0]?.message).toContain("'formatter-a'");
      expect(collisionWarnings[0]?.message).toContain("'formatter-c'");
    });

    it('should warn when main output returns to the first content after a difference', async () => {
      const ast = createTestProgram();
      const formatterA = createMockFormatter('formatter-a', 'shared.md');
      const formatterB = createMockFormatter('formatter-b', 'shared.md');
      const formatterC = createMockFormatter('formatter-c', 'shared.md');
      vi.mocked(formatterA.format).mockReturnValue({
        path: 'shared.md',
        content: '# First content',
      });
      vi.mocked(formatterB.format).mockReturnValue({
        path: 'shared.md',
        content: '# Different content',
      });
      vi.mocked(formatterC.format).mockReturnValue({
        path: 'shared.md',
        content: '# First content',
      });

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatterA, formatterB, formatterC],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      const collisionWarnings = result.warnings.filter((w) => w.ruleId === 'PS4001');
      expect(collisionWarnings).toHaveLength(2);
      expect(collisionWarnings[0]?.message).toContain("'formatter-a'");
      expect(collisionWarnings[0]?.message).toContain("'formatter-b'");
      expect(collisionWarnings[1]?.message).toContain("'formatter-b'");
      expect(collisionWarnings[1]?.message).toContain("'formatter-c'");
    });

    it('should not warn when formatters emit an identical additional file', async () => {
      const ast = createTestProgram();
      const sharedSkill = {
        path: '.agents/skills/demo/SKILL.md',
        content: '---\nname: demo\n---\n\nShared body.\n',
      };
      const formatter1: Formatter = {
        ...createMockFormatter('codex', 'AGENTS.md'),
        format: vi.fn(() => ({
          path: 'AGENTS.md',
          content: '# Codex',
          additionalFiles: [sharedSkill],
        })),
      };
      const formatter2: Formatter = {
        ...createMockFormatter('cursor', '.cursor/rules/project.mdc'),
        format: vi.fn(() => ({
          path: '.cursor/rules/project.mdc',
          content: '# Cursor',
          additionalFiles: [sharedSkill],
        })),
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const result = await compiler.compile('./test.prs');

      expect(result.success).toBe(true);
      expect(result.warnings.some((w) => w.ruleId === 'PS4001')).toBe(false);
      expect(result.outputs.has('.agents/skills/demo/SKILL.md')).toBe(true);
    });

    it('should warn when identical additional content has different modes', async () => {
      const ast = createTestProgram();
      const formatter1: Formatter = {
        ...createMockFormatter('formatter-a', 'a.md'),
        format: vi.fn(() => ({
          path: 'a.md',
          content: '# A',
          additionalFiles: [{ path: 'scripts/run.sh', content: 'echo test\n', mode: 0o644 }],
        })),
      };
      const formatter2: Formatter = {
        ...createMockFormatter('formatter-b', 'b.md'),
        format: vi.fn(() => ({
          path: 'b.md',
          content: '# B',
          additionalFiles: [{ path: 'scripts/run.sh', content: 'echo test\n', mode: 0o755 }],
        })),
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = new Compiler({
        resolver: { registryPath: '/registry' },
        formatters: [formatter1, formatter2],
      });

      const result = await compiler.compile('./test.prs');

      const collisionWarning = result.warnings.find((w) => w.ruleId === 'PS4001');
      expect(collisionWarning?.message).toContain('write settings');
      expect(collisionWarning?.message).toContain('first output will be preserved');
      expect(result.outputs.get('scripts/run.sh')?.mode).toBe(0o644);
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

    it('should inject skill into configured skillBaseDir', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('factory', 'AGENTS.md', '.factory/skills', 'SKILL.md');
      vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({
        formatters: [
          {
            name: 'factory',
            config: { skillBaseDir: 'plugins/logstrip/.factory/skills' },
          },
        ],
        skillContent,
      });
      const result = await compiler.compile('test.prs');

      expect(result.success).toBe(true);
      expect(result.outputs.has('plugins/logstrip/.factory/skills/promptscript/SKILL.md')).toBe(
        true
      );

      vi.restoreAllMocks();
    });

    it('should skip injected skill when includeSkills excludes promptscript', async () => {
      const ast = createTestProgram();
      const formatter = createMockFormatter('factory', 'AGENTS.md', '.factory/skills', 'SKILL.md');
      vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({
        formatters: [
          {
            name: 'factory',
            config: { includeSkills: ['logstrip'] },
          },
        ],
        skillContent,
      });
      const result = await compiler.compile('test.prs');

      expect(result.success).toBe(true);
      expect(result.outputs.has('.factory/skills/promptscript/SKILL.md')).toBe(false);

      vi.restoreAllMocks();
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

    it('should warn when same formatter already output a different skill', async () => {
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
      expect(result.warnings.some((w) => w.ruleId === 'PS4001')).toBe(true);
    });

    it('should report injected skill transform failures as formatter errors', async () => {
      const ast = createTestProgram();
      const formatter: Formatter = {
        ...createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md'),
        format: vi.fn(() => ({
          path: 'CLAUDE.md',
          content: '# Claude',
          additionalFiles: [
            {
              path: '.claude/skills/promptscript/SKILL.md',
              content: skillContent,
            },
          ],
        })),
        transformInjectedSkillContent: () => {
          throw new Error('invalid injected skill');
        },
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [formatter], skillContent });
      const result = await compiler.compile('test.prs');

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'PS4000',
          message: expect.stringContaining('invalid injected skill'),
        })
      );
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

    it('should not warn when two formatters share dotDir with identical content', async () => {
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
      expect(collisionWarnings).toEqual([]);
    });

    it('should warn when two formatters share dotDir with different content', async () => {
      const ast = createTestProgram();
      const cline = createMockFormatter('cline', '.clinerules', '.agents/skills', 'SKILL.md');
      const codex: Formatter = {
        ...createMockFormatter('codex', 'AGENTS.md', '.agents/skills', 'SKILL.md'),
        transformInjectedSkillContent: (content: string) => `${content}\n<!-- codex flavour -->`,
      };

      mockResolve.mockResolvedValue(createResolveSuccess(ast));
      mockValidate.mockReturnValue(createValidationSuccess());

      const compiler = createTestCompiler({ formatters: [cline, codex], skillContent });
      const result = await compiler.compile('test.prs');
      expect(result.success).toBe(true);
      const collisionWarnings = result.warnings.filter(
        (w) => w.ruleId === 'PS4001' && w.message.includes('.agents/skills/promptscript/SKILL.md')
      );
      expect(collisionWarnings.length).toBe(1);
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
    expect(mockResolve).toHaveBeenCalledWith(resolve('./test.prs'));
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
    expect(mockResolve).toHaveBeenCalledWith(resolve('./test.prs'));

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
    vi.useFakeTimers();
    mockWatcher = {
      on: vi.fn().mockReturnThis(),
      close: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
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
      include: ['?.prs'],
    });

    // Simulate file change
    if (changeHandler) {
      changeHandler('./a.prs');
    }

    await vi.advanceTimersByTimeAsync(10);

    await watcher.close();

    vi.restoreAllMocks();
  });

  it('should respect exclude patterns', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    let changeHandler: ((path: string) => void) | undefined;
    let ignoredHandler: ((path: string) => boolean) | undefined;

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    const watchMock = vi
      .fn()
      .mockImplementation(
        (_paths: string[], watchOptions: { ignored?: (path: string) => boolean }) => {
          ignoredHandler = watchOptions.ignored;
          return {
            on: vi.fn().mockImplementation((event: string, handler: (path: string) => void) => {
              if (event === 'change') {
                changeHandler = handler;
              }
              return mockWatcher;
            }),
            close: vi.fn().mockResolvedValue(undefined),
          };
        }
      );
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

    expect(ignoredHandler?.('/repo/dist/ignored.prs')).toBe(true);
    expect(ignoredHandler?.('/repo/src/included.prs')).toBe(false);
    changeHandler?.('./dist/ignored.prs');
    await watcher.close();

    vi.restoreAllMocks();
  });

  it('should watch and invalidate resolved native dependencies', async () => {
    const workspace = createMarkedWorkspace();
    const importedSource = join(workspace.root, 'imported.prs');
    const nativeSkill = join(workspace.root, '.promptscript', 'skills', 'review', 'SKILL.md');
    const lockfile = join(workspace.root, 'promptscript.lock');
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    const onCompile = vi.fn();
    let changeHandler: ((path: string) => void) | undefined;
    let watchedPaths: string[] = [];

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast, [importedSource, nativeSkill]));
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockImplementation((paths: string[]) => {
          watchedPaths = paths;
          const add = vi.fn().mockResolvedValue(undefined);
          return {
            on: vi.fn().mockImplementation((event: string, handler: unknown) => {
              if (event === 'change') {
                changeHandler = handler as (path: string) => void;
              }
              return mockWatcher;
            }),
            close: vi.fn().mockResolvedValue(undefined),
            add,
          };
        }),
      },
    }));

    try {
      const compiler = new Compiler({
        resolver: { registryPath: '/registry', projectRoot: workspace.root },
        formatters: ['test'],
      });

      const watcher = await compiler.watch(workspace.entry, {
        onCompile,
        debounce: 10,
      });

      expect(watchedPaths).toEqual(
        expect.arrayContaining([
          importedSource,
          nativeSkill,
          join(workspace.root, 'promptscript.lock'),
        ])
      );
      expect(watchedPaths.some((path) => path.includes('*'))).toBe(false);

      changeHandler?.(nativeSkill);
      await vi.advanceTimersByTimeAsync(10);

      expect(mockInvalidate).toHaveBeenCalledWith([nativeSkill]);
      expect(mockResolve).toHaveBeenCalledTimes(2);
      expect(onCompile).toHaveBeenCalledOnce();

      changeHandler?.(lockfile);
      await vi.advanceTimersByTimeAsync(10);

      expect(mockClearCache).toHaveBeenCalled();
      await watcher.close();
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
      vi.restoreAllMocks();
    }
  });

  it('should unwatch dependencies removed by a successful rebuild', async () => {
    const workspace = createMarkedWorkspace();
    const staleDependency = join(workspace.root, '.promptscript', 'skills', 'old', 'SKILL.md');
    const currentDependency = join(
      workspace.root,
      '.promptscript',
      'skills',
      'current',
      'SKILL.md'
    );
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    let changeHandler: ((path: string) => void) | undefined;
    const add = vi.fn().mockResolvedValue(undefined);
    const unwatch = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve
      .mockResolvedValueOnce(createResolveSuccess(ast, [staleDependency]))
      .mockResolvedValueOnce(createResolveSuccess(ast, [currentDependency]));
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockImplementation(() => ({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
          add,
          unwatch,
        })),
      },
    }));

    try {
      const compiler = new Compiler({
        resolver: { registryPath: '/registry', projectRoot: workspace.root },
        formatters: ['test'],
      });

      const watcher = await compiler.watch(workspace.entry, { debounce: 1 });

      changeHandler?.(staleDependency);
      await vi.advanceTimersByTimeAsync(1);

      expect(unwatch).toHaveBeenCalledWith([staleDependency]);
      expect(add).toHaveBeenCalledWith(expect.arrayContaining([currentDependency]));
      await watcher.close();
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
      vi.restoreAllMocks();
    }
  });

  it('should preserve resolved dependencies after a failed recompilation', async () => {
    const workspace = createMarkedWorkspace();
    const nativeSkill = join(workspace.root, '.promptscript', 'skills', 'review', 'SKILL.md');
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    let changeHandler: ((path: string) => void) | undefined;

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve
      .mockResolvedValueOnce(createResolveSuccess(ast, [nativeSkill]))
      .mockRejectedValueOnce(new Error('Circular dependency'))
      .mockResolvedValueOnce(createResolveSuccess(ast, [nativeSkill]));
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockImplementation(() => ({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
          add: vi.fn().mockResolvedValue(undefined),
        })),
      },
    }));

    try {
      const compiler = new Compiler({
        resolver: { registryPath: '/registry', projectRoot: workspace.root },
        formatters: ['test'],
      });

      const watcher = await compiler.watch(workspace.entry, { debounce: 1 });

      changeHandler?.(nativeSkill);
      await vi.advanceTimersByTimeAsync(1);
      changeHandler?.(nativeSkill);
      await vi.advanceTimersByTimeAsync(1);

      expect(mockResolve).toHaveBeenCalledTimes(3);
      await watcher.close();
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
      vi.restoreAllMocks();
    }
  });

  it('should retain dependencies through validation failure before replacing them', async () => {
    const workspace = createMarkedWorkspace();
    const previousDependency = join(
      workspace.root,
      '.promptscript',
      'skills',
      'previous',
      'SKILL.md'
    );
    const candidateDependency = join(
      workspace.root,
      '.promptscript',
      'skills',
      'candidate',
      'SKILL.md'
    );
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    let changeHandler: ((path: string) => void) | undefined;
    const add = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve
      .mockResolvedValueOnce(createResolveSuccess(ast, [previousDependency]))
      .mockResolvedValueOnce(createResolveSuccess(ast, [candidateDependency]))
      .mockResolvedValueOnce(createResolveSuccess(ast, [candidateDependency]));
    mockValidate
      .mockReturnValueOnce(createValidationSuccess())
      .mockReturnValueOnce(createValidationFailure())
      .mockReturnValueOnce(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockImplementation(() => ({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
          add,
        })),
      },
    }));

    try {
      const compiler = new Compiler({
        resolver: { registryPath: '/registry', projectRoot: workspace.root },
        formatters: ['test'],
      });

      const watcher = await compiler.watch(workspace.entry, { debounce: 1 });

      changeHandler?.(previousDependency);
      await vi.advanceTimersByTimeAsync(1);
      expect(add).toHaveBeenLastCalledWith(expect.arrayContaining([previousDependency]));

      changeHandler?.(previousDependency);
      await vi.advanceTimersByTimeAsync(1);
      expect(add).toHaveBeenLastCalledWith(expect.arrayContaining([candidateDependency]));
      await watcher.close();
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
      vi.restoreAllMocks();
    }
  });

  it('should retain dependencies through formatting failure before replacing them', async () => {
    const workspace = createMarkedWorkspace();
    const previousDependency = join(
      workspace.root,
      '.promptscript',
      'skills',
      'previous',
      'SKILL.md'
    );
    const candidateDependency = join(
      workspace.root,
      '.promptscript',
      'skills',
      'candidate',
      'SKILL.md'
    );
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    let changeHandler: ((path: string) => void) | undefined;
    const add = vi.fn().mockResolvedValue(undefined);
    let formatCalls = 0;
    formatter.format = vi.fn(() => {
      formatCalls++;
      if (formatCalls === 2) {
        throw new Error('Formatting failed');
      }
      return {
        path: './test/output.md',
        content: '# test output',
      };
    });

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve
      .mockResolvedValueOnce(createResolveSuccess(ast, [previousDependency]))
      .mockResolvedValueOnce(createResolveSuccess(ast, [candidateDependency]))
      .mockResolvedValueOnce(createResolveSuccess(ast, [candidateDependency]));
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockImplementation(() => ({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
          add,
        })),
      },
    }));

    try {
      const compiler = new Compiler({
        resolver: { registryPath: '/registry', projectRoot: workspace.root },
        formatters: ['test'],
      });

      const watcher = await compiler.watch(workspace.entry, { debounce: 1 });

      changeHandler?.(previousDependency);
      await vi.advanceTimersByTimeAsync(1);
      expect(add).toHaveBeenLastCalledWith(expect.arrayContaining([previousDependency]));

      changeHandler?.(previousDependency);
      await vi.advanceTimersByTimeAsync(1);
      expect(add).toHaveBeenLastCalledWith(expect.arrayContaining([candidateDependency]));
      await watcher.close();
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
      vi.restoreAllMocks();
    }
  });

  it('should invalidate dependencies through symlinked paths', async () => {
    const workspace = createMarkedWorkspace();
    const realDependency = join(workspace.root, 'real-resource.md');
    const symlinkedDependency = join(workspace.root, 'linked-resource.md');
    writeFileSync(realDependency, 'resource\n');
    symlinkSync(realDependency, symlinkedDependency);
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    let changeHandler: ((path: string) => void) | undefined;

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast, [realDependency]));
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockImplementation(() => ({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
          add: vi.fn().mockResolvedValue(undefined),
        })),
      },
    }));

    try {
      const compiler = new Compiler({
        resolver: { registryPath: '/registry', projectRoot: workspace.root },
        formatters: ['test'],
      });

      const watcher = await compiler.watch(workspace.entry, { debounce: 1 });
      changeHandler?.(symlinkedDependency);
      await vi.advanceTimersByTimeAsync(1);

      expect(mockInvalidate).toHaveBeenCalledWith(
        expect.arrayContaining([symlinkedDependency, realpathSync(realDependency)])
      );
      expect(mockResolve).toHaveBeenCalledTimes(2);
      await watcher.close();
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
      vi.restoreAllMocks();
    }
  });

  it('should close the watcher and report rejected initial dependency setup', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    const onError = vi.fn();
    const add = vi.fn().mockRejectedValue(new Error('permission denied'));
    const close = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          close,
          add,
        }),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    await expect(compiler.watch('./test.prs', { onError })).rejects.toThrow(
      "Failed to watch dependencies for './test.prs': permission denied"
    );
    expect(close).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('permission denied') })
    );

    vi.restoreAllMocks();
  });

  it('should await an in-flight rebuild when closing', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    const onCompile = vi.fn();
    let changeHandler: ((path: string) => void) | undefined;
    let releaseRebuild: (() => void) | undefined;
    const rebuildBlocked = new Promise<void>((resolve) => {
      releaseRebuild = resolve;
    });
    const add = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve
      .mockResolvedValueOnce(createResolveSuccess(ast))
      .mockImplementationOnce(async () => {
        await rebuildBlocked;
        return createResolveSuccess(ast);
      });
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockImplementation(() => ({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
          add,
        })),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const watcher = await compiler.watch('./test.prs', {
      onCompile,
      debounce: 1,
    });
    changeHandler?.('./test.prs');
    await vi.advanceTimersByTimeAsync(1);

    const closePromise = watcher.close();
    await Promise.resolve();
    expect(onCompile).not.toHaveBeenCalled();
    releaseRebuild?.();
    await closePromise;
    expect(onCompile).not.toHaveBeenCalled();
    expect(add).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
  });

  it('should match brace include patterns', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    const onCompile = vi.fn();
    let changeHandler: ((path: string) => void) | undefined;

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockImplementation(() => ({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
        })),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const watcher = await compiler.watch('./test.prs', {
      include: ['**/*.{prs,md}'],
      onCompile,
      debounce: 1,
    });

    changeHandler?.('./notes.md');
    await vi.advanceTimersByTimeAsync(1);

    expect(mockResolve).toHaveBeenCalledTimes(2);
    expect(onCompile).toHaveBeenCalledOnce();
    await watcher.close();
    vi.restoreAllMocks();
  });

  it('should match character class include patterns', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    const onCompile = vi.fn();
    let changeHandler: ((path: string) => void) | undefined;

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockImplementation(() => ({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
        })),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const watcher = await compiler.watch('./test.prs', {
      include: ['[ab].prs'],
      onCompile,
      debounce: 1,
    });

    changeHandler?.('./a.prs');
    await vi.advanceTimersByTimeAsync(1);

    expect(mockResolve).toHaveBeenCalledTimes(2);
    expect(onCompile).toHaveBeenCalledOnce();
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

    await watcher.close();

    vi.restoreAllMocks();
  });

  it('should report errors while handling a change', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    const onError = vi.fn();
    let changeHandler: ((path: string) => void) | undefined;
    const add = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('watch dependency update failed'));

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
            }
            return mockWatcher;
          }),
          close: vi.fn().mockResolvedValue(undefined),
          add,
        }),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: ['test'],
    });

    const watcher = await compiler.watch('./test.prs', {
      onError,
      debounce: 1,
    });

    changeHandler?.('./test.prs');
    await vi.advanceTimersByTimeAsync(1);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'watch dependency update failed' })
    );

    await watcher.close();
    vi.restoreAllMocks();
  });

  it('should report initial compilation errors while starting watch', async () => {
    const onError = vi.fn();

    const compileSpy = vi
      .spyOn(Compiler.prototype, 'compile')
      .mockRejectedValueOnce(new Error('initial watch compile failed'));

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue(mockWatcher),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [],
    });

    const watcher = await compiler.watch('./test.prs', { onError });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'initial watch compile failed' })
    );

    await watcher.close();
    compileSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should forward failed initial compilation results', async () => {
    const onCompile = vi.fn();
    const failedResult = {
      ast: null,
      sources: [],
      errors: [{ name: 'ResolveError', code: 'PS2001', message: 'Broken entry' }],
    };
    mockResolve.mockResolvedValue(failedResult);

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue(mockWatcher),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [],
    });

    const watcher = await compiler.watch('./test.prs', { onCompile });

    expect(onCompile).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: [expect.objectContaining({ message: 'Broken entry' })],
      }),
      []
    );

    await watcher.close();
    vi.restoreAllMocks();
  });

  it('should report failed initial compilation through onError', async () => {
    const onError = vi.fn();
    const failedResult = {
      ast: null,
      sources: [],
      errors: [],
    };
    mockResolve.mockResolvedValue(failedResult);

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue(mockWatcher),
      },
    }));

    const compiler = new Compiler({
      resolver: { registryPath: '/registry' },
      formatters: [],
    });

    const watcher = await compiler.watch('./test.prs', { onError });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Initial compilation failed' })
    );

    await watcher.close();
    vi.restoreAllMocks();
  });

  it('should serialize overlapping rebuilds', async () => {
    const ast = createTestProgram();
    const formatter = createMockFormatter('test');
    const onCompile = vi.fn();
    let changeHandler: ((path: string) => void) | undefined;
    const releaseRebuilds: Array<() => void> = [];
    let resolveCalls = 0;

    vi.spyOn(FormatterRegistry, 'get').mockReturnValue(formatter);
    mockResolve.mockImplementation(async () => {
      resolveCalls++;
      if (resolveCalls > 1) {
        await new Promise<void>((resolve) => {
          releaseRebuilds.push(resolve);
        });
      }
      return createResolveSuccess(ast);
    });
    mockValidate.mockReturnValue(createValidationSuccess());

    vi.doMock('chokidar', () => ({
      default: {
        watch: vi.fn().mockReturnValue({
          on: vi.fn().mockImplementation((event: string, handler: unknown) => {
            if (event === 'change') {
              changeHandler = handler as (path: string) => void;
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
      debounce: 1,
    });

    changeHandler?.('./first.prs');
    changeHandler?.('./coalesced.prs');
    await vi.advanceTimersByTimeAsync(1);
    expect(resolveCalls).toBe(2);

    changeHandler?.('./second.prs');
    await vi.advanceTimersByTimeAsync(1);
    releaseRebuilds.shift()?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(resolveCalls).toBe(3);

    changeHandler?.('./third.prs');
    await vi.advanceTimersByTimeAsync(1);
    expect(resolveCalls).toBe(3);
    releaseRebuilds.shift()?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(resolveCalls).toBe(4);
    releaseRebuilds.shift()?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(resolveCalls).toBe(4);
    expect(onCompile).toHaveBeenCalledTimes(3);

    await watcher.close();
    mockResolve.mockReset();
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
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

  it('should preserve managed output directory declarations', async () => {
    const ast = createTestProgram();
    const formatterWithManagedDirectory: Formatter = {
      name: 'factory',
      outputPath: 'AGENTS.md',
      description: 'Factory formatter',
      defaultConvention: 'markdown',
      format: vi.fn(() => ({
        path: 'AGENTS.md',
        content: '# AGENTS.md',
        managedOutputDirectories: ['.factory/rules'],
        additionalFiles: [
          {
            path: '.factory/rules/security.md',
            content: '# Security',
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
      formatters: [formatterWithManagedDirectory],
    });
    const result = await compiler.compile('.promptscript/project.prs');

    expect(result.outputs.get('AGENTS.md')?.managedOutputDirectories).toEqual(['.factory/rules']);
    expect(result.outputs.get('.factory/rules/security.md')?.content).toContain(
      '| target: factory'
    );
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

describe('Stage 1.5: Reference Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidate.mockReturnValue(createValidationSuccess());
  });

  it('should fall back to USERPROFILE for the default registry cache', async () => {
    vi.stubEnv('HOME', undefined);
    vi.stubEnv('USERPROFILE', '/users/test');
    mockResolve.mockResolvedValue(createResolveSuccess(createTestProgram()));
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: { version: 1, dependencies: {} },
      },
      formatters: [],
    });

    await compiler.compile('./test.prs');

    expect(mockRegistryCacheConstructor).toHaveBeenCalledWith(
      join('/users/test', '.promptscript', 'cache')
    );
  });

  it('should fall back to the temporary directory for the default registry cache', async () => {
    vi.stubEnv('HOME', undefined);
    vi.stubEnv('USERPROFILE', undefined);
    mockResolve.mockResolvedValue(createResolveSuccess(createTestProgram()));
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: { version: 1, dependencies: {} },
      },
      formatters: [],
    });

    await compiler.compile('./test.prs');

    expect(mockRegistryCacheConstructor).toHaveBeenCalledWith(
      join('/tmp', '.promptscript', 'cache')
    );
  });

  it('should collect registry references from skills blocks and pass to validator', async () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              mySkill: {
                description: 'test skill',
                references: ['ref1.md', 'ref2.md'],
              },
            },
            loc,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));

    const validatorConfig = {};
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: {
          version: 1,
          dependencies: {},
          references: {
            key1: { hash: 'sha256-abc', lockedAt: '2026-01-01T00:00:00Z' },
          },
        },
      },
      validator: validatorConfig,
      formatters: [],
    });

    await compiler.compile('./test.prs');

    // updateConfig should have been called with registryReferences
    expect(mockUpdateConfig).toHaveBeenCalled();
    const updateCall = mockUpdateConfig.mock.calls.find(
      (c) => c[0] && 'registryReferences' in (c[0] as Record<string, unknown>)
    );
    expect(updateCall).toBeDefined();
    const regRefs = (updateCall![0] as Record<string, unknown>)[
      'registryReferences'
    ] as Set<string>;
    expect(regRefs).toBeInstanceOf(Set);
    expect(regRefs.size).toBe(2);
    expect(regRefs.has('ref1.md')).toBe(true);
    expect(regRefs.has('ref2.md')).toBe(true);
  });

  it('should check Stage 1.5 when the lockfile references section is absent', async () => {
    const ast = createTestProgram();
    mockResolve.mockResolvedValue(createResolveSuccess(ast));

    const validatorConfig = {};
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: { version: 1, dependencies: {} },
      },
      validator: validatorConfig,
      formatters: [],
    });

    await compiler.compile('./test.prs');

    const refCall = mockUpdateConfig.mock.calls.find(
      (c) => c[0] && 'registryReferences' in (c[0] as Record<string, unknown>)
    );
    expect(refCall).toBeDefined();
  });

  it('should reject registry references missing from the lockfile', async () => {
    const repoUrl = 'github.com/org/repo';
    const version = 'v1.0.0';
    const loc: SourceLocation = {
      file: `/cache/registries/${repoUrl}/${version}/rules/main.prs`,
      line: 1,
      column: 1,
    };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              skill: { description: 'test', references: ['./references/guide.md'] },
            },
            loc,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: {
          version: 1,
          dependencies: {
            [repoUrl]: {
              version,
              commit: 'a'.repeat(40),
              integrity: 'sha256-test',
            },
          },
        },
      },
      formatters: [],
    });

    const result = await compiler.compile('./test.prs');

    expect(result.success).toBe(false);
    expect(result.errors[0]?.message).toContain('no integrity hash');
  });

  it('should accept a registry reference with a matching lockfile entry', async () => {
    const repoUrl = 'github.com/org/repo';
    const version = 'v1.0.0';
    const loc: SourceLocation = {
      file: `/cache/registries/${repoUrl}/${version}/rules/main.prs`,
      line: 1,
      column: 1,
    };
    const referenceKey = `${repoUrl}\0rules/references/guide.md\0${version}`;
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              skill: { description: 'test', references: ['./references/guide.md'] },
            },
            loc,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: {
          version: 1,
          dependencies: {
            [repoUrl]: {
              version,
              commit: 'a'.repeat(40),
              integrity: 'sha256-test',
            },
          },
          references: {
            [referenceKey]: {
              hash: 'sha256-reference',
              lockedAt: '2026-04-01T12:00:00Z',
            },
          },
        },
      },
      formatters: [],
    });

    const result = await compiler.compile('./test.prs');

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should collect references from blocks without source files', async () => {
    const locWithoutFile = { line: 1, column: 1 } as SourceLocation;
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc: locWithoutFile,
          content: {
            type: 'ObjectContent',
            properties: {
              skill: { description: 'test', references: ['./guide.md'] },
            },
            loc: locWithoutFile,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: {
          version: 1,
          dependencies: {
            'github.com/org/repo': {
              version: 'v1.0.0',
              commit: 'a'.repeat(40),
              integrity: 'sha256-test',
            },
          },
        },
      },
      formatters: [],
    });

    const result = await compiler.compile('./test.prs');

    expect(result.success).toBe(true);
    const updateCall = mockUpdateConfig.mock.calls.find(
      (call) => call[0] && 'registryReferences' in (call[0] as Record<string, unknown>)
    );
    const registryReferences = (updateCall?.[0] as Record<string, unknown> | undefined)?.[
      'registryReferences'
    ];
    expect(registryReferences).toEqual(new Set(['./guide.md']));
  });

  it('should use configured roots when a repository cannot be vendored', async () => {
    const repoUrl = 'file:///tmp/registry';
    const version = 'main';
    const repositoryPath = '/custom/default-registry';
    const loc: SourceLocation = {
      file: `${repositoryPath}/rules.prs`,
      line: 1,
      column: 1,
    };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              skill: { description: 'test', references: ['./guide.md'] },
            },
            loc,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    const compiler = createTestCompiler({
      resolver: {
        registryPath: repositoryPath,
        vendorDir: '/vendor',
        referenceRoots: { [repoUrl]: [repositoryPath] },
        lockfile: {
          version: 1,
          dependencies: {
            [repoUrl]: {
              version,
              commit: 'a'.repeat(40),
              integrity: 'sha256-test',
            },
          },
        },
      },
      formatters: [],
    });

    const result = await compiler.compile('./test.prs');

    expect(result.success).toBe(false);
    expect(result.errors[0]?.message).toContain('no integrity hash');
  });

  it('should reject registry reference paths that escape their repository', async () => {
    const repoUrl = 'github.com/org/repo';
    const version = 'v1.0.0';
    const loc: SourceLocation = {
      file: `/cache/registries/${repoUrl}/${version}/rules.prs`,
      line: 1,
      column: 1,
    };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              skill: { description: 'test', references: ['../outside.md'] },
            },
            loc,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: {
          version: 1,
          dependencies: {
            [repoUrl]: {
              version,
              commit: 'a'.repeat(40),
              integrity: 'sha256-test',
            },
          },
        },
      },
      formatters: [],
    });

    const result = await compiler.compile('./test.prs');

    expect(result.success).toBe(false);
    expect(result.errors[0]?.message).toContain('escapes its repository');
  });

  it('should set ignoreHashes on validator when flag is true', async () => {
    const ast = createTestProgram();
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const validatorConfig = {};
    const compiler = createTestCompiler({
      resolver: { registryPath: '/registry' },
      validator: validatorConfig,
      formatters: [],
      ignoreHashes: true,
    });

    await compiler.compile('./test.prs');

    expect(mockUpdateConfig).toHaveBeenCalledWith({ ignoreHashes: true });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('--ignore-hashes is set'));
    errorSpy.mockRestore();
  });

  it('should skip non-skills blocks when collecting references', async () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'identity',
          loc,
          content: { type: 'TextContent', value: 'I am a bot', loc },
        },
        {
          type: 'Block',
          name: 'skills',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              mySkill: { description: 'test', references: ['reg-ref.md'] },
            },
            loc,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));

    const validatorConfig = {};
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: { version: 1, dependencies: {}, references: {} },
      },
      validator: validatorConfig,
      formatters: [],
    });

    await compiler.compile('./test.prs');

    const updateCall = mockUpdateConfig.mock.calls.find(
      (c) => c[0] && 'registryReferences' in (c[0] as Record<string, unknown>)
    );
    expect(updateCall).toBeDefined();
    const regRefs = (updateCall![0] as Record<string, unknown>)[
      'registryReferences'
    ] as Set<string>;
    expect(regRefs.size).toBe(1);
    expect(regRefs.has('reg-ref.md')).toBe(true);
  });

  it('should skip skills without references property', async () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              skillNoRefs: { description: 'no refs' },
              skillWithRefs: { description: 'has refs', references: ['a.md'] },
            },
            loc,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));

    const validatorConfig = {};
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: { version: 1, dependencies: {}, references: {} },
      },
      validator: validatorConfig,
      formatters: [],
    });

    await compiler.compile('./test.prs');

    const updateCall = mockUpdateConfig.mock.calls.find(
      (c) => c[0] && 'registryReferences' in (c[0] as Record<string, unknown>)
    );
    expect(updateCall).toBeDefined();
    const regRefs = (updateCall![0] as Record<string, unknown>)[
      'registryReferences'
    ] as Set<string>;
    expect(regRefs.size).toBe(1);
  });

  it('should handle non-array references property', async () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              mySkill: { description: 'test', references: 'not-an-array' },
            },
            loc,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));

    const validatorConfig = {};
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: { version: 1, dependencies: {}, references: {} },
      },
      validator: validatorConfig,
      formatters: [],
    });

    await compiler.compile('./test.prs');

    const updateCall = mockUpdateConfig.mock.calls.find(
      (c) => c[0] && 'registryReferences' in (c[0] as Record<string, unknown>)
    );
    expect(updateCall).toBeDefined();
    const regRefs = (updateCall![0] as Record<string, unknown>)[
      'registryReferences'
    ] as Set<string>;
    expect(regRefs.size).toBe(0);
  });

  it('should skip non-string entries in references array', async () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              mySkill: { description: 'test', references: [42, null, 'valid.md'] },
            },
            loc,
          },
        },
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));

    const validatorConfig = {};
    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: { version: 1, dependencies: {}, references: {} },
      },
      validator: validatorConfig,
      formatters: [],
    });

    await compiler.compile('./test.prs');

    const updateCall = mockUpdateConfig.mock.calls.find(
      (c) => c[0] && 'registryReferences' in (c[0] as Record<string, unknown>)
    );
    expect(updateCall).toBeDefined();
    const regRefs = (updateCall![0] as Record<string, unknown>)[
      'registryReferences'
    ] as Set<string>;
    expect(regRefs.size).toBe(1);
    expect(regRefs.has('valid.md')).toBe(true);
  });

  it('should return compile errors when verifyReferenceHashes finds mismatches', async () => {
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc: { file: 'test.prs', line: 1, column: 1 },
          content: {
            type: 'ObjectContent',
            properties: {
              mySkill: {
                references: ['./ref.md'],
              } as unknown as Record<string, unknown>,
            },
            loc: { file: 'test.prs', line: 1, column: 1 },
          } as unknown as import('@promptscript/core').BlockContent,
        } as unknown as import('@promptscript/core').Block,
      ],
    });
    mockResolve.mockResolvedValue(createResolveSuccess(ast));

    // Mock verifyReferenceHashes to return hash mismatch errors
    const hashError = {
      message: 'Reference file hash mismatch: ./ref.md has changed since last lock.',
      code: 'PS_LOCKFILE_INTEGRITY',
      name: 'ResolveError',
    };
    mockVerifyReferenceHashes.mockResolvedValueOnce([hashError]);

    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: {
          version: 1,
          dependencies: {},
          references: {
            'repo\0./ref.md\0v1.0.0': {
              hash: 'abc',
              lockedAt: '2026-01-01T00:00:00Z',
            },
          },
        },
      },
      formatters: [],
    });

    const result = await compiler.compile('./test.prs');

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]!.message).toContain('hash mismatch');
  });

  it('should call updateConfig with ignoreHashes when --ignore-hashes is set', async () => {
    const ast = createTestProgram();
    mockResolve.mockResolvedValue(createResolveSuccess(ast));
    mockValidate.mockReturnValue({ valid: true, errors: [], warnings: [], infos: [], all: [] });

    const compiler = createTestCompiler({
      resolver: {
        registryPath: '/registry',
        lockfile: {
          version: 1,
          dependencies: {},
          references: {
            'repo\0./ref.md\0v1.0.0': {
              hash: 'abc',
              lockedAt: '2026-01-01T00:00:00Z',
            },
          },
        },
      },
      ignoreHashes: true,
      formatters: [],
    });

    await compiler.compile('./test.prs');

    const ignoreCall = mockUpdateConfig.mock.calls.find(
      (c) => c[0] && 'ignoreHashes' in (c[0] as Record<string, unknown>)
    );
    expect(ignoreCall).toBeDefined();
    expect((ignoreCall![0] as Record<string, unknown>)['ignoreHashes']).toBe(true);
  });
});
