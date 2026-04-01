import { describe, it, expect } from 'vitest';
import { parse } from '../parse.js';

// ============================================================
// Inline @use — Parser Tests
//
// The grammar allows @use declarations inside block content.
// The visitor collects them as InlineUseDeclaration nodes and
// attaches them to ObjectContent.inlineUses on the block that
// directly contains the @use (not on a nested skill object).
// ============================================================

describe('inline @use in block content', () => {
  describe('basic relative path', () => {
    it('should parse @use ./path inside a skills block without errors', () => {
      const source = `
        @skills {
          ops: {
            description: "Operations skill"
          }
          @use ./shared/ops
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();
    });

    it('should attach inlineUses to the skills block ObjectContent', () => {
      const source = `
        @skills {
          ops: {
            description: "Operations skill"
          }
          @use ./shared/ops
        }
      `;
      const result = parse(source);

      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skills?.content.type).toBe('ObjectContent');
      if (skills?.content.type === 'ObjectContent') {
        expect(skills.content.inlineUses).toHaveLength(1);
        const decl = skills.content.inlineUses![0]!;
        expect(decl.type).toBe('InlineUseDeclaration');
        expect(decl.path.isRelative).toBe(true);
        expect(decl.path.segments).toEqual(['shared', 'ops']);
      }
    });

    it('should preserve the raw path value', () => {
      const source = `
        @skills {
          @use ./tools/build
        }
      `;
      const result = parse(source);

      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.path.raw).toBe('./tools/build');
      }
    });

    it('should have no params when none are specified', () => {
      const source = `
        @skills {
          @use ./shared/ops
        }
      `;
      const result = parse(source);

      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.params).toBeUndefined();
        expect(decl.alias).toBeUndefined();
      }
    });
  });

  describe('@use with parameters', () => {
    it('should parse @use ./path(key: "value") with a single parameter', () => {
      const source = `
        @skills {
          @use ./shared/ops(env: "production")
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.params).toHaveLength(1);
        expect(decl.params![0]!.name).toBe('env');
        expect(decl.params![0]!.value).toBe('production');
      }
    });

    it('should parse @use ./path with multiple parameters', () => {
      const source = `
        @skills {
          @use ./shared/ops(env: "staging", debug: true)
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.params).toHaveLength(2);
        expect(decl.params![0]!.name).toBe('env');
        expect(decl.params![0]!.value).toBe('staging');
        expect(decl.params![1]!.name).toBe('debug');
        expect(decl.params![1]!.value).toBe(true);
      }
    });

    it('should parse @use with numeric parameter', () => {
      const source = `
        @skills {
          @use ./shared/ops(timeout: 30)
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.params).toHaveLength(1);
        expect(decl.params![0]!.value).toBe(30);
      }
    });
  });

  describe('@use with alias', () => {
    it('should parse @use ./path as alias', () => {
      const source = `
        @skills {
          @use ./shared/ops as myOps
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.alias).toBe('myOps');
        expect(decl.path.isRelative).toBe(true);
        expect(decl.path.segments).toEqual(['shared', 'ops']);
      }
    });

    it('should parse @use with both parameters and alias', () => {
      const source = `
        @skills {
          @use ./shared/ops(env: "prod") as prodOps
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.alias).toBe('prodOps');
        expect(decl.params).toHaveLength(1);
        expect(decl.params![0]!.name).toBe('env');
        expect(decl.params![0]!.value).toBe('prod');
      }
    });
  });

  describe('multiple @use declarations', () => {
    it('should collect all @use declarations into inlineUses array', () => {
      const source = `
        @skills {
          @use ./phase-one
          @use ./phase-two
          @use ./phase-three
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        expect(skills.content.inlineUses).toHaveLength(3);
        expect(skills.content.inlineUses![0]!.path.segments).toEqual(['phase-one']);
        expect(skills.content.inlineUses![1]!.path.segments).toEqual(['phase-two']);
        expect(skills.content.inlineUses![2]!.path.segments).toEqual(['phase-three']);
      }
    });

    it('should parse @use declarations mixed with skill property fields', () => {
      const source = `
        @skills {
          deploy: {
            description: "Deploy skill"
          }
          @use ./shared/pre-checks
          rollback: {
            description: "Rollback skill"
          }
          @use ./shared/post-checks
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        // Properties are preserved
        expect(skills.content.properties['deploy']).toBeDefined();
        expect(skills.content.properties['rollback']).toBeDefined();
        // Both inline uses are collected
        expect(skills.content.inlineUses).toHaveLength(2);
        expect(skills.content.inlineUses![0]!.path.segments).toEqual(['shared', 'pre-checks']);
        expect(skills.content.inlineUses![1]!.path.segments).toEqual(['shared', 'post-checks']);
      }
    });
  });

  describe('absolute and URL paths', () => {
    it('should parse @use with absolute namespace path', () => {
      const source = `
        @skills {
          @use @acme/shared-skills
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.path.isRelative).toBe(false);
        expect(decl.path.namespace).toBe('acme');
        expect(decl.path.segments).toEqual(['shared-skills']);
      }
    });

    it('should parse @use with versioned absolute path', () => {
      const source = `
        @skills {
          @use @acme/shared-skills@2.0.0
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.path.version).toBe('2.0.0');
      }
    });
  });

  describe('source location tracking', () => {
    it('should record source location on InlineUseDeclaration', () => {
      const source = `@skills {\n  @use ./shared/ops\n}`;
      const result = parse(source, { filename: 'test.prs' });

      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        const decl = skills.content.inlineUses![0]!;
        expect(decl.loc.file).toBe('test.prs');
        expect(decl.loc.line).toBe(2);
      }
    });
  });

  describe('regression: blocks without @use', () => {
    it('should produce no inlineUses on a plain skills block', () => {
      const source = `
        @skills {
          commit: {
            description: "Create git commits"
          }
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skills?.content.type).toBe('ObjectContent');
      if (skills?.content.type === 'ObjectContent') {
        expect(skills.content.inlineUses).toBeUndefined();
      }
    });

    it('should produce no inlineUses on a non-skills block', () => {
      const source = `
        @standards {
          style: "clean"
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const standards = result.ast?.blocks.find((b) => b.name === 'standards');
      expect(standards?.content.type).toBe('ObjectContent');
      if (standards?.content.type === 'ObjectContent') {
        expect(standards.content.inlineUses).toBeUndefined();
      }
    });

    it('should produce no inlineUses on a text-content block', () => {
      const source = `
        @identity {
          """
          You are a helpful assistant.
          """
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const identity = result.ast?.blocks.find((b) => b.name === 'identity');
      expect(identity?.content.type).toBe('TextContent');
      // TextContent has no inlineUses property at all
      expect(
        (identity?.content as unknown as Record<string, unknown>)['inlineUses']
      ).toBeUndefined();
    });

    it('should not affect top-level @use declarations', () => {
      const source = `
        @use ./some/lib
        @skills {
          @use ./shared/ops
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      // Top-level uses are still on program.uses
      expect(result.ast?.uses).toHaveLength(1);
      expect(result.ast?.uses[0]!.type).toBe('UseDeclaration');

      // Inline use is on the skills block
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      if (skills?.content.type === 'ObjectContent') {
        expect(skills.content.inlineUses).toHaveLength(1);
        expect(skills.content.inlineUses![0]!.type).toBe('InlineUseDeclaration');
      }
    });
  });
});
