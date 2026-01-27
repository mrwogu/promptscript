import { describe, it, expect } from 'vitest';
import {
  compile,
  compileFor,
  VirtualFileSystem,
  BrowserCompiler,
  getBundledRegistryFiles,
} from '../index.js';

describe('compile', () => {
  it('should compile a simple file', async () => {
    const files = {
      'project.prs': `
        @meta {
          id: "test-project"
          syntax: "1.0.0"
        }
        @identity {
          """You are a helpful assistant."""
        }
      `,
    };

    const result = await compile(files, 'project.prs');

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.outputs.size).toBeGreaterThan(0);

    // Check that Claude output exists
    const claudeOutput = result.outputs.get('CLAUDE.md');
    expect(claudeOutput).toBeDefined();
    expect(claudeOutput?.content).toContain('helpful assistant');
  });

  it('should return errors for invalid syntax', async () => {
    const files = {
      'project.prs': `
        @meta {
          id: "invalid
        }
      `,
    };

    const result = await compile(files, 'project.prs');

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return error for missing entry file', async () => {
    const files = {
      'other.prs': '@meta { id: "other" syntax: "1.0.0" }',
    };

    const result = await compile(files, 'missing.prs');

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.message.includes('not found'))).toBe(true);
  });

  it('should support inheritance with bundled registry', async () => {
    const files = {
      'project.prs': `@meta {
  id: "test-project"
  syntax: "1.0.0"
}
@inherit @core/base`,
    };

    const result = await compile(files, 'project.prs', { bundledRegistry: true });

    if (!result.success) {
      console.log('Inheritance test errors:', JSON.stringify(result.errors, null, 2));
    }

    expect(result.success).toBe(true);

    // Should include content from @core/base
    const claudeOutput = result.outputs.get('CLAUDE.md');
    expect(claudeOutput?.content).toContain('helpful, accurate, and thoughtful');
  });

  it('should support @use imports', async () => {
    const files = {
      'project.prs': `@meta {
  id: "test-project"
  syntax: "1.0.0"
}
@use @core/quality`,
    };

    const result = await compile(files, 'project.prs');

    if (!result.success) {
      console.log('Use test errors:', JSON.stringify(result.errors, null, 2));
    }

    expect(result.success).toBe(true);

    // Should include content from @core/quality
    const claudeOutput = result.outputs.get('CLAUDE.md');
    expect(claudeOutput?.content).toContain('code quality');
  });

  it('should compile multi-file projects', async () => {
    const files = {
      'project.prs': `@meta {
  id: "test-project"
  syntax: "1.0.0"
}
@inherit ./base
@identity {
  """Child identity adds to parent."""
}`,
      'base.prs': `@meta {
  id: "base"
  syntax: "1.0.0"
}
@identity {
  """Base assistant identity."""
}`,
    };

    const result = await compile(files, 'project.prs');

    if (!result.success) {
      console.log('Multi-file test errors:', JSON.stringify(result.errors, null, 2));
    }

    expect(result.success).toBe(true);
    const claudeOutput = result.outputs.get('CLAUDE.md');
    // Both parent and child identity should be present (merged)
    expect(claudeOutput?.content).toContain('Base assistant identity');
    expect(claudeOutput?.content).toContain('Child identity');
  });

  it('should accept Map as files input', async () => {
    const files = new Map([
      [
        'project.prs',
        `
        @meta { id: "map-test" syntax: "1.0.0" }
        @identity { """Map test identity.""" }
      `,
      ],
    ]);

    const result = await compile(files, 'project.prs');

    expect(result.success).toBe(true);
    expect(result.outputs.get('CLAUDE.md')?.content).toContain('Map test identity');
  });
});

describe('compileFor', () => {
  it('should compile for a specific formatter', async () => {
    const files = {
      'project.prs': `
        @meta { id: "test" syntax: "1.0.0" }
        @identity { """Test identity.""" }
      `,
    };

    const result = await compileFor(files, 'project.prs', 'claude');

    expect(result.success).toBe(true);
    expect(result.outputs.has('CLAUDE.md')).toBe(true);
    // Should only have claude output, not all formatters
    // (Note: some formatters may produce additional files)
  });
});

describe('BrowserCompiler', () => {
  it('should allow creating compiler with custom formatters', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `
        @meta { id: "test" syntax: "1.0.0" }
        @identity { """Test.""" }
      `,
    });

    const compiler = new BrowserCompiler({
      fs,
      formatters: ['claude', 'github'],
    });

    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
    expect(result.outputs.has('CLAUDE.md')).toBe(true);
    // GitHub produces multiple files
    expect(Array.from(result.outputs.keys()).some((k) => k.includes('copilot'))).toBe(true);
  });

  it('should track compilation stats', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `
        @meta { id: "test" syntax: "1.0.0" }
        @identity { """Test.""" }
      `,
    });

    const compiler = new BrowserCompiler({ fs });
    const result = await compiler.compile('project.prs');

    expect(result.stats.resolveTime).toBeGreaterThanOrEqual(0);
    expect(result.stats.validateTime).toBeGreaterThanOrEqual(0);
    expect(result.stats.formatTime).toBeGreaterThanOrEqual(0);
    expect(result.stats.totalTime).toBeGreaterThanOrEqual(0);
  });
});

describe('BrowserCompiler advanced', () => {
  it('should handle formatter config objects', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `
        @meta { id: "test" syntax: "1.0.0" }
        @identity { """Test.""" }
      `,
    });

    const compiler = new BrowserCompiler({
      fs,
      formatters: [{ name: 'claude', config: { enabled: true, version: 'full' } }],
    });

    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
    expect(result.outputs.has('CLAUDE.md')).toBe(true);
  });

  it('should throw for unknown formatter name', () => {
    const fs = new VirtualFileSystem({});

    expect(() => {
      new BrowserCompiler({
        fs,
        formatters: ['unknown-formatter'],
      });
    }).toThrow('Unknown formatter');
  });

  it('should use default formatters when none specified', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `
        @meta { id: "test" syntax: "1.0.0" }
        @identity { """Test.""" }
      `,
    });

    const compiler = new BrowserCompiler({ fs });
    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
    // Should have multiple formatter outputs
    expect(result.outputs.size).toBeGreaterThan(1);
  });

  it('should return configured formatters via getFormatters', () => {
    const fs = new VirtualFileSystem({});

    const compiler = new BrowserCompiler({
      fs,
      formatters: ['claude', 'github'],
    });

    const formatters = compiler.getFormatters();

    expect(formatters).toHaveLength(2);
    expect(formatters.map((f) => f.name)).toContain('claude');
    expect(formatters.map((f) => f.name)).toContain('github');
  });

  it('should clear cache via clearCache method', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
    });

    const compiler = new BrowserCompiler({ fs, cache: true });

    await compiler.compile('project.prs');
    compiler.clearCache();
    // Should not throw and should work normally after clearing cache
    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
  });

  it('should handle convention name in config', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `
        @meta { id: "test" syntax: "1.0.0" }
        @identity { """Test.""" }
      `,
    });

    // Use a built-in convention name
    const compiler = new BrowserCompiler({
      fs,
      formatters: [{ name: 'claude', config: { convention: 'xml' } }],
    });

    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
  });

  it('should handle output path in config', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `
        @meta { id: "test" syntax: "1.0.0" }
        @identity { """Test.""" }
      `,
    });

    const compiler = new BrowserCompiler({
      fs,
      formatters: [{ name: 'claude', config: { output: 'custom/CLAUDE.md' } }],
    });

    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
  });

  it('should handle prettier options', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `
        @meta { id: "test" syntax: "1.0.0" }
        @identity { """Test.""" }
      `,
    });

    const compiler = new BrowserCompiler({
      fs,
      formatters: ['claude'],
      prettier: {
        tabWidth: 4,
        proseWrap: 'always',
        printWidth: 100,
      },
    });

    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
  });

  it('should handle validation errors', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `
        @meta { id: "" syntax: "1.0.0" }
        @identity { """Test.""" }
      `,
    });

    const compiler = new BrowserCompiler({ fs });
    const result = await compiler.compile('project.prs');

    // Empty id should trigger validation error
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.code !== 'PS0000')).toBe(true);
  });

  it('should include warnings from validation', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `
        @meta { id: "test" syntax: "1.0.0" }
        @identity { """Test.""" }
      `,
    });

    const compiler = new BrowserCompiler({ fs });
    const result = await compiler.compile('project.prs');

    // Warnings array should exist even if empty
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('should report resolve stage errors with timing', async () => {
    const fs = new VirtualFileSystem({});

    const compiler = new BrowserCompiler({ fs });
    const result = await compiler.compile('missing.prs');

    expect(result.success).toBe(false);
    expect(result.stats.resolveTime).toBeGreaterThanOrEqual(0);
    expect(result.stats.totalTime).toBeGreaterThanOrEqual(0);
  });

  it('should handle circular dependencies during compile', async () => {
    const fs = new VirtualFileSystem({
      'a.prs': `@meta { id: "a" syntax: "1.0.0" }
@inherit ./b`,
      'b.prs': `@meta { id: "b" syntax: "1.0.0" }
@inherit ./a`,
    });

    const compiler = new BrowserCompiler({ fs });
    const result = await compiler.compile('a.prs');

    expect(result.success).toBe(false);
    expect(result.errors[0].message).toContain('Circular');
  });

  it('should disable caching when cache option is false', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
    });

    const compiler = new BrowserCompiler({ fs, cache: false });

    const result1 = await compiler.compile('project.prs');
    const result2 = await compiler.compile('project.prs');

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it('should use custom logger', async () => {
    const logs: string[] = [];
    const logger = {
      debug: (msg: string) => logs.push(`debug: ${msg}`),
      verbose: (msg: string) => logs.push(`verbose: ${msg}`),
      info: (msg: string) => logs.push(`info: ${msg}`),
      warn: (msg: string) => logs.push(`warn: ${msg}`),
      error: (msg: string) => logs.push(`error: ${msg}`),
    };

    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
    });

    const compiler = new BrowserCompiler({ fs, logger });
    await compiler.compile('project.prs');

    expect(logs.some((l) => l.includes('verbose'))).toBe(true);
  });
});

describe('getBundledRegistryFiles', () => {
  it('should return all bundled files', () => {
    const files = getBundledRegistryFiles();

    expect(files['@core/base.prs']).toBeDefined();
    expect(files['@core/quality.prs']).toBeDefined();
    expect(files['@core/security.prs']).toBeDefined();
  });

  it('should contain valid PRS content', () => {
    const files = getBundledRegistryFiles();

    expect(files['@core/base.prs']).toContain('@meta');
    expect(files['@core/base.prs']).toContain('@identity');
  });
});
