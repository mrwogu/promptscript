import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, parseOrThrow } from '../parse';
import { ParseError } from '@promptscript/core';

const fixturesDir = join(__dirname, '__fixtures__');

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

describe('parse', () => {
  describe('minimal example', () => {
    it('should parse a minimal PromptScript file', () => {
      const source = loadFixture('minimal.prs');
      const result = parse(source, { filename: 'minimal.prs' });

      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();
      expect(result.ast?.type).toBe('Program');
      expect(result.ast?.meta).toBeDefined();
      expect(result.ast?.meta?.fields['id']).toBe('test-project');
      expect(result.ast?.meta?.fields['syntax']).toBe('1.0.0');
    });
  });

  describe('complete example', () => {
    it('should parse a complete PromptScript file', () => {
      const source = loadFixture('complete.prs');
      const result = parse(source, { filename: 'complete.prs' });

      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();
    });

    it('should parse meta block', () => {
      const source = loadFixture('complete.prs');
      const result = parse(source);

      expect(result.ast?.meta?.fields['id']).toBe('my-project');
      expect(result.ast?.meta?.fields['syntax']).toBe('1.0.0');
      expect(result.ast?.meta?.fields['tags']).toEqual(['frontend', 'typescript']);
    });

    it('should parse inherit declaration', () => {
      const source = loadFixture('complete.prs');
      const result = parse(source);

      expect(result.ast?.inherit).toBeDefined();
      expect(result.ast?.inherit?.path.namespace).toBe('company');
      expect(result.ast?.inherit?.path.segments).toEqual(['frontend-team']);
    });

    it('should parse use declarations', () => {
      const source = loadFixture('complete.prs');
      const result = parse(source);

      expect(result.ast?.uses).toHaveLength(2);
      expect(result.ast?.uses[0]?.path.namespace).toBe('core');
      expect(result.ast?.uses[0]?.alias).toBeUndefined();
      expect(result.ast?.uses[1]?.alias).toBe('sec');
    });

    it('should parse blocks', () => {
      const source = loadFixture('complete.prs');
      const result = parse(source);

      const blockNames = result.ast?.blocks.map((b) => b.name);
      expect(blockNames).toContain('identity');
      expect(blockNames).toContain('context');
      expect(blockNames).toContain('standards');
      expect(blockNames).toContain('restrictions');
      expect(blockNames).toContain('shortcuts');
      expect(blockNames).toContain('params');
    });

    it('should parse extend blocks', () => {
      const source = loadFixture('complete.prs');
      const result = parse(source);

      expect(result.ast?.extends).toHaveLength(1);
      expect(result.ast?.extends[0]?.targetPath).toBe('standards.code');
    });
  });

  describe('meta block', () => {
    it('should parse simple meta fields', () => {
      const source = `
        @meta {
          id: "test"
          syntax: "1.0.0"
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast?.meta?.fields['id']).toBe('test');
      expect(result.ast?.meta?.fields['syntax']).toBe('1.0.0');
    });

    it('should parse arrays in meta', () => {
      const source = `
        @meta {
          tags: [frontend, backend, api]
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast?.meta?.fields['tags']).toEqual(['frontend', 'backend', 'api']);
    });
  });

  describe('text content', () => {
    it('should parse text blocks', () => {
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
      expect(identity).toBeDefined();
      expect(identity?.content.type).toBe('TextContent');
    });
  });

  describe('restrictions', () => {
    it('should parse restriction items', () => {
      const source = `
        @restrictions {
          - "Never expose secrets"
          - "Always validate input"
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const restrictions = result.ast?.blocks.find((b) => b.name === 'restrictions');
      expect(restrictions).toBeDefined();
      expect(restrictions?.content.type).toBe('ObjectContent');
      if (restrictions?.content.type === 'ObjectContent') {
        expect(restrictions.content.properties['items']).toEqual([
          'Never expose secrets',
          'Always validate input',
        ]);
      }
    });
  });

  describe('type expressions', () => {
    it('should parse range types', () => {
      const source = `
        @params {
          level: range(1..10)
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const params = result.ast?.blocks.find((b) => b.name === 'params');
      expect(params?.content.type).toBe('ObjectContent');
      if (params?.content.type === 'ObjectContent') {
        const level = params.content.properties['level'];
        expect(level).toHaveProperty('type', 'TypeExpression');
        expect(level).toHaveProperty('kind', 'range');
      }
    });

    it('should parse enum types', () => {
      const source = `
        @params {
          format: enum("json", "xml", "text")
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const params = result.ast?.blocks.find((b) => b.name === 'params');
      if (params?.content.type === 'ObjectContent') {
        const format = params.content.properties['format'];
        expect(format).toHaveProperty('type', 'TypeExpression');
        expect(format).toHaveProperty('kind', 'enum');
      }
    });
  });

  describe('path references', () => {
    it('should parse absolute paths', () => {
      const source = '@inherit @org/project/file';
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast?.inherit?.path.namespace).toBe('org');
      expect(result.ast?.inherit?.path.segments).toEqual(['project', 'file']);
      expect(result.ast?.inherit?.path.isRelative).toBe(false);
    });

    it('should parse versioned paths', () => {
      const source = '@inherit @org/lib@2.0.0';
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast?.inherit?.path.version).toBe('2.0.0');
    });

    it('should parse relative paths', () => {
      const source = '@inherit ./local/file';
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast?.inherit?.path.isRelative).toBe(true);
      expect(result.ast?.inherit?.path.segments).toEqual(['local', 'file']);
    });
  });

  describe('error handling', () => {
    it('should return errors for invalid syntax', () => {
      const source = '@meta { id }'; // Missing colon and value
      const result = parse(source);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.ast).toBeNull();
    });

    it('should include file location in errors', () => {
      const source = '@meta { id }';
      const result = parse(source, { filename: 'test.prs' });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.location?.file).toBe('test.prs');
    });

    it('should support tolerant mode', () => {
      const source = '@meta { id }';
      const result = parse(source, { tolerant: true });

      expect(result.errors.length).toBeGreaterThan(0);
      // In tolerant mode, we still try to produce an AST
    });
  });

  describe('nested objects', () => {
    it('should parse nested objects', () => {
      const source = `
        @standards {
          code: {
            style: "clean"
            testing: {
              required: true
              coverage: 80
            }
          }
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const standards = result.ast?.blocks.find((b) => b.name === 'standards');
      expect(standards?.content.type).toBe('ObjectContent');
      if (standards?.content.type === 'ObjectContent') {
        const code = standards.content.properties['code'] as Record<string, unknown>;
        expect(code['style']).toBe('clean');
        const testing = code['testing'] as Record<string, unknown>;
        expect(testing['required']).toBe(true);
        expect(testing['coverage']).toBe(80);
      }
    });
  });

  describe('literal values', () => {
    it('should parse boolean values', () => {
      const source = `
        @meta {
          enabled: true
          disabled: false
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast?.meta?.fields['enabled']).toBe(true);
      expect(result.ast?.meta?.fields['disabled']).toBe(false);
    });

    it('should parse null values', () => {
      const source = `
        @meta {
          optional: null
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast?.meta?.fields['optional']).toBeNull();
    });

    it('should parse numeric values', () => {
      const source = `
        @meta {
          count: 42
          ratio: 3.14
          negative: -10
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast?.meta?.fields['count']).toBe(42);
      expect(result.ast?.meta?.fields['ratio']).toBe(3.14);
      expect(result.ast?.meta?.fields['negative']).toBe(-10);
    });
  });

  describe('source locations', () => {
    it('should track source locations for meta block', () => {
      const source = '@meta {\n  id: "test"\n}';
      const result = parse(source, { filename: 'test.prs' });

      expect(result.ast?.meta?.loc.file).toBe('test.prs');
      expect(result.ast?.meta?.loc.line).toBe(1);
      expect(result.ast?.meta?.loc.column).toBe(1);
    });
  });

  describe('skills block', () => {
    it('should parse skills block with nested skill definitions', () => {
      const source = `
        @skills {
          commit: {
            description: "Create git commits"
            disableModelInvocation: true
            content: "Instructions for commit skill..."
          }
          review: {
            description: "Review code changes"
            userInvocable: true
          }
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skills).toBeDefined();
      expect(skills?.content.type).toBe('ObjectContent');
      if (skills?.content.type === 'ObjectContent') {
        const commit = skills.content.properties['commit'] as Record<string, unknown>;
        expect(commit['description']).toBe('Create git commits');
        expect(commit['disableModelInvocation']).toBe(true);
        expect(commit['content']).toBe('Instructions for commit skill...');

        const review = skills.content.properties['review'] as Record<string, unknown>;
        expect(review['description']).toBe('Review code changes');
        expect(review['userInvocable']).toBe(true);
      }
    });

    it('should parse skills block with arrays', () => {
      const source = `
        @skills {
          deploy: {
            description: "Deploy the application"
            allowedTools: ["Bash", "Read", "Write"]
            context: "fork"
            agent: "general-purpose"
          }
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const skills = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skills?.content.type).toBe('ObjectContent');
      if (skills?.content.type === 'ObjectContent') {
        const deploy = skills.content.properties['deploy'] as Record<string, unknown>;
        expect(deploy['allowedTools']).toEqual(['Bash', 'Read', 'Write']);
        expect(deploy['context']).toBe('fork');
        expect(deploy['agent']).toBe('general-purpose');
      }
    });
  });

  describe('local block', () => {
    it('should parse local block with text content', () => {
      const source = `
        @local {
          """
          Private instructions for local development.
          This content is not committed to git.
          """
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const local = result.ast?.blocks.find((b) => b.name === 'local');
      expect(local).toBeDefined();
      expect(local?.content.type).toBe('TextContent');
      if (local?.content.type === 'TextContent') {
        expect(local.content.value).toContain('Private instructions');
        expect(local.content.value).toContain('not committed to git');
      }
    });

    it('should parse local block with object content', () => {
      const source = `
        @local {
          apiKey: "dev-secret-key"
          debugMode: true
          customPaths: ["/tmp/dev", "/var/local"]
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const local = result.ast?.blocks.find((b) => b.name === 'local');
      expect(local?.content.type).toBe('ObjectContent');
      if (local?.content.type === 'ObjectContent') {
        expect(local.content.properties['apiKey']).toBe('dev-secret-key');
        expect(local.content.properties['debugMode']).toBe(true);
        expect(local.content.properties['customPaths']).toEqual(['/tmp/dev', '/var/local']);
      }
    });

    it('should parse local block with mixed content', () => {
      const source = `
        @local {
          """
          Local development notes.
          """
          envFile: ".env.local"
        }
      `;
      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      const local = result.ast?.blocks.find((b) => b.name === 'local');
      expect(local?.content.type).toBe('MixedContent');
      if (local?.content.type === 'MixedContent') {
        expect(local.content.text?.value).toContain('Local development notes');
        expect(local.content.properties['envFile']).toBe('.env.local');
      }
    });
  });
});

describe('parseOrThrow', () => {
  it('should return AST on success', () => {
    const source = '@meta { id: "test" }';
    const ast = parseOrThrow(source);

    expect(ast.type).toBe('Program');
    expect(ast.meta?.fields['id']).toBe('test');
  });

  it('should throw ParseError on failure', () => {
    const source = '@meta { invalid';

    expect(() => parseOrThrow(source)).toThrow(ParseError);
  });

  it('should include filename in thrown error', () => {
    const source = '@meta { invalid';

    try {
      parseOrThrow(source, { filename: 'test.prs' });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ParseError);
      expect((error as ParseError).location?.file).toBe('test.prs');
    }
  });
});
