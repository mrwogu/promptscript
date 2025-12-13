import { describe, expect, it, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { CursorFormatter, CURSOR_VERSIONS } from '../formatters/cursor';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

const createMinimalProgram = (): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
});

describe('CursorFormatter', () => {
  let formatter: CursorFormatter;

  beforeEach(() => {
    formatter = new CursorFormatter();
  });

  it('should have correct name, outputPath and description', () => {
    expect(formatter.name).toBe('cursor');
    expect(formatter.outputPath).toBe('.cursor/rules/project.mdc');
    expect(formatter.description).toBe('Cursor rules (MDC with frontmatter)');
  });

  describe('convention validation', () => {
    it('should throw error when using xml convention', () => {
      const ast = createMinimalProgram();
      expect(() => formatter.format(ast, { convention: 'xml' })).toThrow(
        "Cursor formatter does not support 'xml' convention. Only 'markdown' convention is supported for Cursor targets."
      );
    });

    it('should throw error when using custom convention', () => {
      const ast = createMinimalProgram();
      expect(() => formatter.format(ast, { convention: 'custom' })).toThrow(
        "Cursor formatter does not support 'custom' convention. Only 'markdown' convention is supported for Cursor targets."
      );
    });

    it('should work with markdown convention', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.path).toBe('.cursor/rules/project.mdc');
    });

    it('should work without convention (defaults to markdown)', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);
      expect(result.path).toBe('.cursor/rules/project.mdc');
    });
  });

  describe('format', () => {
    it('should generate intro with default project', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);
      expect(result.path).toBe('.cursor/rules/project.mdc');
      expect(result.content).toContain('You are working on the project.');
    });

    it('should generate intro with project from context', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                project: 'Checkout Service',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('You are working on Checkout Service.');
    });

    it('should generate intro with project from identity fallback', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'E-commerce platform backend',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('You are working on E-commerce platform backend.');
    });

    it('should include organization in intro when available', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        meta: {
          type: 'MetaBlock',
          fields: { org: 'Acme Corp' },
          loc: createLoc(),
        },
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                project: 'Checkout Service',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('You are working on Checkout Service at Acme Corp.');
    });

    it('should generate tech stack as plain text', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  languages: ['TypeScript'],
                  frameworks: ['React', 'Node.js'],
                  testing: ['Vitest'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Tech stack: TypeScript, React, Node.js, Vitest');
    });

    it('should generate code style section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                typescript: {
                  style: 'Functional React components',
                  hooks: 'Custom hooks for business logic',
                },
                naming: {
                  exports: 'Named exports only',
                  components: 'No class components',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Code style:');
      expect(result.content).toContain('- style: Functional React components');
      expect(result.content).toContain('- hooks: Custom hooks for business logic');
      expect(result.content).toContain('- exports: Named exports only');
      expect(result.content).toContain('- components: No class components');
    });

    it('should generate commands section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Review code for quality',
                '/test': 'Write comprehensive tests',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Commands:');
      expect(result.content).toContain('/review - Review code for quality');
      expect(result.content).toContain('/test - Write comprehensive tests');
    });

    it('should generate never section from restrictions array', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Expose API keys or secrets', 'Use any types', 'Skip input validation'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Never:');
      expect(result.content).toContain('- Expose API keys or secrets');
      expect(result.content).toContain('- Use any types');
      expect(result.content).toContain('- Skip input validation');
    });

    it('should handle text content for never section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: 'Expose secrets\nSkip validation\n- Already prefixed',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Never:');
      expect(result.content).toContain('- Expose secrets');
      expect(result.content).toContain('- Skip validation');
      expect(result.content).toContain('- Already prefixed');
    });

    it('should separate sections with double newlines (no markdown)', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        meta: {
          type: 'MetaBlock',
          fields: { org: 'Test' },
          loc: createLoc(),
        },
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  languages: ['TypeScript'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['No secrets'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('\n\n');
      expect(result.content).not.toContain('##');
      // Frontmatter uses --- but content shouldn't have additional horizontal rules
      expect(result.content).toMatch(/^---\ndescription:/);
    });

    it('should skip empty sections', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {},
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Tech stack:');
      expect(result.content).not.toContain('Code style:');
    });

    it('should handle single value tech items', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  languages: 'TypeScript',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Tech stack: TypeScript');
    });

    it('should skip never section when content is ObjectContent', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                key: 'value',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Never:');
    });
  });

  describe('version support', () => {
    it('should expose supported versions', () => {
      const versions = CursorFormatter.getSupportedVersions();
      expect(versions.modern).toBeDefined();
      expect(versions.legacy).toBeDefined();
      expect(versions.modern.outputPath).toBe('.cursor/rules/project.mdc');
      expect(versions.legacy.outputPath).toBe('.cursorrules');
    });

    it('should have version metadata', () => {
      expect(CURSOR_VERSIONS.modern.cursorVersion).toBe('0.45+');
      expect(CURSOR_VERSIONS.legacy.deprecated).toBe(true);
    });

    describe('modern format (default)', () => {
      it('should generate MDC with frontmatter', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast);

        expect(result.path).toBe('.cursor/rules/project.mdc');
        expect(result.content).toMatch(/^---\n/);
        expect(result.content).toContain('alwaysApply: true');
        expect(result.content).toContain('---\n\n');
      });

      it('should use modern format when version is undefined', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast, {});

        expect(result.path).toBe('.cursor/rules/project.mdc');
        expect(result.content).toMatch(/^---\n/);
      });

      it('should use modern format when version is "modern"', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast, { version: 'modern' });

        expect(result.path).toBe('.cursor/rules/project.mdc');
        expect(result.content).toMatch(/^---\n/);
      });
    });

    describe('legacy format', () => {
      it('should generate plain text without frontmatter', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast, { version: 'legacy' });

        expect(result.path).toBe('.cursorrules');
        expect(result.content).not.toMatch(/^---\n/);
        expect(result.content).not.toContain('alwaysApply');
      });

      it('should start with intro text', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast, { version: 'legacy' });

        expect(result.content).toMatch(/^You are working on/);
      });

      it('should allow custom output path in legacy mode', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast, {
          version: 'legacy',
          outputPath: 'custom/.cursorrules',
        });

        expect(result.path).toBe('custom/.cursorrules');
      });
    });

    describe('multifile format', () => {
      it('should generate main file with alwaysApply', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast, { version: 'multifile' });

        expect(result.path).toBe('.cursor/rules/project.mdc');
        expect(result.content).toContain('alwaysApply: true');
      });

      it('should extract TypeScript globs and generate separate file', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'guards',
              content: {
                type: 'ObjectContent',
                properties: {
                  globs: ['*.ts', '*.tsx'],
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
            {
              type: 'Block',
              name: 'standards',
              content: {
                type: 'ObjectContent',
                properties: {
                  typescript: {
                    strict: 'Enable strict mode',
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'multifile' });

        expect(result.additionalFiles).toBeDefined();
        expect(result.additionalFiles?.length).toBeGreaterThan(0);

        const tsFile = result.additionalFiles?.find((f) => f.path.includes('typescript.mdc'));
        expect(tsFile).toBeDefined();
        expect(tsFile?.content).toContain('globs:');
        expect(tsFile?.content).toContain('*.ts');
        expect(tsFile?.content).toContain('*.tsx');
        expect(tsFile?.content).toContain('TypeScript-specific rules');
      });

      it('should extract testing globs and generate separate file', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'guards',
              content: {
                type: 'ObjectContent',
                properties: {
                  globs: ['**/*.spec.ts', '**/__tests__/**'],
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'multifile' });

        expect(result.additionalFiles).toBeDefined();

        const testFile = result.additionalFiles?.find((f) => f.path.includes('testing.mdc'));
        expect(testFile).toBeDefined();
        expect(testFile?.content).toContain('globs:');
        expect(testFile?.content).toContain('Testing-specific rules');
      });

      it('should generate shortcuts file for manual activation', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'shortcuts',
              content: {
                type: 'ObjectContent',
                properties: {
                  '/test': 'Run tests',
                  '/deploy': {
                    description: 'Deploy workflow',
                    steps: ['Build', 'Test', 'Deploy'],
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'multifile' });

        expect(result.additionalFiles).toBeDefined();

        const shortcutsFile = result.additionalFiles?.find((f) => f.path.includes('shortcuts.mdc'));
        expect(shortcutsFile).toBeDefined();
        expect(shortcutsFile?.content).toContain('alwaysApply: false');
        expect(shortcutsFile?.content).toContain('## Commands');
        expect(shortcutsFile?.content).toContain('/test');
        expect(shortcutsFile?.content).toContain('/deploy');
        expect(shortcutsFile?.content).toContain('**Steps:**');
        expect(shortcutsFile?.content).toContain('1. Build');
      });

      it('should not generate additional files when no guards or shortcuts', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast, { version: 'multifile' });

        expect(result.additionalFiles).toBeUndefined();
      });

      it('should treat frontmatter version as modern', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast, { version: 'frontmatter' });

        expect(result.path).toBe('.cursor/rules/project.mdc');
        expect(result.content).toContain('alwaysApply: true');
        expect(result.additionalFiles).toBeUndefined();
      });

      it('should have multifile version in CURSOR_VERSIONS', () => {
        expect(CURSOR_VERSIONS.multifile).toBeDefined();
        expect(CURSOR_VERSIONS.multifile.name).toBe('multifile');
        expect(CURSOR_VERSIONS.frontmatter).toBeDefined();
      });
    });
  });
});
